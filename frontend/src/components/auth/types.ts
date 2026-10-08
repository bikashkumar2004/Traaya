import { UserRole } from "@/lib/auth-context";

export type AuthSetupCategory = "individual" | "health_worker";
export type AuthMode = "login" | "register";
export type AuthMethod = "phone_otp" | "email_password";
