"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchLiveDoctorProfile, updateLiveDoctorProfile } from "@/lib/doctor-api";
import {
  DoctorProfileHero,
  DoctorProfileStats,
  DoctorProfileDetails,
  DoctorProfileCompetencies,
} from "./profile";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { ReviewedCaseRecord } from "./DoctorReviewHistoryView";

interface DoctorProfileViewProps {
  queueCases?: CaseDetails[];
  reviewedCases?: ReviewedCaseRecord[];
}

export function DoctorProfileView({ queueCases, reviewedCases }: DoctorProfileViewProps = {}) {
  const { user, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  // Doctor Profile States initialized from user in profiles table
  const [fullName, setFullName] = useState<string>(user?.fullName || "");
  const [designation, setDesignation] = useState<string>("Senior Attending Physician & Clinical Specialist");
  const [qualification, setQualification] = useState<string>("MBBS, MD (Emergency Medicine)");
  const [department, setDepartment] = useState<string>("Department of Medicine & Emergency OPD");
  const [roomNumber, setRoomNumber] = useState<string>("OPD Room 102");
  const [phone, setPhone] = useState<string>(user?.phone || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [hprId, setHprId] = useState<string>("91-7712-3321-4402@hpr");

  // STAFF ID: Taken directly from userId stored in profiles table
  const [staffId, setStaffId] = useState<string>(user?.userId || user?.patientUhid || "");

  const [councilReg, setCouncilReg] = useState<string>("MCI-OD-2012-8942");
  const [facility, setFacility] = useState<string>(user?.facilityName || "");
  const [district, setDistrict] = useState<string>(user?.district || "");
  const [bloodGroup, setBloodGroup] = useState<string>(user?.bloodGroup || "");
  const [gender, setGender] = useState<string>(user?.gender || "");
  const [dob, setDob] = useState<string>(user?.dateOfBirth || "");
  const [shift, setShift] = useState<string>("Morning OPD (08:00 AM - 02:00 PM)");

  // Clinical Statistics (Real live numbers loaded directly from database)
  const [stats, setStats] = useState({
    activeCases: 0,
    emergencyReferrals: 0,
    completeCases: 0,
    teleconsults: 0,
  });

  const competencies = [
    {
      name: "Emergency & Critical Care (ACLS/ATLS)",
      level: "Certified Lead",
      desc: "Acute coronary syndrome, stroke thrombolysis window, severe respiratory failure.",
    },
    {
      name: "Internal Medicine & Infectious Diseases",
      level: "Specialist",
      desc: "Tropical fevers, multi-drug resistant sepsis, glycemic and hypertensive crises.",
    },
    {
      name: "Clinical Audit & Protocol Governance",
      level: "Chief Auditor",
      desc: "AI differential review, guideline concordance, and emergency triage quality assurance.",
    },
    {
      name: "Jan Aushadhi Rational Prescribing",
      level: "Nodal Officer",
      desc: "Generic medicine formulary adherence and antibiotic stewardship.",
    },
  ];

  // Load all profile, credential, and clinical metrics data from the live database
  const loadProfileFromDatabase = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLiveDoctorProfile(user?.id);
      if (data) {
        const { profile, doctorProfile, stats: liveStats } = data;

        if (profile) {
          if (profile.full_name) setFullName(profile.full_name);
          if (profile.phone) setPhone(profile.phone);
          if (profile.email) setEmail(profile.email);
          if (profile.user_id) setStaffId(profile.user_id);
          if (profile.facility_name) setFacility(profile.facility_name);
          if (profile.district) setDistrict(profile.district);
          if (profile.blood_group) setBloodGroup(profile.blood_group);
          if (profile.gender) setGender(profile.gender);
          if (profile.date_of_birth) setDob(profile.date_of_birth);
        }

        if (doctorProfile) {
          if (doctorProfile.designation) setDesignation(doctorProfile.designation);
          if (doctorProfile.qualifications) setQualification(doctorProfile.qualifications);
          if (doctorProfile.department) setDepartment(doctorProfile.department);
          if (doctorProfile.room_number) setRoomNumber(doctorProfile.room_number);
          if (doctorProfile.hpr_id) setHprId(doctorProfile.hpr_id);
          if (doctorProfile.council_registration) setCouncilReg(doctorProfile.council_registration);
          if (doctorProfile.shift_timings) setShift(doctorProfile.shift_timings);
        }

        if (liveStats) {
          setStats((prev) => ({
            activeCases: prev.activeCases > 0 ? prev.activeCases : liveStats.activeCases,
            emergencyReferrals: prev.emergencyReferrals > 0 ? prev.emergencyReferrals : liveStats.emergencyReferrals,
            completeCases: prev.completeCases > 0 ? prev.completeCases : liveStats.completeCases,
            teleconsults: prev.teleconsults > 0 ? prev.teleconsults : liveStats.teleconsults,
          }));
        }
      }
    } catch (err) {
      console.warn("[DoctorProfileView] Live DB fetch error, keeping current state:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfileFromDatabase();
  }, [loadProfileFromDatabase]);

  // Synchronize clinical stats from live cases (props or cached state)
  useEffect(() => {
    let liveQueue = queueCases;
    let liveReviewed = reviewedCases;

    if (!liveQueue || liveQueue.length === 0) {
      if (typeof window !== "undefined") {
        try {
          const cached = sessionStorage.getItem("triage_cached_doctor_queue");
          if (cached) liveQueue = JSON.parse(cached);
        } catch {}
      }
    }

    if (!liveReviewed || liveReviewed.length === 0) {
      if (typeof window !== "undefined") {
        try {
          const cached = sessionStorage.getItem("triage_cached_doctor_reviewed");
          if (cached) liveReviewed = JSON.parse(cached);
        } catch {}
      }
    }

    const q = liveQueue || [];
    const r = liveReviewed || [];

    if (q.length > 0 || r.length > 0) {
      const activeCount = q.length;
      const refCount = r.filter(
        (c) =>
          c.category === "Referred" ||
          c.status === "Referred" ||
          (c.doctorDecision && c.doctorDecision.toLowerCase().includes("refer"))
      ).length;
      const compCount = r.filter(
        (c) =>
          c.category === "Complete" ||
          c.status === "Completed" ||
          c.status === "Complete" ||
          (c.status && c.status.toLowerCase().includes("discharge")) ||
          (c.doctorDecision && !c.doctorDecision.toLowerCase().includes("refer"))
      ).length;
      const teleCount = [...q, ...r].filter(
        (c) =>
          c.consultationMode === "online" ||
          c.consultationMode === "teleconsult" ||
          ((c as any).doctorNotes && (c as any).doctorNotes.toLowerCase().includes("teleconsult"))
      ).length;

      setStats({
        activeCases: activeCount,
        emergencyReferrals: refCount,
        completeCases: compCount,
        teleconsults: teleCount,
      });
    }
  }, [queueCases, reviewedCases]);

  // Synchronize when the auth context user changes
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.userId || user.patientUhid) setStaffId(user.userId || user.patientUhid || "");
      if (user.facilityName) setFacility(user.facilityName);
      if (user.district) setDistrict(user.district);
      if (user.bloodGroup) setBloodGroup(user.bloodGroup);
      if (user.gender) setGender(user.gender);
      if (user.dateOfBirth) setDob(user.dateOfBirth);
    }
  }, [user]);

  // Save updated profile strictly to Supabase Database
  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.id) {
        await updateLiveDoctorProfile(
          user.id,
          {
            fullName,
            phone,
            bloodGroup,
            gender,
            dateOfBirth: dob,
            facilityName: facility,
            district,
          },
          {
            designation,
            qualification,
            department,
            roomNumber,
            hprId,
            stateCouncilReg: councilReg,
            medicalRegistrationNumber: councilReg,
            shiftSchedule: shift,
            facilityName: facility,
          }
        );
      }

      await updateProfile({
        fullName,
        phone,
        bloodGroup,
        gender,
        dateOfBirth: dob,
        facilityName: facility,
        district,
      });

      setEditMode(false);
      setSavedToast("Doctor profile updated successfully in Supabase database!");
      setTimeout(() => setSavedToast(null), 4000);
    } catch (err: any) {
      console.error("[DoctorProfileView] Save error:", err);
      alert("Failed to save changes. Please check network connection.");
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{savedToast}</span>
        </div>
      )}

      {/* Hero Profile Card */}
      <DoctorProfileHero
        initials={initials}
        fullName={fullName}
        designation={designation}
        staffId={staffId}
        facility={facility}
        roomNumber={roomNumber}
        loading={loading}
        editMode={editMode}
        saving={saving}
        setEditMode={setEditMode}
        onRefresh={loadProfileFromDatabase}
        onSave={handleSave}
      />

      {/* Station Statistics Grid */}
      <DoctorProfileStats stats={stats} />

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Personal & Professional Details (7 cols) */}
        <div className="lg:col-span-7">
          <DoctorProfileDetails
            editMode={editMode}
            fullName={fullName}
            setFullName={setFullName}
            designation={designation}
            setDesignation={setDesignation}
            phone={phone}
            setPhone={setPhone}
            email={email}
            gender={gender}
            setGender={setGender}
            bloodGroup={bloodGroup}
            setBloodGroup={setBloodGroup}
            dob={dob}
            setDob={setDob}
            staffId={staffId}
            councilReg={councilReg}
            setCouncilReg={setCouncilReg}
            hprId={hprId}
            setHprId={setHprId}
            facility={facility}
            setFacility={setFacility}
            qualification={qualification}
            setQualification={setQualification}
            shift={shift}
            setShift={setShift}
          />
        </div>

        {/* Right Column: Competencies & Security (5 cols) */}
        <div className="lg:col-span-5">
          <DoctorProfileCompetencies
            competencies={competencies}
            facility={facility}
            councilReg={councilReg}
          />
        </div>
      </div>
    </div>
  );
}
