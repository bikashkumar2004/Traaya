"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  REGISTERED_ORGANIZATIONS,
  getStoredOrganizationPatients,
  saveOrganizationPatient,
  OrganizationPatient,
} from "@/lib/organization-data";
import { CheckCircle2 } from "lucide-react";
import {
  OrganizationHeader,
  OrganizationBanner,
  OrganizationStats,
  OrganizationBloodBank,
  OrganizationPatientsTable,
  OrganizationIdCardModal,
  OrganizationDossierModal,
  OrganizationAddMemberModal,
} from "@/components/organization";

export default function OrganizationPortalPage() {
  const { user, signOut } = useAuth();

  // Active organization: strictly isolated to the logged-in organization
  const [selectedOrgId, setSelectedOrgId] = useState<string>("org-nalco");

  useEffect(() => {
    // 1. If user has organizationId in metadata, lock to it
    if (user?.metadata?.organizationId && REGISTERED_ORGANIZATIONS.some((o) => o.id === user.metadata?.organizationId)) {
      setSelectedOrgId(user.metadata.organizationId);
      return;
    }
    // 2. Check session/local storage for registered organization
    if (typeof window !== "undefined") {
      const storedOrgId = localStorage.getItem("triage_org_id") || sessionStorage.getItem("triage_org_id");
      if (storedOrgId && REGISTERED_ORGANIZATIONS.some((o) => o.id === storedOrgId)) {
        setSelectedOrgId(storedOrgId);
        return;
      }
    }
    // 3. Match from user's facilityName if applicable
    if (user?.facilityName) {
      const match = REGISTERED_ORGANIZATIONS.find(
        (o) =>
          user.facilityName?.toLowerCase().includes(o.name.toLowerCase()) ||
          o.name.toLowerCase().includes(user.facilityName?.toLowerCase() || "") ||
          user.facilityName?.toLowerCase().includes(o.code.toLowerCase())
      );
      if (match) {
        setSelectedOrgId(match.id);
      }
    }
  }, [user]);

  const selectedOrg =
    REGISTERED_ORGANIZATIONS.find((o) => o.id === selectedOrgId) ||
    REGISTERED_ORGANIZATIONS[0];

  // All patients for all organizations
  const [allPatients, setAllPatients] = useState<OrganizationPatient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>("All");
  const [filterDepartment, setFilterDepartment] = useState<string>("All");

  // Modals and feedback
  const [selectedPatientForDossier, setSelectedPatientForDossier] =
    useState<OrganizationPatient | null>(null);
  const [selectedPatientForIdCard, setSelectedPatientForIdCard] =
    useState<OrganizationPatient | null>(null);
  const [showAddPatientModal, setShowAddPatientModal] = useState<boolean>(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // New Patient Form state for manual quick enrollment
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState<number | string>("");
  const [newPatientGender, setNewPatientGender] = useState("Male");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState("O+");
  const [newPatientMemberId, setNewPatientMemberId] = useState("");
  const [newPatientDepartment, setNewPatientDepartment] = useState("Operations");
  const [newPatientCategory, setNewPatientCategory] = useState<"Employee" | "Student">("Employee");
  const [newPatientAddress, setNewPatientAddress] = useState("");
  const [newPatientSymptoms, setNewPatientSymptoms] = useState("Routine Checkup / None");
  const [newPatientIdCardPreview, setNewPatientIdCardPreview] = useState("");
  const [newPatientIdCardFileName, setNewPatientIdCardFileName] = useState("");

  // Load stored patients on mount and update whenever storage changes
  useEffect(() => {
    const loaded = getStoredOrganizationPatients();
    setAllPatients(loaded);
  }, []);

  // Filter patients by the selected organization
  const orgPatients = allPatients.filter(
    (p) => p.organizationId === selectedOrg.id
  );

  // Filtered patients based on search and filters
  const filteredPatients = orgPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientUhid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.latestSymptoms && p.latestSymptoms.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesPriority =
      filterPriority === "All" ||
      p.triagePriority.toLowerCase().includes(filterPriority.toLowerCase());

    const matchesBloodGroup =
      filterBloodGroup === "All" || p.bloodGroup === filterBloodGroup;

    const matchesDepartment =
      filterDepartment === "All" || p.department === filterDepartment;

    return matchesSearch && matchesPriority && matchesBloodGroup && matchesDepartment;
  });

  // Calculate Organization Dashboard Metrics
  const totalCount = orgPatients.length;
  const redCount = orgPatients.filter((p) =>
    p.triagePriority.includes("Immediate")
  ).length;
  const yellowCount = orgPatients.filter((p) =>
    p.triagePriority.includes("Urgent")
  ).length;
  const greenCount = orgPatients.filter(
    (p) =>
      p.triagePriority.includes("Less Urgent") ||
      p.triagePriority.includes("Routine")
  ).length;
  const verifiedIdCount = orgPatients.filter((p) => p.idCardVerified).length;

  // Distinct departments for filter dropdown
  const departmentOptions = Array.from(
    new Set(orgPatients.map((p) => p.department).filter(Boolean))
  );

  // Blood group breakdown counts for this organization
  const bloodGroupsList = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];
  const bloodGroupCounts: Record<string, number> = {};
  bloodGroupsList.forEach((bg) => {
    bloodGroupCounts[bg] = orgPatients.filter((p) => p.bloodGroup === bg).length;
  });

  // Handle Quick Member Add
  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientMemberId.trim()) {
      return;
    }

    const newUhId = `PAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newEntry: OrganizationPatient = {
      id: `OP-${Date.now()}`,
      patientUhid: newUhId,
      name: newPatientName.trim(),
      age: Number(newPatientAge) || 30,
      gender: newPatientGender,
      phone: newPatientPhone.trim() || "+91 94371 00000",
      bloodGroup: newPatientBloodGroup,
      address: newPatientAddress.trim() || `${selectedOrg.location}, ${selectedOrg.district}`,
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
      memberId: newPatientMemberId.trim(),
      department: newPatientDepartment.trim(),
      category: newPatientCategory,
      idCardUrl:
        newPatientIdCardPreview ||
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60",
      idCardVerified: true,
      latestVitals: { bp: "120/80", pulse: 76, spo2: 98, temp: "98.6°F" },
      latestSymptoms: newPatientSymptoms.trim()
        ? newPatientSymptoms.split(",").map((s) => s.trim()).filter(Boolean)
        : ["Routine Checkup / None"],
      triagePriority: "Routine / Fit",
      lastScreened: "Just now (Enrolled by Admin)",
      healthNotes: `Enrolled by ${selectedOrg.name} Occupational Medical Desk. Blood Group: ${newPatientBloodGroup}. Member ID: ${newPatientMemberId}. ID Card verified.`,
    };

    saveOrganizationPatient(newEntry);
    setAllPatients((prev) => [newEntry, ...prev]);
    setShowAddPatientModal(false);

    // Reset inputs
    setNewPatientName("");
    setNewPatientAge("");
    setNewPatientMemberId("");
    setNewPatientCategory("Employee");
    setNewPatientPhone("");
    setNewPatientAddress("");
    setNewPatientIdCardFileName("");
    setNewPatientIdCardPreview("");

    setNotificationToast(`Patient ${newEntry.name} enrolled under ${selectedOrg.name}.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  const cleanPriorityText = (priority: string) => {
    return (priority || "")
      .replace(/\s*\(Red\)/gi, "")
      .replace(/\s*\(Yellow\)/gi, "")
      .replace(/\s*\(Green\)/gi, "")
      .trim();
  };

  const getPriorityBadgeClass = (priority: string) => {
    const norm = (priority || "").toLowerCase();
    if (norm.includes("immediate") || norm.includes("red")) {
      return "bg-rose-50 text-rose-800 border-rose-300";
    }
    if (norm.includes("urgent") || norm.includes("yellow")) {
      return "bg-amber-50 text-amber-800 border-amber-300";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-300";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans pb-16">
      {/* Top Navbar */}
      <OrganizationHeader selectedOrg={selectedOrg} onSignOut={signOut} />

      {/* Main Single Dashboard Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Toast */}
        {notificationToast && (
          <div className="fixed top-20 right-6 z-50 bg-teal-950 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-teal-700 animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{notificationToast}</span>
          </div>
        )}

        {/* Organisation Profile & Clinical Gateway Banner */}
        <OrganizationBanner
          selectedOrg={selectedOrg}
          onOpenAddModal={() => setShowAddPatientModal(true)}
          onExportDossier={() => {
            setNotificationToast(`Occupational health roster for ${selectedOrg.name} exported.`);
            setTimeout(() => setNotificationToast(null), 3500);
          }}
        />

        {/* Metric Telemetry KPI Cards */}
        <OrganizationStats
          totalCount={totalCount}
          redCount={redCount}
          yellowCount={yellowCount}
          greenCount={greenCount}
          verifiedIdCount={verifiedIdCount}
          orgName={selectedOrg.name}
        />

        {/* Emergency Blood Group Bank & Donor Matrix */}
        <OrganizationBloodBank
          bloodGroupsList={bloodGroupsList}
          bloodGroupCounts={bloodGroupCounts}
          filterBloodGroup={filterBloodGroup}
          setFilterBloodGroup={setFilterBloodGroup}
        />

        {/* Member Directory & Health Telemetry Table */}
        <OrganizationPatientsTable
          orgName={selectedOrg.name}
          filteredPatients={filteredPatients}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterBloodGroup={filterBloodGroup}
          setFilterBloodGroup={setFilterBloodGroup}
          filterDepartment={filterDepartment}
          setFilterDepartment={setFilterDepartment}
          bloodGroupsList={bloodGroupsList}
          departmentOptions={departmentOptions}
          cleanPriorityText={cleanPriorityText}
          getPriorityBadgeClass={getPriorityBadgeClass}
          onViewIdCard={(patient) => setSelectedPatientForIdCard(patient)}
          onViewDossier={(patient) => setSelectedPatientForDossier(patient)}
        />
      </main>

      {/* Modal 1: View Uploaded Organisation ID Card */}
      <OrganizationIdCardModal
        patient={selectedPatientForIdCard}
        onClose={() => setSelectedPatientForIdCard(null)}
      />

      {/* Modal 2: Complete Patient Health Dossier */}
      <OrganizationDossierModal
        patient={selectedPatientForDossier}
        onClose={() => setSelectedPatientForDossier(null)}
        onFastTrackReferral={(patient) => {
          setNotificationToast(`Doctor referral slip generated for ${patient.name} to CHC Khandapada.`);
          setSelectedPatientForDossier(null);
          setTimeout(() => setNotificationToast(null), 3500);
        }}
        cleanPriorityText={cleanPriorityText}
        getPriorityBadgeClass={getPriorityBadgeClass}
      />

      {/* Modal 3: Enroll New Patient Under Organisation */}
      <OrganizationAddMemberModal
        showModal={showAddPatientModal}
        onClose={() => setShowAddPatientModal(false)}
        selectedOrgName={selectedOrg.name}
        bloodGroupsList={bloodGroupsList}
        newPatientCategory={newPatientCategory}
        setNewPatientCategory={setNewPatientCategory}
        newPatientName={newPatientName}
        setNewPatientName={setNewPatientName}
        newPatientAge={newPatientAge}
        setNewPatientAge={setNewPatientAge}
        newPatientGender={newPatientGender}
        setNewPatientGender={setNewPatientGender}
        newPatientBloodGroup={newPatientBloodGroup}
        setNewPatientBloodGroup={setNewPatientBloodGroup}
        newPatientMemberId={newPatientMemberId}
        setNewPatientMemberId={setNewPatientMemberId}
        newPatientDepartment={newPatientDepartment}
        setNewPatientDepartment={setNewPatientDepartment}
        newPatientPhone={newPatientPhone}
        setNewPatientPhone={setNewPatientPhone}
        newPatientAddress={newPatientAddress}
        setNewPatientAddress={setNewPatientAddress}
        newPatientSymptoms={newPatientSymptoms}
        setNewPatientSymptoms={setNewPatientSymptoms}
        newPatientIdCardFileName={newPatientIdCardFileName}
        setNewPatientIdCardFileName={setNewPatientIdCardFileName}
        newPatientIdCardPreview={newPatientIdCardPreview}
        setNewPatientIdCardPreview={setNewPatientIdCardPreview}
        onSubmit={handleAddNewMember}
      />
    </div>
  );
}
