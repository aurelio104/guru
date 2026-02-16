/**
 * Middleware: detecta idioma por IP (Vercel Geo) o Accept-Language.
 * Añade x-locale al request para que el layout use es|en.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SPANISH_COUNTRIES = new Set([
  "ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO",
  "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR",
]);

function getLocale(request: NextRequest): "es" | "en" {
  // 1. Vercel Geo (IP): país del visitante
  const country = request.headers.get("x-vercel-ip-country") ?? (request as unknown as { geo?: { country?: string } }).geo?.country ?? "";
  if (SPANISH_COUNTRIES.has(country)) return "es";

  // 2. Accept-Language (ej. es-ES, es-MX, en-US)
  const acceptLang = request.headers.get("accept-language") ?? "";
  const prefLang = acceptLang.split(",")[0]?.toLowerCase() ?? "";
  if (prefLang.startsWith("es")) return "es";

  return "en";
}

export function middleware(request: NextRequest) {
  const locale = getLocale(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|logo|icon|manifest|sw).*)"],
};
