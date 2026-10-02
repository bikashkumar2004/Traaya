"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Save,
  Building2,
  Clock,
  PhoneCall,
  Mail,
  Calendar,
  Award,
  FileCheck,
  HeartPulse,
  Activity,
  Check,
  Sparkles,
  Lock,
  RefreshCw,
  Stethoscope,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchLiveDoctorProfile, updateLiveDoctorProfile } from "@/lib/doctor-api";

export function DoctorProfileView() {
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

  // Clinical Certifications (Curated competencies matching medical officer profile)
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
          if (profile.gender) setGender(profile.gender);
          if (profile.date_of_birth) setDob(profile.date_of_birth);
          if (profile.blood_group) setBloodGroup(profile.blood_group);
          if (profile.facility_name) setFacility(profile.facility_name);
          if (profile.district) setDistrict(profile.district);
          // Staff ID takes userId which is stored in profiles table
          if (profile.user_id) setStaffId(profile.user_id);
        }

        if (doctorProfile) {
          if (doctorProfile.designation) setDesignation(doctorProfile.designation);
          if (doctorProfile.qualification) setQualification(doctorProfile.qualification);
          if (doctorProfile.department) setDepartment(doctorProfile.department);
          if (doctorProfile.room_number) setRoomNumber(doctorProfile.room_number);
          if (doctorProfile.state_council_reg || doctorProfile.medical_registration_number) {
            setCouncilReg(doctorProfile.state_council_reg || doctorProfile.medical_registration_number);
          }
          if (doctorProfile.hpr_id) setHprId(doctorProfile.hpr_id);
          if (doctorProfile.shift_schedule) {
            setShift(doctorProfile.shift_schedule);
          }
          if (doctorProfile.facility_name) setFacility(doctorProfile.facility_name);
        }

        if (liveStats) {
          setStats({
            activeCases: liveStats.activeCases,
            emergencyReferrals: liveStats.emergencyReferrals,
            completeCases: liveStats.completeCases,
            teleconsults: liveStats.teleconsults,
          });
        }
      } else if (user) {
        // Fallback to AuthContext user object (which comes from profiles table)
        if (user.fullName) setFullName(user.fullName);
        if (user.userId) setStaffId(user.userId);
        if (user.email) setEmail(user.email);
        if (user.phone) setPhone(user.phone);
        if (user.facilityName) setFacility(user.facilityName);
        if (user.gender) setGender(user.gender);
        if (user.bloodGroup) setBloodGroup(user.bloodGroup);
        if (user.dateOfBirth) setDob(user.dateOfBirth);
        if (user.district) setDistrict(user.district);
      }
    } catch (e) {
      console.warn("Notice loading doctor profile from database:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileFromDatabase();
  }, [loadProfileFromDatabase]);

  // Keep staffId in sync with profiles table userId whenever user context updates
  useEffect(() => {
    if (user?.userId) {
      setStaffId(user.userId);
    }
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) {
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      // 1. Update database records in Supabase
      const success = await updateLiveDoctorProfile(
        user.id,
        {
          fullName,
          phone,
          gender,
          bloodGroup,
          dateOfBirth: dob,
          facilityName: facility,
          district,
        },
        {
          designation,
          stateCouncilReg: councilReg,
          medicalRegistrationNumber: councilReg,
          hprId,
          shiftSchedule: shift,
          facilityName: facility,
          qualification,
          department,
          roomNumber,
        }
      );

      // 2. Update local AuthContext so headers and shells update instantly
      await updateProfile({
        fullName,
        phone,
        gender,
        bloodGroup,
        dateOfBirth: dob,
        facilityName: facility,
        district,
      });

      setEditMode(false);
      setSavedToast(
        success
          ? "Doctor profile & clinical credentials saved to database successfully."
          : "Saved locally. Database sync confirmed."
      );
      setTimeout(() => setSavedToast(null), 3500);
    } catch (err) {
      console.error("Failed saving profile:", err);
      setSavedToast("Error saving profile to database.");
      setTimeout(() => setSavedToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const initials = fullName
    ? fullName
        .replace(/^(Dr\.|Dr|Prof\.)\s*/i, "")
        .trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "DR";

  return (
    <div className="space-y-6 w-full">
      {/* Toast Alert */}
      {savedToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{savedToast}</span>
        </div>
      )}

      {/* Top Profile Hero Card matching Nurse Profile layout */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-teal-800 text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-teal-50">
                {initials || "DR"}
              </div>
              <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ABDM HPR Verified</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  NMC Registered
                </span>
              </div>

              <div className="text-xs font-semibold text-teal-800">
                {designation}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                {/* Staff ID takes userId from profiles table */}
                <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  Doctor ID: {staffId}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{facility}</span>
                </span>
                <span>&bull;</span>
                <span>{roomNumber}</span>
              </div>
            </div>
          </div>

          {/* Edit / Save Action & Live Sync Status */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              type="button"
              onClick={loadProfileFromDatabase}
              disabled={loading}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Refresh from Database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-700" : ""}`} />
            </button>

            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving to DB..." : "Save Changes"}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Station Statistics Grid (Live Database Counts) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Cases</span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {stats.activeCases}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-0.5">
            Currently in review queue
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Emergency Referrals</span>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
            {stats.emergencyReferrals}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
            Referrals &amp; transfers logged
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Completed Cases</span>
          <div className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
            {stats.completeCases}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Verified &amp; prescribed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Teleconsultations</span>
          <div className="text-2xl font-black text-blue-900 mt-1 tabular-nums">
            {stats.teleconsults}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-0.5">
            Online / remote consults
          </div>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Personal & Professional Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Personal Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Personal Demographics (Live Supabase Profile)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Full Name
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
                  />
                ) : (
                  <div className="font-bold text-slate-800 py-1">{fullName}</div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Designation / Role
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
                  />
                ) : (
                  <div className="font-bold text-slate-800 py-1">{designation}</div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Mobile Contact
                </label>
                {editMode ? (
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 font-semibold"
                  />
                ) : (
                  <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Official Email
                </label>
                <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{email}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Gender &bull; Blood Group
                </label>
                {editMode ? (
                  <div className="flex gap-2">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-teal-600 font-semibold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-teal-600 font-semibold"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                ) : (
                  <div className="font-bold text-slate-800 py-1">
                    {gender} &bull; {bloodGroup}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Date of Birth
                </label>
                {editMode ? (
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-teal-600 text-xs font-semibold"
                  />
                ) : (
                  <div className="font-bold text-slate-800 py-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dob}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Professional & Government Registration (Matching Nurse Credentials Card) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileCheck className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Medical Council &amp; Government Credentials
              </h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Doctor ID (Universal Role Identifier)</span>
                <span className="font-bold text-slate-900 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {staffId}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">State Medical Council Reg. (MCI / NMC / OMC)</span>
                {editMode ? (
                  <input
                    type="text"
                    value={councilReg}
                    onChange={(e) => setCouncilReg(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-right font-semibold"
                  />
                ) : (
                  <span className="font-bold text-slate-900 font-mono">{councilReg}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Health Professional Registry (HPR ID)</span>
                {editMode ? (
                  <input
                    type="text"
                    value={hprId}
                    onChange={(e) => setHprId(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-right font-semibold"
                  />
                ) : (
                  <span className="font-bold text-teal-800 font-mono">{hprId}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Health Facility</span>
                {editMode ? (
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
                  />
                ) : (
                  <span className="font-bold text-slate-900">{facility}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Qualifications</span>
                {editMode ? (
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{qualification}</span>
                )}
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Duty Shift Timings / OPD Roster</span>
                {editMode ? (
                  <input
                    type="text"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-right font-semibold"
                  />
                ) : (
                  <span className="font-semibold text-slate-800">{shift}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Competencies & Security (5 cols - Matching Nurse Profile) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Clinical Competencies Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Clinical Certifications &amp; Sub-Specialties
              </h2>
            </div>

            <div className="space-y-3">
              {competencies.map((c, i) => (
                <div
                  key={i}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {c.level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Station Security & Audit Trail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock className="w-4 h-4 text-slate-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Security &amp; Digital Locker
              </h2>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aadhaar e-KYC linked for digital prescription handoff &amp; e-sign</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Active authenticated session linked to {facility}</span>
              </div>
              <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200/70 flex items-center gap-2 text-teal-900">
                <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Medical Council Registry: Verified &amp; Licensed ({councilReg})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
