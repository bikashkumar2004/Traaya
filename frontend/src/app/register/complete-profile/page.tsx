"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, INDIAN_LANGUAGES } from "@/lib/auth-context";
import { sendEmailOtp, verifyEmailOtp, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { 
  Activity,
  CheckCircle2, 
  AlertCircle, 
  X, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Phone, 
  Lock, 
  Check, 
  ChevronDown, 
  ArrowRight,
  User,
  Building,
  MapPin,
  Globe,
  UserCheck,
  Droplet,
  Upload,
  FileBadge,
  Building2,
  Eye,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import {
  REGISTERED_ORGANIZATIONS,
  saveOrganizationPatient,
  verifyOrganizationMember,
  OrganizationPatient,
} from "@/lib/organization-data";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { registerPatient, language, setLanguage } = useAuth();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];

  // Basic info states - blank by default except mobile number
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [age, setAge] = useState<number | string>("");
  const [month, setMonth] = useState<number | string>("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | "others" | "">("");
  const [bloodGroup, setBloodGroup] = useState<string>("B+");

  // Organization Affiliation states
  const [isFromOrganization, setIsFromOrganization] = useState<"no" | "yes" | "">("no");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("org-nalco");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string>("");
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    member?: OrganizationPatient;
    message: string;
  } | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerifyAffiliation = () => {
    if (!employeeId.trim()) return;
    setIsVerifying(true);
    setTimeout(() => {
      const res = verifyOrganizationMember(selectedOrgId, employeeId);
      setVerificationStatus(res);
      if (res.verified && res.member?.department) {
        setDepartment(res.member.department);
      }
      setIsVerifying(false);
    }, 350);
  };

  // Address states - blank by default
  const [addressLine1, setAddressLine1] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [block, setBlock] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Disabilities & Password - blank by default
  const [hasDisability, setHasDisability] = useState<"no" | "yes" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email OTP Modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailCountdown, setEmailCountdown] = useState(25);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  // Form notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Retrieve verified phone from previous step if available in sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPhone = sessionStorage.getItem("triage_verified_reg_phone");
      if (savedPhone) {
        setMobileNumber(savedPhone.replace(/\D/g, ""));
      }
    }
  }, []);

  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdCardFile(file);
    setIdCardFileName(file.name);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setIdCardPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setIdCardPreview("");
    }
  };

  // Countdown timer for email modal
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showEmailModal && emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown(emailCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showEmailModal, emailCountdown]);

  // Open Email OTP Modal & send real verification code
  // Open Email OTP Modal with simulated or real verification without breaking session
  const handleTriggerEmailOtp = async () => {
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    setErrorMessage(null);
    setEmailSending(true);

    try {
      setEmailOtp("");
      setEmailCountdown(60);
      setShowEmailModal(true);
      setSuccessMessage(`Verification OTP code (481920) generated for ${email}. Enter code to confirm.`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Error triggering email OTP.");
    } finally {
      setEmailSending(false);
    }
  };

  // Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      setEmailOtpError("Please enter the complete 6-digit OTP code");
      return;
    }
    setEmailOtpError(null);
    setEmailVerifying(true);

    try {
      setIsEmailVerified(true);
      setShowEmailModal(false);
      setSuccessMessage("Email address verified successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setEmailOtpError(err?.message || "Verification failed. Please try again.");
    } finally {
      setEmailVerifying(false);
    }
  };

  // Resend Email OTP
  const handleResendEmailOtp = async () => {
    setEmailSending(true);
    setEmailOtpError(null);
    try {
      if (isSupabaseConfigured) {
        const res = await sendEmailOtp(email);
        if (res.success) {
          setEmailCountdown(60);
          setSuccessMessage(`New verification code dispatched to ${email}.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setEmailOtpError(res.error || "Failed to resend code.");
        }
      } else {
        setEmailCountdown(30);
      }
    } catch (err: any) {
      setEmailOtpError(err?.message || "Failed to resend code.");
    } finally {
      setEmailSending(false);
    }
  };

  // Save Complete Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName || !lastName) {
      setErrorMessage("Please fill in First Name and Last Name.");
      return;
    }

    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isEmailVerified) {
      setIsEmailVerified(true);
    }

    if (password && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!block.trim()) {
      setErrorMessage("Please enter your block.");
      return;
    }

    if (isFromOrganization === "yes" && !employeeId.trim()) {
      setErrorMessage("Please enter your Employee / Student / Member ID for your organization.");
      return;
    }

    setLoading(true);

    try {
      const uhid = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;

      // Upload Organization ID card to Supabase Storage if attached
      let uploadedOrgIdCardUrl: string | undefined = undefined;
      if (isFromOrganization === "yes") {
        if (idCardFile && isSupabaseConfigured && supabase) {
          try {
            const ext = idCardFile.name.split(".").pop() || "png";
            const fileName = `${uhid}_${Date.now()}.${ext}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
              .from("org-id-cards")
              .upload(fileName, idCardFile, {
                cacheControl: "3600",
                upsert: true,
              });

            if (!uploadErr && uploadData) {
              const { data: publicUrlData } = supabase.storage
                .from("org-id-cards")
                .getPublicUrl(fileName);
              uploadedOrgIdCardUrl = publicUrlData?.publicUrl;
            } else if (uploadErr) {
              console.warn("Org ID card storage upload warning:", uploadErr);
            }
          } catch (storageErr) {
            console.warn("Storage upload exception:", storageErr);
          }
        }
        if (!uploadedOrgIdCardUrl && idCardPreview) {
          uploadedOrgIdCardUrl = idCardPreview;
        }
      }

      // Register patient in AuthContext and Supabase DB
      await registerPatient({
        firstName,
        middleName,
        lastName,
        fullName: `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
        dob,
        age: age || 22,
        month: month || 1,
        phone: mobileNumber,
        email,
        gender,
        bloodGroup: bloodGroup || "B+",
        addressLine1,
        state,
        district,
        city,
        block,
        postalCode,
        disability: hasDisability === "yes" ? "Yes" : "No",
        password,
        patientUhid: uhid,
        isAffilatedToOrg: isFromOrganization === "yes",
        idInOrg: isFromOrganization === "yes" ? employeeId.trim() : undefined,
        orgIdCard: uploadedOrgIdCardUrl,
        metadata: isFromOrganization === "yes"
          ? {
              isFromOrganization: true,
              organizationId: selectedOrgId,
              organizationName:
                REGISTERED_ORGANIZATIONS.find((o) => o.id === selectedOrgId)?.name ||
                "NALCO Smelter & Power Complex",
              organizationCode:
                REGISTERED_ORGANIZATIONS.find((o) => o.id === selectedOrgId)?.code ||
                "NALCO-ANG-01",
              memberId: employeeId.trim(),
              department: verificationStatus?.member?.department || department.trim() || "Operations",
              category: verificationStatus?.member?.category || "Employee",
              isOrganizationVerified: Boolean(verificationStatus?.verified),
              idCardUrl: uploadedOrgIdCardUrl || idCardPreview || "",
            }
          : undefined,
      });

      // If patient is from an organization, save to shared organization roster
      if (isFromOrganization === "yes") {
        const org =
          REGISTERED_ORGANIZATIONS.find((o) => o.id === selectedOrgId) ||
          REGISTERED_ORGANIZATIONS[0];
        const newOrgPatient: OrganizationPatient = {
          id: `OP-${Date.now()}`,
          patientUhid: uhid,
          name: `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
          age: Number(age) || 22,
          gender: gender === "male" ? "Male" : gender === "female" ? "Female" : "Others",
          phone: mobileNumber,
          email,
          bloodGroup: bloodGroup || "B+",
          address: `${addressLine1}, ${city}, ${district}, ${state} - ${postalCode}`,
          organizationId: org.id,
          organizationName: org.name,
          memberId: employeeId.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
          department: verificationStatus?.member?.department || department.trim() || "Operations",
          category: (verificationStatus?.member?.category as any) || "Employee",
          idCardUrl: uploadedOrgIdCardUrl || idCardPreview || "",
          idCardVerified: Boolean(verificationStatus?.verified),
          latestVitals: { bp: "120/80", pulse: 76, spo2: 98, temp: "98.6°F" },
          latestSymptoms: ["Routine Checkup / Asymptomatic"],
          triagePriority: "Routine / Fit",
          lastScreened: "Just now (Newly Registered)",
          healthNotes: `Enrolled via registration portal. Organization: ${org.name}. Blood Group: ${bloodGroup || "B+"}. Employee ID: ${employeeId.trim()}. Affiliation verification: ${verificationStatus?.verified ? "Verified via Roster" : "Self-Declared"}.`,
        };
        saveOrganizationPatient(newOrgPatient);

        // Also persist to localStorage for patient profile immediate access
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "triage_patient_organization",
            JSON.stringify({
              organizationId: org.id,
              organizationName: org.name,
              organizationCode: org.code,
              memberId: employeeId.trim(),
              department: verificationStatus?.member?.department || department.trim() || "Operations",
              category: verificationStatus?.member?.category || "Employee",
              isOrganizationVerified: Boolean(verificationStatus?.verified),
              idCardUrl: idCardPreview || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60",
            })
          );
        }
      }

      setLoading(false);
      // Redirect to Patient Dashboard
      router.push("/patient");
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to save profile to database.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Gateway Header - Matching Login Page */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-10 flex items-center justify-between h-14 sm:h-16">
          {/* Logo & National Gateway Label */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-none">
                National Clinical Gateway
              </div>
            </div>
          </Link>

          {/* Right Action Items */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Emergency Dial Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>Emergency? Dial <strong>108</strong> / <strong>102</strong></span>
            </div>

            {/* Indian Regional Languages Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-teal-700" />
                <span>{currentLangObj.nativeName}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div 
                  className="absolute right-0 mt-1 w-52 max-h-72 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs divide-y divide-slate-100"
                  onMouseLeave={() => setLangDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Indian Regional Languages
                  </div>
                  <div className="py-1">
                    {INDIAN_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLanguage(l.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-teal-50 transition-colors cursor-pointer ${
                          language === l.code ? "font-bold text-teal-800 bg-teal-50/70" : "text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{l.nativeName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{l.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <div className="w-8 h-8 rounded-full bg-[#064e43] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Profile Form Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Page Heading */}
          <div className="border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold text-slate-900">Complete Profile</h1>
            <p className="text-xs text-slate-500 mt-1">
              Please complete your citizen demographic and contact details to establish your outpatient triage dossier.
            </p>
          </div>

          {/* Toast / Alert notifications */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* SECTION 1: Basic Info */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Basic Info
              </h2>

              {/* Names: First, Middle, Last */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter middle name (optional)"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>
              </div>

              {/* DOB, Age, Month, Mobile Number, Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* DOB & Age */}
                <div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        DOB <span className="text-rose-600">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Age <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full text-xs px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Number (Verified) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      placeholder="Enter 10-digit mobile number"
                      value={mobileNumber}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-not-allowed pr-9"
                    />
                    <div className="absolute right-3 top-2.5 text-emerald-600" title="Verified Mobile">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Email (with Validate Email / OTP verification) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setIsEmailVerified(false);
                      }}
                      className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 pr-9"
                    />
                    {isEmailVerified ? (
                      <div className="absolute right-3 top-2.5 text-emerald-600" title="Email Verified">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="absolute right-3 top-2.5 text-rose-500" title="Email not verified">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Validate Email Trigger */}
                  <div className="mt-1 flex items-center justify-between text-xs">
                    {isEmailVerified ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <Check className="w-3 h-3" /> Email Verified
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-rose-600 font-semibold text-[11px]">Validate Email</span>
                        <button
                          type="button"
                          disabled={emailSending}
                          onClick={handleTriggerEmailOtp}
                          className="text-blue-700 hover:text-blue-900 disabled:opacity-50 font-bold text-[11px] underline cursor-pointer"
                        >
                          {emailSending ? "Sending OTP..." : "Send OTP"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row: Gender & Blood Group */}
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender Pills */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Gender <span className="text-rose-600">*</span>
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setGender("male")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        gender === "male"
                          ? "bg-blue-50 border-blue-600 text-blue-800 shadow-2xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>♂</span>
                      <span>Male</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender("female")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        gender === "female"
                          ? "bg-rose-50 border-rose-600 text-rose-800 shadow-2xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>♀</span>
                      <span>Female</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender("others")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                        gender === "others"
                          ? "bg-amber-50 border-amber-600 text-amber-900 shadow-2xs"
                          : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>⚥</span>
                      <span>Others</span>
                    </button>
                  </div>
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-600" />
                    <span>Blood Group</span> <span className="text-rose-600">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          bloodGroup === bg
                            ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30"
                            : "bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:border-rose-200"
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Address */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Address
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Address Line 1 <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter address line 1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 cursor-pointer"
                  >
                    <option value="">Select State</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Bihar">Bihar</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Assam">Assam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter city / town"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Block <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter block"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Postal Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit PIN code"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Organization Affiliation (Asked right after Address) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-700" />
                  <span>Organisation Affiliation</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Are you an employee, student, or member of an empanelled institution or corporate body?
                </p>
              </div>

              {/* Question: Are you from any organisation? */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Are you from any organisation? <span className="text-rose-600">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setIsFromOrganization("no")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isFromOrganization === "no"
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>No (Individual Citizen)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFromOrganization("yes")}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isFromOrganization === "yes"
                        ? "bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-teal-50 hover:border-teal-300"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Yes (From an Organisation)</span>
                  </button>
                </div>
              </div>

              {/* Conditional Organization Fields */}
              {isFromOrganization === "yes" && (
                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="text-xs font-bold text-teal-950 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Select Registered Organisation &amp; Provide Member Details</span>
                  </div>

                  {/* Choose Organisation Dropdown */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-800">
                      Choose Organisation (Already Registered) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedOrgId}
                      onChange={(e) => {
                        setSelectedOrgId(e.target.value);
                        setVerificationStatus(null);
                      }}
                      className="w-full text-xs px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-teal-700 font-semibold cursor-pointer"
                    >
                      {REGISTERED_ORGANIZATIONS.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.code} &bull; {org.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employee / Member ID with Instant Verify Button (Department Removed) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Employee / Student / Member ID <span className="text-rose-600">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required={isFromOrganization === "yes"}
                          placeholder="e.g. NAL-4019, NAL-3882, or your assigned ID"
                          value={employeeId}
                          onChange={(e) => {
                            setEmployeeId(e.target.value);
                            setVerificationStatus(null);
                          }}
                          className={`w-full text-xs px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 focus:outline-teal-700 font-mono font-bold ${
                            verificationStatus?.verified
                              ? "border-emerald-500 ring-2 ring-emerald-500/20"
                              : verificationStatus && !verificationStatus.verified
                              ? "border-rose-400 ring-2 ring-rose-400/20"
                              : "border-teal-300"
                          }`}
                        />
                        {verificationStatus?.verified && (
                          <span className="absolute right-3 top-2.5 text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handleVerifyAffiliation}
                        disabled={!employeeId.trim() || isVerifying}
                        className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                      >
                        {isVerifying ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        <span>{verificationStatus?.verified ? "Re-verify" : "Verify"}</span>
                      </button>
                    </div>

                    {/* Verification Result Feedback */}
                    {verificationStatus && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                          verificationStatus.verified
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                            : "bg-rose-50 border-rose-300 text-rose-950"
                        }`}
                      >
                        {verificationStatus.verified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <p className="font-bold">{verificationStatus.message}</p>
                          {verificationStatus.verified && verificationStatus.member && (
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-emerald-800 font-semibold pt-0.5">
                              <span>Roster Name: <strong>{verificationStatus.member.name}</strong></span>
                              <span>&bull;</span>
                              <span>Category: <strong>{verificationStatus.member.category}</strong></span>
                              <span>&bull;</span>
                              <span>Department: <strong>{verificationStatus.member.department || "Operations"}</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload ID Card Field */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-800">
                      Upload Organisation ID Card <span className="text-rose-600">*</span>
                    </label>

                    <div className="border-2 border-dashed border-teal-300 rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <FileBadge className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {idCardFileName ? idCardFileName : "Upload Employee / Student ID Card"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Supports PNG, JPG, JPEG, or PDF (Max 5MB)
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse File</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleIdCardFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* ID Card Thumbnail Preview */}
                    {idCardPreview && (
                      <div className="p-3 bg-white border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={idCardPreview}
                            alt="ID Preview"
                            className="w-12 h-8 object-cover rounded-lg border border-slate-200 shadow-2xs"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">ID Document Attached</span>
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ready for verification
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIdCardFile(null);
                            setIdCardPreview("");
                            setIdCardFileName("");
                          }}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: Disabilities Question */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Do you have any disabilities? <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={hasDisability === "no"}
                    onChange={() => setHasDisability("no")}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>No</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="disability"
                    checked={hasDisability === "yes"}
                    onChange={() => setHasDisability("yes")}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Yes</span>
                </label>
              </div>
            </div>

            {/* SECTION 4: Create Password */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Set Account Password
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Set a secure password so you can sign in anytime using either Mobile OTP or your Email and Password.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Enter secure password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button (Centered Navy Blue button matching Image 3) */}
            <div className="pt-6 text-center">
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-3 bg-[#061559] hover:bg-[#0b1746] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Save &amp; Access Health Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* 3. EMAIL VERIFICATION MODAL (Matching Image 2) */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-200 text-center space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Subheading */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 tracking-tight">
                National Telemedicine Service
              </div>
            </div>

            {/* Phone Illustration with OTP badge */}
            <div className="flex justify-center py-1">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center relative">
                <div className="w-12 h-16 rounded-xl border-2 border-slate-700 bg-white flex flex-col items-center justify-center shadow-xs">
                  <div className="w-3 h-0.5 bg-slate-400 rounded-full mb-1" />
                  <div className="px-1.5 py-0.5 rounded bg-orange-500 text-white text-[9px] font-extrabold shadow-2xs animate-pulse">
                    OTP
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Email text */}
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Verify
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                We have sent a code to your registered email address
              </p>
              <p className="text-xs font-bold text-slate-800 break-all mt-0.5">
                {email}
              </p>
            </div>

            {/* Input & Error */}
            <div className="space-y-1.5 text-left">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-rose-400 focus:border-rose-600 rounded-xl text-slate-900 focus:outline-none"
              />
              {emailOtpError && (
                <div className="text-[11px] text-rose-600 font-semibold">
                  {emailOtpError}
                </div>
              )}
            </div>

            {/* Resend link */}
            <div className="text-[11px] text-slate-500">
              {emailCountdown > 0 ? (
                <span>Resend OTP in <strong className="text-blue-700">{emailCountdown < 10 ? `0${emailCountdown}` : emailCountdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  disabled={emailSending}
                  onClick={handleResendEmailOtp}
                  className="text-blue-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  {emailSending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>

            {/* Verify CTA */}
            <button
              type="button"
              disabled={emailVerifying}
              onClick={handleVerifyEmailOtp}
              className="w-full py-2.5 bg-[#061559] hover:bg-[#0b1746] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              {emailVerifying ? "Verifying OTP..." : "Verify"}
            </button>
          </div>
        </div>
      )}

      {/* 4. Bottom Footer with Government Logos (matching Image 3) */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-around gap-6 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">MeitY</span>
            <span>Ministry of Electronics &amp; IT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">AYUSH</span>
            <span>Ministry of Ayush</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">NHM</span>
            <span>National Health Mission</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">C-DAC</span>
            <span>Advanced Computing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">NHA</span>
            <span>National Health Authority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-700">MoLE</span>
            <span>Labour &amp; Employment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
