"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Edit3,
  Lock,
  UserCheck,
  Check,
  Plus,
  X,
  AlertTriangle,
  User,
  Users,
  Trash2,
  HeartPulse,
  Pill,
  Calendar,
  PhoneCall,
  Activity,
  Building2,
  FileBadge,
  Eye
} from "lucide-react";

import { useAuth, ChronicCondition, DrugAllergy, FamilyDependent } from "@/lib/auth-context";

export default function PatientProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states initialized with live Supabase user data
  const [fullName, setFullName] = useState<string>(user?.fullName || "Bikash Kumar Choudhury");
  const [phone, setPhone] = useState<string>(user?.phone || "+91 8895140540");
  const [email, setEmail] = useState<string>(user?.email || "kumarbikashchoudhury2004@gmail.com");
  const [dob, setDob] = useState<string>(user?.dateOfBirth || "2006-01-01");
  const [age, setAge] = useState<number | string>(user?.age || 20);
  const [gender, setGender] = useState<string>(user?.gender || "Male");
  const [bloodGroup, setBloodGroup] = useState<string>(user?.bloodGroup || "B+");
  const [address, setAddress] = useState<string>(
    user?.addressLine1
      ? `${user.addressLine1}, ${user.city || ""}, ${user.district || ""}, ${user.state || ""} - ${user.postalCode || ""}`
      : "Main Road, R.udayagiri, Gajapati, Odisha - 761016"
  );

  // Dynamic lists connected to database
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>(user?.chronicConditions || []);
  const [allergies, setAllergies] = useState<DrugAllergy[]>(user?.allergies || []);
  const [dependents, setDependents] = useState<FamilyDependent[]>(user?.dependents || []);

  // Organization Affiliation State
  const [organizationAffiliation, setOrganizationAffiliation] = useState<{
    organizationId?: string;
    organizationName?: string;
    organizationCode?: string;
    memberId?: string;
    department?: string;
    category?: string;
    isOrganizationVerified?: boolean;
    idCardUrl?: string;
  } | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);

  // Inline modal / form toggles
  const [showAddCondition, setShowAddCondition] = useState<boolean>(false);
  const [newConditionName, setNewConditionName] = useState<string>("");
  const [newConditionYear, setNewConditionYear] = useState<string>(new Date().getFullYear().toString());
  const [newConditionNotes, setNewConditionNotes] = useState<string>("");

  const [showAddAllergy, setShowAddAllergy] = useState<boolean>(false);
  const [newAllergenName, setNewAllergenName] = useState<string>("");
  const [newAllergySeverity, setNewAllergySeverity] = useState<"Severe" | "Moderate" | "Mild">("Severe");
  const [newAllergyReaction, setNewAllergyReaction] = useState<string>("");

  const [showAddDependent, setShowAddDependent] = useState<boolean>(false);
  const [newDepName, setNewDepName] = useState<string>("");
  const [newDepRelation, setNewDepRelation] = useState<string>("Spouse");
  const [newDepAge, setNewDepAge] = useState<string>("");
  const [newDepGender, setNewDepGender] = useState<string>("Female");
  const [newDepPhone, setNewDepPhone] = useState<string>("");

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
      if (user.dateOfBirth) setDob(user.dateOfBirth);
      if (user.age) setAge(user.age);
      if (user.gender) setGender(user.gender);
      if (user.bloodGroup) setBloodGroup(user.bloodGroup);
      if (user.addressLine1) {
        setAddress(`${user.addressLine1}, ${user.city || ""}, ${user.district || ""}, ${user.state || ""} - ${user.postalCode || ""}`);
      }
      if (user.chronicConditions) {
        setChronicConditions(user.chronicConditions);
      }
      if (user.allergies) {
        setAllergies(user.allergies);
      }
      if (user.dependents) {
        setDependents(user.dependents);
      }
      const isAffiliated = Boolean(
        user.isAffilatedToOrg ||
        user.organizationName ||
        user.metadata?.organizationName ||
        user.metadata?.organization_name ||
        user.idInOrg
      );

      if (isAffiliated) {
        setOrganizationAffiliation({
          organizationId: user.metadata?.organizationId || "org-registered",
          organizationName:
            user.organizationName ||
            user.metadata?.organizationName ||
            user.metadata?.organization_name ||
            "Affiliated Organisation",
          organizationCode:
            user.metadata?.organizationCode ||
            user.metadata?.organization_code ||
            "",
          memberId:
            user.idInOrg ||
            user.metadata?.id_in_org ||
            user.metadata?.memberId ||
            "N/A",
          department:
            user.metadata?.department ||
            "General Division",
          category:
            user.metadata?.category ||
            "Member",
          isOrganizationVerified: user.metadata?.isOrganizationVerified ?? true,
          idCardUrl:
            user.orgIdCard ||
            user.metadata?.org_id_card ||
            user.metadata?.idCardUrl ||
            "",
        });
      } else {
        setOrganizationAffiliation(null);
      }
    } else {
      setOrganizationAffiliation(null);
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("triage_patient_organization");
    }
  }, [user]);

  // Save Demographic Changes
  const handleSaveChanges = async () => {
    setSaving(true);
    const success = await updateProfile({
      fullName,
      phone,
      dateOfBirth: dob,
      age: Number(age) || undefined,
      gender,
      bloodGroup,
      addressLine1: address,
      chronicConditions,
      allergies,
      dependents
    });
    setSaving(false);
    if (success) {
      setSaved(true);
      setEditMode(false);
      showNotification("Profile changes successfully updated in Supabase database.");
      setTimeout(() => setSaved(false), 4000);
    }
  };

  // Chronic Conditions Handlers
  const handleAddCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConditionName.trim()) return;

    const newItem: ChronicCondition = {
      id: `cc-${Date.now()}`,
      condition: newConditionName.trim(),
      diagnosedYear: newConditionYear.trim() || undefined,
      notes: newConditionNotes.trim() || undefined,
    };

    const updated = [...chronicConditions, newItem];
    setChronicConditions(updated);
    setNewConditionName("");
    setNewConditionNotes("");
    setShowAddCondition(false);

    await updateProfile({ chronicConditions: updated });
    showNotification(`Added condition "${newItem.condition}" to database.`);
  };

  const handleDeleteCondition = async (id: string) => {
    const itemToDelete = chronicConditions.find((c) => c.id === id);
    const updated = chronicConditions.filter((c) => c.id !== id);
    setChronicConditions(updated);

    await updateProfile({ chronicConditions: updated });
    showNotification(`Removed condition "${itemToDelete?.condition || ''}" from database.`);
  };

  // Allergies Handlers
  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergenName.trim()) return;

    const newItem: DrugAllergy = {
      id: `al-${Date.now()}`,
      allergen: newAllergenName.trim(),
      severity: newAllergySeverity,
      reaction: newAllergyReaction.trim() || undefined,
      reportedYear: new Date().getFullYear().toString(),
    };

    const updated = [...allergies, newItem];
    setAllergies(updated);
    setNewAllergenName("");
    setNewAllergyReaction("");
    setShowAddAllergy(false);

    await updateProfile({ allergies: updated });
    showNotification(`Added allergy alert for "${newItem.allergen}" to database.`);
  };

  const handleDeleteAllergy = async (id: string) => {
    const itemToDelete = allergies.find((a) => a.id === id);
    const updated = allergies.filter((a) => a.id !== id);
    setAllergies(updated);

    await updateProfile({ allergies: updated });
    showNotification(`Removed allergy "${itemToDelete?.allergen || ''}" from database.`);
  };

  // Dependents Handlers
  const handleAddDependent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDepName.trim()) return;

    const newItem: FamilyDependent = {
      id: `dep-${Date.now()}`,
      fullName: newDepName.trim(),
      relation: newDepRelation,
      age: newDepAge.trim() || undefined,
      gender: newDepGender,
      phone: newDepPhone.trim() || undefined,
      patientUhid: `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    const updated = [...dependents, newItem];
    setDependents(updated);
    setNewDepName("");
    setNewDepAge("");
    setNewDepPhone("");
    setShowAddDependent(false);

    await updateProfile({ dependents: updated });
    showNotification(`Linked dependent "${newItem.fullName}" to your family registry.`);
  };

  const handleDeleteDependent = async (id: string) => {
    const itemToDelete = dependents.find((d) => d.id === id);
    const updated = dependents.filter((d) => d.id !== id);
    setDependents(updated);

    await updateProfile({ dependents: updated });
    showNotification(`Unlinked dependent "${itemToDelete?.fullName || ''}" from database.`);
  };

  const patientId = user?.patientUhid || "PAT-224052";
  const userInitials = (fullName || "Bikash Kumar Choudhury")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title & Top Save Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Patient Profile</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Patient Profile &amp; Clinical Health Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Manage your personal demographics, diagnosed chronic conditions, medication allergies, and linked family dependents synced directly with the national database.
          </p>
        </div>

        {/* Top action button (Only Save Changes - Download Patient Card removed) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving to Database..." : saved ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Database Feedback Toast */}
      {(saved || toastMessage) && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage || "Profile details successfully updated in Supabase database."}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setToastMessage(null);
            }}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Full-Width Stack */}
      <div className="space-y-6 w-full">
        {/* 1. DEMOGRAPHIC DETAILS - Full Width & Increased Width */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Demographic Details
              </h3>
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Synced with Supabase Patient Registry
              </span>
            </div>

            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="text-xs text-teal-800 font-bold hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editMode ? "Cancel Editing" : "Edit Details"}</span>
            </button>
          </div>

          {/* Profile identity badge - Spacious Full Width */}
          <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white font-black text-lg flex items-center justify-center relative shadow-sm">
                {userInitials}
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white">
                  ✓
                </span>
              </div>
              <div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900">
                  {fullName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Patient ID: <strong className="font-mono text-slate-800">{patientId}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                Database Verified
              </span>
            </div>
          </div>

          {/* Form Fields Grid - 3 Columns on Large Screens for Wide Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!editMode}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700 disabled:opacity-90 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Date of Birth &amp; Age</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={!editMode}
                  className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold disabled:opacity-90 transition-colors"
                />
                <input
                  type="text"
                  value={`${age} Yrs`}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                  disabled={!editMode}
                  className="w-24 h-11 px-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-center disabled:opacity-90"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Gender</label>
              <select
                value={gender.toLowerCase()}
                onChange={(e) => setGender(e.target.value)}
                disabled={!editMode}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 disabled:opacity-90 cursor-pointer"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Primary Mobile</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!editMode}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold pr-20 disabled:opacity-90"
                />
                <span className="absolute right-2.5 top-2.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Verified
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full h-11 px-3.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-700 font-bold">Blood Group</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                disabled={!editMode}
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold disabled:opacity-90"
              />
            </div>
          </div>

          {/* Permanent Address - Spans Full Width */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            <label className="text-slate-700 font-bold">Residential Address</label>
            {editMode ? (
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, District, State - PIN"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 transition-colors"
              />
            ) : (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium leading-relaxed">
                {address}
              </div>
            )}
          </div>
        </div>

        {/* 1.5 ORGANISATION & INSTITUTIONAL AFFILIATION */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <span>Organisation &amp; Institutional Affiliation</span>
              </h3>
              <span className="text-xs text-slate-500">
                Official occupational or campus health registry affiliation verified against organisation records.
              </span>
            </div>
            {organizationAffiliation?.isOrganizationVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Affiliation</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Self-Declared Affiliation</span>
              </span>
            )}
          </div>

          {organizationAffiliation ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Org Name */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Empanelled Organisation
                </span>
                <div className="font-extrabold text-slate-900 text-sm">
                  {organizationAffiliation.organizationName || "Affiliated Organisation"}
                </div>
                {organizationAffiliation.organizationCode ? (
                  <div className="text-[11px] font-mono font-bold text-teal-800">
                    {organizationAffiliation.organizationCode}
                  </div>
                ) : null}
              </div>

              {/* Member ID */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Employee / Student ID
                </span>
                <div className="font-mono font-black text-slate-900 text-base">
                  {organizationAffiliation.memberId || "N/A"}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {organizationAffiliation.category || "Member"}
                </span>
              </div>

              {/* Department */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Department / Division
                </span>
                <div className="font-bold text-slate-800 text-sm">
                  {organizationAffiliation.department || "General"}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Occupational Health Registry
                </span>
              </div>

              {/* Uploaded ID Card Card */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Organisation ID Card
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <FileBadge className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">
                        ID Document
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold block">
                        Verified &bull; On Record
                      </span>
                    </div>
                  </div>
                </div>

                {organizationAffiliation.idCardUrl ? (
                  <button
                    type="button"
                    onClick={() => setShowIdCardModal(true)}
                    className="w-full py-1.5 px-2 bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 hover:border-teal-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    <span>View ID Card</span>
                  </button>
                ) : (
                  <div className="py-1.5 px-2 bg-slate-100 text-slate-400 rounded-xl text-[11px] font-medium text-center">
                    No Document Uploaded
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                No organisation or corporate affiliation currently linked to your profile.
              </p>
            </div>
          )}
        </div>

        {/* 2. MEDICAL BACKGROUND & HEALTH PROFILE (Fully Dynamic) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-700" />
                <span>Medical Background &amp; Health Profile</span>
              </h3>
              <span className="text-xs text-slate-500">
                Directly factored into clinical triage safety scoring. Connected to database.
              </span>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200 self-start sm:self-auto">
              Live Clinical Registry
            </span>
          </div>

          {/* DYNAMIC SECTION A: Diagnosed Chronic Conditions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Diagnosed Chronic Conditions
                </span>
                <span className="text-[11px] text-slate-500">
                  {chronicConditions.length} active chronic condition(s) recorded in Supabase
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCondition(!showAddCondition)}
                className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Condition</span>
              </button>
            </div>

            {/* Inline Form to Add Chronic Condition */}
            {showAddCondition && (
              <form
                onSubmit={handleAddCondition}
                className="p-4 sm:p-5 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
                    Add New Chronic Condition
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCondition(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Condition Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Type-2 Diabetes, Hypertension, Asthma"
                      value={newConditionName}
                      onChange={(e) => setNewConditionName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Diagnosed Year
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2019"
                      value={newConditionYear}
                      onChange={(e) => setNewConditionYear(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Management Notes / Clinical Status (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Stage-1, Daily medication at PHC"
                    value={newConditionNotes}
                    onChange={(e) => setNewConditionNotes(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-teal-700"
                  />
                </div>

                {/* Quick suggestion pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Quick add:</span>
                  {["Diabetes Mellitus", "Hypertension", "Asthma", "Thyroid Disorder", "Arthritis"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewConditionName(name)}
                      className="px-2 py-0.5 bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCondition(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Condition to Database
                  </button>
                </div>
              </form>
            )}

            {/* Dynamic Conditions List */}
            {chronicConditions.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No chronic conditions recorded. Click &quot;Add Condition&quot; if you have ongoing health conditions.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {chronicConditions.map((cond) => (
                  <div
                    key={cond.id}
                    className="p-3.5 bg-teal-50/80 border border-teal-200 text-teal-950 rounded-2xl flex items-start justify-between gap-2.5 shadow-2xs group hover:border-teal-300 transition-colors"
                  >
                    <div>
                      <span className="font-extrabold block text-slate-900">{cond.condition}</span>
                      {(cond.diagnosedYear || cond.notes) && (
                        <span className="text-[11px] text-teal-800/80 block mt-0.5">
                          {cond.diagnosedYear && `Diagnosed ${cond.diagnosedYear}`}
                          {cond.diagnosedYear && cond.notes && " • "}
                          {cond.notes}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCondition(cond.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer shrink-0"
                      title="Delete condition from database"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DYNAMIC SECTION B: Known Drug Allergies & Sensitivities */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Known Drug Allergies &amp; Sensitivities
                </span>
                <span className="text-[11px] text-slate-500">
                  {allergies.length} medication allergy flag(s) active
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddAllergy(!showAddAllergy)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Allergy</span>
              </button>
            </div>

            {/* Inline Form to Add Drug Allergy */}
            {showAddAllergy && (
              <form
                onSubmit={handleAddAllergy}
                className="p-4 sm:p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
                    Add Known Drug Allergy Alert
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddAllergy(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Medication / Allergen Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Penicillin, Sulfa, Aspirin, Ibuprofen"
                      value={newAllergenName}
                      onChange={(e) => setNewAllergenName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-rose-700"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Severity Level
                    </label>
                    <select
                      value={newAllergySeverity}
                      onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-rose-700 cursor-pointer"
                    >
                      <option value="Severe">Severe Alert</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Mild">Mild</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-xs">
                    Allergic Symptoms &amp; Reactions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Facial swelling, breathing difficulty, severe rash, hives"
                    value={newAllergyReaction}
                    onChange={(e) => setNewAllergyReaction(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-rose-700"
                  />
                </div>

                {/* Quick suggestion pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold">Common:</span>
                  {["Penicillin", "Sulfa Antibiotics", "Aspirin", "Ibuprofen", "Paracetamol", "Codeine"].map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewAllergenName(name)}
                      className="px-2 py-0.5 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      {name}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddAllergy(false)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Save Allergy to Database
                  </button>
                </div>
              </form>
            )}

            {/* Dynamic Allergies List */}
            {allergies.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                No known drug allergies reported. Click &quot;Add Allergy&quot; if you have adverse reactions to specific medications.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className={`p-3.5 rounded-2xl border space-y-1.5 relative group ${
                      allergy.severity === "Severe"
                        ? "bg-rose-50/70 border-rose-200"
                        : allergy.severity === "Moderate"
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            allergy.severity === "Severe"
                              ? "text-rose-600"
                              : allergy.severity === "Moderate"
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        />
                        <span>{allergy.allergen}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            allergy.severity === "Severe"
                              ? "bg-rose-100 text-rose-800"
                              : allergy.severity === "Moderate"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {allergy.severity} Alert
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAllergy(allergy.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                          title="Delete allergy from database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {allergy.reaction && (
                      <p className="text-[11px] text-slate-700 leading-snug">
                        {allergy.reaction}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 pt-0.5">
                      {allergy.reportedYear ? `Recorded: ${allergy.reportedYear}` : "Doctor Verified"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Cross-check banner */}
          <div className="p-3.5 bg-teal-50/60 rounded-2xl border border-teal-200/90 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <span>
              <strong>TriageAssist Clinical Cross-Check Active:</strong> Your {chronicConditions.length} chronic condition(s) and {allergies.length} medication allergy alert(s) are automatically linked to AI triage preliminary assessments, warning clinicians before dispensing medications.
            </span>
          </div>
        </div>

        {/* 3. FAMILY & DEPENDENTS - Placed at the Bottom & Full Width */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-teal-700" />
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Family &amp; Dependents
                </h3>
                <span className="text-xs text-slate-500">
                  Link family members to manage appointments, triage histories, and clinical records under your unified account.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
                {dependents.length + 1} Total Members
              </span>
              {!showAddDependent && (
                <button
                  type="button"
                  onClick={() => setShowAddDependent(true)}
                  className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Link Family Dependent</span>
                </button>
              )}
            </div>
          </div>

          {/* Inline Form to Add Family Dependent */}
          {showAddDependent && (
            <form
              onSubmit={handleAddDependent}
              className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Link Family Member
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddDependent(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div className="lg:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kamla Devi, Rohit Choudhury"
                    value={newDepName}
                    onChange={(e) => setNewDepName(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Relation *
                  </label>
                  <select
                    value={newDepRelation}
                    onChange={(e) => setNewDepRelation(e.target.value)}
                    className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other Dependent</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={newDepAge}
                    onChange={(e) => setNewDepAge(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Gender
                  </label>
                  <select
                    value={newDepGender}
                    onChange={(e) => setNewDepGender(e.target.value)}
                    className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-5">
                  <label className="font-bold text-slate-700 block mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={newDepPhone}
                    onChange={(e) => setNewDepPhone(e.target.value)}
                    className="w-full sm:w-80 h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddDependent(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Link Dependent to Database
                </button>
              </div>
            </form>
          )}

          {/* Grid of Family Members (Primary Self + Linked Dependents) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            {/* Primary Account (Self) */}
            <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {fullName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {age}Y &bull; {gender} &bull; {patientId}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                Primary Self
              </span>
            </div>

            {/* Linked Dependents */}
            {dependents.map((dep) => (
              <div
                key={dep.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                    {dep.fullName
                      .trim()
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{dep.fullName}</span>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                        {dep.relation}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {dep.age && `${dep.age}Y`}
                      {dep.age && dep.gender && " • "}
                      {dep.gender}
                      {dep.patientUhid && ` • ${dep.patientUhid}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteDependent(dep.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                  title="Unlink dependent from database"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Empty state notice if no dependents */}
          {dependents.length === 0 && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
              No family dependents linked yet. Click &quot;Link Family Dependent&quot; above to add family members to your health registry.
            </div>
          )}
        </div>
      </div>

      {/* Organisation ID Card Zoom Modal */}
      {showIdCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Organisation ID Document
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {organizationAffiliation?.organizationName || "Affiliated Organisation"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIdCardModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-3/2 flex items-center justify-center">
              {organizationAffiliation?.idCardUrl ? (
                <img
                  src={organizationAffiliation.idCardUrl}
                  alt="Organisation ID Card"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-slate-400 text-xs font-medium">No ID card uploaded</span>
              )}
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[10px] block">Member ID:</span>
                <span className="font-mono font-bold text-teal-900">
                  {organizationAffiliation?.memberId || "N/A"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">Status:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Member</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIdCardModal(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
