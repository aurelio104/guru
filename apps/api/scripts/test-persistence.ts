/**
 * Prueba de persistencia: escribe datos, sale (persistiendo), y en una segunda ejecución comprueba que sigan ahí.
 * Uso:
 *   APLAT_DATA_PATH=./data-persist-test npx tsx scripts/test-persistence.ts phase1
 *   APLAT_DATA_PATH=./data-persist-test npx tsx scripts/test-persistence.ts phase2
 */
import {
  initStoreDb,
  createClient,
  updateClientProfile,
  addServiceSubscription,
  getClientByEmail,
  getSubscriptionsByPhone,
} from "../src/clients-store.js";

const TEST_EMAIL = "persist-test@test.com";
const TEST_PHONE = "+34900123456";
const TEST_SERVICE = "TestService";
const TEST_DAY = 15;
const TEST_AMOUNT = 99;
const TEST_NOMBRES = "Test";
const TEST_APELLIDOS = "User";

async function phase1(): Promise<void> {
  await initStoreDb();
  const client = createClient(TEST_EMAIL, "test-password-hash");
  updateClientProfile(client.id, {
    nombres: TEST_NOMBRES,
    apellidos: TEST_APELLIDOS,
    telefono: TEST_PHONE,
    telefonoVerificado: true,
  });
  addServiceSubscription(TEST_PHONE, TEST_SERVICE, TEST_DAY, TEST_AMOUNT);
  console.log("[test-persistence] Phase 1: cliente, perfil y suscripción creados. Saliendo para persistir.");
  process.exit(0);
}

async function phase2(): Promise<void> {
  await initStoreDb();
  const client = getClientByEmail(TEST_EMAIL);
  if (!client) {
    console.error("[test-persistence] FAIL: Cliente no encontrado tras reinicio.");
    process.exit(1);
  }
  if (client.profile?.nombres !== TEST_NOMBRES || client.profile?.apellidos !== TEST_APELLIDOS) {
    console.error("[test-persistence] FAIL: Perfil no persistido. Esperado nombres/apellidos:", TEST_NOMBRES, TEST_APELLIDOS, "Recibido:", client.profile?.nombres, client.profile?.apellidos);
    process.exit(1);
  }
  const subs = getSubscriptionsByPhone(TEST_PHONE);
  if (subs.length !== 1) {
    console.error("[test-persistence] FAIL: Suscripciones no persistidas. Esperado 1, recibido:", subs.length);
    process.exit(1);
  }
  if (subs[0].serviceName !== TEST_SERVICE || subs[0].dayOfMonth !== TEST_DAY || subs[0].amount !== TEST_AMOUNT) {
    console.error("[test-persistence] FAIL: Datos de suscripción incorrectos.", subs[0]);
    process.exit(1);
  }
  console.log("[test-persistence] OK: Cliente, perfil y suscripción persisten correctamente tras reinicio.");
  process.exit(0);
}

const phase = process.argv[2] || "";
if (phase === "phase1") phase1().catch((e) => { console.error(e); process.exit(1); });
else if (phase === "phase2") phase2().catch((e) => { console.error(e); process.exit(1); });
else {
  console.error("Uso: APLAT_DATA_PATH=./data-persist-test npx tsx scripts/test-persistence.ts phase1 | phase2");
  process.exit(1);
}
