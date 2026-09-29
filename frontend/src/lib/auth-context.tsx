"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured, formatToE164Phone } from "./supabase";

export type UserRole = "patient" | "nurse" | "doctor" | "admin" | "organization" | "healthcamp" | "facility" | "medical";
export type Language = 
  | "en" // English
  | "hi" // Hindi
  | "ta" // Tamil
  | "te" // Telugu
  | "bn" // Bengali
  | "mr" // Marathi
  | "gu" // Gujarati
  | "kn" // Kannada
  | "ml" // Malayalam
  | "pa" // Punjabi
  | "or" // Odia
  | "as" // Assamese
  | "ur" // Urdu
  | string;

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "Hindi" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা" },
  { code: "mr", name: "Marathi", nativeName: "Marathi" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া" },
  { code: "ur", name: "Urdu", nativeName: "اردو" },
];

export interface ChronicCondition {
  id: string;
  condition: string;
  diagnosedYear?: string;
  notes?: string;
}

export interface DrugAllergy {
  id: string;
  allergen: string;
  severity: "Severe" | "Moderate" | "Mild";
  reaction?: string;
  reportedYear?: string;
}

export interface FamilyDependent {
  id: string;
  fullName: string;
  relation: string;
  age?: number | string;
  gender?: string;
  phone?: string;
  patientUhid?: string;
  statusNote?: string;
}

export interface UserProfile {
  id: string;
  userId?: string; // Universal Role Identifier (e.g. PAT-849201, DOC-4412, NUR-0021, ADM-0001, ORG-0001)
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string | number;
  bloodGroup?: string;
  patientUhid?: string; // Backwards-compatible alias for userId
  facilityName?: string;
  addressLine1?: string;
  state?: string;
  district?: string;
  city?: string;
  block?: string;
  postalCode?: string;
  disability?: string;
  password?: string;
  chronicConditions?: ChronicCondition[];
  allergies?: DrugAllergy[];
  dependents?: FamilyDependent[];
  isAffilatedToOrg?: boolean;
  organizationName?: string;
  idInOrg?: string;
  orgIdCard?: string;
  metadata?: Record<string, any>;
}

export interface PatientRegistrationPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  dob: string;
  age: string | number;
  month: string | number;
  phone: string;
  email: string;
  gender: string;
  bloodGroup?: string;
  addressLine1: string;
  state: string;
  district: string;
  city?: string;
  block?: string;
  postalCode: string;
  disability?: string;
  password?: string;
  patientUhid?: string;
  isAffilatedToOrg?: boolean;
  organizationName?: string;
  idInOrg?: string;
  orgIdCard?: string;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  language: Language;
  setLanguage: (lang: Language) => void;
  loginWithPhoneOtp: (role: UserRole, phone: string, customName?: string) => Promise<void>;
  loginWithEmailPassword: (role: UserRole, email: string, password: string) => Promise<boolean>;
  registerPatient: (data: PatientRegistrationPayload) => Promise<UserProfile>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  isLiveSupabase: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map Supabase public.profiles row and patient_profiles row to UserProfile
  const mapSupabaseProfile = (row: any, authUser?: any, patientRow?: any): UserProfile => {
    const chronicConditions = Array.isArray(patientRow?.chronic_conditions) && patientRow.chronic_conditions.length > 0
      ? patientRow.chronic_conditions
      : (Array.isArray(row.chronic_conditions) && row.chronic_conditions.length > 0
        ? row.chronic_conditions
        : (Array.isArray(row.metadata?.chronic_conditions) ? row.metadata.chronic_conditions : []));

    const allergies = Array.isArray(patientRow?.allergies) && patientRow.allergies.length > 0
      ? patientRow.allergies
      : (Array.isArray(row.allergies) && row.allergies.length > 0
        ? row.allergies
        : (Array.isArray(row.metadata?.allergies) ? row.metadata.allergies : []));

    const dependents = Array.isArray(patientRow?.dependents) && patientRow.dependents.length > 0
      ? patientRow.dependents
      : (Array.isArray(row.dependents) && row.dependents.length > 0
        ? row.dependents
        : (Array.isArray(row.metadata?.dependents) ? row.metadata.dependents : []));

    const isAffilatedToOrg = patientRow?.is_affilated_to_org ?? row.is_affilated_to_org ?? row.metadata?.is_affilated_to_org ?? false;
    const organizationName = patientRow?.organization_name || row.organization_name || row.metadata?.organizationName || row.metadata?.organization_name || "";
    const idInOrg = patientRow?.id_in_org || row.id_in_org || row.metadata?.idInOrg || row.metadata?.id_in_org || "";
    const orgIdCard = patientRow?.org_id_card || row.org_id_card || row.metadata?.orgIdCard || row.metadata?.org_id_card || "";

    return {
      id: row.id || authUser?.id,
      userId: row.user_id || row.patient_uhid || authUser?.user_metadata?.user_id,
      email: row.email || authUser?.email || "",
      fullName: row.full_name || authUser?.user_metadata?.full_name || "Healthcare User",
      role: (row.role as UserRole) || (authUser?.user_metadata?.role as UserRole) || "patient",
      phone: row.phone || authUser?.phone || authUser?.user_metadata?.phone,
      patientUhid: row.user_id || row.patient_uhid || authUser?.user_metadata?.patient_uhid || "PAT-8402",
      gender: row.gender || "male",
      dateOfBirth: row.date_of_birth,
      age: row.age,
      bloodGroup: patientRow?.blood_group || row.blood_group,
      facilityName: patientRow?.primary_facility_name || row.facility_name || "Primary Health Centre & Sub-Centres",
      addressLine1: row.address_line1,
      state: row.state,
      district: row.district,
      city: row.city,
      block: row.block,
      postalCode: row.postal_code,
      disability: patientRow?.disability || row.disability || "No",
      chronicConditions,
      allergies,
      dependents,
      isAffilatedToOrg,
      organizationName,
      idInOrg,
      orgIdCard,
      metadata: {
        ...(row.metadata || {}),
        ...(patientRow?.metadata || {}),
        organizationName,
      },
    };
  };

  // Helper to fetch live profile from Supabase public.profiles table and role tables
  const fetchProfileFromSupabase = useCallback(async (userId: string, authUser?: any): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Notice reading profile from Supabase:", error.message);
      }

      if (data) {
        let patientRow = null;
        if (data.role === "patient") {
          const { data: pData, error: pError } = await supabase
            .from("patient_profiles")
            .select("*")
            .eq("profile_id", userId)
            .maybeSingle();
          if (pError) {
            console.warn("Notice reading patient profile:", pError.message);
          } else {
            patientRow = pData;
          }
        }
        return mapSupabaseProfile(data, authUser, patientRow);
      }
    } catch (err) {
      console.error("fetchProfileFromSupabase exception:", err);
    }

    if (authUser) {
      return {
        id: authUser.id,
        email: authUser.email || "",
        fullName: authUser.user_metadata?.full_name || "Healthcare User",
        role: (authUser.user_metadata?.role as UserRole) || "patient",
        phone: authUser.phone || authUser.user_metadata?.phone,
        patientUhid: authUser.user_metadata?.patient_uhid || "PAT-8402",
      };
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id && isSupabaseConfigured && supabase) {
      const updated = await fetchProfileFromSupabase(user.id);
      if (updated) {
        setUser(updated);
      }
    }
  }, [user?.id, fetchProfileFromSupabase]);

  useEffect(() => {
    let savedRole: UserRole | null = null;
    if (typeof window !== "undefined") {
      // Check saved language and role preference from sessionStorage only
      savedRole = sessionStorage.getItem("triage_active_role") as UserRole | null;
      const savedLang = sessionStorage.getItem("triage_language") as Language | null;

      if (savedLang) {
        setLanguage(savedLang);
      }

      // Security Cleanup: Purge all residual authentication and triage keys from localStorage
      const keysToPurge = [
        "triage_custom_user",
        "triage_active_role",
        "triage_language",
        "triage_supabase_user_id",
        "triage_verified_reg_phone"
      ];
      keysToPurge.forEach((k) => localStorage.removeItem(k));

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("auth-token") || k.startsWith("triage_"))) {
          localStorage.removeItem(k);
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      // 1. Get initial live Supabase session from sessionStorage
      sb.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const profile = await fetchProfileFromSupabase(session.user.id, session.user);
          if (profile) {
            setUser(profile);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: If no active session, check if there is a primary patient profile in Supabase
        const { data: defaultProfile } = await sb
          .from("profiles")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (defaultProfile) {
          const fullProfile = await fetchProfileFromSupabase(defaultProfile.id);
          setUser(fullProfile || mapSupabaseProfile(defaultProfile));
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });

      // 2. Subscribe to live auth state changes
      const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfileFromSupabase(session.user.id, session.user);
          if (profile) {
            setUser(profile);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setUser(null);
      setIsLoading(false);
    }
  }, [fetchProfileFromSupabase]);

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
        const resolvedRole = mapped.role || role;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_active_role", resolvedRole);
        }
        return;
      }
    }

    const formattedPhone = formatToE164Phone(rawPhone);
    const uhidPrefix = role === "doctor" ? "DOC" : role === "nurse" ? "STF" : (role === "facility" || role === "medical") ? "FAC" : "PAT";
    const newUhid = `${uhidPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: UserProfile = {
      id: `usr-${cleanDigits.slice(-6) || Date.now().toString().slice(-6)}`,
      email: `${cleanDigits.slice(-10)}@triageassist.live`,
      fullName: customName || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      role: role,
      phone: formattedPhone,
      patientUhid: newUhid,
    };
    setUser(newUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_active_role", role);
    }
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
            const resolvedRole = profile.role || role;
            if (typeof window !== "undefined") {
              sessionStorage.setItem("triage_active_role", resolvedRole);
            }
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
        const resolvedRole = mapped.role || role;
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_active_role", resolvedRole);
        }
        return true;
      }
    }

    // Direct fallback authenticated profile
    const uhidPrefix = role === "doctor" ? "DOC" : role === "nurse" ? "STF" : (role === "facility" || role === "medical") ? "FAC" : "PAT";
    const customUser: UserProfile = {
      id: `usr-${cleanEmail.split("@")[0].slice(0, 8)}`,
      email: cleanEmail,
      fullName: cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      role: role,
      patientUhid: `${uhidPrefix}-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setUser(customUser);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("triage_active_role", role);
    }
    return true;
  };

  const registerPatient = async (data: PatientRegistrationPayload): Promise<UserProfile> => {
    const computedFullName = data.fullName || `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`.trim();
    const formattedPhone = formatToE164Phone(data.phone);
    const cleanEmail = data.email.trim().toLowerCase();
    const computedUhid = data.patientUhid || `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

    let sessionUserId: string | undefined;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        sessionUserId = sessionData.session?.user?.id;
      } catch (err) {
        console.warn("Notice reading session user:", err);
      }
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          fullName: computedFullName,
          email: cleanEmail,
          phone: formattedPhone,
          patientUhid: computedUhid,
          userId: sessionUserId,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to register profile in database.");
      }

      const finalizedProfile: UserProfile = json.user;
      setUser(finalizedProfile);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("triage_active_role", "patient");
      }
      return finalizedProfile;
    } catch (err: any) {
      console.error("registerPatient error:", err);
      // Fallback local representation if offline
      const fallbackProfile: UserProfile = {
        id: sessionUserId || `patient-${Date.now()}`,
        userId: computedUhid,
        email: cleanEmail,
        fullName: computedFullName,
        role: "patient",
        phone: formattedPhone,
        gender: data.gender || "male",
        dateOfBirth: data.dob || "2004-05-15",
        age: Number(data.age) || 22,
        bloodGroup: data.bloodGroup || "B+",
        patientUhid: computedUhid,
        facilityName: "Primary Health Centre & Sub-Centres",
        addressLine1: data.addressLine1,
        state: data.state,
        district: data.district,
        city: data.city,
        block: data.block,
        disability: data.disability || "No",
        isAffilatedToOrg: data.isAffilatedToOrg,
        idInOrg: data.idInOrg,
        orgIdCard: data.orgIdCard,
        metadata: data.metadata,
      };
      setUser(fallbackProfile);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("triage_active_role", "patient");
      }
      return fallbackProfile;
    }
  };

  const updateProfile = async (updatedData: Partial<UserProfile>): Promise<boolean> => {
    if (!user?.id) return false;

    const newProfile: UserProfile = { ...user, ...updatedData };
    setUser(newProfile);

    if (isSupabaseConfigured && supabase && /^[0-9a-fA-F-]{36}$/.test(user.id)) {
      try {
        // 1. Update public.profiles (common identity & demographic fields only)
        const profileUpdatePayload: any = {
          full_name: newProfile.fullName,
          phone: newProfile.phone,
          gender: newProfile.gender,
          date_of_birth: newProfile.dateOfBirth || null,
          age: Number(newProfile.age) || null,
          address_line1: newProfile.addressLine1,
          state: newProfile.state,
          district: newProfile.district,
          city: newProfile.city,
          block: newProfile.block,
          postal_code: newProfile.postalCode,
          metadata: {
            ...(newProfile.metadata || {}),
            organizationName: newProfile.organizationName,
            isAffilatedToOrg: newProfile.isAffilatedToOrg,
            idInOrg: newProfile.idInOrg,
            orgIdCard: newProfile.orgIdCard,
            chronic_conditions: newProfile.chronicConditions || [],
            allergies: newProfile.allergies || [],
            dependents: newProfile.dependents || [],
          },
          updated_at: new Date().toISOString(),
        };

        const { error: profileErr } = await supabase
          .from("profiles")
          .update(profileUpdatePayload)
          .eq("id", user.id);

        if (profileErr) {
          console.error("Supabase profile update error:", profileErr.message);
          return false;
        }

        // 2. If role is patient, update or upsert public.patient_profiles
        if (newProfile.role === "patient") {
          const patientPayload: any = {
            profile_id: user.id,
            blood_group: newProfile.bloodGroup,
            disability: newProfile.disability || "No",
            primary_facility_name: newProfile.facilityName || "Community Health Centre (CHC) Khandapada",
            is_affilated_to_org: !!newProfile.isAffilatedToOrg,
            organization_name: newProfile.organizationName || null,
            id_in_org: newProfile.idInOrg || null,
            org_id_card: newProfile.orgIdCard || null,
            chronic_conditions: newProfile.chronicConditions || [],
            allergies: newProfile.allergies || [],
            dependents: newProfile.dependents || [],
            metadata: {
              ...(newProfile.metadata || {}),
              organizationName: newProfile.organizationName,
            },
            updated_at: new Date().toISOString(),
          };

          const { error: patientErr } = await supabase
            .from("patient_profiles")
            .upsert(patientPayload, { onConflict: "profile_id" });

          if (patientErr) {
            console.error("Supabase patient_profiles update error:", patientErr.message);
            return false;
          }
        }

        return true;
      } catch (e) {
        console.error("updateProfile error:", e);
        return false;
      }
    }
    return true;
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn("Notice signing out:", e);
      }
    }
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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "patient",
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
