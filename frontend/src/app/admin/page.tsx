"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";
import { getIndiaStates, getDistrictsForState, getBlocksForDistrict } from "@/lib/india-locations";
import {
  ShieldAlert,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Pill,
  Building2,
  Truck,
  Sparkles,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Eye,
  EyeOff,
  User,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Building,
  Check,
  RefreshCw
} from "lucide-react";

interface QuickFillPreset {
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  age: number;
  addressLine1: string;
  state: string;
  district: string;
  city: string;
  block: string;
  postalCode: string;
  password: string;
  userId: string;
  roleSpecific: Record<string, any>;
}

export default function AdminRegistrationPage() {
  const router = useRouter();
  const { loginWithPhoneOtp } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] = useState<Array<{
    role: string;
    userId: string;
    fullName: string;
    phone: string;
    email: string;
    password: string;
    destination: string;
  }>>([]);

  // Common Form States
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Triage@2026");
  const [gender, setGender] = useState("male");
  const [dob, setDob] = useState("1996-06-15");
  const [age, setAge] = useState<number | string>(28);

  // Automatically calculate age when DOB is selected
  const handleDobChange = (newDob: string) => {
    setDob(newDob);
    if (!newDob) {
      setAge("");
      return;
    }
    const birthDate = new Date(newDob);
    if (isNaN(birthDate.getTime())) return;

    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge >= 0) {
      setAge(calculatedAge);
    }
  };

  const [addressLine1, setAddressLine1] = useState("Ward 4, Hospital Road");
  const [state, setState] = useState("Odisha");
  const [district, setDistrict] = useState("Nayagarh");
  const [city, setCity] = useState("Nayagarh");
  const [block, setBlock] = useState("Khandapada");
  const [postalCode, setPostalCode] = useState("752077");

  // Cascading location options: State -> District -> Block
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

  // Patient Specific States
  const [bloodGroup, setBloodGroup] = useState("B+");
  const [disability, setDisability] = useState("No");
  const [primaryFacilityName, setPrimaryFacilityName] = useState("Community Health Centre (CHC) Khandapada");
  const [isAffilatedToOrg, setIsAffilatedToOrg] = useState(false);
  const [patientOrgName, setPatientOrgName] = useState("");
  const [idInOrg, setIdInOrg] = useState("");
  const [orgIdCard, setOrgIdCard] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("Bijay Kumar Sahu");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("+91 94371 99120");

  // Registered Facilities & Verification for Nurse/Doctor
  const [registeredFacilities, setRegisteredFacilities] = useState<Array<{
    id: string;
    user_id: string;
    facility_name: string;
    city?: string;
    district?: string;
    state?: string;
    department?: string;
  }>>([]);
  const [verifiedFacility, setVerifiedFacility] = useState<{
    id: string;
    user_id: string;
    facility_name: string;
    city?: string;
    district?: string;
    state?: string;
    department?: string;
  } | null>(null);
  const [isVerifyingFacility, setIsVerifyingFacility] = useState(false);
  const [facilityVerificationError, setFacilityVerificationError] = useState<string | null>(null);

  // Load registered facilities from database
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      try {
        const res = await fetch("/api/admin/facilities");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.facilities)) {
          setRegisteredFacilities(data.facilities);
        }
      } catch (err) {
        console.warn("Failed to load facilities:", err);
      }
    }
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time verification of facility against database
  useEffect(() => {
    const trimmed = primaryFacilityName.trim();
    if (!trimmed) {
      setVerifiedFacility(null);
      setFacilityVerificationError(null);
      setIsVerifyingFacility(false);
      return;
    }

    // Check preloaded list for instant match
    const localMatch = registeredFacilities.find(
      (f) =>
        (f.user_id && f.user_id.toLowerCase() === trimmed.toLowerCase()) ||
        (f.facility_name && f.facility_name.toLowerCase() === trimmed.toLowerCase()) ||
        (f.id && f.id.toLowerCase() === trimmed.toLowerCase())
    );

    if (localMatch) {
      setVerifiedFacility(localMatch);
      setFacilityVerificationError(null);
      setIsVerifyingFacility(false);
      return;
    }

    setIsVerifyingFacility(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/facilities?query=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success && data.verified && data.facility) {
          setVerifiedFacility(data.facility);
          setFacilityVerificationError(null);
        } else {
          setVerifiedFacility(null);
          setFacilityVerificationError(
            `No registered facility found in database matching "${trimmed}".`
          );
        }
      } catch (err) {
        setVerifiedFacility(null);
        setFacilityVerificationError("Failed to verify facility with database.");
      } finally {
        setIsVerifyingFacility(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [primaryFacilityName, registeredFacilities]);

  // Doctor Specific States
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState("");
  const [doctorStateCouncilReg, setDoctorStateCouncilReg] = useState("");
  const [doctorHprId, setDoctorHprId] = useState("");
  const [doctorDesignation, setDoctorDesignation] = useState("Senior Attending Physician & Clinical Specialist");
  const [qualification, setQualification] = useState("MBBS, MD (Medicine)");
  const [department, setDepartment] = useState("Department of General Medicine");
  const [roomNumber, setRoomNumber] = useState("OPD Room 102");
  const [doctorShiftSchedule, setDoctorShiftSchedule] = useState("Morning OPD (08:00 AM - 02:00 PM)");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [isAuthorizedReviewer, setIsAuthorizedReviewer] = useState(true);

  // Nurse Specific States
  const [staffId, setStaffId] = useState("");
  const [stateCouncilReg, setStateCouncilReg] = useState("");
  const [hprId, setHprId] = useState("");
  const [designation, setDesignation] = useState("Senior Staff Nurse & Triage Specialist");
  const [shiftSchedule, setShiftSchedule] = useState("Morning Roster (08:00 AM - 04:00 PM)");

  // Facility / Pharmacy Specific States (matching facility_profiles schema: hpr_id, department)
  const [facilityHprId, setFacilityHprId] = useState("");
  const [facilityDepartment, setFacilityDepartment] = useState("Central Pharmacy & Lab");

  // Organization Specific States
  const [orgCode, setOrgCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgCategory, setOrgCategory] = useState("Public Sector Undertaking (PSU)");
  const [totalWorkforce, setTotalWorkforce] = useState<number | string>(3200);
  const [contactEmail, setContactEmail] = useState("");

  // Health Camp Specific States
  const [campId, setCampId] = useState("");
  const [mmuUnitCode, setMmuUnitCode] = useState("MMU-OD-04");
  const [campName, setCampName] = useState("Nayagarh Mobile Medical Outreach Unit #4");
  const [assignedBlock, setAssignedBlock] = useState("Khandapada Block");
  const [leadOfficer, setLeadOfficer] = useState("Dr. S. Mohapatra");
  const [operationalStatus, setOperationalStatus] = useState("Active");

  // QUICK FILL GENERATOR FOR TESTING
  const handleQuickFill = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const randomPhone = `943710${randomSuffix}`;

    if (activeRole === "patient") {
      setFullName("Rohan Kumar Dash");
      setUserId(`PAT-${randomSuffix}91`);
      setPhone(randomPhone);
      setEmail(`rohan.patient.${randomSuffix}@test.com`);
      setGender("male");
      setDob("1998-04-12");
      setAge(26);
      setAddressLine1("Plot 42, Khandapada Bada Danda");
      setCity("Khandapada");
      setDistrict("Nayagarh");
      setBlock("Khandapada");
      setPostalCode("752077");
      setBloodGroup("O+");
      setDisability("No");
      setIsAffilatedToOrg(true);
      setPatientOrgName("NALCO Smelter & Power Complex");
      setIdInOrg(`NALCO-EMP-${randomSuffix}`);
      setOrgIdCard("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60");
      setEmergencyContactName("Manas Dash");
      setEmergencyContactPhone("+91 94371 88123");
    } else if (activeRole === "doctor") {
      const docCode = `DOC-${randomSuffix}`;
      setFullName("Dr. Ramesh Chandra Mohanty");
      setUserId(docCode);
      setPhone(randomPhone);
      setEmail(`dr.ramesh.${randomSuffix}@triageassist.org`);
      setGender("male");
      setDob("1984-08-22");
      setAge(40);
      setMedicalRegistrationNumber(`MCI-OD-2012-${randomSuffix}`);
      setDoctorStateCouncilReg(`MCI-OD-2012-${randomSuffix}`);
      setDoctorHprId(`91-7712-${randomSuffix}-4402@hpr`);
      setDoctorDesignation("Senior Attending Physician & Clinical Specialist");
      setQualification("MBBS, MD (Emergency Medicine)");
      setDepartment("Department of Medicine & Emergency OPD");
      setRoomNumber("OPD Room 102");
      setDoctorShiftSchedule("Morning OPD (08:00 AM - 02:00 PM)");
      setAvailabilityStatus("Available");
      setIsAuthorizedReviewer(true);
      setPrimaryFacilityName("Community Health Centre (CHC) Khandapada");
    } else if (activeRole === "nurse") {
      const nurCode = `NUR-${randomSuffix}`;
      setFullName("Sister Sarita Kumari Jena");
      setUserId(nurCode);
      setStaffId(nurCode);
      setPhone(randomPhone);
      setEmail(`sarita.nurse.${randomSuffix}@triageassist.org`);
      setGender("female");
      setDob("1992-11-05");
      setAge(32);
      setStateCouncilReg(`ONRC-2016-${randomSuffix}`);
      setHprId(`91-8821-${randomSuffix}-2011@hpr`);
      setDesignation("Senior Staff Nurse & Triage Specialist");
      setShiftSchedule("Morning Roster (08:00 AM - 04:00 PM)");
      setPrimaryFacilityName("Community Health Centre (CHC) Khandapada");
    } else if (activeRole === "facility" || activeRole === "medical") {
      const medCode = `FAC-${randomSuffix.toString().slice(0, 3)}`;
      setFullName("Jan Aushadhi Kendra & CHC Pathology Counter");
      setUserId(medCode);
      setPhone(randomPhone);
      setEmail(`facility.khandapada.${randomSuffix}@triageassist.org`);
      setGender("other");
      setDob("");
      setAge("");
      setAddressLine1("Hospital Road, Main CHC Campus");
      setCity("Khandapada");
      setDistrict("Nayagarh");
      setBlock("Khandapada");
      setState("Odisha");
      setPostalCode("752077");
      setFacilityHprId(`91-7712-${randomSuffix}-4402@hpr`);
      setFacilityDepartment("Central Pharmacy & Lab");
      setPrimaryFacilityName("");
    } else if (activeRole === "organization") {
      const orgUnique = `ORG-NALCO-${randomSuffix.toString().slice(0, 3)}`;
      setFullName("NALCO Smelter & Power Complex");
      setUserId(orgUnique);
      setOrgCode(orgUnique);
      setOrgName("NALCO Smelter & Power Complex, Angul");
      setOrgCategory("Public Sector Undertaking (PSU)");
      setTotalWorkforce(3500);
      setPhone(randomPhone);
      setEmail(`health.nalco.${randomSuffix}@nalcoindia.co.in`);
      setContactEmail(`health.nalco.${randomSuffix}@nalcoindia.co.in`);
      setCity("Angul");
      setDistrict("Angul");
      setBlock("Banarpal");
      setPostalCode("759145");
    } else if (activeRole === "healthcamp") {
      const campUnique = `CMP-${randomSuffix.toString().slice(0, 3)}`;
      setFullName("Nayagarh Mobile Medical Outreach Unit #4");
      setUserId(campUnique);
      setCampId(campUnique);
      setMmuUnitCode(`MMU-OD-0${Math.floor(1 + Math.random() * 8)}`);
      setCampName("Nayagarh Mobile Medical Outreach Fleet #4");
      setAssignedBlock("Khandapada Block");
      setDistrict("Nayagarh");
      setLeadOfficer("Dr. S. Mohapatra (MO I/C)");
      setOperationalStatus("Active");
      setPhone(randomPhone);
      setEmail(`mmu.nayagarh.${randomSuffix}@triageassist.org`);
    } else if (activeRole === "admin") {
      const admCode = `ADM-${randomSuffix}`;
      setFullName("Clinical System Administrator");
      setUserId(admCode);
      setPhone(randomPhone);
      setEmail(`admin.${randomSuffix}@triageassist.gov.in`);
      setGender("other");
      setDob("1986-07-14");
      setAge(38);
    }

    setStatusMessage({
      type: "success",
      text: `⚡ Quick-filled realistic test data for ${activeRole.toUpperCase()}!`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleClear = () => {
    setFullName("");
    setUserId("");
    setPhone("");
    setEmail("");
    setPatientOrgName("");
    setIdInOrg("");
    setDoctorStateCouncilReg("");
    setDoctorHprId("");
    setStaffId("");
    setOrgCode("");
    setCampId("");
    setStatusMessage(null);
  };

  const getDestinationRoute = (role: string): string => {
    switch (role) {
      case "patient": return "/patient";
      case "doctor": return "/doctor";
      case "nurse": return "/nurse";
      case "facility": return "/medical";
      case "medical": return "/medical";
      case "organization": return "/organization";
      case "healthcamp": return "/healthcamp";
      case "admin": return "/doctor";
      default: return "/patient";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const payload: Record<string, any> = {
        role: activeRole,
        fullName,
        userId: userId || undefined,
        phone,
        email,
        password,
        gender,
        dob,
        age: Number(age),
        addressLine1,
        state,
        district,
        city,
        block,
        postalCode,
        primaryFacilityName: verifiedFacility?.facility_name || primaryFacilityName,
        facilityId: verifiedFacility?.id || null,
      };

      if (activeRole === "patient") {
        payload.bloodGroup = bloodGroup;
        payload.disability = disability;
        payload.isAffilatedToOrg = isAffilatedToOrg;
        payload.organizationName = isAffilatedToOrg ? patientOrgName : null;
        payload.idInOrg = isAffilatedToOrg ? idInOrg : null;
        payload.orgIdCard = isAffilatedToOrg ? orgIdCard : null;
        payload.emergencyContactName = emergencyContactName;
        payload.emergencyContactPhone = emergencyContactPhone;
      } else if (activeRole === "doctor") {
        payload.medicalRegistrationNumber = medicalRegistrationNumber;
        payload.stateCouncilReg = doctorStateCouncilReg || medicalRegistrationNumber;
        payload.hprId = doctorHprId;
        payload.designation = doctorDesignation;
        payload.qualification = qualification;
        payload.department = department;
        payload.roomNumber = roomNumber;
        payload.shiftSchedule = doctorShiftSchedule;
        payload.availabilityStatus = availabilityStatus;
        payload.isAuthorizedReviewer = isAuthorizedReviewer;
        payload.facilityId = verifiedFacility?.id || null;
        payload.primaryFacilityName = verifiedFacility?.facility_name || primaryFacilityName;
      } else if (activeRole === "nurse") {
        payload.staffId = staffId || userId;
        payload.stateCouncilReg = stateCouncilReg;
        payload.hprId = hprId;
        payload.designation = designation;
        payload.shiftSchedule = shiftSchedule;
        payload.facilityId = verifiedFacility?.id || null;
        payload.primaryFacilityName = verifiedFacility?.facility_name || primaryFacilityName;
      } else if (activeRole === "facility" || activeRole === "medical") {
        payload.hprId = facilityHprId;
        payload.department = facilityDepartment;
      } else if (activeRole === "organization") {
        payload.orgCode = orgCode || userId;
        payload.orgName = orgName || fullName;
        payload.orgCategory = orgCategory;
        payload.totalWorkforce = totalWorkforce;
        payload.contactEmail = contactEmail || email;
      } else if (activeRole === "healthcamp") {
        payload.campId = campId || userId;
        payload.mmuUnitCode = mmuUnitCode;
        payload.campName = campName || fullName;
        payload.assignedBlock = assignedBlock;
        payload.leadOfficer = leadOfficer;
        payload.operationalStatus = operationalStatus;
      }

      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Admin registration failed.");
      }

      const createdUser = data.user;
      const destination = getDestinationRoute(activeRole);

      setStatusMessage({
        type: "success",
        text: `✓ Successfully created ${createdUser.fullName} (${activeRole.toUpperCase()}) with ID: ${createdUser.userId}`,
      });

      setRecentAccounts((prev) => [
        {
          role: activeRole,
          userId: createdUser.userId,
          fullName: createdUser.fullName,
          phone: createdUser.phone,
          email: createdUser.email,
          password: password,
          destination,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to register user.",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDirectLogin = async (acc: typeof recentAccounts[0]) => {
    await loginWithPhoneOtp(acc.role as UserRole, acc.phone, acc.fullName);
    router.push(acc.destination);
  };

  const roleTabs: Array<{ id: UserRole; label: string; icon: any; color: string; badge: string }> = [
    { id: "patient", label: "Patient", icon: UserCheck, color: "text-emerald-700 border-emerald-500 bg-emerald-50", badge: "PAT-XXXXXX" },
    { id: "doctor", label: "Doctor", icon: Stethoscope, color: "text-cyan-700 border-cyan-500 bg-cyan-50", badge: "DOC-XXXX" },
    { id: "nurse", label: "Nurse", icon: HeartPulse, color: "text-rose-700 border-rose-500 bg-rose-50", badge: "NUR-XXXX" },
    { id: "facility", label: "Facility / Pharmacy", icon: Pill, color: "text-indigo-700 border-indigo-500 bg-indigo-50", badge: "FAC-XXX" },
    { id: "organization", label: "Organization", icon: Building2, color: "text-amber-700 border-amber-500 bg-amber-50", badge: "ORG-XXX" },
    { id: "healthcamp", label: "Health Camp / MMU", icon: Truck, color: "text-teal-700 border-teal-500 bg-teal-50", badge: "CMP-XXX" },
    { id: "admin", label: "System Admin", icon: ShieldAlert, color: "text-purple-700 border-purple-500 bg-purple-50", badge: "ADM-XXXX" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/40">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  TriageAssist Admin Test Console
                </h1>
                <p className="text-xs text-slate-400">
                  Universal Multi-Role Registration & QA Data Provisioning Workbench
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>⚡ Quick Fill Test Data</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-200"
                : "bg-rose-950/70 border-rose-500/50 text-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold">{statusMessage.text}</span>
          </div>
        )}

        {/* Role Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {roleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveRole(tab.id);
                  setStatusMessage(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-teal-400 ring-2 ring-teal-400/40 shadow-lg text-white"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <Icon className={`w-5 h-5 ${isSelected ? "text-teal-400" : "text-slate-400"}`} />
                  <span className="text-[10px] font-mono uppercase bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300">
                    {tab.badge}
                  </span>
                </div>
                <span className="text-xs font-bold truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">

          {/* Section 1: Core Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
              <KeyRound className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                1. Authentication & Common Identity ({activeRole.toUpperCase()})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {activeRole === "facility" || activeRole === "medical"
                    ? "Facility / Centre Name"
                    : activeRole === "organization"
                    ? "Organization Name"
                    : activeRole === "healthcamp"
                    ? "Camp / MMU Name"
                    : "Full Legal / Professional Name"}{" "}
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    activeRole === "facility" || activeRole === "medical"
                      ? "e.g. Jan Aushadhi Kendra & CHC Pathology Counter"
                      : activeRole === "organization"
                      ? "e.g. NALCO Smelter & Power Complex"
                      : activeRole === "healthcamp"
                      ? "e.g. Nayagarh Mobile Medical Outreach Fleet #4"
                      : "e.g. Dr. Ramesh Mohanty"
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Universal User ID / Identifier
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={
                    activeRole === "patient" ? "PAT-991204" :
                    activeRole === "doctor" ? "DOC-4412" :
                    activeRole === "nurse" ? "NUR-0021" :
                    (activeRole === "facility" || activeRole === "medical") ? "FAC-001" :
                    activeRole === "organization" ? "ORG-NALCO-01" :
                    activeRole === "healthcamp" ? "CMP-001" : "ADM-0001"
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-teal-300 font-mono placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone Number (for SMS & OTP login) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9437100001"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@triageassist.org"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {activeRole !== "facility" && activeRole !== "medical" && activeRole !== "organization" && activeRole !== "healthcamp" && (
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Assigned Facility {activeRole === "nurse" && <span className="text-teal-400 font-normal">(Database Verification)</span>}
                    </label>
                    {isVerifyingFacility ? (
                      <span className="text-[10px] text-teal-400 flex items-center gap-1 font-mono">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                      </span>
                    ) : verifiedFacility ? (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Database Verified
                      </span>
                    ) : primaryFacilityName.trim() ? (
                      <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" /> Not Verified
                      </span>
                    ) : null}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      list="admin-registered-facilities"
                      value={primaryFacilityName}
                      onChange={(e) => setPrimaryFacilityName(e.target.value)}
                      placeholder="e.g. FAC-357 or Jan Aushadhi Kendra"
                      className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                        verifiedFacility
                          ? "border-emerald-500/80 focus:border-emerald-400 ring-1 ring-emerald-500/30"
                          : primaryFacilityName.trim()
                          ? "border-rose-500/80 focus:border-rose-400 ring-1 ring-rose-500/30"
                          : "border-slate-700 focus:border-teal-400"
                      }`}
                    />
                    {verifiedFacility && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
                    )}
                  </div>

                  <datalist id="admin-registered-facilities">
                    {registeredFacilities.map((fac) => (
                      <option key={fac.id} value={fac.facility_name}>
                        {fac.user_id ? `[${fac.user_id}] ` : ""}{fac.facility_name} ({fac.city || fac.district || "Registered"})
                      </option>
                    ))}
                  </datalist>

                  {/* Verification Status Details */}
                  {verifiedFacility ? (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-300">
                            Verified: {verifiedFacility.facility_name} {verifiedFacility.user_id && `[${verifiedFacility.user_id}]`}
                          </div>
                          <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                            Facility ID: <span className="underline">{verifiedFacility.id}</span>
                            {verifiedFacility.city && ` • ${verifiedFacility.city}`}
                            {verifiedFacility.district && `, ${verifiedFacility.district}`}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/40 shrink-0">
                        ID Linked ✓
                      </span>
                    </div>
                  ) : primaryFacilityName.trim() && !isVerifyingFacility ? (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-rose-300">
                            Facility Not Found in Database
                          </div>
                          <div className="text-[11px] text-rose-400/80 mt-0.5">
                            {facilityVerificationError || "No registered facility found in database. Enter a valid facility name or code."}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-full border border-rose-500/40 shrink-0">
                        Unverified ✕
                      </span>
                    </div>
                  ) : null}

                  {/* Registered Facilities Quick-Pills */}
                  {registeredFacilities.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Registered Facilities in Database:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {registeredFacilities.slice(0, 4).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setPrimaryFacilityName(f.facility_name);
                              setVerifiedFacility(f);
                              setFacilityVerificationError(null);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              verifiedFacility?.id === f.id
                                ? "bg-teal-500/20 border-teal-400 text-teal-200"
                                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                            }`}
                          >
                            {f.user_id ? `[${f.user_id}] ` : ""}{f.facility_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Demographics & Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                {activeRole === "facility" || activeRole === "medical" || activeRole === "organization" || activeRole === "healthcamp"
                  ? "2. Facility Location & Address Information"
                  : "2. Demographics & Address Information"}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {activeRole !== "facility" && activeRole !== "medical" && activeRole !== "organization" && activeRole !== "healthcamp" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </>
              )}

              <div className={activeRole === "facility" || activeRole === "medical" || activeRole === "organization" || activeRole === "healthcamp" ? "col-span-2 sm:col-span-4 lg:col-span-3" : "col-span-2 sm:col-span-3"}>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {activeRole === "facility" || activeRole === "medical" ? "Facility Address Line 1" : "Address Line 1"}
                </label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. Hospital Road, Main CHC Campus"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                >
                  <option value="">Select State / UT</option>
                  {allStates.map((st) => (
                    <option key={st} value={st} className="bg-slate-900 text-white">
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                {availableDistricts.length > 0 ? (
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="">{state ? "Select District" : "Select State First"}</option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled={!state}
                    placeholder={state ? "Enter district" : "Select state first"}
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-50"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Block</label>
                {availableBlocks.length > 0 ? (
                  <select
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                  >
                    <option value="">{district ? "Select Block" : "Select District First"}</option>
                    {availableBlocks.map((b) => (
                      <option key={b} value={b} className="bg-slate-900 text-white">
                        {b}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled={!district}
                    placeholder={district ? "Enter block" : "Select district first"}
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-50"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Dynamic Role Specific Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                3. Role-Specific Details ({activeRole.toUpperCase()})
              </h2>
            </div>

            {/* PATIENT FIELDS */}
            {activeRole === "patient" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Disability</label>
                  <select
                    value={disability}
                    onChange={(e) => setDisability(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="No">No</option>
                    <option value="Locomotor">Locomotor</option>
                    <option value="Visual">Visual</option>
                    <option value="Hearing">Hearing</option>
                    <option value="Speech">Speech</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Affiliated to Organization?
                  </label>
                  <select
                    value={isAffilatedToOrg ? "yes" : "no"}
                    onChange={(e) => setIsAffilatedToOrg(e.target.value === "yes")}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="no">No (General Public)</option>
                    <option value="yes">Yes (Employee / PSU / University)</option>
                  </select>
                </div>

                {isAffilatedToOrg && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={patientOrgName}
                        onChange={(e) => setPatientOrgName(e.target.value)}
                        placeholder="e.g. NALCO Smelter & Power Complex"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        ID in Organization (id_in_org)
                      </label>
                      <input
                        type="text"
                        value={idInOrg}
                        onChange={(e) => setIdInOrg(e.target.value)}
                        placeholder="e.g. NALCO-EMP-8841"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Organization ID Card URL (org_id_card)
                      </label>
                      <input
                        type="text"
                        value={orgIdCard}
                        onChange={(e) => setOrgIdCard(e.target.value)}
                        placeholder="https://... supabase storage URL or mock preview"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Name</label>
                  <input
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Contact Phone</label>
                  <input
                    type="text"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            )}

            {/* DOCTOR FIELDS */}
            {activeRole === "doctor" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Medical Reg. No (MCI / State Council) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={medicalRegistrationNumber}
                    onChange={(e) => setMedicalRegistrationNumber(e.target.value)}
                    placeholder="e.g. MCI-OD-2012-9041"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State Council Registration No.
                  </label>
                  <input
                    type="text"
                    value={doctorStateCouncilReg}
                    onChange={(e) => setDoctorStateCouncilReg(e.target.value)}
                    placeholder="e.g. MCI-OD-2012-9041"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    HPR ID (ABDM Healthcare Professional ID)
                  </label>
                  <input
                    type="text"
                    value={doctorHprId}
                    onChange={(e) => setDoctorHprId(e.target.value)}
                    placeholder="e.g. 91-7712-3321-4402@hpr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Designation & Clinical Role
                  </label>
                  <input
                    type="text"
                    value={doctorDesignation}
                    onChange={(e) => setDoctorDesignation(e.target.value)}
                    placeholder="e.g. Senior Attending Physician & Clinical Specialist"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. MBBS, MD"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Department of Medicine"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OPD Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. OPD Room 102"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Schedule / Roster</label>
                  <input
                    type="text"
                    value={doctorShiftSchedule}
                    onChange={(e) => setDoctorShiftSchedule(e.target.value)}
                    placeholder="e.g. Morning OPD (08:00 AM - 02:00 PM)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Availability Status</label>
                  <select
                    value={availabilityStatus}
                    onChange={(e) => setAvailabilityStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="On Call">On Call</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="authReviewer"
                    checked={isAuthorizedReviewer}
                    onChange={(e) => setIsAuthorizedReviewer(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400"
                  />
                  <label htmlFor="authReviewer" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Authorized Clinical AI Reviewer
                  </label>
                </div>
              </div>
            )}

            {/* NURSE FIELDS */}
            {activeRole === "nurse" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    State Council Reg No <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={stateCouncilReg}
                    onChange={(e) => setStateCouncilReg(e.target.value)}
                    placeholder="e.g. ONRC-2018-9941"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ABDM HPR ID</label>
                  <input
                    type="text"
                    value={hprId}
                    onChange={(e) => setHprId(e.target.value)}
                    placeholder="91-8821-4433-2011@hpr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Schedule</label>
                  <input
                    type="text"
                    value={shiftSchedule}
                    onChange={(e) => setShiftSchedule(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            )}

            {/* FACILITY / MEDICAL FIELDS */}
            {(activeRole === "facility" || activeRole === "medical") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ABDM HPR ID (hpr_id) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={facilityHprId}
                    onChange={(e) => setFacilityHprId(e.target.value)}
                    placeholder="e.g. 91-7712-3321-4402@hpr"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Healthcare Professional Registry ID of facility incharge</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department (department) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={facilityDepartment}
                    onChange={(e) => setFacilityDepartment(e.target.value)}
                    placeholder="e.g. Central Pharmacy & Lab"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Primary operational wing or counter unit</p>
                </div>
              </div>
            )}

            {/* ORGANIZATION FIELDS */}
            {activeRole === "organization" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Org Code (org_code) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value)}
                    placeholder="e.g. ORG-NALCO-01"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization Official Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="National Aluminium Company Limited"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={orgCategory}
                    onChange={(e) => setOrgCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Public Sector Undertaking (PSU)">Public Sector Undertaking (PSU)</option>
                    <option value="Corporate / Private Industry">Corporate / Private Industry</option>
                    <option value="Educational Institute / University">Educational Institute / University</option>
                    <option value="Government Department">Government Department</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Workforce Size</label>
                  <input
                    type="number"
                    value={totalWorkforce}
                    onChange={(e) => setTotalWorkforce(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="health.desk@organization.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            )}

            {/* HEALTHCAMP FIELDS */}
            {activeRole === "healthcamp" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Camp ID (camp_id) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={campId}
                    onChange={(e) => setCampId(e.target.value)}
                    placeholder="e.g. CMP-001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MMU Fleet Unit Code <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={mmuUnitCode}
                    onChange={(e) => setMmuUnitCode(e.target.value)}
                    placeholder="MMU-OD-04"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Medical Officer</label>
                  <input
                    type="text"
                    value={leadOfficer}
                    onChange={(e) => setLeadOfficer(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operational Status</label>
                  <select
                    value={operationalStatus}
                    onChange={(e) => setOperationalStatus(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Active">Active (On Field Duty)</option>
                    <option value="Standby">Standby (Depot / CHC)</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Camp Unit Name</label>
                  <input
                    type="text"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            )}

            {/* ADMIN FIELDS */}
            {activeRole === "admin" && (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-300">
                <p className="font-semibold text-teal-300">🛡️ System Administrator Role</p>
                <p className="mt-1 text-slate-400">
                  Full administrative permissions across all facilities, audit logs, compliance rosters, and clinical overrides.
                </p>
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Account will be immediately provisioned with confirmed credentials in Supabase.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Account in Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Register {activeRole.toUpperCase()} Account</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Recently Created Accounts in this Session */}
        {recentAccounts.length > 0 && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recently Provisioned Test Accounts ({recentAccounts.length})</span>
              </h2>
              <span className="text-xs text-slate-400">Click below to copy or test login</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-2.5 hover:border-teal-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {acc.role}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {acc.userId}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-white text-sm">{acc.fullName}</div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Phone: <span className="font-mono text-slate-200">{acc.phone}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.phone, `phone-${idx}`)}
                        className="text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `phone-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Password: <span className="font-mono text-slate-200">{acc.password}</span></span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(acc.password, `pwd-${idx}`)}
                        className="text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `pwd-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-slate-400 truncate">
                      Email: <span className="text-slate-300">{acc.email}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleDirectLogin(acc)}
                      className="px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Direct Login as {acc.role.toUpperCase()}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const copyPayload = `Role: ${acc.role}\nUser ID: ${acc.userId}\nName: ${acc.fullName}\nPhone: ${acc.phone}\nEmail: ${acc.email}\nPassword: ${acc.password}`;
                        copyToClipboard(copyPayload, `all-${idx}`);
                      }}
                      className="text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
                    >
                      {copiedKey === `all-${idx}` ? "✓ Copied All" : "Copy All"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
