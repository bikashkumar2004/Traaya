import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-to-route authorization mapping
const ROLE_PORTAL_MAP: Record<string, string[]> = {
  "/patient": ["patient"],
  "/nurse": ["nurse", "admin"],
  "/doctor": ["doctor", "admin"],
  "/admin": ["admin"],
  "/organization": ["organization", "admin"],
  "/healthcamp": ["healthcamp", "doctor", "nurse", "admin"],
  "/medical": ["medical", "facility", "doctor", "nurse", "admin"],
  "/facility": ["medical", "facility", "doctor", "nurse", "admin"],
};

const ROLE_DEFAULT_PORTAL: Record<string, string> = {
  patient: "/patient",
  nurse: "/nurse",
  doctor: "/doctor",
  facility: "/medical",
  medical: "/medical",
  organization: "/organization",
  healthcamp: "/healthcamp",
  admin: "/admin",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass public assets, API routes, auth routes, and static Next.js internals
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1.1 Redirect any /facility visits directly to /medical
  if (pathname === "/facility" || pathname.startsWith("/facility/")) {
    const medicalUrl = new URL("/medical", request.url);
    return NextResponse.redirect(medicalUrl);
  }

  // 2. Read auth cookies: check HttpOnly refresh_token and triage_role
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const roleCookie = request.cookies.get("triage_role")?.value;
  const sessionCookie = request.cookies.get("triage_auth_session")?.value;

  let resolvedRole = roleCookie;
  if (!resolvedRole && refreshToken) {
    try {
      const parts = refreshToken.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
        resolvedRole = payload?.user?.role;
      }
    } catch {
      // ignore
    }
  }

  const isAuthenticated = Boolean(refreshToken || resolvedRole);

  // 3. Match against protected portals
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_PORTAL_MAP)) {
    if (pathname === routePrefix || pathname.startsWith(`${routePrefix}/`)) {
      // Unauthenticated -> Redirect to /login
      if (!isAuthenticated) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Authenticated but unauthorized role for this portal -> redirect to user's portal
      if (resolvedRole && !allowedRoles.includes(resolvedRole)) {
        const userPortal = ROLE_DEFAULT_PORTAL[resolvedRole] || `/${resolvedRole}`;
        const targetUrl = new URL(userPortal, request.url);
        return NextResponse.redirect(targetUrl);
      }

      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient",
    "/patient/:path*",
    "/nurse",
    "/nurse/:path*",
    "/doctor",
    "/doctor/:path*",
    "/admin",
    "/admin/:path*",
    "/organization",
    "/organization/:path*",
    "/healthcamp",
    "/healthcamp/:path*",
    "/medical",
    "/medical/:path*",
    "/facility",
    "/facility/:path*",
  ],
};
