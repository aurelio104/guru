"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
  Phone,
  MapPin,
  Mail,
  Briefcase,
  Shield,
} from "lucide-react";
import { useDashboardUser } from "@/contexts/DashboardUserContext";
import { CountryCodePhoneInput } from "@/components/ui/CountryCodePhoneInput";

const API_URL = process.env.NEXT_PUBLIC_APLAT_API_URL ?? "";

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("aplat_token") : null;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type ProfileData = {
  nombres: string;
  apellidos: string;
  identidad: string;
  telefono: string;
  telefonoVerificado: boolean;
  direccion: string;
  email: string;
  tipoServicio: string;
  updatedAt?: string;
};

const TIPOS_SERVICIO = [
  "Hosting y dominios",
  "Desarrollo web",
  "Mantenimiento",
  "Consultoría",
  "Soporte",
  "Otro",
];

const emptyProfile: ProfileData = {
  nombres: "",
  apellidos: "",
  identidad: "",
  telefono: "",
  telefonoVerificado: false,
  direccion: "",
  email: "",
  tipoServicio: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useDashboardUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mode, setMode] = useState<"view" | "wizard" | "edit">("wizard");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  const fetchProfile = useCallback(() => {
    if (!API_URL || user?.role !== "client") return;
    const token = localStorage.getItem("aplat_token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL.replace(/\/$/, "")}/api/client/profile`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAccountEmail(data.email ?? "");
          if (data.profile && (data.profile.nombres || data.profile.telefono)) {
            setProfile({
              ...emptyProfile,
              ...data.profile,
              email: data.profile.email || data.email,
            });
            setForm({
              ...emptyProfile,
              ...data.profile,
              email: data.profile.email || data.email,
            });
            setMode("view");
          } else {
            setForm((f) => ({ ...f, email: data.email ?? "" }));
            setMode("wizard");
          }
        }
      })
      .catch(() => setMessage({ type: "error", text: "Error al cargar perfil." }))
      .finally(() => setLoading(false));
  }, [user?.role]);

  useEffect(() => {
    if (user?.role === "master") {
      router.replace("/dashboard");
      return;
    }
    if (!user && user !== undefined) return;
    fetchProfile();
  }, [user, router, fetchProfile]);

  const updateForm = (patch: Partial<ProfileData>) => {
    setForm((f) => ({ ...f, ...patch }));
  };

  const sendPhoneCode = async () => {
    if (!form.telefono.trim() || !API_URL) {
      setMessage({ type: "error", text: "Ingresa tu número de teléfono." });
      return;
    }
    setMessage(null);
    setSendingCode(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/phone/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ phone: form.telefono.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setPhoneCodeSent(true);
        const num = data.jid ? `+${(data.jid as string).replace(/@.*/, "").trim()}` : "";
        const toShow = num ? `Código enviado por WhatsApp al ${num}. Revisa tu teléfono.` : "Código enviado por WhatsApp.";
        setMessage({ type: "success", text: toShow });
      } else {
        setMessage({ type: "error", text: data.error ?? "Error al enviar código." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setSendingCode(false);
    }
  };

  const verifyPhoneCode = async () => {
    if (!verifyCode.trim() || !form.telefono.trim() || !API_URL) {
      setMessage({ type: "error", text: "Ingresa el código recibido." });
      return;
    }
    setMessage(null);
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/auth/phone/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ phone: form.telefono.trim(), code: verifyCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setForm((f) => ({ ...f, telefonoVerificado: true }));
        setMessage({ type: "success", text: "Teléfono verificado correctamente." });
        setStep(3);
      } else {
        setMessage({ type: "error", text: data.error ?? "Código inválido." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setVerifying(false);
    }
  };

  const saveProfile = async () => {
    if (!API_URL) return;
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/api/client/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          identidad: form.identidad.trim(),
          telefono: form.telefono.trim(),
          direccion: form.direccion.trim(),
          email: form.email.trim() || accountEmail,
          tipoServicio: form.tipoServicio.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setProfile({ ...form });
        setMode("view");
        setMessage({ type: "success", text: "Perfil guardado correctamente." });
        fetchProfile();
      } else {
        setMessage({ type: "error", text: data.error ?? "Error al guardar." });
      }
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role === "master") return null;
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-aplat-cyan" />
      </div>
    );
  }

  // Vista profesional del perfil (solo lectura + Editar)
  if (mode === "view" && profile) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al panel
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glass-strong rounded-2xl border border-white/10 mirror-shine overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl p-3 bg-aplat-cyan/15 text-aplat-cyan">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-aplat-text">
                    {profile.nombres} {profile.apellidos}
                  </h1>
                  <p className="text-aplat-muted text-sm">{profile.email || accountEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode("edit");
                  setForm({ ...profile, email: profile.email || accountEmail });
                }}
                className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 text-sm font-medium text-aplat-text transition-all"
              >
                Editar
              </button>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-aplat-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-aplat-muted text-xs uppercase tracking-wider mb-0.5">Identidad</p>
                <p className="text-aplat-text">{profile.identidad || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-aplat-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-aplat-muted text-xs uppercase tracking-wider mb-0.5">Teléfono</p>
                <p className="text-aplat-text">
                  {profile.telefono || "—"}
                  {profile.telefonoVerificado && (
                    <span className="ml-2 inline-flex items-center gap-1 text-aplat-emerald text-xs">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verificado
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-aplat-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-aplat-muted text-xs uppercase tracking-wider mb-0.5">Dirección</p>
                <p className="text-aplat-text">{profile.direccion || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-aplat-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-aplat-muted text-xs uppercase tracking-wider mb-0.5">Correo electrónico</p>
                <p className="text-aplat-text">{profile.email || accountEmail || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-aplat-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-aplat-muted text-xs uppercase tracking-wider mb-0.5">Tipo de servicio</p>
                <p className="text-aplat-text">{profile.tipoServicio || "—"}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Wizard o formulario de edición
  const isEdit = mode === "edit";
  const canGoStep2 = form.nombres.trim() && form.apellidos.trim();
  const canGoStep3 = form.telefono.trim() && form.telefonoVerificado;

  return (
    <div className="max-w-xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-aplat-muted hover:text-aplat-text text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al panel
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glass-strong rounded-2xl p-6 border border-white/10 mirror-shine"
      >
        <h1 className="text-xl font-bold text-aplat-text mb-1">
          {isEdit ? "Editar perfil" : "Completa tu perfil"}
        </h1>
        <p className="text-aplat-muted text-sm mb-6">
          {isEdit ? "Modifica tus datos y guarda los cambios." : "Paso a paso: datos, teléfono, dirección y servicio."}
        </p>

        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-sm mb-4 ${
              message.type === "success"
                ? "bg-aplat-emerald/10 text-aplat-emerald border border-aplat-emerald/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        {isEdit ? (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-aplat-muted text-sm mb-1 block">Nombres</span>
                  <input
                    type="text"
                    value={form.nombres}
                    onChange={(e) => updateForm({ nombres: e.target.value })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-aplat-muted text-sm mb-1 block">Apellidos</span>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={(e) => updateForm({ apellidos: e.target.value })}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Identidad (ID)</span>
                <input
                  type="text"
                  value={form.identidad}
                  onChange={(e) => updateForm({ identidad: e.target.value })}
                  placeholder="Número de identificación"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Teléfono</span>
                <CountryCodePhoneInput
                  value={form.telefono}
                  onChange={(v) => updateForm({ telefono: v })}
                  placeholder="9841 2345"
                />
                {form.telefonoVerificado && (
                  <span className="mt-1 inline-flex items-center gap-1 text-aplat-emerald text-xs">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verificado
                  </span>
                )}
              </label>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Dirección</span>
                <input
                  type="text"
                  value={form.direccion}
                  onChange={(e) => updateForm({ direccion: e.target.value })}
                  placeholder="Dirección completa"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Correo electrónico</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm({ email: e.target.value })}
                  placeholder={accountEmail}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-aplat-muted text-sm mb-1 block">Tipo de servicio</span>
                <select
                  value={form.tipoServicio}
                  onChange={(e) => updateForm({ tipoServicio: e.target.value })}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                >
                  <option value="">Selecciona...</option>
                  {TIPOS_SERVICIO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setMode("view")}
                className="rounded-xl border border-white/20 text-aplat-muted hover:text-aplat-text px-4 py-2.5 text-sm font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar cambios
              </button>
            </div>
          </>
        ) : (
          <>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-aplat-muted text-sm mb-2">Datos personales</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-aplat-muted text-xs mb-1 block">Nombres</span>
                      <input
                        type="text"
                        value={form.nombres}
                        onChange={(e) => updateForm({ nombres: e.target.value })}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-aplat-muted text-xs mb-1 block">Apellidos</span>
                      <input
                        type="text"
                        value={form.apellidos}
                        onChange={(e) => updateForm({ apellidos: e.target.value })}
                        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-aplat-muted text-xs mb-1 block">Identidad (ID)</span>
                    <input
                      type="text"
                      value={form.identidad}
                      onChange={(e) => updateForm({ identidad: e.target.value })}
                      placeholder="Número de identificación"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                    />
                  </label>
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!canGoStep2}
                      className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium disabled:opacity-50 disabled:pointer-events-none"
                    >
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-aplat-muted text-sm mb-2">Teléfono (recibirás un código por WhatsApp para verificar)</p>
                  <label className="block">
                    <span className="text-aplat-muted text-xs mb-1 block">País y número</span>
                    <CountryCodePhoneInput
                      value={form.telefono}
                      onChange={(v) => {
                        updateForm({ telefono: v });
                        setPhoneCodeSent(false);
                      }}
                      placeholder="9841 2345"
                    />
                  </label>
                  {!phoneCodeSent ? (
                    <button
                      type="button"
                      onClick={sendPhoneCode}
                      disabled={sendingCode || !form.telefono.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-aplat-violet/20 hover:bg-aplat-violet/30 text-aplat-violet border border-aplat-violet/40 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                    >
                      {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Enviar código por WhatsApp
                    </button>
                  ) : (
                    <>
                      <label className="block">
                        <span className="text-aplat-muted text-xs mb-1 block">Código de verificación</span>
                        <input
                          type="text"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6 dígitos"
                          maxLength={6}
                          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={sendPhoneCode}
                          disabled={sendingCode}
                          className="rounded-xl border border-white/20 text-aplat-muted hover:text-aplat-text px-4 py-2.5 text-sm font-medium"
                        >
                          Reenviar código
                        </button>
                        <button
                          type="button"
                          onClick={verifyPhoneCode}
                          disabled={verifying || verifyCode.length !== 6}
                          className="inline-flex items-center gap-2 rounded-xl bg-aplat-emerald/20 hover:bg-aplat-emerald/30 text-aplat-emerald border border-aplat-emerald/40 px-4 py-2.5 text-sm font-medium disabled:opacity-50"
                        >
                          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Verificar
                        </button>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-aplat-muted hover:text-aplat-text px-4 py-2.5 text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </button>
                    {form.telefonoVerificado && (
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium"
                      >
                        Siguiente
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="space-y-4"
                >
                  <p className="text-aplat-muted text-sm mb-2">Dirección y contacto</p>
                  <label className="block">
                    <span className="text-aplat-muted text-xs mb-1 block">Dirección</span>
                    <input
                      type="text"
                      value={form.direccion}
                      onChange={(e) => updateForm({ direccion: e.target.value })}
                      placeholder="Dirección completa"
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-aplat-muted text-xs mb-1 block">Correo electrónico</span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm({ email: e.target.value })}
                      placeholder={accountEmail}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text placeholder:text-aplat-muted/60 focus:border-aplat-cyan/50 focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-aplat-muted text-xs mb-1 block">Tipo de servicio</span>
                    <select
                      value={form.tipoServicio}
                      onChange={(e) => updateForm({ tipoServicio: e.target.value })}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-aplat-text focus:border-aplat-cyan/50 focus:outline-none"
                    >
                      <option value="">Selecciona...</option>
                      {TIPOS_SERVICIO.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-aplat-muted hover:text-aplat-text px-4 py-2.5 text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-aplat-cyan/20 hover:bg-aplat-cyan/30 text-aplat-cyan border border-aplat-cyan/40 px-4 py-2.5 text-sm font-medium disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Guardar perfil
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}
