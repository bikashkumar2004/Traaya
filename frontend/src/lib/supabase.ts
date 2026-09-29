import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes("your-project") &&
  !supabaseAnonKey.includes("your-anon-key")
);

// Custom safe storage wrapper targeting sessionStorage for enhanced security
const customSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  },
};

// Safe Supabase client initialization using sessionStorage for secure token persistence
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: customSessionStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Format an Indian or international phone number to E.164 standard (e.g. +919876543210)
 */
export function formatToE164Phone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (rawPhone.startsWith("+")) {
    return `+${digits}`;
  }
  return `+91${digits.slice(-10)}`;
}

/**
 * Send real SMS OTP to phone via Supabase Auth
 */
export async function sendPhoneOtp(rawPhone: string): Promise<{ success: boolean; formattedPhone: string; error?: string }> {
  const formattedPhone = formatToE164Phone(rawPhone);
  
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, formattedPhone, error: "Supabase client is not configured." };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      return { success: false, formattedPhone, error: error.message };
    }

    return { success: true, formattedPhone };
  } catch (err: any) {
    return { success: false, formattedPhone, error: err?.message || "Failed to dispatch SMS OTP." };
  }
}

/**
 * Verify SMS OTP token with Supabase Auth
 */
export async function verifyPhoneOtp(
  rawPhone: string,
  token: string
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const formattedPhone = formatToE164Phone(rawPhone);

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase client is not configured." };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: token.trim(),
      type: "sms",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify phone OTP." };
  }
}

/**
 * Send real OTP verification code to Email via Supabase Auth
 */
export async function sendEmailOtp(email: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase client is not configured." };
  }

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to dispatch email verification code." };
  }
}

/**
 * Verify Email OTP token with Supabase Auth
 */
export async function verifyEmailOtp(
  email: string,
  token: string
): Promise<{ success: boolean; session?: any; user?: any; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: "Supabase client is not configured." };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: token.trim(),
      type: "email",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, session: data.session, user: data.user };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to verify email OTP." };
  }
}
