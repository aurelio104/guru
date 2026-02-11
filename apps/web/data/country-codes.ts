/**
 * Códigos de país para teléfono (E.164) con bandera y nombre.
 * Ordenados por longitud del código (desc) para parsear correctamente.
 */
export type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

export const COUNTRY_CODES: CountryOption[] = [
  { code: "1", name: "Estados Unidos / Canadá", flag: "🇺🇸" },
  { code: "52", name: "México", flag: "🇲🇽" },
  { code: "53", name: "Cuba", flag: "🇨🇺" },
  { code: "54", name: "Argentina", flag: "🇦🇷" },
  { code: "55", name: "Brasil", flag: "🇧🇷" },
  { code: "56", name: "Chile", flag: "🇨🇱" },
  { code: "57", name: "Colombia", flag: "🇨🇴" },
  { code: "58", name: "Venezuela", flag: "🇻🇪" },
  { code: "59", name: "Guayana", flag: "🇬🇾" },
  { code: "591", name: "Bolivia", flag: "🇧🇴" },
  { code: "592", name: "Guyana", flag: "🇬🇾" },
  { code: "593", name: "Ecuador", flag: "🇪🇨" },
  { code: "594", name: "Guayana Francesa", flag: "🇬🇫" },
  { code: "595", name: "Paraguay", flag: "🇵🇾" },
  { code: "596", name: "Martinica", flag: "🇲🇶" },
  { code: "597", name: "Surinam", flag: "🇸🇷" },
  { code: "598", name: "Uruguay", flag: "🇺🇾" },
  { code: "599", name: "Curazao", flag: "🇨🇼" },
  { code: "34", name: "España", flag: "🇪🇸" },
  { code: "351", name: "Portugal", flag: "🇵🇹" },
  { code: "502", name: "Guatemala", flag: "🇬🇹" },
  { code: "503", name: "El Salvador", flag: "🇸🇻" },
  { code: "504", name: "Honduras", flag: "🇭🇳" },
  { code: "505", name: "Nicaragua", flag: "🇳🇮" },
  { code: "506", name: "Costa Rica", flag: "🇨🇷" },
  { code: "507", name: "Panamá", flag: "🇵🇦" },
  { code: "508", name: "San Pedro y Miquelón", flag: "🇵🇲" },
  { code: "509", name: "Haití", flag: "🇭🇹" },
  { code: "51", name: "Perú", flag: "🇵🇪" },
];

// Sin duplicados y ordenados por longitud del código (desc) para parsear
const byCodeLength = [...new Map(COUNTRY_CODES.map((c) => [c.code, c])).values()].sort(
  (a, b) => b.code.length - a.code.length
);

/** Parsea un número E.164 completo y devuelve { code, localNumber } o null */
export function parsePhoneE164(full: string): { code: string; localNumber: string } | null {
  const digits = full.replace(/\D/g, "");
  if (!digits.length) return null;
  for (const country of byCodeLength) {
    if (digits.startsWith(country.code)) {
      return {
        code: country.code,
        localNumber: digits.slice(country.code.length),
      };
    }
  }
  return { code: "", localNumber: digits };
}

/** Código por defecto (Honduras) */
export const DEFAULT_COUNTRY_CODE = "504";
