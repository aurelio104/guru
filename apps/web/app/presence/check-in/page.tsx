"use client";

/**
 * APlat Presence — Check-in multi-canal
 * Geolocalización, QR, BLE, NFC. Cola offline para reintentos automáticos.
 */
import { useState, useEffect, useCallback } from "react";
import { enqueueCheckIn, flushOfflineQueue, getQueuedCount, registerSyncForPresence } from "@/lib/presence-offline-queue";
import { parseBleAdvertisement, selectStrongestBeacon, type BleBeaconDetected } from "@/lib/ble-scanner";
import { motion } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, AlertCircle, Navigation, QrCode, Bluetooth, CreditCard } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";
const SITE_URL = typeof window !== "undefined" ? window.location.origin : "";

type Zone = { id: string; name: string };
type Site = { id: string; name: string };
type CheckInMode = "geolocation" | "qr" | "ble" | "nfc" | "smart";

export default function CheckInPage() {
  const [siteId, setSiteId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [mode, setMode] = useState<CheckInMode>("geolocation");
  const [sites, setSites] = useState<Site[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [status, setStatus] = useState<"idle" | "locating" | "checking" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [locationPermitted, setLocationPermitted] = useState<boolean | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  const BASE = API_URL.replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const fetchSites = useCallback(async () => {
    if (!token || !API_URL) return;
    if (siteId) return;
    try {
      const res = await fetch(`${BASE}/api/presence/admin/sites`, { headers });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.sites)) {
        setSites(data.sites);
        if (data.sites.length === 1) setSiteId(data.sites[0].id);
      }
    } catch {}
  }, [token, siteId]);

  const fetchZones = useCallback(async () => {
    if (!siteId || !API_URL) return;
    if (!token) return;
    try {
      const res = await fetch(`${BASE}/api/presence/zones?site_id=${siteId}`, { headers });
      const data = await res.json().catch(() => ({}));
      if (data.ok && Array.isArray(data.zones)) {
        setZones(data.zones);
        if (data.zones.length === 1) setZoneId(data.zones[0].id);
      }
    } catch {}
  }, [siteId, token]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const s = params.get("site_id") || params.get("site");
    const z = params.get("zone_id") || params.get("zone");
    const m = params.get("channel") || params.get("mode");
    if (s) setSiteId(s);
    if (z) setZoneId(z);
    if (m === "qr") setMode("qr");
    if (m === "ble") setMode("ble");
    if (m === "nfc") setMode("nfc");
    if (m === "smart") setMode("smart");
  }, []);

  useEffect(() => {
    const seen = typeof window !== "undefined" && localStorage.getItem("aplat_presence_onboarding") === "1";
    setOnboardingSeen(!!seen);
  }, []);

  useEffect(() => {
    setQueuedCount(getQueuedCount());
    setOnline(navigator.onLine);
    const onOnline = () => {
      setOnline(true);
      flushOfflineQueue(
        () => setQueuedCount(getQueuedCount()),
        () => {}
      ).then(() => setQueuedCount(getQueuedCount()));
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "FLUSH_PRESENCE_QUEUE") {
        flushOfflineQueue(
          () => setQueuedCount(getQueuedCount()),
          () => {}
        ).then(() => setQueuedCount(getQueuedCount()));
      }
    };
    sw.addEventListener("message", onMessage);
    return () => sw.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  async function requestLocation() {
    if (!navigator.geolocation) {
      setMessage("Su navegador no soporta geolocalización.");
      setLocationPermitted(false);
      return;
    }
    if (!onboardingSeen) setOnboardingSeen(true);
    if (typeof window !== "undefined") localStorage.setItem("aplat_presence_onboarding", "1");
    setStatus("locating");
    setMessage("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationPermitted(true);
        setStatus("idle");
      },
      (err) => {
        setLocationPermitted(false);
        setStatus("idle");
        if (err.code === 1) setMessage("Permiso de ubicación denegado. Habilítelo en ajustes.");
        else if (err.code === 2) setMessage("No se pudo obtener la ubicación.");
        else setMessage("Error al obtener ubicación.");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }

  const [bleBeacon, setBleBeacon] = useState<{ uuid: string; major: number; minor: number; rssi?: number; eddystoneUid?: string } | null>(null);
  const [bleScanning, setBleScanning] = useState(false);
  const [nfcTagId, setNfcTagId] = useState<string | null>(null);
  const [nfcScanning, setNfcScanning] = useState(false);

  async function scanForBeacon() {
    const nav = navigator as Navigator & { bluetooth?: { requestLEScan?: (opts: unknown) => Promise<unknown> } };
    if (!nav.bluetooth?.requestLEScan) {
      setMessage("BLE requiere Chrome en Android. Use QR o geolocalización.");
      return;
    }
    setBleScanning(true);
    setMessage("");
    try {
      const controller = new AbortController();
      const scanner = await nav.bluetooth.requestLEScan({
        acceptAllAdvertisements: true,
        signal: controller.signal,
      });
      const found = new Map<string, BleBeaconDetected>();
      const handler = (ev: unknown) => {
        const e = ev as { manufacturerData?: Map<number, DataView>; serviceData?: Map<number | string, DataView>; rssi?: number };
        const beacon = parseBleAdvertisement(e);
        if (!beacon) return;
        const key = beacon.type === "eddystone_uid" ? `ed:${beacon.uuid}` : `${beacon.uuid}:${beacon.major}:${beacon.minor}`;
        if (!found.has(key)) found.set(key, beacon);
      };
      (scanner as { addEventListener?: (e: string, h: (ev: unknown) => void) => void }).addEventListener?.("advertisementreceived", handler);
      setTimeout(() => {
        controller.abort();
        const list = Array.from(found.values());
        if (list.length > 0) {
          const best = selectStrongestBeacon(list);
          setBleBeacon({
            uuid: best.uuid,
            major: best.major,
            minor: best.minor,
            rssi: best.rssi,
            eddystoneUid: best.type === "eddystone_uid" ? best.uuid : undefined,
          });
        }
        setBleScanning(false);
      }, 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al escanear BLE.");
      setBleScanning(false);
    }
  }

  async function scanNfc() {
    const NDEFReader = typeof window !== "undefined" ? (window as unknown as { NDEFReader?: new () => { scan: () => Promise<void>; onreading: ((ev: { serialNumber?: string }) => void) | null } }).NDEFReader : undefined;
    if (!NDEFReader) {
      setMessage("NFC requiere Chrome en Android con Web NFC habilitado.");
      return;
    }
    setNfcScanning(true);
    setMessage("");
    try {
      const ndef = new NDEFReader();
      ndef.onreading = (ev: { serialNumber?: string }) => {
        const id = ev.serialNumber || "";
        if (id) setNfcTagId(id);
        setNfcScanning(false);
      };
      await ndef.scan();
      setTimeout(() => setNfcScanning(false), 15000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error al leer NFC.");
      setNfcScanning(false);
    }
  }

  async function doSmartCheckIn(): Promise<boolean> {
    const nav = navigator as Navigator & { bluetooth?: { requestLEScan?: (opts: unknown) => Promise<unknown> } };
    const bt = nav.bluetooth;
    if (bt?.requestLEScan) {
      setMessage("Buscando beacon...");
      setStatus("checking");
      try {
        const controller = new AbortController();
        const scanner = await bt.requestLEScan({
          acceptAllAdvertisements: true,
          signal: controller.signal,
        });
        const found: BleBeaconDetected[] = [];
        const handler = (ev: unknown) => {
          const b = parseBleAdvertisement(ev as Parameters<typeof parseBleAdvertisement>[0]);
          if (b) found.push(b);
        };
        (scanner as { addEventListener?: (e: string, h: (ev: unknown) => void) => void }).addEventListener?.("advertisementreceived", handler);
        await new Promise((r) => setTimeout(r, 3000));
        controller.abort();
        if (found.length > 0) {
          const best = selectStrongestBeacon(found);
          const beacon = {
            uuid: best.uuid,
            major: best.major,
            minor: best.minor,
            rssi: best.rssi,
            eddystoneUid: best.type === "eddystone_uid" ? best.uuid : undefined,
          };
          setBleBeacon(beacon);
          await submitCheckInBle(beacon);
          return true;
        }
      } catch {
        /* continue to geo */
      }
    }
    if (coords) {
      await submitCheckIn("geolocation", coords.lat, coords.lng);
      return true;
    }
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(c);
            await submitCheckIn("geolocation", c.lat, c.lng);
            resolve(true);
          },
          () => {
            setMessage("Use QR, BLE o Ubicación manual.");
            setStatus("idle");
            resolve(false);
          },
          { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 }
        );
      });
    }
    setMessage("Use QR o modo manual.");
    setStatus("idle");
    return false;
  }

  async function doCheckIn(useQr = false, useBle = false, useNfc = false, useSmart = false) {
    if (!useBle && !useNfc && (!siteId || !zoneId)) {
      setMessage("Seleccione sede y zona.");
      setStatus("error");
      return;
    }
    if (!API_URL) {
      setMessage("Servicio no configurado.");
      setStatus("error");
      return;
    }
    if (useSmart) {
      await doSmartCheckIn();
      return;
    }
    if (useQr) {
      await submitCheckIn("qr", undefined, undefined);
      return;
    }
    if (useBle) {
      if (!bleBeacon) {
        setMessage("Escanee un beacon cercano primero.");
        setStatus("error");
        return;
      }
      await submitCheckInBle(bleBeacon);
      return;
    }
    if (useNfc) {
      if (!nfcTagId) {
        setMessage("Acérquese al tag NFC primero.");
        setStatus("error");
        return;
      }
      await submitCheckInNfc(nfcTagId);
      return;
    }
    if (!coords && locationPermitted !== true) {
      setMessage("Obtenga su ubicación primero.");
      setStatus("error");
      return;
    }
    if (!coords) {
      await requestLocation();
      return;
    }
    await submitCheckIn("geolocation", coords.lat, coords.lng);
  }

  async function submitCheckInNfc(tagId: string) {
    setStatus("checking");
    setMessage("");
    const body = { channel: "nfc" as const, nfc_tag_id: tagId };
    try {
      const res = await fetch(`${BASE}/api/presence/check-in`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.error || "Tag NFC no registrado.");
      }
    } catch {
      enqueueCheckIn(`${BASE}/api/presence/check-in`, headers, body);
      registerSyncForPresence();
      setQueuedCount(getQueuedCount());
      setStatus("error");
      setMessage("Sin conexión. Check-in guardado y se enviará al recuperar red.");
    }
  }

  async function submitCheckInBle(beacon: { uuid: string; major: number; minor: number; rssi?: number; eddystoneUid?: string }) {
    setStatus("checking");
    setMessage("");
    const body: Record<string, unknown> = { channel: "ble" as const };
    if (beacon.eddystoneUid) {
      body.beacon_eddystone_uid = beacon.eddystoneUid;
      if (beacon.rssi != null) body.beacon_rssi = beacon.rssi;
    } else {
      body.beacon_uuid = beacon.uuid;
      body.beacon_major = beacon.major;
      body.beacon_minor = beacon.minor;
      if (beacon.rssi != null) body.beacon_rssi = beacon.rssi;
    }
    try {
      const res = await fetch(`${BASE}/api/presence/check-in`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.error || "Beacon no registrado en este sitio.");
      }
    } catch {
      enqueueCheckIn(`${BASE}/api/presence/check-in`, headers, body);
      registerSyncForPresence();
      setQueuedCount(getQueuedCount());
      setStatus("error");
      setMessage("Sin conexión. Check-in guardado y se enviará al recuperar red.");
    }
  }

  async function submitCheckIn(channel: "geolocation" | "qr", lat?: number, lng?: number) {
    setStatus("checking");
    setMessage("");
    const body: Record<string, unknown> = {
      site_id: siteId,
      zone_id: zoneId,
      channel,
    };
    if (channel === "geolocation" && lat != null && lng != null) {
      body.lat = lat;
      body.lng = lng;
    }
    if (channel === "qr") {
      body.qr_code = `${SITE_URL}/presence/check-in?site_id=${siteId}&zone_id=${zoneId}&channel=qr`;
    }
    try {
      const res = await fetch(`${BASE}/api/presence/check-in`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setMessage(data.error || "Error al registrar check-in.");
      }
    } catch {
      enqueueCheckIn(`${BASE}/api/presence/check-in`, headers, body);
      registerSyncForPresence();
      setQueuedCount(getQueuedCount());
      setStatus("error");
      setMessage("Sin conexión. Check-in guardado y se enviará al recuperar red.");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-aplat-deep flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-neon rounded-2xl p-8 text-center max-w-sm"
        >
          <CheckCircle2 className="w-16 h-16 text-aplat-emerald mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-aplat-text mb-2">Check-in registrado</h2>
          <p className="text-aplat-muted text-sm">¡Bienvenido! Su llegada ha sido registrada.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aplat-deep flex flex-col items-center justify-center p-4 bg-grid-perspective">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-neon rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-aplat-cyan/10">
            <MapPin className="w-6 h-6 text-aplat-cyan" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-aplat-text">Check-in</h1>
            <p className="text-aplat-muted text-sm">Registre su llegada</p>
          </div>
        </div>

        {(!online || queuedCount > 0) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm">
            {!online && "Sin conexión. Los check-ins se guardarán y enviarán al recuperar red."}
            {online && queuedCount > 0 && `${queuedCount} check-in(s) pendientes de enviar.`}
          </div>
        )}

        {!onboardingSeen && mode === "geolocation" && (
          <div className="p-4 rounded-xl bg-aplat-cyan/10 border border-aplat-cyan/20 text-sm text-aplat-text">
            <p className="font-medium mb-1">Para check-in automático</p>
            <p className="text-aplat-muted text-xs">
              Necesitamos acceso a su ubicación para verificar que está en la zona. Solo se usa al registrar llegada.
            </p>
          </div>
        )}

        {sites.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-aplat-muted mb-1">Sede</label>
            <select
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setZoneId("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text"
            >
              <option value="">Seleccionar...</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {zones.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-aplat-muted mb-1">Zona</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text"
            >
              <option value="">Seleccionar...</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {siteId && zoneId && (
          <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-white/5">
            <button
              type="button"
              onClick={() => setMode("smart")}
              className={`flex-1 min-w-[100px] py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                mode === "smart" ? "bg-aplat-emerald/20 text-aplat-emerald" : "text-aplat-muted hover:text-aplat-text"
              }`}
            >
              <Navigation className="w-4 h-4" />
              Inteligente
            </button>
            <button
              type="button"
              onClick={() => setMode("geolocation")}
              className={`flex-1 min-w-[100px] py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                mode === "geolocation" ? "bg-aplat-cyan/20 text-aplat-cyan" : "text-aplat-muted hover:text-aplat-text"
              }`}
            >
              <MapPin className="w-4 h-4" />
              Ubicación
            </button>
            <button
              type="button"
              onClick={() => setMode("qr")}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                mode === "qr" ? "bg-aplat-cyan/20 text-aplat-cyan" : "text-aplat-muted hover:text-aplat-text"
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR
            </button>
            <button
              type="button"
              onClick={() => setMode("ble")}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                mode === "ble" ? "bg-aplat-cyan/20 text-aplat-cyan" : "text-aplat-muted hover:text-aplat-text"
              }`}
            >
              <Bluetooth className="w-4 h-4" />
              BLE
            </button>
            <button
              type="button"
              onClick={() => setMode("nfc")}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                mode === "nfc" ? "bg-aplat-cyan/20 text-aplat-cyan" : "text-aplat-muted hover:text-aplat-text"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              NFC
            </button>
          </div>
        )}

        {mode === "smart" && (
          <p className="text-aplat-muted text-xs">
            Intenta BLE → Ubicación → fallback. Un toque para registrar.
          </p>
        )}

        {mode === "qr" && (
          <p className="text-aplat-muted text-xs">
            Escaneó el código QR. Un toque para registrar su llegada.
          </p>
        )}

        {mode === "nfc" && (
          <div className="space-y-2">
            {!nfcTagId ? (
              <button
                type="button"
                onClick={scanNfc}
                disabled={nfcScanning}
                className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text text-sm flex items-center justify-center gap-2"
              >
                {nfcScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Acercando tag NFC...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Escanear tag NFC
                  </>
                )}
              </button>
            ) : (
              <p className="text-aplat-muted text-xs">Tag detectado: {nfcTagId.slice(0, 16)}...</p>
            )}
          </div>
        )}

        {mode === "ble" && (
          <div className="space-y-2">
            {!bleBeacon ? (
              <button
                type="button"
                onClick={scanForBeacon}
                disabled={bleScanning}
                className="w-full py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-aplat-text text-sm flex items-center justify-center gap-2"
              >
                {bleScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando beacon...
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4" />
                    Escanear beacon cercano
                  </>
                )}
              </button>
            ) : (
              <p className="text-aplat-muted text-xs">
                Beacon detectado: {bleBeacon.uuid.slice(0, 8)}... {bleBeacon.major}:{bleBeacon.minor}
              </p>
            )}
          </div>
        )}

        {coords && mode === "geolocation" && (
          <p className="text-aplat-muted text-xs">
            Ubicación: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}

        {locationPermitted === false && mode === "geolocation" && (
          <p className="text-red-400/80 text-sm">Habilite la ubicación en ajustes para continuar.</p>
        )}

        {message && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {mode === "geolocation" && !coords && locationPermitted !== false && (
            <button
              type="button"
              onClick={requestLocation}
              disabled={status === "locating"}
              className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-aplat-text font-medium hover:bg-white/10 flex items-center justify-center gap-2"
            >
              {status === "locating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  Permitir ubicación
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => doCheckIn(mode === "qr", mode === "ble", mode === "nfc", mode === "smart")}
            disabled={
              status === "checking" ||
              status === "locating" ||
              (mode === "geolocation" && !coords) ||
              (mode === "ble" && !bleBeacon) ||
              (mode === "nfc" && !nfcTagId)
            }
            className="w-full py-3 px-4 rounded-xl bg-aplat-cyan text-aplat-deep font-semibold hover:bg-aplat-cyan/90 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {status === "checking" ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registrando...
              </>
            ) : mode === "qr" || mode === "ble" || mode === "nfc" ? (
              <>
                {mode === "qr" ? <QrCode className="w-5 h-5" /> : mode === "ble" ? <Bluetooth className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                Registrar llegada
              </>
            ) : (
              <>
                <MapPin className="w-5 h-5" />
                Registrar llegada
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
