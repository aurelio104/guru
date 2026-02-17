"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, Loader2 } from "lucide-react";
import { getWebAuthnRpId } from "@/lib/webauthn";

const API_URL = process.env.NEXT_PUBLIC_GURU_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("guru_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function DashboardWidgetPasskey() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRegisterPasskey() {
    if (!API_URL) {
      setMessage({ type: "error", text: "API no configurada." });
      return;
    }
    const token = localStorage.getItem("guru_token");
    if (!token) {
      setMessage({ type: "error", text: "Inicia sesión primero." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const beginRes = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/webauthn/register/begin`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ deviceName: "GURU Dashboard" }),
      });
      const beginData = await beginRes.json().catch(() => ({}));
      if (!beginRes.ok || !beginData.ok || !beginData.options) {
        setMessage({ type: "error", text: beginData.message || "Error al iniciar registro." });
        setLoading(false);
        return;
      }
      const opts = beginData.options;
      const rpId = getWebAuthnRpId();
      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: new Uint8Array(opts.challenge),
        rp: { name: opts.rp.name, id: opts.rp.id || rpId },
        user: {
          id: new Uint8Array(opts.user.id),
          name: opts.user.name,
          displayName: opts.user.displayName || opts.user.name,
        },
        pubKeyCredParams: opts.pubKeyCredParams,
        authenticatorSelection: opts.authenticatorSelection,
        timeout: opts.timeout,
        attestation: opts.attestation || "none",
      };
      const credential = await navigator.credentials.create({
        publicKey,
      }) as PublicKeyCredential | null;
      if (!credential) {
        setMessage({ type: "error", text: "Registro cancelado." });
        setLoading(false);
        return;
      }
      const response = credential.response as AuthenticatorAttestationResponse;
      const completeRes = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/webauthn/register/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          challenge: beginData.challenge,
          credentialId: Array.from(new Uint8Array(credential.rawId)),
          publicKey: {
            keyType: response.getPublicKeyAlgorithm(),
            key: Array.from(new Uint8Array(response.getPublicKey() ?? [])),
            cosePublicKey: Array.from(new Uint8Array(response.getPublicKey() ?? [])),
          },
          deviceName: "GURU Dashboard",
        }),
      });
      const completeData = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok || !completeData.ok) {
        setMessage({ type: "error", text: completeData.message || "Error al completar registro." });
        setLoading(false);
        return;
      }
      setMessage({ type: "success", text: "Passkey registrada. La próxima vez puedes iniciar sesión con Passkey." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error de conexión." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-xl p-2 bg-guru-violet/15 text-guru-violet">
          <KeyRound className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-semibold text-guru-text">Passkey</h2>
      </div>
      <p className="text-guru-muted text-sm mb-4">
        Registra una Passkey para iniciar sesión sin contraseña. El navegador mostrará la opción de guardarla en este dispositivo o de escanear un QR para guardarla en tu smartphone.
      </p>
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm mb-4 ${
            message.type === "success"
              ? "bg-guru-emerald/10 text-guru-emerald border border-guru-emerald/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.text}
        </div>
      )}
      <button
        type="button"
        onClick={handleRegisterPasskey}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-guru-violet/20 hover:bg-guru-violet/30 text-guru-violet border border-guru-violet/40 px-4 py-3 font-medium transition-all disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <KeyRound className="w-4 h-4" />
            Registrar Passkey (este dispositivo o smartphone vía QR)
          </>
        )}
      </button>
    </motion.div>
  );
}
