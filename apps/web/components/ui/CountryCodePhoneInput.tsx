"use client";

import {
  COUNTRY_CODES,
  parsePhoneE164,
  DEFAULT_COUNTRY_CODE,
} from "@/data/country-codes";

type Props = {
  value: string;
  onChange: (full: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  inputClassName?: string;
  /** Versión compacta (select más estrecho, solo bandera + código) */
  compact?: boolean;
};

export function CountryCodePhoneInput({
  value,
  onChange,
  placeholder = "Número sin código",
  disabled,
  id,
  className = "",
  inputClassName = "",
  compact = false,
}: Props) {
  const parsed = parsePhoneE164(value);
  const code = parsed?.code ?? DEFAULT_COUNTRY_CODE;
  const localNumber = parsed?.localNumber ?? "";

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    const digits = localNumber.replace(/\D/g, "");
    onChange(newCode + digits);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    onChange(code + digits);
  };

  return (
    <div className={`flex rounded-xl bg-white/5 border border-white/10 overflow-hidden focus-within:border-aplat-cyan/50 focus-within:ring-1 focus-within:ring-aplat-cyan/30 ${compact ? "rounded-lg" : ""} ${className}`}>
      <select
        value={code}
        onChange={handleCodeChange}
        disabled={disabled}
        className={`bg-white/5 text-aplat-text border-r border-white/10 focus:outline-none focus:ring-0 disabled:opacity-60 [&>option]:bg-aplat-card ${compact ? "pl-1.5 pr-1 py-1 text-xs min-w-[72px]" : "pl-3 pr-2 py-2.5 text-sm min-w-[140px]"}`}
        aria-label="Código de país"
        title="Código de país"
      >
        {COUNTRY_CODES.map((c) => (
          <option key={c.code} value={c.code}>
            {compact ? `${c.flag} +${c.code}` : `${c.flag} ${c.name} +${c.code}`}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={placeholder}
        disabled={disabled}
        id={id}
        className={`flex-1 min-w-0 bg-transparent text-aplat-text placeholder:text-aplat-muted/60 focus:outline-none ${compact ? "px-2 py-1 text-xs" : "px-4 py-2.5 text-sm"} ${inputClassName}`}
        aria-label="Número de teléfono"
      />
    </div>
  );
}
