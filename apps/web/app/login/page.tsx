"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  KeyRound,
  Fingerprint,
  Lock,
  Loader2,
  Shield,
  Mail,
} from "lucide-react";
import { getWebAuthnRpId, decodeBase64UrlToUint8Array } from "@/lib/webauthn";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

type AuthMethod = "passkey" | "biometric" | "traditional";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect")?.replace(/[^a-zA-Z0-9/_-]/g, "") || "/dashboard";
  const [authMethod, setAuthMethod] = useState<AuthMethod>("traditional");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passkeySupported, setPasskeySupported] = useState<boolean | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      typeof window.PublicKeyCredential !== "undefined" &&
      typeof navigator?.credentials?.get === "function";
    setPasskeySupported(ok);
  }, []);

  async function handlePasskeyLogin() {
    if (!API_URL) {
      setMessage({ type: "error", text: "API no configurada." });
      return;
    }
    if (passkeySupported === false) {
      setMessage({ type: "error", text: "Tu navegador o contexto no soporta Passkeys (usa HTTPS o localhost)." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const challengeRes = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/webauthn/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const challengeData = await challengeRes.json().catch(() => ({}));
      if (!challengeData.ok || !challengeData.challenge) {
        setMessage({ type: "error", text: challengeData.message || "Error al obtener el challenge." });
        setLoading(false);
        return;
      }
      const challengeBytes = decodeBase64UrlToUint8Array(challengeData.challenge);
      const rpId = getWebAuthnRpId();
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challengeBytes as BufferSource,
          allowCredentials: [],
          timeout: 60000,
          userVerification: "preferred",
          rpId: rpId === "localhost" ? undefined : rpId,
        },
      }) as PublicKeyCredential | null;
      if (!credential) {
        setMessage({ type: "error", text: "Autenticación cancelada o no hay Passkey registrada." });
        setLoading(false);
        return;
      }
      const response = credential.response as AuthenticatorAssertionResponse;
      const verifyRes = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/webauthn/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId: Array.from(new Uint8Array(credential.rawId)),
          authenticatorData: Array.from(new Uint8Array(response.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(response.clientDataJSON)),
          signature: Array.from(new Uint8Array(response.signature)),
          userHandle: response.userHandle ? Array.from(new Uint8Array(response.userHandle)) : null,
        }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok || !verifyData.ok) {
        setMessage({ type: "error", text: verifyData.message || verifyData.error || "Passkey no reconocida." });
        setLoading(false);
        return;
      }
      if (verifyData.token) {
        localStorage.setItem("aplat_token", verifyData.token);
      }
      setMessage({ type: "success", text: "Sesión iniciada con Passkey. Redirigiendo..." });
      const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      setTimeout(() => { window.location.href = target; }, 800);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error de conexión." });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (authMethod !== "traditional" || !email.trim() || !password.trim()) return;
    if (!API_URL) {
      setMessage({ type: "error", text: "API no configurada." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data?.error ?? "Error al iniciar sesión." });
        return;
      }
      if (data.token) {
        typeof window !== "undefined" && localStorage.setItem("aplat_token", data.token);
      }
      setMessage({ type: "success", text: "Sesión iniciada. Redirigiendo..." });
      const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard";
      setTimeout(() => {
        window.location.href = target;
      }, 800);
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aplat-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-aplat-violet/10 rounded-full blur-[120px]" />
      </div>
      <div className="absolute top-0 left-0 right-0 z-10 p-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="glass glass-strong rounded-2xl p-8 mirror-shine border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-aplat-text mb-1">
              Acceso seguro
            </h1>
            <p className="text-aplat-muted text-sm">
              Passkey, biométrico o email/contraseña
            </p>
          </div>

          <div className="flex gap-2 mb-6 rounded-xl bg-white/5 p-1">
            {[
              { id: "passkey" as const, icon: KeyRound, label: "Passkey" },
              { id: "biometric" as const, icon: Fingerprint, label: "Biométrico" },
              { id: "traditional" as const, icon: Lock, label: "Email/Password" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAuthMethod(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  authMethod === id
                    ? "bg-aplat-cyan/20 text-aplat-cyan border border-aplat-cyan/30"
                    : "text-aplat-muted hover:text-aplat-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {(authMethod === "passkey" || authMethod === "biometric") && (
            <div className="rounded-xl bg-aplat-cyan/5 border border-aplat-cyan/20 p-4 text-center text-aplat-muted text-sm">
              Próximamente: autenticación con llave de acceso y biométrico (WebAuthn).
              Usa Email/Password por ahora.
            </div>
          )}

          {authMethod === "traditional" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "bg-aplat-emerald/10 text-aplat-emerald border border-aplat-emerald/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 disabled:opacity-60"
                />
              </label>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none focus:ring-1 focus:ring-aplat-cyan/30 disabled:opacity-60"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-3 font-medium transition-all disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Iniciar sesión
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-aplat-muted text-xs">
            <span className="inline-flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              JWT + HTTPS
            </span>
            <span className="inline-flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              Passkey como Omac
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-aplat-deep">
        <div className="w-10 h-10 border-2 border-aplat-cyan/40 border-t-aplat-cyan rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
