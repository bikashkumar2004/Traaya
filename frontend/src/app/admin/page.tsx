"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/lib/auth-context";
import { getIndiaStates, getDistrictsForState, getBlocksForDistrict } from "@/lib/india-locations";
import { CheckCircle2, AlertCircle, Check } from "lucide-react";
import {
  AdminHeader,
  AdminRoleTabs,
  AdminAuthSection,
  AdminDemographicsSection,
  AdminRoleSpecificSection,
  AdminRecentAccounts,
  AdminRecentAccount,
  RegisteredFacility,
} from "@/components/admin";

export default function AdminRegistrationPage() {
  const router = useRouter();
  const { loginWithPhoneOtp } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recentAccounts, setRecentAccounts] = useState<AdminRecentAccount[]>([]);

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
  const [registeredFacilities, setRegisteredFacilities] = useState<RegisteredFacility[]>([]);
  const [verifiedFacility, setVerifiedFacility] = useState<RegisteredFacility | null>(null);
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
      } catch {
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

  // Facility / Pharmacy Specific States
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
      case "patient": return "/citizen";
      case "doctor": return "/doctor";
      case "nurse": return "/nurse";
      case "facility": return "/medical";
      case "medical": return "/medical";
      case "organization": return "/organization";
      case "healthcamp": return "/healthcamp";
      case "admin": return "/doctor";
      default: return "/citizen";
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

  const handleDirectLogin = async (acc: AdminRecentAccount) => {
    await loginWithPhoneOtp(acc.role as UserRole, acc.phone, acc.fullName);
    router.push(acc.destination);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header Card */}
        <AdminHeader onQuickFill={handleQuickFill} onClear={handleClear} />

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
        <AdminRoleTabs
          activeRole={activeRole}
          onSelectRole={(role) => {
            setActiveRole(role);
            setStatusMessage(null);
          }}
        />

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          {/* Section 1: Core Credentials */}
          <AdminAuthSection
            activeRole={activeRole}
            fullName={fullName}
            setFullName={setFullName}
            userId={userId}
            setUserId={setUserId}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            primaryFacilityName={primaryFacilityName}
            setPrimaryFacilityName={setPrimaryFacilityName}
            registeredFacilities={registeredFacilities}
            verifiedFacility={verifiedFacility}
            setVerifiedFacility={setVerifiedFacility}
            isVerifyingFacility={isVerifyingFacility}
            facilityVerificationError={facilityVerificationError}
            setFacilityVerificationError={setFacilityVerificationError}
          />

          {/* Section 2: Demographics & Address */}
          <AdminDemographicsSection
            activeRole={activeRole}
            gender={gender}
            setGender={setGender}
            dob={dob}
            handleDobChange={handleDobChange}
            age={age}
            setAge={setAge}
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

          {/* Section 3: Dynamic Role Specific Details */}
          <AdminRoleSpecificSection
            activeRole={activeRole}
            bloodGroup={bloodGroup}
            setBloodGroup={setBloodGroup}
            disability={disability}
            setDisability={setDisability}
            isAffilatedToOrg={isAffilatedToOrg}
            setIsAffilatedToOrg={setIsAffilatedToOrg}
            patientOrgName={patientOrgName}
            setPatientOrgName={setPatientOrgName}
            idInOrg={idInOrg}
            setIdInOrg={setIdInOrg}
            orgIdCard={orgIdCard}
            setOrgIdCard={setOrgIdCard}
            emergencyContactName={emergencyContactName}
            setEmergencyContactName={setEmergencyContactName}
            emergencyContactPhone={emergencyContactPhone}
            setEmergencyContactPhone={setEmergencyContactPhone}
            medicalRegistrationNumber={medicalRegistrationNumber}
            setMedicalRegistrationNumber={setMedicalRegistrationNumber}
            doctorStateCouncilReg={doctorStateCouncilReg}
            setDoctorStateCouncilReg={setDoctorStateCouncilReg}
            doctorHprId={doctorHprId}
            setDoctorHprId={setDoctorHprId}
            doctorDesignation={doctorDesignation}
            setDoctorDesignation={setDoctorDesignation}
            qualification={qualification}
            setQualification={setQualification}
            department={department}
            setDepartment={setDepartment}
            roomNumber={roomNumber}
            setRoomNumber={setRoomNumber}
            doctorShiftSchedule={doctorShiftSchedule}
            setDoctorShiftSchedule={setDoctorShiftSchedule}
            availabilityStatus={availabilityStatus}
            setAvailabilityStatus={setAvailabilityStatus}
            isAuthorizedReviewer={isAuthorizedReviewer}
            setIsAuthorizedReviewer={setIsAuthorizedReviewer}
            stateCouncilReg={stateCouncilReg}
            setStateCouncilReg={setStateCouncilReg}
            hprId={hprId}
            setHprId={setHprId}
            designation={designation}
            setDesignation={setDesignation}
            shiftSchedule={shiftSchedule}
            setShiftSchedule={setShiftSchedule}
            facilityHprId={facilityHprId}
            setFacilityHprId={setFacilityHprId}
            facilityDepartment={facilityDepartment}
            setFacilityDepartment={setFacilityDepartment}
            orgCode={orgCode}
            setOrgCode={setOrgCode}
            orgName={orgName}
            setOrgName={setOrgName}
            orgCategory={orgCategory}
            setOrgCategory={setOrgCategory}
            totalWorkforce={totalWorkforce}
            setTotalWorkforce={setTotalWorkforce}
            contactEmail={contactEmail}
            setContactEmail={setContactEmail}
            campId={campId}
            setCampId={setCampId}
            mmuUnitCode={mmuUnitCode}
            setMmuUnitCode={setMmuUnitCode}
            campName={campName}
            setCampName={setCampName}
            leadOfficer={leadOfficer}
            setLeadOfficer={setLeadOfficer}
            operationalStatus={operationalStatus}
            setOperationalStatus={setOperationalStatus}
          />

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
        <AdminRecentAccounts
          recentAccounts={recentAccounts}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
          onDirectLogin={handleDirectLogin}
        />

      </div>
    </div>
  );
}
