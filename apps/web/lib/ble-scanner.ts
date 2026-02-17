/**
 * GURU Presence — Escáner BLE multi-formato
 * iBeacon (Apple), Eddystone-UID (Google), RSSI y multi-beacon
 */
export type BleBeaconDetected = {
  type: "ibeacon" | "eddystone_uid";
  uuid: string; // iBeacon: UUID; Eddystone: hex(namespace+instance)
  major: number; // iBeacon: major; Eddystone: 0
  minor: number; // iBeacon: minor; Eddystone: 0
  rssi?: number; // Intensidad de señal (si disponible)
  namespace?: string; // Eddystone namespace hex
  instance?: string; // Eddystone instance hex
};

function parseIBeacon(m: DataView): BleBeaconDetected | null {
  if (m.byteLength < 23) return null;
  if (m.getUint8(0) !== 0x02 || m.getUint8(1) !== 0x15) return null;
  const uuid = [
    m.getUint8(2).toString(16).padStart(2, "0"),
    m.getUint8(3).toString(16).padStart(2, "0"),
    m.getUint8(4).toString(16).padStart(2, "0"),
    m.getUint8(5).toString(16).padStart(2, "0"),
    "-",
    m.getUint8(6).toString(16).padStart(2, "0"),
    m.getUint8(7).toString(16).padStart(2, "0"),
    "-",
    m.getUint8(8).toString(16).padStart(2, "0"),
    m.getUint8(9).toString(16).padStart(2, "0"),
    "-",
    m.getUint8(10).toString(16).padStart(2, "0"),
    m.getUint8(11).toString(16).padStart(2, "0"),
    "-",
    m.getUint8(12).toString(16).padStart(2, "0"),
    m.getUint8(13).toString(16).padStart(2, "0"),
    m.getUint8(14).toString(16).padStart(2, "0"),
    m.getUint8(15).toString(16).padStart(2, "0"),
    m.getUint8(16).toString(16).padStart(2, "0"),
    m.getUint8(17).toString(16).padStart(2, "0"),
  ].join("");
  const major = m.getUint16(18, false);
  const minor = m.getUint16(20, false);
  return { type: "ibeacon", uuid: uuid.toUpperCase(), major, minor };
}

function parseEddystoneUid(d: DataView): BleBeaconDetected | null {
  if (d.byteLength < 18) return null; // 1+1+1+10+6
  const frameType = d.getUint8(0);
  if (frameType !== 0x00) return null; // UID frame
  const namespace = Array.from(new Uint8Array(d.buffer, d.byteOffset + 2, 10))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const instance = Array.from(new Uint8Array(d.buffer, d.byteOffset + 12, 6))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const uid = (namespace + instance).toUpperCase();
  return { type: "eddystone_uid", uuid: uid, major: 0, minor: 0, namespace, instance };
}

export function parseBleAdvertisement(
  ev: { manufacturerData?: Map<number, DataView>; serviceData?: Map<string | number, DataView>; rssi?: number }
): BleBeaconDetected | null {
  let beacon: BleBeaconDetected | null = null;
  const e = ev;

  // iBeacon (Apple, manufacturer 0x004C)
  const m = e.manufacturerData?.get(0x004c);
  if (m) beacon = parseIBeacon(m);

  // Eddystone-UID (Google, service 0xFEAA)
  if (!beacon && e.serviceData) {
    const feaa = e.serviceData.get(0xfeaa)
      ?? e.serviceData.get("0xfeaa")
      ?? e.serviceData.get("0000feaa-0000-1000-8000-00805f9b34fb")
      ?? e.serviceData.get("0000FEAA-0000-1000-8000-00805F9B34FB");
    if (feaa) beacon = parseEddystoneUid(feaa);
  }

  if (beacon && e.rssi != null) beacon.rssi = e.rssi;
  return beacon;
}

/** Selecciona el beacon más cercano (mayor RSSI) de una lista */
export function selectStrongestBeacon(beacons: BleBeaconDetected[]): BleBeaconDetected {
  return beacons.reduce((best, b) =>
    (b.rssi ?? -100) > (best.rssi ?? -100) ? b : best
  );
}
