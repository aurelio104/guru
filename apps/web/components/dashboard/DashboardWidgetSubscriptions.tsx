"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, ExternalLink, ToggleLeft } from "lucide-react";

const STORAGE_KEY = "aplat_subscription_mode";

function getStoredSubscriptionModes(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function setStoredSubscriptionModes(modes: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(modes));
}

export type ProjectEntry = { name: string; url: string };

export function DashboardWidgetSubscriptions({ projects }: { projects: ProjectEntry[] }) {
  const [modes, setModes] = useState<Record<string, boolean>>({});

  const initialModes = useMemo(() => getStoredSubscriptionModes(), []);
  const subscriptionState = useMemo(() => {
    const s = { ...initialModes };
    projects.forEach((p) => {
      if (s[p.name] === undefined) s[p.name] = false;
    });
    return s;
  }, [projects, initialModes]);

  const state = { ...subscriptionState, ...modes };

  const toggle = (name: string) => {
    const next = { ...state, [name]: !state[name] };
    setModes(next);
    setStoredSubscriptionModes(next);
  };
  const activeCount = Object.values(state).filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass glass-strong rounded-2xl p-5 border border-white/10 mirror-shine"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl p-2 bg-aplat-violet/15 text-aplat-violet">
            <CreditCard className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-aplat-text">Suscripciones</h2>
        </div>
        <span className="text-aplat-muted text-sm">
          {activeCount} con modo suscripción
        </span>
      </div>
      <p className="text-aplat-muted text-sm mb-4">
        Activa el modo suscripción por proyecto para recordatorios y control de acceso.
      </p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {projects.map((p) => (
          <li
            key={p.name}
            className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/5 px-3 py-2"
          >
            <span className="text-aplat-text text-sm font-medium truncate">{p.name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggle(p.name)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1 transition-colors ${
                  state[p.name]
                    ? "bg-aplat-violet/20 text-aplat-violet"
                    : "text-aplat-muted hover:text-aplat-text"
                }`}
                title={state[p.name] ? "Desactivar modo suscripción" : "Activar modo suscripción"}
              >
                <ToggleLeft className="w-4 h-4" />
                {state[p.name] ? "ON" : "OFF"}
              </button>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-aplat-muted hover:text-aplat-cyan transition-colors"
                title="Abrir proyecto"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
