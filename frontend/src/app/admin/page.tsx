"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";
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
  Check
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
  const [addressLine1, setAddressLine1] = useState("Ward 4, Hospital Road");
  const [state, setState] = useState("Odisha");
  const [district, setDistrict] = useState("Nayagarh");
  const [city, setCity] = useState("Nayagarh");
  const [block, setBlock] = useState("Khandapada");
  const [postalCode, setPostalCode] = useState("752077");

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

  // Doctor Specific States
  const [doctorId, setDoctorId] = useState("");
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState("");
  const [specialization, setSpecialization] = useState("General Medicine & Emergency Care");
  const [qualification, setQualification] = useState("MBBS, MD (Medicine)");
  const [department, setDepartment] = useState("Department of General Medicine");
  const [roomNumber, setRoomNumber] = useState("OPD Room 102");
  const [shiftTimings, setShiftTimings] = useState("08:00 AM - 02:00 PM");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  const [isAuthorizedReviewer, setIsAuthorizedReviewer] = useState(true);

  // Nurse Specific States
  const [staffId, setStaffId] = useState("");
  const [stateCouncilReg, setStateCouncilReg] = useState("");
  const [hprId, setHprId] = useState("");
  const [designation, setDesignation] = useState("Senior Staff Nurse & Triage Specialist");
  const [shiftSchedule, setShiftSchedule] = useState("Morning Roster (08:00 AM - 04:00 PM)");

  // Medical / Pharmacy Specific States
  const [pharmacyLicenseNumber, setPharmacyLicenseNumber] = useState("");
  const [staffDesignation, setStaffDesignation] = useState("Registered Chief Pharmacist");
  const [counterNumber, setCounterNumber] = useState("Jan Aushadhi Counter 1");
  const [isJanAushadhiIncharge, setIsJanAushadhiIncharge] = useState(true);

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
      setDoctorId(docCode);
      setPhone(randomPhone);
      setEmail(`dr.ramesh.${randomSuffix}@triageassist.org`);
      setGender("male");
      setDob("1984-08-22");
      setAge(40);
      setMedicalRegistrationNumber(`MCI-OD-2012-${randomSuffix}`);
      setSpecialization("Emergency Medicine & Critical Care");
      setQualification("MBBS, MD (Emergency Medicine)");
      setDepartment("Department of Medicine & Emergency OPD");
      setRoomNumber("OPD Room 102");
      setShiftTimings("08:00 AM - 02:00 PM");
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
      setFullName("Subrat Kumar Sahu");
      setUserId(medCode);
      setStaffId(medCode);
      setPhone(randomPhone);
      setEmail(`subrat.pharmacy.${randomSuffix}@triageassist.org`);
      setGender("male");
      setDob("1989-02-18");
      setAge(35);
      setPharmacyLicenseNumber(`DL-OD-NAY-2021-${randomSuffix}`);
      setStaffDesignation("Registered Pharmacist & Jan Aushadhi Incharge");
      setDepartment("Central Pharmacy & Lab");
      setCounterNumber("Dispensary Desk 1");
      setIsJanAushadhiIncharge(true);
      setPrimaryFacilityName("Jan Aushadhi Kendra & CHC Pathology Counter");
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
    setDoctorId("");
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
        primaryFacilityName,
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
        payload.doctorId = doctorId || userId;
        payload.medicalRegistrationNumber = medicalRegistrationNumber;
        payload.specialization = specialization;
        payload.qualification = qualification;
        payload.department = department;
        payload.roomNumber = roomNumber;
        payload.shiftTimings = shiftTimings;
        payload.availabilityStatus = availabilityStatus;
        payload.isAuthorizedReviewer = isAuthorizedReviewer;
      } else if (activeRole === "nurse") {
        payload.staffId = staffId || userId;
        payload.stateCouncilReg = stateCouncilReg;
        payload.hprId = hprId;
        payload.designation = designation;
        payload.shiftSchedule = shiftSchedule;
      } else if (activeRole === "facility" || activeRole === "medical") {
        payload.staffId = staffId || userId;
        payload.pharmacyLicenseNumber = pharmacyLicenseNumber;
        payload.staffDesignation = staffDesignation;
        payload.counterNumber = counterNumber;
        payload.isJanAushadhiIncharge = isJanAushadhiIncharge;
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
                  Full Legal / Professional Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Mohanty"
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Assigned Facility
                </label>
                <input
                  type="text"
                  value={primaryFacilityName}
                  onChange={(e) => setPrimaryFacilityName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Demographics & Address */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                2. Demographics & Address Information
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
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
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                >
                </input>
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

              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Block</label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
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
                    Doctor ID (doctor_id) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    placeholder="e.g. DOC-4412"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Qualifications</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">OPD Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Shift Timings</label>
                  <input
                    type="text"
                    value={shiftTimings}
                    onChange={(e) => setShiftTimings(e.target.value)}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff ID (staff_id) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="e.g. FAC-001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pharmacy Drug License Number
                  </label>
                  <input
                    type="text"
                    value={pharmacyLicenseNumber}
                    onChange={(e) => setPharmacyLicenseNumber(e.target.value)}
                    placeholder="e.g. DL-OD-NAY-2022-819"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Counter Number</label>
                  <input
                    type="text"
                    value={counterNumber}
                    onChange={(e) => setCounterNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="janAushadhi"
                    checked={isJanAushadhiIncharge}
                    onChange={(e) => setIsJanAushadhiIncharge(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400"
                  />
                  <label htmlFor="janAushadhi" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Jan Aushadhi Dispensary Incharge
                  </label>
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
