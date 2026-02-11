/**
 * Servicio de WhatsApp usando Baileys
 * IMPLEMENTACIÓN CONSERVADORA - Diseñada para evitar restricciones de WhatsApp
 * 
 * PRINCIPIOS:
 * 1. NO reconexiones automáticas - solo cuando el usuario lo solicite
 * 2. NO generación automática de QR - solo cuando el usuario lo solicite
 * 3. Rate limiting estricto - mínimo 5 minutos entre QR codes
 * 4. Cooldowns largos - 10 minutos después de errores
 * 5. Guardado seguro de credenciales - verificación antes de guardar
 * 6. Limpieza completa - verificación antes de eliminar
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import path from "path";
import fs from "fs";

// Logger silencioso para Baileys
const logger = pino({ level: "silent" });

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

let socket: WASocket | null = null;
let currentQR: string | null = null;
let qrTimestamp: number = 0;
let isInitializing = false;
let isConnecting = false;
let qrRegenerationCount = 0; // Contador de regeneraciones de QR sin escanear
const MAX_QR_REGENERATIONS = 3; // Máximo de regeneraciones automáticas antes de cerrar socket

// Rate limiting y cooldowns
let lastQRGenerationTime = 0;
const MIN_QR_GENERATION_INTERVAL_MS = 5 * 60 * 1000; // 5 MINUTOS mínimo entre QR codes

let lastErrorTime = 0;
const ERROR_COOLDOWN_MS = 10 * 60 * 1000; // 10 MINUTOS después de errores

let lastLinkingErrorTime = 0;
const LINKING_ERROR_COOLDOWN_MS = 10 * 60 * 1000; // 10 MINUTOS después de errores de vinculación

// Cooldown para evitar restricciones de WhatsApp al vincular
let lastInitAttempt = 0;
const INIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos entre intentos de vinculación

// Flag para controlar guardado de credenciales
let pendingCredsSave = false;
let credsJustSaved = false; // Flag para detectar si acabamos de guardar credenciales
let saveCredsFunction: (() => Promise<void>) | null = null; // Referencia a saveCreds
let authState: { creds: any; keys: any } | null = null; // Estado de autenticación completo

// Variable para rastrear el estado real de la conexión
let connectionState: "connecting" | "open" | "close" | null = null;

// Protección contra reconexiones automáticas múltiples desde isWhatsAppConnected()
let lastAutoReconnectAttempt = 0;
const AUTO_RECONNECT_COOLDOWN_MS = 120 * 1000; // 120 segundos mínimo entre reconexiones automáticas (aumentado de 60s)
let isAutoReconnecting = false; // Flag para indicar que ya se está intentando reconectar automáticamente
let isReconnectScheduled = false; // Flag para indicar que ya hay una reconexión programada
let reconnectTimeoutId: NodeJS.Timeout | null = null; // ID del timeout programado para cancelarlo si es necesario

// ============================================================================
// DETECCIÓN DE ENTORNO (APlat API: siempre backend, nunca Vercel)
// ============================================================================

function isBuildTime(): boolean {
  return false; // API Fastify no tiene fase de build Next.js
}

function detectKoyeb(): boolean {
  return (
    process.env.KOYEB === "1" ||
    !!process.env.KOYEB_APP_NAME ||
    !!process.env.KOYEB_SERVICE_NAME ||
    (fs.existsSync("/app/whatsapp-auth") && fs.statSync("/app/whatsapp-auth").isDirectory())
  );
}

function detectVercel(): boolean {
  return false; // API APlat corre en Koyeb, nunca en Vercel
}

function getWhatsAppAuthDir(): string {
  const explicit = process.env.APLAT_WHATSAPP_AUTH_PATH || process.env.KOYEB_WHATSAPP_AUTH_PATH;
  if (explicit) return explicit;
  const isKoyeb = detectKoyeb();
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && isKoyeb) return "/app/whatsapp-auth";
  return path.join(process.cwd(), ".whatsapp-auth");
}

const AUTH_DIR = getWhatsAppAuthDir();

// Asegurar que el directorio existe
if (!isBuildTime() && !fs.existsSync(AUTH_DIR)) {
  try {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log(`[WHATSAPP] ✅ Directorio de auth creado: ${AUTH_DIR}`);
  } catch (err) {
    const isVercel = detectVercel();
    const isKoyeb = detectKoyeb();
    const isProduction = process.env.NODE_ENV === "production";
    
    if (isVercel && !isKoyeb) {
      console.log(`[WHATSAPP] ⚠️ No se puede crear directorio en Vercel. WhatsApp solo disponible en Koyeb.`);
    } else if (isKoyeb && isProduction) {
      throw new Error(`No se pudo crear directorio de auth en Koyeb: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// ============================================================================
// UTILIDADES DE LIMPIEZA
// ============================================================================

async function safeCleanAuthDir(dirPath: string, maxRetries = 5): Promise<boolean> {
  if (!fs.existsSync(dirPath)) {
    return true;
  }
  
  let retries = maxRetries;
  
  while (retries > 0) {
    try {
      // Esperar antes de intentar (aumentar tiempo de espera)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Listar archivos primero
      let files: string[] = [];
      try {
        files = fs.readdirSync(dirPath);
      } catch (readErr) {
        // Si no se puede leer, intentar eliminar directamente
        try {
          fs.rmSync(dirPath, { recursive: true, force: true });
          return true;
        } catch (rmErr) {
          retries--;
          if (retries > 0) {
            console.warn(`[WHATSAPP CLEAN] ⚠️ Error leyendo directorio, reintentando... (${retries} intentos restantes)`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }
          return false;
        }
      }
      
      // Eliminar archivos individuales primero (más agresivo)
      for (const file of files) {
        try {
          const filePath = path.join(dirPath, file);
          
          // Intentar múltiples veces eliminar cada archivo
          let fileRetries = 3;
          while (fileRetries > 0) {
            try {
              const stat = fs.statSync(filePath);
              
              if (stat.isDirectory()) {
                // Eliminar directorio recursivamente
                fs.rmSync(filePath, { recursive: true, force: true, maxRetries: 3 });
              } else {
                // Cambiar permisos si es necesario
                try {
                  fs.chmodSync(filePath, 0o666);
                } catch (chmodErr) {
                  // Ignorar errores de chmod
                }
                fs.unlinkSync(filePath);
              }
              break; // Éxito, salir del loop de retries
            } catch (fileErr) {
              fileRetries--;
              if (fileRetries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        } catch (fileErr) {
          // Continuar con otros archivos
          console.warn(`[WHATSAPP CLEAN] ⚠️ No se pudo eliminar archivo ${file}, continuando...`);
        }
      }
      
      // Esperar un momento antes de intentar eliminar el directorio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Intentar eliminar el directorio
      fs.rmSync(dirPath, { recursive: true, force: true, maxRetries: 3 });
      
      // Verificar que se eliminó
      if (!fs.existsSync(dirPath)) {
        return true;
      }
      
      // Si aún existe, puede estar vacío, intentar una vez más
      const remainingFiles = fs.readdirSync(dirPath);
      if (remainingFiles.length === 0) {
        // Directorio vacío, intentar eliminar de nuevo
        try {
          fs.rmdirSync(dirPath);
          return true;
        } catch (rmdirErr) {
          // Si falla, al menos está vacío, considerar éxito parcial
          console.warn(`[WHATSAPP CLEAN] ⚠️ Directorio vacío pero no se pudo eliminar. Considerando éxito parcial.`);
          return true;
        }
      }
      
      return true;
    } catch (err) {
      retries--;
      if (retries > 0) {
        console.warn(`[WHATSAPP CLEAN] ⚠️ Error eliminando directorio, reintentando... (${retries} intentos restantes)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error(`[WHATSAPP CLEAN] ❌ No se pudo eliminar directorio después de ${maxRetries} intentos`);
        // Verificar si está vacío al menos
        try {
          const remaining = fs.readdirSync(dirPath);
          if (remaining.length === 0) {
            console.warn(`[WHATSAPP CLEAN] ⚠️ Directorio está vacío aunque no se pudo eliminar. Considerando éxito parcial.`);
            return true;
          }
        } catch (checkErr) {
          // Ignorar errores de verificación
        }
        return false;
      }
    }
  }
  
  return false;
}

// ============================================================================
// INICIALIZACIÓN DE WHATSAPP
// ============================================================================

export async function initWhatsApp(): Promise<WASocket> {
  const isVercel = detectVercel();
  const isKoyeb = detectKoyeb();
  
  if (isVercel && !isKoyeb) {
    throw new Error("WhatsApp no está disponible en Vercel. Usa Koyeb para conectar WhatsApp.");
  }
  
  // Verificar cooldown para evitar restricciones de WhatsApp
  const now = Date.now();
  const timeSinceLastAttempt = now - lastInitAttempt;
  if (lastInitAttempt > 0 && timeSinceLastAttempt < INIT_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((INIT_COOLDOWN_MS - timeSinceLastAttempt) / 60000);
    throw new Error(`⏳ Debes esperar ${remainingMinutes} minuto(s) antes de intentar vincular nuevamente. WhatsApp limita los intentos de vinculación para prevenir abuso.`);
  }
  
  // Verificar cooldowns
  // Cooldown general después de errores
  if (lastErrorTime > 0 && (now - lastErrorTime) < ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((ERROR_COOLDOWN_MS - (now - lastErrorTime)) / 60000);
    throw new Error(`WhatsApp está en cooldown. Espera ${remainingMinutes} minutos más antes de intentar de nuevo.`);
  }
  
  // Cooldown después de errores de vinculación
  if (lastLinkingErrorTime > 0 && (now - lastLinkingErrorTime) < LINKING_ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((LINKING_ERROR_COOLDOWN_MS - (now - lastLinkingErrorTime)) / 60000);
    throw new Error(`Error de vinculación reciente. Espera ${remainingMinutes} minutos más. Desvincula dispositivos antiguos desde WhatsApp en tu teléfono.`);
  }
  
  // Prevenir múltiples inicializaciones simultáneas
  if (isInitializing || isConnecting) {
    console.log(`[WHATSAPP] ⏳ Inicialización ya en curso, esperando...`);
    // Esperar hasta que termine la inicialización actual
    let attempts = 0;
    while ((isInitializing || isConnecting) && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    if (socket && socket.user && connectionState === "open") {
      console.log(`[WHATSAPP] ✅ Socket conectado después de esperar`);
      return socket;
    }
  }
  
  // Si ya hay socket conectado, reutilizarlo
  if (socket && socket.user && connectionState === "open") {
    console.log(`[WHATSAPP] ✅ Socket ya conectado, reutilizando`);
    return socket;
  }
  
  isInitializing = true;
  isConnecting = true;
  lastInitAttempt = now; // Registrar intento
  qrRegenerationCount = 0; // Resetear contador de regeneraciones para nueva inicialización
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    // Guardar referencias para uso posterior
    saveCredsFunction = saveCreds;
    authState = state;
    
    // Verificar si ya hay credenciales guardadas
    const hasExistingCreds = state.creds && state.creds.me;
    if (hasExistingCreds) {
      console.log(`[WHATSAPP] ✅ Credenciales existentes encontradas para: ${state.creds.me?.id || 'N/A'}`);
      console.log(`[WHATSAPP] 💡 Intentando conectar con credenciales existentes...`);
    } else {
      console.log(`[WHATSAPP] ℹ️ No hay credenciales existentes, se generará QR`);
    }
    
    const { version } = await fetchLatestBaileysVersion();
    
    socket = makeWASocket({
      version,
      logger,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      // Configuración para evitar detección como fraude
      syncFullHistory: false, // No sincronizar historial completo
      markOnlineOnConnect: false, // No marcar como online automáticamente
      generateHighQualityLinkPreview: false, // No generar previews de links
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      // Reducir actividad para parecer más legítimo
      keepAliveIntervalMs: 30000, // 30 segundos (más conservador)
      retryRequestDelayMs: 1000, // 1 segundo entre reintentos
      maxMsgRetryCount: 1, // Solo 1 reintento
      printQRInTerminal: false,
      // Opciones adicionales para mejorar estabilidad después de escanear QR
      shouldSyncHistoryMessage: () => false, // No sincronizar historial automáticamente
      shouldIgnoreJid: () => false,
      getMessage: async () => undefined, // No obtener mensajes automáticamente
    });
    
    // CRÍTICO: Configurar guardado de credenciales
    // IMPORTANTE: Guardar en creds.update para creds, pero las keys se guardan después
    // El evento creds.update se dispara cuando las credenciales están listas
    // PERO las keys pueden no estar completamente sincronizadas aún
    socket.ev.on("creds.update", async () => {
      console.log(`[WHATSAPP] 🔄 Evento creds.update disparado`);
      if (saveCredsFunction) {
        try {
          // Guardar inmediatamente (creds)
          await saveCredsFunction();
          credsJustSaved = true; // Marcar que acabamos de guardar
          pendingCredsSave = true;
          console.log(`[WHATSAPP] ✅ Credenciales guardadas en creds.update (puede que keys aún no estén)`);
          
          // Verificar archivos guardados
          if (fs.existsSync(AUTH_DIR)) {
            const files = fs.readdirSync(AUTH_DIR);
            // Reducir logging: solo loggear ocasionalmente (1% de las veces en producción)
            const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.01;
            if (shouldLog) {
              console.log(`[WHATSAPP] 📁 Archivos guardados después de creds.update: ${files.length}`);
            }
            
            // Verificar si las keys están disponibles
            const hasKeys = files.some(f => f.includes('key') || f.includes('app-state'));
            if (!hasKeys) {
              // Solo loggear si realmente no hay keys (problema potencial)
              if (shouldLog) {
                console.log(`[WHATSAPP] ⏳ Keys aún no están guardadas, esperando a que se sincronicen...`);
              }
              
              // CRÍTICO: Esperar un poco y verificar si las keys están disponibles en authState
              // Las keys se sincronizan poco después de creds.update
              setTimeout(async () => {
                if (authState && authState.keys && saveCredsFunction) {
                  const keysCount = Object.keys(authState.keys).length;
                  if (keysCount > 0) {
                    if (shouldLog) {
                      console.log(`[WHATSAPP] 🔑 Keys detectadas en authState (${keysCount}), guardando nuevamente...`);
                    }
                    try {
                      await saveCredsFunction();
                      if (shouldLog) {
                        console.log(`[WHATSAPP] ✅ Credenciales completas (creds + keys) guardadas después de esperar`);
                      }
                      
                      // Verificar archivos nuevamente (solo en desarrollo)
                      if (process.env.NODE_ENV === "development" && fs.existsSync(AUTH_DIR)) {
                        const filesAfter = fs.readdirSync(AUTH_DIR);
                        const hasKeysAfter = filesAfter.some(f => f.includes('key') || f.includes('app-state'));
                        console.log(`[WHATSAPP] 📁 Archivos después de guardar keys: ${filesAfter.length} (keys: ${hasKeysAfter})`);
                        if (hasKeysAfter) {
                          console.log(`[WHATSAPP] ✅ Credenciales completas verificadas`);
                        }
                      }
                    } catch (saveErr2) {
                      console.error(`[WHATSAPP] ❌ Error guardando keys después de esperar:`, saveErr2);
                    }
                  } else {
                    console.log(`[WHATSAPP] ⏳ Keys aún no están disponibles en authState, se guardarán cuando la conexión se establezca`);
                  }
                } else if (!saveCredsFunction) {
                  console.warn(`[WHATSAPP] ⚠️ saveCredsFunction no está disponible en el timeout`);
                }
              }, 1000); // Esperar 1 segundo para que las keys se sincronicen
            } else {
              console.log(`[WHATSAPP] ✅ Keys ya están guardadas`);
            }
          }
        } catch (saveErr) {
          console.error(`[WHATSAPP] ❌ Error guardando credenciales en creds.update:`, saveErr);
          credsJustSaved = false;
        }
      } else {
        console.warn(`[WHATSAPP] ⚠️ saveCredsFunction no está disponible`);
      }
    });
    
    // Manejar actualizaciones de conexión
    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, receivedPendingNotifications } = update;
      
      // Capturar QR
      if (qr && !socket?.user) {
        // Incrementar contador de regeneraciones
        qrRegenerationCount++;
        
        // Si se han generado demasiados QRs sin escanear, cerrar el socket
        if (qrRegenerationCount > MAX_QR_REGENERATIONS) {
          console.log(`[WHATSAPP] ⚠️ Se han generado ${qrRegenerationCount} QRs sin escanear. Cerrando socket para evitar regeneraciones infinitas.`);
          console.log(`[WHATSAPP] 💡 Solicita un nuevo QR manualmente desde el dashboard.`);
          
          // Cerrar socket
          const currentSocket = socket;
          if (currentSocket) {
            try {
              currentSocket.end(undefined);
            } catch (e) {
              console.warn(`[WHATSAPP] ⚠️ Error cerrando socket:`, e);
            }
          }
          
          // Limpiar estado
          socket = null;
          currentQR = null;
          qrTimestamp = 0;
          connectionState = "close";
          isInitializing = false;
          isConnecting = false;
          qrRegenerationCount = 0; // Resetear contador
          
          return; // No procesar este QR
        }
        
        currentQR = qr;
        qrTimestamp = Date.now();
        console.log(`[WHATSAPP] 📱 QR Code generado (expira en ~20 segundos) [Regeneración ${qrRegenerationCount}/${MAX_QR_REGENERATIONS}]`);
      }
      
      // Detectar cuando se escanea el QR
      // CRÍTICO: WhatsApp requiere reiniciar INMEDIATAMENTE después del pairing
      // No podemos esperar porque el error 515 ocurre muy rápido
      if (isNewLogin) {
        console.log(`[WHATSAPP] ✅ QR escaneado (isNewLogin=true)`);
        console.log(`[WHATSAPP] 💡 WhatsApp requiere reiniciar la conexión INMEDIATAMENTE después del pairing`);
        console.log(`[WHATSAPP] 🔄 Reiniciando conexión ahora...`);
        
        // Resetear contador de regeneraciones (QR fue escaneado exitosamente)
        qrRegenerationCount = 0;
        
        // Guardar credenciales inmediatamente (si está disponible)
        if (saveCredsFunction) {
          try {
            await saveCredsFunction();
            console.log(`[WHATSAPP] 💾 Credenciales guardadas antes de reiniciar`);
          } catch (saveErr) {
            console.warn(`[WHATSAPP] ⚠️ Error guardando antes de reiniciar (continuando de todas formas):`, saveErr);
          }
        }
        
        // Cerrar socket actual INMEDIATAMENTE
        const currentSocket = socket;
        if (currentSocket) {
          try {
            currentSocket.end(undefined);
            console.log(`[WHATSAPP] 🔌 Socket cerrado`);
          } catch (e) {
            console.warn(`[WHATSAPP] ⚠️ Error cerrando socket (continuando):`, e);
          }
        }
        
        // Limpiar estado
        socket = null;
        currentQR = null;
        qrTimestamp = 0;
        connectionState = "close";
        isInitializing = false;
        isConnecting = false;
        
        // Esperar un momento para que las credenciales se guarden completamente
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar archivos guardados (sin listar todos los archivos individualmente)
        if (fs.existsSync(AUTH_DIR)) {
          const files = fs.readdirSync(AUTH_DIR);
          const hasKeys = files.some(f => f.includes('key') || f.includes('app-state'));
          // Solo loggear resumen, no todos los archivos (evita miles de líneas de logs)
          const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.01;
          if (shouldLog) {
            console.log(`[WHATSAPP] 📁 Archivos antes de reiniciar: ${files.length} (keys: ${hasKeys})`);
          }
        }
        
        // Reiniciar conexión con credenciales guardadas
        // CRÍTICO: Resetear TODOS los cooldowns antes de reiniciar porque es parte del mismo proceso de vinculación
        console.log(`[WHATSAPP] 🚀 Reiniciando WhatsApp con credenciales guardadas...`);
        console.log(`[WHATSAPP] 💡 Reseteando todos los cooldowns para reinicio automático (parte del mismo proceso de vinculación)`);
        lastInitAttempt = 0; // Resetear cooldown de inicialización
        lastErrorTime = 0; // Resetear cooldown de errores
        lastLinkingErrorTime = 0; // Resetear cooldown de errores de vinculación
        try {
          await initWhatsApp();
          console.log(`[WHATSAPP] ✅ Reinicio completado`);
        } catch (restartErr) {
          console.error(`[WHATSAPP] ❌ Error al reiniciar:`, restartErr);
          // No lanzar error, permitir que el usuario intente nuevamente
        }
      }
      
      // Loggear todos los estados de conexión para debugging
      if (connection) {
        // Actualizar el estado global de conexión
        connectionState = connection;
        console.log(`[WHATSAPP] 🔌 Estado de conexión: ${connection}`);
        if (connection === "connecting") {
          console.log(`[WHATSAPP] 🔄 Conectando... (isNewLogin: ${isNewLogin}, receivedPendingNotifications: ${receivedPendingNotifications})`);
        }
        if (lastDisconnect?.error) {
          const errorDetails = lastDisconnect.error as Boom;
          console.log(`[WHATSAPP] Error de desconexión:`, {
            statusCode: errorDetails?.output?.statusCode,
            message: errorDetails?.message,
            data: errorDetails?.data,
            output: errorDetails?.output,
          });
        }
      }
      
      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMsg = String(lastDisconnect?.error || "");
        const errorData = (lastDisconnect?.error as Boom)?.data;
        
        // Actualizar estado de conexión
        connectionState = "close";
        
        console.log(`[WHATSAPP] ❌ Conexión cerrada`);
        console.log(`[WHATSAPP] 📊 Status Code: ${statusCode}`);
        console.log(`[WHATSAPP] 📊 Error: ${errorMsg}`);
        if (errorData) {
          console.log(`[WHATSAPP] Datos del error:`, errorData);
        }
        
        // Detectar error 515 (Stream Errored - restart required)
        // Este error suele ocurrir cuando se escanea el QR pero la conexión falla inmediatamente después
        // Puede indicar que las credenciales están corruptas, problemas de red, o que WhatsApp requiere reiniciar
        const isStreamError = statusCode === 515 || 
                              errorMsg.toLowerCase().includes("stream errored") ||
                              errorMsg.toLowerCase().includes("restart required");
        
        // Si es error 515 y acabamos de guardar credenciales (después de escanear QR),
        // puede ser que las credenciales estén incompletas o que haya un problema de red
        if (isStreamError) {
          if (credsJustSaved) {
            console.log(`[WHATSAPP] ⚠️ Error 515: Stream Errored (restart required)`);
            console.log(`[WHATSAPP] 💡 Error 515 después de guardar credenciales - esto puede ser normal`);
            console.log(`[WHATSAPP] 💡 Las credenciales se guardaron correctamente, pero el socket necesita reiniciarse`);
            console.log(`[WHATSAPP] 💡 Verificando que las credenciales estén completas...`);
            
            // Verificar que las credenciales se guardaron correctamente
            let credsComplete = false;
            if (fs.existsSync(AUTH_DIR)) {
              const files = fs.readdirSync(AUTH_DIR);
              const hasCreds = files.some(f => f.includes('creds') || f.includes('app-state'));
              const hasKeys = files.some(f => f.includes('keys') || f.includes('pre-key'));
              
              // Reducir logging: solo loggear en desarrollo o cuando hay problemas
              const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.01;
              
              if (hasCreds && hasKeys && files.length >= 2) {
                credsComplete = true;
                if (shouldLog) {
                  console.log(`[WHATSAPP] ✅ Credenciales completas guardadas correctamente (${files.length} archivos)`);
                }
              } else {
                // Siempre loggear advertencias importantes (credenciales incompletas)
                console.warn(`[WHATSAPP] ⚠️ Credenciales incompletas: creds=${hasCreds}, keys=${hasKeys}, files=${files.length}`);
                console.warn(`[WHATSAPP] ⚠️ Esto puede causar el error 515. Limpia y vuelve a intentar.`);
              }
            }
            
            credsJustSaved = false; // Resetear flag
            
            // Intentar limpiar credenciales automáticamente después de un delay
            // Solo si las credenciales están incompletas o si el usuario lo solicita
            // Esperar más tiempo para dar oportunidad a que la conexión se recupere
            setTimeout(async () => {
              try {
                // Solo limpiar automáticamente si las credenciales están claramente incompletas
                // De lo contrario, dejar que el usuario decida
                if (!credsComplete) {
                  console.log(`[WHATSAPP] 🔄 Credenciales incompletas detectadas, limpiando automáticamente...`);
                  const cleaned = await safeCleanAuthDir(AUTH_DIR, 3);
                  if (cleaned) {
                    console.log(`[WHATSAPP] ✅ Credenciales incompletas limpiadas automáticamente`);
                  } else {
                    console.warn(`[WHATSAPP] ⚠️ No se pudieron limpiar credenciales automáticamente. Limpia manualmente.`);
                  }
                } else {
                  console.log(`[WHATSAPP] ℹ️ Credenciales parecen completas. El error 515 puede ser temporal.`);
                  console.log(`[WHATSAPP] ℹ️ Intenta obtener un nuevo QR sin limpiar credenciales primero.`);
                  console.log(`[WHATSAPP] ℹ️ Si el problema persiste, limpia las credenciales manualmente.`);
                }
              } catch (autoCleanErr) {
                console.error(`[WHATSAPP] ❌ Error en limpieza automática:`, autoCleanErr);
              }
            }, 10000); // Esperar 10 segundos para dar tiempo a que la conexión se recupere o se cierre completamente
            
            // Marcar como error de vinculación para activar cooldown (pero más corto para errores 515)
            // Error 515 puede ser temporal, así que usar un cooldown más corto
            lastLinkingErrorTime = Date.now();
          } else {
            // Si no hay credenciales recientes, es un error de conexión normal
            console.log(`[WHATSAPP] 💡 Esto puede indicar:`);
            console.log(`[WHATSAPP] 💡 1. Credenciales incompletas`);
            console.log(`[WHATSAPP] 💡 2. Problemas de red`);
            console.log(`[WHATSAPP] 💡 3. Límite de dispositivos alcanzado`);
            lastErrorTime = Date.now();
          }
        }
        
        // Detectar errores de vinculación (más exhaustivo)
        // Incluir más variantes del mensaje "no se pudo vincular"
        const errorMsgLower = errorMsg.toLowerCase();
        const errorDataText = errorData && typeof errorData === 'object' && 'text' in errorData 
          ? String(errorData.text).toLowerCase() 
          : '';
        const errorDataMessage = errorData && typeof errorData === 'object' && 'message' in errorData 
          ? String(errorData.message).toLowerCase() 
          : '';
        
        const isLinkingError =
          statusCode === 401 ||
          statusCode === 403 ||
          statusCode === DisconnectReason.forbidden ||
          statusCode === DisconnectReason.badSession ||
          statusCode === DisconnectReason.loggedOut ||
          errorMsgLower.includes("cannot link") ||
          errorMsgLower.includes("device limit") ||
          errorMsgLower.includes("too many devices") ||
          errorMsgLower.includes("no se pudo vincular") ||
          errorMsgLower.includes("could not link") ||
          errorMsgLower.includes("maximum devices") ||
          errorMsgLower.includes("vuelva a intentarlo") ||
          errorMsgLower.includes("try again later") ||
          errorMsgLower.includes("intentarlo más tarde") ||
          errorMsgLower.includes("dispositivo no se pudo vincular") ||
          errorMsgLower.includes("device could not be linked") ||
          errorDataText.includes("device") ||
          errorDataText.includes("link") ||
          errorDataText.includes("vincular") ||
          errorDataMessage.includes("device") ||
          errorDataMessage.includes("link") ||
          errorDataMessage.includes("vincular");
        
        // Si hay un error de vinculación Y acabamos de escanear el QR (pendingCredsSave = true),
        // significa que la vinculación falló y debemos limpiar las credenciales incompletas
        const isLinkingErrorAfterScan = isLinkingError && pendingCredsSave && !socket?.user;
        
        if (isLinkingError && !isStreamError) {
          lastLinkingErrorTime = Date.now();
          console.error(`[WHATSAPP] ❌ Error de vinculación detectado`);
          console.error(`[WHATSAPP] Status: ${statusCode}`);
          console.error(`[WHATSAPP] Mensaje: ${errorMsg}`);
          if (errorDataText) {
            console.error(`[WHATSAPP] Datos del error: ${errorDataText}`);
          }
          console.error(`[WHATSAPP] 💡 Desvincula dispositivos antiguos desde WhatsApp en tu teléfono`);
          console.error(`[WHATSAPP] 💡 Ve a WhatsApp > Configuración > Dispositivos vinculados`);
          console.error(`[WHATSAPP] 💡 Elimina dispositivos antiguos y vuelve a intentar`);
          console.error(`[WHATSAPP] ⏳ Cooldown de 10 minutos activado`);
          
          // CRÍTICO: Si el error ocurre después de escanear QR, limpiar credenciales automáticamente
          // porque están incompletas y causarán problemas en el siguiente intento
          if (isLinkingErrorAfterScan) {
            console.error(`[WHATSAPP] 🔄 Error de vinculación después de escanear QR detectado`);
            console.error(`[WHATSAPP] 🔄 Limpiando credenciales incompletas automáticamente...`);
            
            // Resetear flag antes de limpiar
            pendingCredsSave = false;
            
            // Limpiar credenciales después de un breve delay para asegurar que el socket se cierre
            setTimeout(async () => {
              try {
                if (fs.existsSync(AUTH_DIR)) {
                  const files = fs.readdirSync(AUTH_DIR);
                  if (files.length > 0) {
                    console.log(`[WHATSAPP] 🔄 Limpiando ${files.length} archivos de credenciales incompletas...`);
                    const cleaned = await safeCleanAuthDir(AUTH_DIR, 3);
                    if (cleaned) {
                      console.log(`[WHATSAPP] ✅ Credenciales incompletas limpiadas automáticamente después de error de vinculación`);
                      console.log(`[WHATSAPP] 💡 Puedes intentar escanear el QR nuevamente después del cooldown`);
                    } else {
                      console.warn(`[WHATSAPP] ⚠️ No se pudieron limpiar todas las credenciales. Limpia manualmente desde el dashboard.`);
                    }
                  } else {
                    console.log(`[WHATSAPP] ℹ️ No había credenciales para limpiar`);
                  }
                }
              } catch (autoCleanErr) {
                console.error(`[WHATSAPP] ❌ Error limpiando credenciales automáticamente:`, autoCleanErr);
                console.error(`[WHATSAPP] 💡 Limpia manualmente las credenciales desde el dashboard`);
              }
            }, 3000); // Esperar 3 segundos para que el socket se cierre completamente
          }
        } else if (!isStreamError) {
          lastErrorTime = Date.now();
        }
        
        // Resetear flag de credenciales pendientes si la conexión se cierra sin éxito
        // Esto evita que se intenten guardar credenciales incompletas en el siguiente intento
        if (pendingCredsSave && !socket?.user) {
          console.warn(`[WHATSAPP] ⚠️ Conexión cerrada antes de completar la vinculación. Credenciales no se guardarán.`);
          pendingCredsSave = false;
        }
        
        // Cerrar socket pero mantener credenciales si se guardaron
        if (socket) {
          try {
            socket.end(undefined);
          } catch (e) {
            // Ignorar errores al cerrar
          }
        }
        socket = null;
        currentQR = null;
        qrTimestamp = 0;
        isConnecting = false;
        isInitializing = false; // Permitir nueva inicialización
        
        // LÓGICA DE RECONEXIÓN AUTOMÁTICA:
        // - Si hay credenciales guardadas válidas Y NO es un error de vinculación/logout
        //   → Intentar reconectar automáticamente después de un delay
        // - Si es un error de vinculación/logout → NO reconectar (requiere acción manual)
        // - Si no hay credenciales → NO reconectar (requiere QR)
        
        // Verificar si hay credenciales guardadas válidas
        let hasValidCreds = false;
        if (fs.existsSync(AUTH_DIR)) {
          try {
            const files = fs.readdirSync(AUTH_DIR);
            const hasCreds = files.some(f => f.includes('creds'));
            const hasKeys = files.some(f => f.includes('key') || f.includes('pre-key'));
            hasValidCreds = hasCreds && hasKeys && files.length >= 10; // Mínimo de archivos para credenciales completas
          } catch (checkErr) {
            // Ignorar errores de verificación
          }
        }
        
        // CRÍTICO: NO reconectar automáticamente si hay error 440 (conflict)
        // El error 440 indica que hay otra conexión activa, reconectar solo empeorará el problema
        // Solo permitir reconexión manual desde el dashboard
        const isConflictError = statusCode === 440;
        
        // Determinar si debemos reconectar automáticamente
        // IMPORTANTE: NO reconectar automáticamente para errores 440 (conflict)
        const shouldReconnect = 
          hasValidCreds && // Hay credenciales guardadas
          !isConflictError && // NO es un error 440 (conflict) - requiere acción manual
          !isLinkingError && // NO es un error de vinculación
          statusCode !== DisconnectReason.loggedOut && // NO es un logout manual
          statusCode !== DisconnectReason.badSession && // NO es una sesión inválida
          statusCode !== 401 && // NO es un error de autenticación
          statusCode !== 403; // NO es un error de autorización
        
        if (shouldReconnect) {
          // CRÍTICO: Prevenir múltiples reconexiones simultáneas
          if (isReconnectScheduled || isAutoReconnecting || isInitializing || isConnecting) {
            console.log(`[WHATSAPP] ⏳ Ya hay una reconexión programada o en progreso, saltando esta...`);
            return;
          }
          
          const delay = 15000; // 15 segundos para otros errores
          console.log(`[WHATSAPP] 🔄 Credenciales válidas detectadas, intentando reconexión automática en ${delay / 1000} segundos...`);
          console.log(`[WHATSAPP] 💡 Esto es normal después de reinicios del servidor o errores temporales de red`);
          
          // Marcar que hay una reconexión programada
          isReconnectScheduled = true;
          lastAutoReconnectAttempt = Date.now(); // Actualizar ahora para prevenir otras reconexiones
          
          // Cancelar cualquier timeout anterior
          if (reconnectTimeoutId) {
            clearTimeout(reconnectTimeoutId);
          }
          
          // Programar reconexión
          reconnectTimeoutId = setTimeout(async () => {
            isReconnectScheduled = false;
            reconnectTimeoutId = null;
            
            // Verificar si ya está conectado antes de intentar reconectar
            if (connectionState === "open" && socket && socket.user) {
              console.log(`[WHATSAPP] ✅ Ya está conectado, cancelando reconexión programada`);
              return;
            }
            
            try {
              // Verificar nuevamente si hay credenciales antes de reconectar
              if (fs.existsSync(AUTH_DIR)) {
                const files = fs.readdirSync(AUTH_DIR);
                const hasCreds = files.some(f => f.includes('creds'));
                const hasKeys = files.some(f => f.includes('key') || f.includes('pre-key'));
                if (hasCreds && hasKeys) {
                  console.log(`[WHATSAPP] 🔄 Iniciando reconexión automática...`);
                  isAutoReconnecting = true;
                  // Resetear cooldowns para permitir reconexión automática
                  lastInitAttempt = 0;
                  lastErrorTime = 0;
                  // Intentar reconectar
                  await initWhatsApp();
                  console.log(`[WHATSAPP] ✅ Reconexión automática completada`);
                } else {
                  console.log(`[WHATSAPP] ⚠️ Credenciales no completas, no se puede reconectar automáticamente`);
                }
              }
            } catch (reconnectErr) {
              console.error(`[WHATSAPP] ❌ Error en reconexión automática:`, reconnectErr);
              console.log(`[WHATSAPP] 💡 La reconexión automática falló. Puedes reconectar manualmente desde el dashboard.`);
            } finally {
              isAutoReconnecting = false;
            }
          }, delay);
        } else {
          if (isConflictError) {
            console.log(`[WHATSAPP] ⚠️ Error 440 (conflict) detectado. Hay otra conexión activa.`);
            console.log(`[WHATSAPP] 💡 Para reconectar, limpia las credenciales desde el dashboard y solicita un nuevo QR.`);
            console.log(`[WHATSAPP] 💡 O espera a que la otra conexión se desconecte automáticamente.`);
          } else if (!hasValidCreds) {
            console.log(`[WHATSAPP] ⚠️ No hay credenciales guardadas. Solicita un nuevo QR desde el dashboard.`);
          } else if (isLinkingError) {
            console.log(`[WHATSAPP] ⚠️ Error de vinculación detectado. Desvincula dispositivos antiguos desde WhatsApp en tu teléfono.`);
          } else {
            console.log(`[WHATSAPP] ⚠️ Error crítico (logout/sesión inválida). Limpia credenciales y solicita un nuevo QR.`);
          }
        }
        return;
      }
      
      if (connection === "open") {
        // CRÍTICO: Establecer connectionState explícitamente a "open"
        connectionState = "open";
        console.log(`[WHATSAPP] ✅ CONECTADO A WHATSAPP`);
        console.log(`[WHATSAPP] 🔌 connectionState establecido a "open"`);
        
        // CRÍTICO: Cancelar cualquier reconexión programada cuando se conecta exitosamente
        // Esto previene bucles infinitos de reconexión
        if (isReconnectScheduled && reconnectTimeoutId) {
          console.log(`[WHATSAPP] ✅ Conexión exitosa, cancelando reconexión programada`);
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
          isReconnectScheduled = false;
        }
        isAutoReconnecting = false; // También resetear flag de reconexión en progreso
        console.log(`[WHATSAPP] 🔍 Estado después de conexión: connectionState="${connectionState}", socket existe=${!!socket}, socket.user existe=${!!socket?.user}`);
        isInitializing = false; // Marcar inicialización como completa
        isConnecting = false;
        
        if (socket?.user) {
          console.log(`[WHATSAPP] 👤 Usuario: ${socket.user.id || 'N/A'}`);
          console.log(`[WHATSAPP] 👤 Nombre: ${socket.user.name || 'N/A'}`);
        } else {
          console.warn(`[WHATSAPP] ⚠️ ADVERTENCIA: connection === "open" pero socket?.user no está disponible`);
        }
        
        currentQR = null;
        qrTimestamp = 0;
        qrRegenerationCount = 0; // Resetear contador (conexión exitosa)
        
        // CRÍTICO: Guardar credenciales nuevamente cuando la conexión se establece
        // Esto asegura que las keys también se guarden, ya que en creds.update pueden no estar listas
        if (saveCredsFunction) {
          try {
            console.log(`[WHATSAPP] 💾 Guardando credenciales completas (con keys) ahora que la conexión está abierta...`);
            await saveCredsFunction();
            console.log(`[WHATSAPP] ✅ Credenciales completas guardadas (creds + keys)`);
          } catch (saveErr) {
            console.error(`[WHATSAPP] ❌ Error guardando credenciales completas:`, saveErr);
          }
        }
        
        // Verificar credenciales después de conexión usando authState
        if (authState) {
          console.log(`[WHATSAPP] 🔍 Verificando credenciales después de conexión...`);
          const hasMe = !!authState.creds?.me;
          const keysCount = authState.keys ? Object.keys(authState.keys).length : 0;
          console.log(`[WHATSAPP] 🔍 Credenciales: hasMe=${hasMe}, keysCount=${keysCount}`);
          
          // Verificar que las credenciales estén completas
          if (!hasMe || keysCount === 0) {
            console.warn(`[WHATSAPP] ⚠️ Credenciales incompletas después de conexión: hasMe=${hasMe}, keysCount=${keysCount}`);
          } else {
            console.log(`[WHATSAPP] ✅ Credenciales completas verificadas`);
          }
        }
        
        // Verificar archivos guardados
        if (fs.existsSync(AUTH_DIR)) {
          const files = fs.readdirSync(AUTH_DIR);
          const hasCreds = files.some(f => f.includes('creds'));
          const hasKeys = files.some(f => f.includes('key') || f.includes('app-state'));
          
          // Reducir logging: solo loggear en desarrollo o muy ocasionalmente (1% de las veces)
          const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.01;
          if (shouldLog) {
            console.log(`[WHATSAPP] 📁 Archivos en ${AUTH_DIR}: ${files.length} (creds: ${hasCreds}, keys: ${hasKeys})`);
            // NO listar todos los archivos individualmente - esto genera miles de líneas de logs
            // Solo loggear un resumen si es absolutamente necesario en desarrollo
            if (process.env.NODE_ENV === "development" && files.length < 10) {
              files.slice(0, 5).forEach(file => {
                const filePath = path.join(AUTH_DIR, file);
                const stats = fs.statSync(filePath);
                console.log(`[WHATSAPP] 📄 ${file}: ${stats.size} bytes`);
              });
              if (files.length > 5) {
                console.log(`[WHATSAPP] ... y ${files.length - 5} archivos más`);
              }
            }
          }
          
          if (!hasKeys) {
            // Solo loggear advertencias importantes
            if (shouldLog) {
              console.warn(`[WHATSAPP] ⚠️ ADVERTENCIA: No se encontraron archivos de keys. Esto puede causar problemas en reconexiones.`);
            }
          } else {
            // Solo loggear confirmación ocasionalmente
            if (shouldLog) {
              console.log(`[WHATSAPP] ✅ Credenciales completas (creds + keys) guardadas correctamente`);
            }
          }
        }
        
        credsJustSaved = false; // Resetear flag después de verificar
        pendingCredsSave = false;
      }
    });
    
    // CRÍTICO: Esperar a que el socket esté conectado antes de retornar
    // Si hay credenciales existentes, la conexión debería establecerse rápidamente
    // Esperar hasta que connectionState === "open" o hasta que pase un timeout
    // Reutilizar hasExistingCreds ya declarada arriba
    if (hasExistingCreds) {
      console.log(`[WHATSAPP] 💡 Esperando a que la conexión se establezca...`);
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo
      while (attempts < maxAttempts) {
        // Verificar el estado actual
        const currentState = connectionState;
        if (currentState === "open") {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
        // Verificar si el socket tiene usuario (indicador de conexión)
        if (socket && socket.user) {
          console.log(`[WHATSAPP] ✅ Socket tiene usuario pero connectionState no es "open", estableciendo connectionState="open"`);
          connectionState = "open";
          break;
        }
      }
      
      if (connectionState === "open") {
        console.log(`[WHATSAPP] ✅ Conexión establecida después de ${attempts} segundo(s)`);
      } else {
        console.warn(`[WHATSAPP] ⚠️ Timeout esperando conexión. connectionState="${connectionState}", socket=${!!socket}, socket.user=${!!socket?.user}`);
        // Si el socket tiene usuario pero connectionState no es "open", establecerlo manualmente
        if (socket && socket.user) {
          console.log(`[WHATSAPP] ✅ Socket tiene usuario, estableciendo connectionState="open" manualmente`);
          connectionState = "open";
        }
      }
    }
    
    isConnecting = false;
    isInitializing = false;
    isAutoReconnecting = false; // Resetear flag de reconexión automática después de inicialización exitosa
    isReconnectScheduled = false; // Resetear flag de reconexión programada
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId); // Cancelar cualquier reconexión programada
      reconnectTimeoutId = null;
    }
    return socket;
  } catch (error) {
    isConnecting = false;
    isInitializing = false;
    isAutoReconnecting = false; // Resetear flag de reconexión automática después de error
    isReconnectScheduled = false; // Resetear flag de reconexión programada
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId); // Cancelar cualquier reconexión programada
      reconnectTimeoutId = null;
    }
    lastErrorTime = Date.now();
    throw error;
  }
}

// ============================================================================
// OBTENER QR CODE
// ============================================================================

// Función auxiliar para verificar si hay un error de vinculación activo
export function hasLinkingError(): boolean {
  const now = Date.now();
  return lastLinkingErrorTime > 0 && (now - lastLinkingErrorTime) < LINKING_ERROR_COOLDOWN_MS;
}

// Función auxiliar para verificar rate limiting de QRs
export function getQRRateLimitInfo(): { isRateLimited: boolean; remainingMinutes: number } {
  const now = Date.now();
  
  if (lastQRGenerationTime > 0 && (now - lastQRGenerationTime) < MIN_QR_GENERATION_INTERVAL_MS) {
    const remainingMinutes = Math.ceil((MIN_QR_GENERATION_INTERVAL_MS - (now - lastQRGenerationTime)) / 60000);
    return { isRateLimited: true, remainingMinutes };
  }
  
  return { isRateLimited: false, remainingMinutes: 0 };
}

// Función auxiliar para obtener información sobre cooldowns
export function getCooldownInfo(): { inCooldown: boolean; remainingMinutes: number; isLinkingError: boolean } {
  const now = Date.now();
  
  if (lastLinkingErrorTime > 0 && (now - lastLinkingErrorTime) < LINKING_ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((LINKING_ERROR_COOLDOWN_MS - (now - lastLinkingErrorTime)) / 60000);
    return { inCooldown: true, remainingMinutes, isLinkingError: true };
  }
  
  if (lastErrorTime > 0 && (now - lastErrorTime) < ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((ERROR_COOLDOWN_MS - (now - lastErrorTime)) / 60000);
    return { inCooldown: true, remainingMinutes, isLinkingError: false };
  }
  
  return { inCooldown: false, remainingMinutes: 0, isLinkingError: false };
}

export async function getWhatsAppQR(): Promise<string | null> {
  const isVercel = detectVercel();
  const isKoyeb = detectKoyeb();
  
  if (isVercel && !isKoyeb) {
    return null;
  }
  
  // Verificar si ya hay conexión
  if (socket && socket.user) {
    console.log("[WHATSAPP QR] ✅ Ya hay conexión activa");
    return null;
  }
  
  // Rate limiting estricto
  const now = Date.now();
  const timeSinceLastQR = now - lastQRGenerationTime;
  
  if (lastQRGenerationTime > 0 && timeSinceLastQR < MIN_QR_GENERATION_INTERVAL_MS) {
    const remainingMinutes = Math.ceil((MIN_QR_GENERATION_INTERVAL_MS - timeSinceLastQR) / 60000);
    console.warn(`[WHATSAPP QR] ⚠️ Rate limiting: Espera ${remainingMinutes} minutos antes de generar otro QR`);
    return null;
  }
  
  // Verificar cooldowns
  if (lastErrorTime > 0 && (now - lastErrorTime) < ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((ERROR_COOLDOWN_MS - (now - lastErrorTime)) / 60000);
    console.warn(`[WHATSAPP QR] ⚠️ Cooldown activo: Espera ${remainingMinutes} minutos`);
    return null;
  }
  
  if (lastLinkingErrorTime > 0 && (now - lastLinkingErrorTime) < LINKING_ERROR_COOLDOWN_MS) {
    const remainingMinutes = Math.ceil((LINKING_ERROR_COOLDOWN_MS - (now - lastLinkingErrorTime)) / 60000);
    console.warn(`[WHATSAPP QR] ⚠️ Cooldown de vinculación: Espera ${remainingMinutes} minutos`);
    console.warn(`[WHATSAPP QR] 💡 Desvincula dispositivos antiguos desde WhatsApp en tu teléfono`);
    return null;
  }
  
  // Si hay QR válido, devolverlo
  if (currentQR && qrTimestamp > 0) {
    const qrAge = now - qrTimestamp;
    if (qrAge < 20 * 1000) { // QR válido por 20 segundos
      return currentQR;
    } else {
      currentQR = null;
      qrTimestamp = 0;
    }
  }
  
  // Registrar timestamp de generación
  lastQRGenerationTime = now;
  
  // Inicializar WhatsApp para obtener QR
  try {
    await initWhatsApp();
    
    // Esperar hasta 30 segundos por el QR
    const startTime = Date.now();
    while (Date.now() - startTime < 30000) {
      if (currentQR) {
        return currentQR;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return null;
  } catch (err) {
    console.error("[WHATSAPP QR] Error obteniendo QR:", err);
    return null;
  }
}

export function getCurrentQR(): string | null {
  if (!currentQR || !qrTimestamp) {
    return null;
  }
  
  const now = Date.now();
  const qrAge = now - qrTimestamp;
  
  if (qrAge > 20 * 1000) {
    // QR expirado
    currentQR = null;
    qrTimestamp = 0;
    return null;
  }
  
  return currentQR;
}

// ============================================================================
// VERIFICAR CONEXIÓN
// ============================================================================

export function getWhatsAppSocket(): WASocket | null {
  return socket;
}

export async function isWhatsAppConnected(): Promise<boolean> {
  const isVercel = detectVercel();
  const isKoyeb = detectKoyeb();
  
  console.log(`[isWhatsAppConnected] 🔍 Verificando conexión: connectionState="${connectionState}", socket existe=${!!socket}, socket?.user existe=${!!socket?.user}, currentQR=${!!currentQR}`);
  
  if (isVercel && !isKoyeb) {
    console.log(`[isWhatsAppConnected] ❌ Vercel detectado, retornando false`);
    return false;
  }
  
  // Si hay QR activo, NO está conectado (está esperando escaneo)
  if (currentQR) {
    console.log(`[isWhatsAppConnected] ❌ QR activo detectado, retornando false`);
    return false;
  }
  
  // CRÍTICO: Verificar PRIMERO si el socket está realmente activo, incluso si connectionState es null
  // Esto es necesario porque el estado puede perderse entre diferentes contextos de Next.js
  if (socket && socket.user) {
    // Si el socket está activo y tiene usuario, está conectado
    if (connectionState !== "open") {
      // Actualizar connectionState si no está sincronizado
      console.log(`[isWhatsAppConnected] ✅ Socket activo encontrado pero connectionState="${connectionState}", actualizando a "open"`);
      connectionState = "open";
    }
    console.log(`[isWhatsAppConnected] ✅ Socket activo con usuario, retornando true`);
    return true;
  }
  
  // IMPORTANTE: Verificar el estado real de la conexión
  // Si connectionState es "open", está realmente conectado
  // Incluso si el socket no está disponible en este momento, el estado indica que está conectado
  if (connectionState === "open") {
    // Verificar que el socket existe y tiene usuario
    if (socket && socket.user) {
      console.log(`[isWhatsAppConnected] ✅ connectionState === "open" y socket válido, retornando true`);
      return true;
    }
    
    // Si connectionState es "open" pero el socket no está disponible, verificar credenciales
    // Si hay credenciales guardadas, significa que estaba conectado
    if (fs.existsSync(AUTH_DIR)) {
      try {
        const files = fs.readdirSync(AUTH_DIR);
        const hasCreds = files.some(f => f.includes('creds'));
        const hasKeys = files.some(f => f.includes('key') || f.includes('pre-key'));
        if (hasCreds && hasKeys && files.length >= 10) {
          console.log(`[isWhatsAppConnected] ✅ connectionState === "open" y credenciales válidas encontradas (${files.length} archivos), retornando true`);
          return true;
        }
      } catch (checkErr) {
        console.warn(`[isWhatsAppConnected] ⚠️ Error verificando credenciales:`, checkErr);
      }
    }
    
    // Si connectionState es "open", asumir que está conectado aunque el socket no esté disponible
    console.log(`[isWhatsAppConnected] ✅ connectionState === "open", retornando true (socket puede no estar disponible en este momento)`);
    return true;
  }
  
  // Si connectionState es null pero hay credenciales válidas y socket activo, 
  // actualizar el estado basándose en el socket real
  // Esto puede pasar si el servidor se reinició pero el socket ya está conectado
  if (connectionState === null || connectionState === undefined) {
    // PRIMERO: Verificar si el socket está conectado aunque connectionState sea null
    // Esto puede pasar si el estado se desincronizó
    if (socket && socket.user) {
      console.log(`[isWhatsAppConnected] ✅ Socket conectado encontrado aunque connectionState era "${connectionState}", estableciendo connectionState="open" y retornando true`);
      connectionState = "open"; // Actualizar el estado basándose en el socket real
      return true;
    }
    
    // SEGUNDO: Si no hay socket pero hay credenciales válidas, intentar reconectar automáticamente
    if (fs.existsSync(AUTH_DIR)) {
      try {
        const files = fs.readdirSync(AUTH_DIR);
        const hasCreds = files.some(f => f.includes('creds'));
        const hasKeys = files.some(f => f.includes('key') || f.includes('pre-key'));
        
        if (hasCreds && hasKeys && files.length >= 10) {
          // Hay credenciales válidas pero connectionState es null y no hay socket
          // CRÍTICO: NO intentar reconectar si ya hay una reconexión programada o en progreso
          if (isInitializing || isConnecting || isAutoReconnecting || isReconnectScheduled) {
            // Reducir logging: solo loggear ocasionalmente
            const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.05;
            if (shouldLog) {
              console.log(`[isWhatsAppConnected] ⏳ Credenciales válidas pero reconexión en progreso/programada, retornando false temporalmente`);
            }
            return false;
          }
          
          // Verificar cooldown para evitar reconexiones demasiado frecuentes
          const now = Date.now();
          const timeSinceLastAttempt = now - lastAutoReconnectAttempt;
          if (timeSinceLastAttempt < AUTO_RECONNECT_COOLDOWN_MS) {
            // Reducir logging: solo loggear ocasionalmente
            const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.05;
            if (shouldLog) {
              const remainingSeconds = Math.ceil((AUTO_RECONNECT_COOLDOWN_MS - timeSinceLastAttempt) / 1000);
              console.log(`[isWhatsAppConnected] ⏳ Cooldown activo: ${remainingSeconds} segundo(s) restantes antes de intentar reconectar automáticamente`);
            }
            return false;
          }
          
          // CRÍTICO: Verificar nuevamente si ya está conectado antes de intentar reconectar
          if (connectionState === "open" && socket && socket.user) {
            return true; // Ya está conectado, no necesitamos reconectar
          }
          
          // Hay credenciales válidas pero no hay socket ni reconexión en progreso
          // Intentar reconectar automáticamente (con protección contra múltiples intentos)
          lastAutoReconnectAttempt = now;
          isAutoReconnecting = true;
          
          // Reducir logging: solo loggear ocasionalmente
          const shouldLog = process.env.NODE_ENV === "development" || Math.random() < 0.1;
          if (shouldLog) {
            console.log(`[isWhatsAppConnected] 🔄 Credenciales válidas encontradas (${files.length} archivos) pero no hay conexión activa, intentando reconectar automáticamente...`);
          }
          
          try {
            // Intentar inicializar WhatsApp con credenciales existentes
            const resultSocket = await initWhatsApp();
            if (resultSocket && resultSocket.user) {
              if (shouldLog) {
                console.log(`[isWhatsAppConnected] ✅ Reconexión automática exitosa, retornando true`);
              }
              isAutoReconnecting = false;
              return true;
            } else {
              // Esperar un poco y verificar nuevamente
              await new Promise(resolve => setTimeout(resolve, 2000));
              if (socket && socket.user && connectionState === "open") {
                if (shouldLog) {
                  console.log(`[isWhatsAppConnected] ✅ Socket disponible después de esperar, retornando true`);
                }
                isAutoReconnecting = false;
                return true;
              }
            }
          } catch (reconnectErr) {
            const errorMsg = reconnectErr instanceof Error ? reconnectErr.message : String(reconnectErr);
            // Solo loggear errores importantes
            if (shouldLog) {
              console.warn(`[isWhatsAppConnected] ⚠️ Error en reconexión automática: ${errorMsg}`);
            }
          } finally {
            // Siempre resetear el flag después de intentar reconectar
            isAutoReconnecting = false;
          }
          
          // Si la reconexión no funcionó, retornar false
          // No loggear aquí para evitar spam
          return false;
        }
      } catch (checkErr) {
        console.warn(`[isWhatsAppConnected] ⚠️ Error verificando credenciales:`, checkErr);
      }
    }
  }
  
  // Verificar que el socket existe
  if (!socket) {
    console.log(`[isWhatsAppConnected] ❌ Socket no existe y connectionState !== "open", retornando false`);
    return false;
  }
  
  // Verificar que tiene usuario (significa que está autenticado)
  if (!socket.user) {
    console.log(`[isWhatsAppConnected] ❌ Socket sin usuario, retornando false`);
    return false;
  }
  
  // Si connectionState es "close", NO está conectado
  if (connectionState === "close") {
    console.log(`[isWhatsAppConnected] ❌ connectionState es "close", retornando false`);
    return false;
  }
  
  // Si está "connecting", aún no está conectado
  if (connectionState === "connecting") {
    console.log(`[isWhatsAppConnected] ⏳ connectionState === "connecting", retornando false`);
    return false;
  }
  
  // Por defecto, si hay socket y user pero no sabemos el estado, asumir no conectado
  console.log(`[isWhatsAppConnected] ⚠️ Estado desconocido: connectionState="${connectionState}", socket existe=${!!socket}, socket.user existe=${!!socket?.user}, retornando false`);
  return false;
}

// ============================================================================
// ENVIAR MENSAJE
// ============================================================================

export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const isVercel = detectVercel();
    const isKoyeb = detectKoyeb();
    
    if (isVercel && !isKoyeb) {
      return {
        success: false,
        error: "WhatsApp no está disponible en Vercel. Usa Koyeb para enviar mensajes.",
      };
    }
    
    // Obtener socket
    let sock = socket;
    
    if (!sock || !sock.user) {
      try {
        sock = await initWhatsApp();
      } catch (initErr) {
        return {
          success: false,
          error: `Error inicializando WhatsApp: ${initErr instanceof Error ? initErr.message : String(initErr)}`,
        };
      }
    }
    
    // Esperar a que esté conectado
    let attempts = 0;
    while (!sock.user && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    if (!sock.user) {
      return {
        success: false,
        error: "WhatsApp no está conectado. Escanea el QR primero.",
      };
    }
    
    // Limpiar y formatear número
    let cleanPhone = phoneNumber.trim().replace(/[^0-9]/g, "");
    
    if (cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    if (cleanPhone.length < 8 || cleanPhone.length > 15) {
      return {
        success: false,
        error: `Número inválido (${cleanPhone.length} dígitos). Debe tener entre 8 y 15 dígitos.`,
      };
    }
    
    const formattedNumber = cleanPhone.includes("@") ? cleanPhone : `${cleanPhone}@c.us`;
    
    // Enviar mensaje
    const result = await sock.sendMessage(formattedNumber, { text: message });
    
    if (result?.key?.id) {
      console.log(`[WHATSAPP SEND] ✅ Mensaje enviado. ID: ${result.key.id}`);
      return {
        success: true,
        messageId: result.key.id,
      };
    } else {
      return {
        success: false,
        error: "Mensaje enviado pero no se recibió confirmación válida",
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WHATSAPP SEND] ❌ Error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

// ============================================================================
// LIMPIAR CREDENCIALES
// ============================================================================

export async function cleanWhatsAppCredentials(): Promise<{ success: boolean; message: string }> {
  try {
    const isKoyeb = detectKoyeb();
    const isVercel = detectVercel();
    
    if (isVercel && !isKoyeb) {
      return {
        success: false,
        message: "WhatsApp no está disponible en Vercel. Usa Koyeb para limpiar credenciales.",
      };
    }
    
    console.log(`[WHATSAPP CLEAN] Iniciando limpieza...`);
    
    // Cerrar socket de forma más agresiva
    if (socket) {
      try {
        // Cerrar socket (socket.end() maneja la limpieza de listeners automáticamente)
        try {
          socket.end(undefined);
        } catch (e) {
          // Ignorar
        }
        
        // Cerrar WebSocket si existe
        if (socket.ws) {
          try {
            // Intentar cerrar el WebSocket
            if (typeof socket.ws.close === 'function') {
              socket.ws.close();
            }
          } catch (e) {
            // Ignorar
          }
        }
        
        // Esperar más tiempo para que se cierre completamente
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Forzar cierre si aún existe (usar verificación 'in' para evitar error de TypeScript)
        if (socket.ws) {
          try {
            // Intentar terminar si el método existe (verificar con 'in' para evitar error de tipo)
            const ws = socket.ws as any;
            if ('terminate' in ws && typeof ws.terminate === 'function') {
              ws.terminate();
            }
          } catch (e) {
            // Ignorar
          }
        }
      } catch (e) {
        // Ignorar
      }
      socket = null;
    }
    
    // Limpiar estado
    currentQR = null;
    qrTimestamp = 0;
    isConnecting = false;
    isInitializing = false;
    lastErrorTime = 0;
    lastLinkingErrorTime = 0;
    lastQRGenerationTime = 0;
    lastInitAttempt = 0; // Resetear cooldown al limpiar credenciales
    qrRegenerationCount = 0; // Resetear contador de regeneraciones
    saveCredsFunction = null;
    authState = null;
    connectionState = null;
    credsJustSaved = false;
    console.log(`[WHATSAPP CLEAN] ✅ Cooldown reseteado - puedes intentar vincular nuevamente`);
    
    // Esperar un momento adicional para asegurar que todo se cerró
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Eliminar directorio
    if (fs.existsSync(AUTH_DIR)) {
      const files = fs.readdirSync(AUTH_DIR);
      console.log(`[WHATSAPP CLEAN] Eliminando ${files.length} archivos...`);
      
      const deleted = await safeCleanAuthDir(AUTH_DIR);
      
      if (deleted) {
        fs.mkdirSync(AUTH_DIR, { recursive: true });
        console.log(`[WHATSAPP CLEAN] ✅ Credenciales limpiadas`);
        return {
          success: true,
          message: `Credenciales limpiadas. Se generará nuevo QR en el próximo intento.`,
        };
      } else {
        // Verificar si está vacío
        try {
          const remaining = fs.readdirSync(AUTH_DIR);
          if (remaining.length === 0) {
            return {
              success: true,
              message: "Credenciales limpiadas.",
            };
          } else {
            return {
              success: false,
              message: `No se pudieron eliminar todos los archivos. Quedan ${remaining.length} archivos.`,
            };
          }
        } catch (checkErr) {
          return {
            success: false,
            message: "Error verificando limpieza de credenciales.",
          };
        }
      }
    } else {
      return {
        success: true,
        message: "No había credenciales guardadas.",
      };
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WHATSAPP CLEAN] ❌ Error:`, errorMsg);
    return {
      success: false,
      message: `Error limpiando credenciales: ${errorMsg}`,
    };
  }
}

// ============================================================================
// INICIALIZACIÓN AL INICIO (DESHABILITADA)
// ============================================================================

export async function initializeWhatsAppOnStartup(): Promise<void> {
  const isVercel = detectVercel();
  const isKoyeb = detectKoyeb();
  
  if (isVercel && !isKoyeb) {
    console.log("[WHATSAPP INIT] ⏭️ Saltando inicialización (Vercel)");
    return;
  }
  
  // Verificar si hay credenciales guardadas válidas
  let hasValidCreds = false;
  if (fs.existsSync(AUTH_DIR)) {
    try {
      const files = fs.readdirSync(AUTH_DIR);
      const hasCreds = files.some(f => f.includes('creds'));
      const hasKeys = files.some(f => f.includes('key') || f.includes('pre-key'));
      hasValidCreds = hasCreds && hasKeys && files.length >= 10; // Mínimo de archivos para credenciales completas
      
      if (hasValidCreds) {
        console.log(`[WHATSAPP INIT] ✅ Credenciales guardadas detectadas (${files.length} archivos)`);
        // CRÍTICO: Prevenir múltiples reconexiones simultáneas
        if (isReconnectScheduled || isAutoReconnecting || isInitializing || isConnecting) {
          console.log(`[WHATSAPP INIT] ⏳ Ya hay una reconexión programada o en progreso, saltando reconexión inicial...`);
          return; // Salir sin programar otra reconexión
        }
        
        // Marcar que hay una reconexión programada
        isReconnectScheduled = true;
        lastAutoReconnectAttempt = Date.now();
        console.log(`[WHATSAPP INIT] 🔄 Intentando reconexión automática en 5 segundos...`);
        
        // Cancelar cualquier timeout anterior
        if (reconnectTimeoutId) {
          clearTimeout(reconnectTimeoutId);
        }
        
        // Esperar 5 segundos para asegurar que el servidor esté completamente iniciado (aumentado de 3s)
        reconnectTimeoutId = setTimeout(async () => {
          isReconnectScheduled = false;
          reconnectTimeoutId = null;
          
          // Verificar si ya está conectado antes de intentar reconectar
          if (connectionState === "open" && socket && socket.user) {
            console.log(`[WHATSAPP INIT] ✅ WhatsApp ya está conectado, no es necesario reconectar`);
            return;
          }
          
          try {
            // Resetear cooldowns para permitir reconexión automática al inicio
            lastInitAttempt = 0;
            lastErrorTime = 0;
            lastLinkingErrorTime = 0;
            
            // Verificar nuevamente si ya está conectado
            const alreadyConnected = await isWhatsAppConnected();
            if (alreadyConnected) {
              console.log(`[WHATSAPP INIT] ✅ WhatsApp ya está conectado, no es necesario reconectar`);
              return;
            }
            
            isAutoReconnecting = true;
            // Intentar conectar con credenciales existentes
            const resultSocket = await initWhatsApp();
            if (resultSocket && resultSocket.user) {
              console.log(`[WHATSAPP INIT] ✅ Reconexión automática completada al inicio`);
              
              // Verificar que el estado se estableció correctamente
              if (connectionState === "open") {
                // Reducir logging: solo loggear ocasionalmente
                if (process.env.NODE_ENV === "development" || Math.random() < 0.1) {
                  console.log(`[WHATSAPP INIT] ✅ Estado verificado: connectionState="open", WhatsApp está conectado`);
                }
              } else {
                // Forzar actualización del estado si el socket está conectado
                if (socket && socket.user) {
                  connectionState = "open";
                  console.log(`[WHATSAPP INIT] ✅ Estado corregido: connectionState establecido a "open"`);
                }
              }
            } else {
              // Reducir logging: solo loggear ocasionalmente
              if (process.env.NODE_ENV === "development" || Math.random() < 0.1) {
                console.log(`[WHATSAPP INIT] ⚠️ Reconexión completada pero socket no está disponible o no tiene usuario`);
              }
            }
          } catch (reconnectErr) {
            const errorMsg = reconnectErr instanceof Error ? reconnectErr.message : String(reconnectErr);
            // Solo loggear errores importantes
            if (process.env.NODE_ENV === "development" || Math.random() < 0.1) {
              console.log(`[WHATSAPP INIT] ⚠️ Reconexión automática falló: ${errorMsg}`);
            }
          } finally {
            isAutoReconnecting = false;
          }
        }, 5000); // Aumentado a 5 segundos para evitar conflictos
      } else {
        console.log(`[WHATSAPP INIT] ⚠️ No hay credenciales guardadas válidas (${files.length} archivos)`);
        console.log(`[WHATSAPP INIT] 💡 El usuario debe solicitar conexión manualmente desde el dashboard`);
      }
    } catch (checkErr) {
      console.error(`[WHATSAPP INIT] ❌ Error verificando credenciales:`, checkErr);
      console.log(`[WHATSAPP INIT] 💡 El usuario debe solicitar conexión manualmente desde el dashboard`);
    }
  } else {
    console.log(`[WHATSAPP INIT] ⚠️ No hay credenciales guardadas (directorio no existe)`);
    console.log(`[WHATSAPP INIT] 💡 El usuario debe solicitar conexión manualmente desde el dashboard`);
  }
}

// ============================================================================
// FUNCIONES DE COOLDOWN (para el frontend)
// ============================================================================

export function isWhatsAppInCooldown(): { inCooldown: boolean; remainingSeconds?: number; remainingMinutes?: number; remainingSecs?: number } {
  const now = Date.now();
  
  // Cooldown de generación de QR
  if (lastQRGenerationTime > 0) {
    const timeSince = now - lastQRGenerationTime;
    if (timeSince < MIN_QR_GENERATION_INTERVAL_MS) {
      const remaining = Math.ceil((MIN_QR_GENERATION_INTERVAL_MS - timeSince) / 1000);
      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return { inCooldown: true, remainingSeconds: remaining, remainingMinutes: minutes, remainingSecs: secs };
    }
  }
  
  // Cooldown de errores
  if (lastErrorTime > 0) {
    const timeSince = now - lastErrorTime;
    if (timeSince < ERROR_COOLDOWN_MS) {
      const remaining = Math.ceil((ERROR_COOLDOWN_MS - timeSince) / 1000);
      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return { inCooldown: true, remainingSeconds: remaining, remainingMinutes: minutes, remainingSecs: secs };
    }
  }
  
  return { inCooldown: false };
}

export function isWhatsAppLinkingErrorCooldown(): { inCooldown: boolean; remainingSeconds?: number; remainingMinutes?: number; remainingSecs?: number } {
  const now = Date.now();
  
  if (lastLinkingErrorTime > 0) {
    const timeSince = now - lastLinkingErrorTime;
    if (timeSince < LINKING_ERROR_COOLDOWN_MS) {
      const remaining = Math.ceil((LINKING_ERROR_COOLDOWN_MS - timeSince) / 1000);
      const minutes = Math.floor(remaining / 60);
      const secs = remaining % 60;
      return { inCooldown: true, remainingSeconds: remaining, remainingMinutes: minutes, remainingSecs: secs };
    }
  }
  
  return { inCooldown: false };
}

