"use client";

import { useState, useRef } from "react";
import { FileImage, Loader2 } from "lucide-react";

type OcrCedulaCaptureProps = {
  onExtract: (text: string, documentNumber?: string) => void;
  disabled?: boolean;
};

/** Extrae número de documento (V/E + dígitos) del texto OCR. */
function extractDocumentNumber(text: string): string | undefined {
  const normalized = text.replace(/\s+/g, " ").trim();
  const vMatch = normalized.match(/\b[VE]-?\s*\d{6,10}\b/i);
  if (vMatch) return vMatch[0].replace(/\s/g, "");
  const digits = normalized.match(/\b\d{7,10}\b/);
  return digits ? digits[0] : undefined;
}

export function OcrCedulaCapture({ onExtract, disabled }: OcrCedulaCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Seleccione una imagen (JPG, PNG).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "spa", {
        logger: () => {},
      });
      const text = data.text?.trim() ?? "";
      const docNum = extractDocumentNumber(text);
      onExtract(text, docNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al leer la imagen.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-aplat-muted mb-2">Escanear cédula (OCR)</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={disabled || loading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
        className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 text-aplat-text px-3 py-2 text-sm disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileImage className="w-4 h-4" />
        )}
        {loading ? "Leyendo..." : "Seleccionar imagen"}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
