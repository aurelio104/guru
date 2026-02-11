/**
 * WebAuthn / Passkey (como Omac).
 * rpId debe ser el hostname del sitio (donde corre el front).
 */
export function getWebAuthnRpId(hostname?: string): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APLAT_WEBAUTHN_RP_ID) {
    return process.env.NEXT_PUBLIC_APLAT_WEBAUTHN_RP_ID.trim();
  }
  const current = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  const h = current.split(":")[0] || "";
  if (h === "localhost" || h === "127.0.0.1") return "localhost";
  if (h.includes("vercel.app")) return h;
  if (h.includes("aplat")) return h.replace(/^www\./, "");
  return h || "localhost";
}

export function decodeBase64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padding);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
