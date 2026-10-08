export interface AuthSessionData {
  id: string;
  userId?: string;
  email?: string;
  fullName?: string;
  role: string;
  phone?: string;
  patientUhid?: string;
  facilityName?: string;
  gender?: string;
  age?: number | string;
  dateOfBirth?: string;
  bloodGroup?: string;
  addressLine1?: string;
  state?: string;
  district?: string;
  city?: string;
  block?: string;
  postalCode?: string;
  disability?: string;
  chronicConditions?: any[];
  allergies?: any[];
  dependents?: any[];
  organizationName?: string;
  isAffilatedToOrg?: boolean;
  metadata?: Record<string, any>;
}

export interface AuthTokenResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: AuthSessionData;
  message?: string;
}

export function saveLocalUserDisplay(user: Partial<AuthSessionData>) {
  if (typeof window === "undefined" || !user) return;
  try {
    let existing: any = {};
    const local = localStorage.getItem("triage_user_display");
    if (local) {
      try { existing = JSON.parse(local); } catch {}
    }
    const merged = { ...existing, ...user };
    const serialized = JSON.stringify(merged);
    localStorage.setItem("triage_user_display", serialized);
    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
    document.cookie = `triage_user_display=${encodeURIComponent(serialized)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // Ignore storage errors
  }
}

export function clearLocalUserDisplay() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("triage_user_display");
    document.cookie = "triage_user_display=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax";
  } catch {
    // Ignore storage errors
  }
}

/**
 * Perform login:
 * - Server sets refresh_token in an HttpOnly + Secure + SameSite cookie (mitigating XSS)
 * - Returns short-lived access_token + metadata for IN-MEMORY storage
 * - Caches low-sensitivity display data locally to eliminate flicker on page refresh
 */
export async function loginAuth(data: AuthSessionData): Promise<AuthTokenResponse | null> {
  if (typeof window === "undefined") return null;

  // Optimistically cache display data immediately so UI never flashes default values
  saveLocalUserDisplay(data);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const json: AuthTokenResponse = await res.json();
      if (json.user) {
        saveLocalUserDisplay(json.user);
      }

      // Also forward credentials to FastAPI backend if available
      try {
        await fetch("http://localhost:8000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        });
      } catch {
        // Backend optional
      }

      return json;
    }
  } catch (err) {
    console.error("loginAuth error:", err);
  }
  return null;
}

/**
 * Backward-compatible helper for existing code:
 * Calls server endpoint which secures refresh_token in HttpOnly cookie
 */
export async function setAuthCookies(data: AuthSessionData): Promise<AuthTokenResponse | null> {
  return await loginAuth(data);
}

/**
 * Perform silent refresh using the HttpOnly refresh_token cookie:
 * Returns fresh short-lived access_token to store in JS memory.
 */
export async function refreshAuthToken(): Promise<AuthTokenResponse | null> {
  if (typeof window === "undefined") return null;

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (res.ok) {
      const json = (await res.json()) as AuthTokenResponse;
      if (json.user) {
        saveLocalUserDisplay(json.user);
      }
      return json;
    }
  } catch (err) {
    console.warn("Silent refresh notice:", err);
  }
  return null;
}

/**
 * Logout: instructs server to clear HttpOnly refresh_token and role cookies
 */
export async function clearAuthCookies(): Promise<void> {
  if (typeof window === "undefined") return;

  clearLocalUserDisplay();

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    try {
      await fetch("http://localhost:8000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Backend optional
    }
  } catch (err) {
    console.error("clearAuthCookies error:", err);
  }
}

/**
 * Fetch server session using HttpOnly cookie
 */
export async function fetchServerAuthSession(): Promise<AuthSessionData | null> {
  const refreshed = await refreshAuthToken();
  if (refreshed?.user) {
    return refreshed.user;
  }

  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.authenticated && data?.user) {
        saveLocalUserDisplay(data.user);
        return data.user as AuthSessionData;
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Synchronous local session getter for initial hydration.
 * Returns exact user display data from local cache so there is NO flicker of default values.
 */
export function getLocalAuthSession(): AuthSessionData | null {
  if (typeof window === "undefined") return null;

  // 1. Try reading cached user display from localStorage (instant and synchronous)
  try {
    const local = localStorage.getItem("triage_user_display");
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && parsed.id && parsed.role) {
        return parsed as AuthSessionData;
      }
    }
  } catch {
    // Ignore
  }

  // 2. Try reading non-HttpOnly cookie triage_user_display
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )triage_user_display=([^;]*)/);
    if (match) {
      try {
        const parsed = JSON.parse(decodeURIComponent(match[1]));
        if (parsed && parsed.id && parsed.role) {
          return parsed as AuthSessionData;
        }
      } catch {
        // Ignore
      }
    }
  }

  // 3. Fallback to basic role and id without dummy placeholder names
  if (typeof document !== "undefined") {
    const matchRole = document.cookie.match(/(?:^|; )triage_role=([^;]*)/);
    const matchId = document.cookie.match(/(?:^|; )triage_user_id=([^;]*)/);

    const role = matchRole ? decodeURIComponent(matchRole[1]) : null;
    const uid = matchId ? decodeURIComponent(matchId[1]) : null;

    if (role && uid) {
      return {
        id: uid,
        userId: uid,
        role: role,
        fullName: "",
      };
    }
  }

  return null;
}
