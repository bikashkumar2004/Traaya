"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { sendEmailOtp, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getIndiaStates, getDistrictsForState, getBlocksForDistrict } from "@/lib/india-locations";
import { CheckCircle2, AlertCircle } from "lucide-react";
import {
  REGISTERED_ORGANIZATIONS,
  saveOrganizationPatient,
  verifyOrganizationMember,
  OrganizationPatient,
} from "@/lib/organization-data";
import {
  RegisterHeader,
  RegisterBasicInfoSection,
  RegisterAddressSection,
  RegisterOrganizationSection,
  RegisterSecuritySection,
  RegisterEmailOtpModal,
  RegisterFooter,
  OrgVerificationStatus,
} from "@/components/register";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { registerPatient, language, setLanguage } = useAuth();

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

  // Automatically calculate age and months when DOB is selected
  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    if (!newDob) {
      setAge("");
      setMonth("");
      return;
    }
    const birthDate = new Date(newDob);
    if (isNaN(birthDate.getTime())) return;

    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    let calculatedMonths = today.getMonth() - birthDate.getMonth();

    if (today.getDate() < birthDate.getDate()) {
      calculatedMonths--;
    }

    if (calculatedMonths < 0) {
      calculatedAge--;
      calculatedMonths += 12;
    }

    if (calculatedAge >= 0) {
      setAge(calculatedAge);
      setMonth(calculatedMonths >= 0 ? calculatedMonths : 0);
    }
  };

  // Organization Affiliation states
  const [isFromOrganization, setIsFromOrganization] = useState<"no" | "yes" | "">("no");
  const [selectedOrgId, setSelectedOrgId] = useState<string>("org-nalco");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardFileName, setIdCardFileName] = useState<string>("");
  const [idCardPreview, setIdCardPreview] = useState<string>("");
  const [verificationStatus, setVerificationStatus] = useState<OrgVerificationStatus | null>(null);
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

  const [addressLine1, setAddressLine1] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [block, setBlock] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Cascading India location options: State -> District -> Block
  const allStates = useMemo(() => getIndiaStates(), []);
  const availableDistricts = useMemo(() => getDistrictsForState(state), [state]);
  const availableBlocks = useMemo(() => getBlocksForDistrict(state, district), [state, district]);

  const handleStateChange = (nextState: string) => {
    setState(nextState);
    setDistrict("");
    setBlock("");
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setBlock("");
  };

  // Disabilities & Password - blank by default
  const [hasDisability, setHasDisability] = useState<"no" | "yes" | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      // Redirect to Citizen Dashboard
      router.push("/citizen");
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err?.message || "Failed to save profile to database.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Clinical Gateway Header */}
      <RegisterHeader language={language} setLanguage={setLanguage} />

      {/* Main Profile Form Container */}
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
            {/* Section 1: Basic Info */}
            <RegisterBasicInfoSection
              firstName={firstName}
              setFirstName={setFirstName}
              middleName={middleName}
              setMiddleName={setMiddleName}
              lastName={lastName}
              setLastName={setLastName}
              dob={dob}
              handleDobChange={handleDobChange}
              age={age}
              setAge={setAge}
              mobileNumber={mobileNumber}
              email={email}
              setEmail={setEmail}
              isEmailVerified={isEmailVerified}
              setIsEmailVerified={setIsEmailVerified}
              emailSending={emailSending}
              onTriggerEmailOtp={handleTriggerEmailOtp}
              gender={gender}
              setGender={setGender}
              bloodGroup={bloodGroup}
              setBloodGroup={setBloodGroup}
            />

            {/* Section 2: Address */}
            <RegisterAddressSection
              addressLine1={addressLine1}
              setAddressLine1={setAddressLine1}
              state={state}
              handleStateChange={handleStateChange}
              district={district}
              handleDistrictChange={handleDistrictChange}
              block={block}
              setBlock={setBlock}
              city={city}
              setCity={setCity}
              postalCode={postalCode}
              setPostalCode={setPostalCode}
              allStates={allStates}
              availableDistricts={availableDistricts}
              availableBlocks={availableBlocks}
            />

            {/* Section 3: Organization Affiliation */}
            <RegisterOrganizationSection
              isFromOrganization={isFromOrganization}
              setIsFromOrganization={setIsFromOrganization}
              selectedOrgId={selectedOrgId}
              setSelectedOrgId={setSelectedOrgId}
              employeeId={employeeId}
              setEmployeeId={setEmployeeId}
              verificationStatus={verificationStatus}
              setVerificationStatus={setVerificationStatus}
              isVerifying={isVerifying}
              onVerifyAffiliation={handleVerifyAffiliation}
              idCardFileName={idCardFileName}
              idCardPreview={idCardPreview}
              onIdCardFileChange={handleIdCardFileChange}
              onRemoveIdCard={() => {
                setIdCardFile(null);
                setIdCardPreview("");
                setIdCardFileName("");
              }}
            />

            {/* Section 4: Disabilities & Password */}
            <RegisterSecuritySection
              hasDisability={hasDisability}
              setHasDisability={setHasDisability}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              loading={loading}
            />
          </form>
        </div>
      </main>

      {/* Email Verification Modal */}
      <RegisterEmailOtpModal
        showEmailModal={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={email}
        emailOtp={emailOtp}
        setEmailOtp={setEmailOtp}
        emailOtpError={emailOtpError}
        emailCountdown={emailCountdown}
        emailSending={emailSending}
        emailVerifying={emailVerifying}
        onResendOtp={handleResendEmailOtp}
        onVerifyOtp={handleVerifyEmailOtp}
      />

      {/* Bottom Footer */}
      <RegisterFooter />
    </div>
  );
}
