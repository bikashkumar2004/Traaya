"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth, ChronicCondition, DrugAllergy, FamilyDependent } from "@/lib/auth-context";
import {
  PatientDemographicsCard,
  PatientOrganizationAffiliationCard,
  PatientMedicalProfileCard,
  PatientDependentsCard,
  PatientOrgIdCardModal,
  OrganizationAffiliationData,
} from "@/components/patient/profile";
import {
  REGISTERED_ORGANIZATIONS,
  saveOrganizationPatient,
} from "@/lib/organization-data";

export default function PatientProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saved, setSaved] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states initialized with live user data
  const [fullName, setFullName] = useState<string>(user?.fullName || "");
  const [phone, setPhone] = useState<string>(user?.phone || "");
  const [email, setEmail] = useState<string>(user?.email || "");
  const [dob, setDob] = useState<string>(user?.dateOfBirth || "");
  const [age, setAge] = useState<number | string>(user?.age || "");
  const [gender, setGender] = useState<string>(user?.gender || "");
  const [bloodGroup, setBloodGroup] = useState<string>(user?.bloodGroup || "");

  const [addressLine1, setAddressLine1] = useState<string>(user?.addressLine1 || "");
  const [state, setState] = useState<string>(user?.state || "");
  const [district, setDistrict] = useState<string>(user?.district || "");
  const [block, setBlock] = useState<string>(user?.block || "");
  const [city, setCity] = useState<string>(user?.city || "");
  const [postalCode, setPostalCode] = useState<string>(user?.postalCode || "");

  // Dynamic lists connected to database
  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>(user?.chronicConditions || []);
  const [allergies, setAllergies] = useState<DrugAllergy[]>(user?.allergies || []);
  const [dependents, setDependents] = useState<FamilyDependent[]>(user?.dependents || []);

  // Organization Affiliation State
  const [organizationAffiliation, setOrganizationAffiliation] = useState<OrganizationAffiliationData | null>(null);
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

  const resetDemographicsFromUser = useCallback(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setPhone(user.phone || "");
    setEmail(user.email || "");
    setDob(user.dateOfBirth || "");
    setAge(user.age || "");
    setGender(user.gender || "");
    setBloodGroup(user.bloodGroup || "");

    let a1 = user.addressLine1 || "";
    let b = user.block || "";
    let c = user.city || "";
    let d = user.district || "";
    let s = user.state || "";
    let p = user.postalCode || "";

    if (a1 && (!b || !c || !d || !s || !p) && a1.includes(",")) {
      const parts = a1.split(",").map((x: string) => x.trim());
      if (parts.length >= 4) {
        a1 = parts[0];
        if (!c) c = parts[1];
        if (!b) b = parts[1];
        if (!d) d = parts[2];
        const tail = parts.slice(3).join(", ");
        if (tail.includes("-")) {
          const [st, pin] = tail.split("-").map((x: string) => x.trim());
          if (!s) s = st;
          if (!p) p = pin;
        } else if (!s) {
          s = tail;
        }
      }
    }
    setAddressLine1(a1);
    setBlock(b);
    setCity(c);
    setDistrict(d);
    setState(s);
    setPostalCode(p);
  }, [user]);

  const handleCancelEdit = () => {
    resetDemographicsFromUser();
    setEditMode(false);
  };

  useEffect(() => {
    if (user) {
      resetDemographicsFromUser();
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
  }, [user, resetDemographicsFromUser]);

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
      addressLine1,
      block,
      city,
      district,
      state,
      postalCode,
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

  // Save Organization Affiliation
  const handleSaveAffiliation = async (data: OrganizationAffiliationData) => {
    setSaving(true);
    const selectedOrg =
      REGISTERED_ORGANIZATIONS.find((o) => o.id === data.organizationId) ||
      REGISTERED_ORGANIZATIONS[0];

    const orgMetadata = {
      ...(user?.metadata || {}),
      isFromOrganization: true,
      organizationId: data.organizationId || selectedOrg.id,
      organizationName: data.organizationName || selectedOrg.name,
      organizationCode: data.organizationCode || selectedOrg.code,
      memberId: data.memberId || "",
      department: data.department || "Operations",
      category: data.category || "Employee",
      isOrganizationVerified: Boolean(data.isOrganizationVerified),
      idCardUrl: data.idCardUrl || "",
    };

    const success = await updateProfile({
      isAffilatedToOrg: true,
      organizationName: selectedOrg.name,
      idInOrg: data.memberId,
      orgIdCard: data.idCardUrl,
      metadata: orgMetadata,
    });

    if (success) {
      setOrganizationAffiliation({
        organizationId: data.organizationId || selectedOrg.id,
        organizationName: data.organizationName || selectedOrg.name,
        organizationCode: data.organizationCode || selectedOrg.code,
        memberId: data.memberId,
        department: data.department || "Operations",
        category: data.category || "Employee",
        isOrganizationVerified: Boolean(data.isOrganizationVerified),
        idCardUrl: data.idCardUrl,
      });

      try {
        saveOrganizationPatient({
          id: `OP-${Date.now()}`,
          patientUhid: patientId,
          name: fullName || user?.fullName || "Patient",
          age: Number(age) || 25,
          gender: gender === "male" || gender === "Male" ? "Male" : gender === "female" || gender === "Female" ? "Female" : "Others",
          phone: phone || user?.phone || "",
          email: email || user?.email || "",
          bloodGroup: bloodGroup || "B+",
          address: `${addressLine1 || ""}, ${city || ""}, ${district || ""}, ${state || ""}`.trim(),
          organizationId: selectedOrg.id,
          organizationName: selectedOrg.name,
          memberId: data.memberId || "",
          department: data.department || "Operations",
          category: (data.category as any) || "Employee",
          idCardUrl: data.idCardUrl || "",
          idCardVerified: Boolean(data.isOrganizationVerified),
          latestVitals: { bp: "120/80", pulse: 76, spo2: 98, temp: "98.6°F" },
          latestSymptoms: ["Routine Checkup"],
          triagePriority: "Routine / Fit",
          lastScreened: new Date().toISOString().split("T")[0],
          healthNotes: "Affiliated via citizen profile portal.",
        });
      } catch (err) {
        console.warn("Could not save to organization roster:", err);
      }

      showNotification(`Successfully linked affiliation with ${selectedOrg.name}!`);
    } else {
      showNotification("Could not save affiliation. Please check connection and try again.");
    }
    setSaving(false);
  };

  const handleRemoveAffiliation = async () => {
    if (!confirm("Are you sure you want to remove your organization affiliation?")) return;
    setSaving(true);
    const newMetadata = { ...(user?.metadata || {}) };
    delete newMetadata.organizationId;
    delete newMetadata.organizationName;
    delete newMetadata.organizationCode;
    delete newMetadata.memberId;
    delete newMetadata.department;
    delete newMetadata.category;
    delete newMetadata.isOrganizationVerified;
    delete newMetadata.idCardUrl;
    newMetadata.isFromOrganization = false;

    const success = await updateProfile({
      isAffilatedToOrg: false,
      organizationName: undefined,
      idInOrg: undefined,
      orgIdCard: undefined,
      metadata: newMetadata,
    });

    if (success) {
      setOrganizationAffiliation(null);
      showNotification("Organization affiliation removed from your profile.");
    }
    setSaving(false);
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

  const patientId = user?.patientUhid || user?.userId || "";
  const userInitials = (fullName || user?.fullName || "PT")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Citizen Profile &amp; Clinical Health Records
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Manage your personal demographics, diagnosed chronic conditions, medication allergies, and linked family dependents synced directly with the national database.
        </p>
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
        {/* 1. DEMOGRAPHIC DETAILS */}
        <PatientDemographicsCard
          userInitials={userInitials}
          patientId={patientId}
          fullName={fullName}
          setFullName={setFullName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          dob={dob}
          setDob={setDob}
          age={age}
          setAge={setAge}
          gender={gender}
          setGender={setGender}
          bloodGroup={bloodGroup}
          setBloodGroup={setBloodGroup}
          addressLine1={addressLine1}
          setAddressLine1={setAddressLine1}
          state={state}
          setState={setState}
          district={district}
          setDistrict={setDistrict}
          block={block}
          setBlock={setBlock}
          city={city}
          setCity={setCity}
          postalCode={postalCode}
          setPostalCode={setPostalCode}
          editMode={editMode}
          setEditMode={setEditMode}
          onSave={handleSaveChanges}
          onCancel={handleCancelEdit}
          saving={saving}
        />

        {/* 1.5 ORGANISATION & INSTITUTIONAL AFFILIATION */}
        <PatientOrganizationAffiliationCard
          organizationAffiliation={organizationAffiliation}
          onViewIdCard={() => setShowIdCardModal(true)}
          onSaveAffiliation={handleSaveAffiliation}
          onRemoveAffiliation={handleRemoveAffiliation}
          patientUhid={patientId}
        />

        {/* 2. MEDICAL BACKGROUND & HEALTH PROFILE */}
        <PatientMedicalProfileCard
          chronicConditions={chronicConditions}
          showAddCondition={showAddCondition}
          setShowAddCondition={setShowAddCondition}
          newConditionName={newConditionName}
          setNewConditionName={setNewConditionName}
          newConditionYear={newConditionYear}
          setNewConditionYear={setNewConditionYear}
          newConditionNotes={newConditionNotes}
          setNewConditionNotes={setNewConditionNotes}
          onAddCondition={handleAddCondition}
          onDeleteCondition={handleDeleteCondition}
          allergies={allergies}
          showAddAllergy={showAddAllergy}
          setShowAddAllergy={setShowAddAllergy}
          newAllergenName={newAllergenName}
          setNewAllergenName={setNewAllergenName}
          newAllergySeverity={newAllergySeverity}
          setNewAllergySeverity={setNewAllergySeverity}
          newAllergyReaction={newAllergyReaction}
          setNewAllergyReaction={setNewAllergyReaction}
          onAddAllergy={handleAddAllergy}
          onDeleteAllergy={handleDeleteAllergy}
        />

        {/* 3. FAMILY & DEPENDENTS */}
        <PatientDependentsCard
          dependents={dependents}
          userInitials={userInitials}
          fullName={fullName}
          age={age}
          gender={gender}
          patientId={patientId}
          showAddDependent={showAddDependent}
          setShowAddDependent={setShowAddDependent}
          newDepName={newDepName}
          setNewDepName={setNewDepName}
          newDepRelation={newDepRelation}
          setNewDepRelation={setNewDepRelation}
          newDepAge={newDepAge}
          setNewDepAge={setNewDepAge}
          newDepGender={newDepGender}
          setNewDepGender={setNewDepGender}
          newDepPhone={newDepPhone}
          setNewDepPhone={setNewDepPhone}
          onAddDependent={handleAddDependent}
          onDeleteDependent={handleDeleteDependent}
        />
      </div>

      {/* Organisation ID Card Zoom Modal */}
      <PatientOrgIdCardModal
        isOpen={showIdCardModal}
        onClose={() => setShowIdCardModal(false)}
        organizationAffiliation={organizationAffiliation}
      />
    </div>
  );
}
