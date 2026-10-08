export type UserRole = "patient" | "nurse" | "doctor" | "admin" | "organization" | "healthcamp" | "facility" | "medical";

export type Language = 
  | "en" // English
  | "hi" // Hindi
  | "or" // Odia
  | "bn" // Bengali
  | "te" // Telugu
  | "ta" // Tamil
  | "mr" // Marathi
  | "gu" // Gujarati
  | "kn" // Kannada
  | "ml" // Malayalam
  | "pa" // Punjabi
  | "as" // Assamese
  | "ur" // Urdu
  | "sa" // Sanskrit
  | "ks" // Kashmiri
  | "ne" // Nepali
  | "kok" // Konkani
  | "mai" // Maithili
  | "doi" // Dogri
  | "sd" // Sindhi
  | "brx" // Bodo
  | "sat" // Santali
  | "mni" // Manipuri
  | string;

export interface IndianLanguage {
  code: string;
  name: string;
  nativeName: string;
  bcp47: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: "en", name: "English", nativeName: "English", bcp47: "en-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", bcp47: "hi-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", bcp47: "od-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", bcp47: "bn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", bcp47: "te-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", bcp47: "ta-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", bcp47: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", bcp47: "gu-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", bcp47: "kn-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", bcp47: "ml-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", bcp47: "pa-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", bcp47: "as-IN" },
  { code: "ur", name: "Urdu", nativeName: "اردو", bcp47: "ur-IN" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृतम्", bcp47: "sa-IN" },
  { code: "ks", name: "Kashmiri", nativeName: "کٲشُر", bcp47: "ks-IN" },
  { code: "ne", name: "Nepali", nativeName: "नेपाली", bcp47: "ne-IN" },
  { code: "kok", name: "Konkani", nativeName: "कोंकणी", bcp47: "kok-IN" },
  { code: "mai", name: "Maithili", nativeName: "मैथिली", bcp47: "mai-IN" },
  { code: "doi", name: "Dogri", nativeName: "डोगरी", bcp47: "doi-IN" },
  { code: "sd", name: "Sindhi", nativeName: "سنڌي", bcp47: "sd-IN" },
  { code: "brx", name: "Bodo", nativeName: "बड़ो", bcp47: "brx-IN" },
  { code: "sat", name: "Santali", nativeName: "ᱥᱟᱱᱛᱟᱲᱤ", bcp47: "sat-IN" },
  { code: "mni", name: "Manipuri", nativeName: "মৈতৈলোন্", bcp47: "mni-IN" },
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
  facilityId?: string;
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

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  accessToken: string | null;
  expiresAt: number | null;
  expiresIn: number | null;
  tokenType: string | null;
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
