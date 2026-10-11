"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, formatToE164Phone } from "@/lib/supabase";
import {
  setAuthCookies,
  clearAuthCookies,
  getLocalAuthSession,
  saveLocalUserDisplay,
  fetchServerAuthSession,
  refreshAuthToken,
  AuthTokenResponse,
} from "./auth-cookies";

// Re-export all types so existing imports across components remain 100% intact
export * from "./auth-types";
import {
  UserProfile,
  UserRole,
  Language,
  PatientRegistrationPayload,
  AuthContextType,
} from "./auth-types";

import { mapSupabaseProfile, fetchProfileFromSupabase } from "./auth-profile";
import { registerPatientProfile, updateUserProfile } from "./auth-service";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: UserProfile | null }) {
  // In-memory token storage (never written to sessionStorage or localStorage)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [tokenType, setTokenType] = useState<string | null>("Bearer");

  // Use server-provided initialUser for SSR/client agreement
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (user?.id && isSupabaseConfigured && supabase) {
      const updated = await fetchProfileFromSupabase(user.id);
      if (updated) {
        setUser(updated);
        saveLocalUserDisplay(updated);
      }
    }
  }, [user?.id]);

  const updateTokensAndUser = useCallback((authRes: AuthTokenResponse | null) => {
    if (authRes?.access_token) {
      setAccessToken(authRes.access_token);
      setExpiresAt(authRes.expires_at);
      setExpiresIn(authRes.expires_in);
      setTokenType(authRes.token_type || "Bearer");
    }
  }, []);

  // Silent refresh: refreshes in-memory access_token 60 seconds before expiration
  useEffect(() => {
    if (!expiresAt) return;
    const now = Math.floor(Date.now() / 1000);
    const delayMs = Math.max((expiresAt - now - 60) * 1000, 15000);

    const timer = setTimeout(async () => {
      const res = await refreshAuthToken();
      if (res?.access_token) {
        updateTokensAndUser(res);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [expiresAt, updateTokensAndUser]);

  // Initial silent refresh: recover in-memory access_token from HttpOnly refresh_token cookie
  useEffect(() => {
    let savedRole: UserRole | null = null;
    if (typeof window !== "undefined") {
      savedRole = sessionStorage.getItem("triage_active_role") as UserRole | null;
      const savedLang = sessionStorage.getItem("triage_language") as Language | null;
      if (savedLang) {
        setLanguage(savedLang);
      }
    }

    // Fast local session fallback for immediate UI rendering
    const localSession = getLocalAuthSession();
    if (localSession?.id && localSession?.role) {
      setUser((prev) => prev?.fullName ? prev : ({
        id: localSession.id,
        userId: localSession.userId || localSession.patientUhid,
        email: localSession.email || "",
        fullName: localSession.fullName || "",
        role: (localSession.role as UserRole) || "patient",
        phone: localSession.phone,
        patientUhid: localSession.patientUhid || localSession.userId,
        facilityName: localSession.facilityName,
        gender: localSession.gender,
        age: localSession.age,
        bloodGroup: localSession.bloodGroup,
        dependents: localSession.dependents || [],
      }));
    }

    // Recover in-memory access_token via server HttpOnly refresh_token cookie
    refreshAuthToken().then(async (authRes) => {
      if (authRes?.access_token && authRes?.user) {
        updateTokensAndUser(authRes);
        if (isSupabaseConfigured && supabase) {
          const profile = await fetchProfileFromSupabase(authRes.user.id);
          if (profile) {
            setUser(profile);
            saveLocalUserDisplay(profile);
            setIsLoading(false);
            return;
          }
        }
        setUser((prev) => ({
          ...(prev || {}),
          id: authRes.user.id,
          userId: authRes.user.userId || authRes.user.patientUhid,
          email: authRes.user.email || prev?.email || "",
          fullName: authRes.user.fullName || prev?.fullName || "",
          role: (authRes.user.role as UserRole) || prev?.role || "patient",
          phone: authRes.user.phone || prev?.phone,
          patientUhid: authRes.user.patientUhid || authRes.user.userId || prev?.patientUhid,
          facilityName: authRes.user.facilityName || prev?.facilityName,
          dependents: authRes.user.dependents || prev?.dependents || [],
        }));
        setIsLoading(false);
        return;
      }

      // Check fallback session
      const serverSession = await fetchServerAuthSession();
      if (serverSession?.id && serverSession?.role) {
        setUser((prev) => ({
          ...(prev || {}),
          id: serverSession.id,
          userId: serverSession.userId || serverSession.patientUhid,
          email: serverSession.email || prev?.email || "",
          fullName: serverSession.fullName || prev?.fullName || "",
          role: (serverSession.role as UserRole) || prev?.role || "patient",
          phone: serverSession.phone || prev?.phone,
          patientUhid: serverSession.patientUhid || serverSession.userId || prev?.patientUhid,
          facilityName: serverSession.facilityName || prev?.facilityName,
          dependents: serverSession.dependents || prev?.dependents || [],
        }));
      } else if (!localSession?.id) {
        setUser(null);
      }
      setIsLoading(false);
    });

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      // 1. Check live Supabase session
      sb.auth.getSession().then(async ({ data: { session } }: any) => {
        if (session?.user) {
          const profile = await fetchProfileFromSupabase(session.user.id, session.user);
          if (profile) {
            setUser(profile);
            saveLocalUserDisplay(profile);
            await setAuthCookies({
              ...profile,
              role: profile.role,
            });
            setIsLoading(false);
            return;
          }
        }

        // If local cookie session exists, try to refresh profile from Supabase
        if (localSession?.id) {
          const refreshed = await fetchProfileFromSupabase(localSession.id);
          if (refreshed) {
            setUser(refreshed);
            saveLocalUserDisplay(refreshed);
            await setAuthCookies({
              ...refreshed,
              role: refreshed.role,
            });
          }
        } else if (!getLocalAuthSession()) {
          // No active session and no cookie -> user is strictly unauthenticated
          setUser(null);
        }
        setIsLoading(false);
      });

      // 2. Subscribe to live auth state changes
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event: any, session: any) => {
        if (session?.user) {
          const profile = await fetchProfileFromSupabase(session.user.id, session.user);
          if (profile) {
            setUser(profile);
            saveLocalUserDisplay(profile);
            await setAuthCookies({
              id: profile.id,
              userId: profile.userId || profile.patientUhid,
              email: profile.email,
              fullName: profile.fullName,
              role: profile.role,
              phone: profile.phone,
              patientUhid: profile.patientUhid,
              facilityName: profile.facilityName,
            });
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          await clearAuthCookies();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      if (!localSession?.id) {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_language", lang);
    }
  };

  const loginWithPhoneOtp = async (role: UserRole, rawPhone: string, customName?: string) => {
    const cleanDigits = rawPhone.replace(/\D/g, "");
    
    // Check if profile exists in Supabase for this phone
    if (isSupabaseConfigured && supabase) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .or(`phone.eq.${formatToE164Phone(rawPhone)},phone.ilike.%${cleanDigits.slice(-10)}%`)
        .maybeSingle();

      if (profile) {
        const fullProfile = await fetchProfileFromSupabase(profile.id);
        const mapped = fullProfile || mapSupabaseProfile(profile);
        setUser(mapped);
        saveLocalUserDisplay(mapped);
        const resolvedRole = mapped.role || role;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_active_role", resolvedRole);
        }
        const authRes = await setAuthCookies({
          ...mapped,
          role: resolvedRole,
        });
        updateTokensAndUser(authRes);
        return;
      }
    }

    const formattedPhone = formatToE164Phone(rawPhone);
    const uhidPrefix = role === "doctor" ? "DOC" : role === "nurse" ? "STF" : (role === "facility" || role === "medical") ? "FAC" : "PAT";
    const newUhid = `${uhidPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: UserProfile = {
      id: `usr-${cleanDigits.slice(-6) || Date.now().toString().slice(-6)}`,
      email: `${cleanDigits.slice(-10)}@traaya.live`,
      fullName: customName || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role: role,
      phone: formattedPhone,
      patientUhid: newUhid,
    };
    setUser(newUser);
    saveLocalUserDisplay(newUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_active_role", role);
    }
    const authRes = await setAuthCookies({
      ...newUser,
      role: role,
    });
    updateTokensAndUser(authRes);
  };

  const loginWithEmailPassword = async (role: UserRole, email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (!error && data?.user) {
          const profile = await fetchProfileFromSupabase(data.user.id, data.user);
          if (profile) {
            setUser(profile);
            saveLocalUserDisplay(profile);
            const resolvedRole = profile.role || role;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("triage_active_role", resolvedRole);
            }
            const authRes = await setAuthCookies({
              ...profile,
              role: resolvedRole,
            });
            updateTokensAndUser(authRes);
            return true;
          }
        }
      } catch (err) {
        console.warn("Supabase signInWithPassword failed, checking direct profile...", err);
      }

      // Check direct profile match
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (profile) {
        const fullProfile = await fetchProfileFromSupabase(profile.id);
        const mapped = fullProfile || mapSupabaseProfile(profile);
        setUser(mapped);
        saveLocalUserDisplay(mapped);
        const resolvedRole = mapped.role || role;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_active_role", resolvedRole);
        }
        const authRes = await setAuthCookies({
          ...mapped,
          role: resolvedRole,
        });
        updateTokensAndUser(authRes);
        return true;
      }
    }

    // Direct fallback authenticated profile
    const uhidPrefix = role === "doctor" ? "DOC" : role === "nurse" ? "STF" : (role === "facility" || role === "medical") ? "FAC" : role === "admin" ? "ADM" : "PAT";
    const customUser: UserProfile = {
      id: `usr-${cleanEmail.split("@")[0].slice(0, 8)}`,
      email: cleanEmail,
      fullName: role === "admin" ? "System Administrator" : cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: role,
      patientUhid: `${uhidPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setUser(customUser);
    saveLocalUserDisplay(customUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_active_role", role);
    }
    const authRes = await setAuthCookies({
      ...customUser,
      role: role,
    });
    updateTokensAndUser(authRes);
    return true;
  };

  const registerPatient = async (data: PatientRegistrationPayload): Promise<UserProfile> => {
    const registeredProfile = await registerPatientProfile(data);
    setUser(registeredProfile);
    saveLocalUserDisplay(registeredProfile);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_active_role", "patient");
    }
    const authRes = await setAuthCookies({
      ...registeredProfile,
      role: "patient",
    });
    updateTokensAndUser(authRes);
    return registeredProfile;
  };

  const updateProfile = async (updatedData: Partial<UserProfile>): Promise<boolean> => {
    if (!user?.id) return false;

    const { success, updatedProfile } = await updateUserProfile(user, updatedData);
    setUser(updatedProfile);
    saveLocalUserDisplay(updatedProfile);
    return success;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Notice signing out:", e);
      }
    }
    await clearAuthCookies();
    setAccessToken(null);
    setExpiresAt(null);
    setExpiresIn(null);
    setTokenType(null);
    setUser(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("triage_active_role");
      sessionStorage.removeItem("triage_supabase_user_id");
      sessionStorage.removeItem("triage_verified_reg_phone");
      
      // Clear all session tokens
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("auth-token") || k.startsWith("triage_"))) {
          sessionStorage.removeItem(k);
        }
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("auth-token") || k.startsWith("triage_"))) {
          localStorage.removeItem(k);
        }
      }
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "patient",
        accessToken,
        expiresAt,
        expiresIn,
        tokenType,
        language,
        setLanguage: handleSetLanguage,
        loginWithPhoneOtp,
        loginWithEmailPassword,
        registerPatient,
        updateProfile,
        refreshProfile,
        signOut,
        isLiveSupabase: isSupabaseConfigured,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
