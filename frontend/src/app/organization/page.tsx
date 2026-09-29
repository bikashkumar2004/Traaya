"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  REGISTERED_ORGANIZATIONS,
  getStoredOrganizationPatients,
  saveOrganizationPatient,
  OrganizationPatient,
  RegisteredOrganization,
} from "@/lib/organization-data";
import {
  Building2,
  Users,
  Activity,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Calendar,
  PhoneCall,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  Stethoscope,
  LogOut,
  Sparkles,
  Droplet,
  FileBadge,
  Eye,
  Plus,
  X,
  Upload,
  ChevronDown,
  Printer,
  BadgeCheck,
  AlertCircle
} from "lucide-react";

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 ml-2">
                  Organisation Single Dashboard
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Logged-In Organisation Badge (Read-only, strictly secured to this organization) */}
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-teal-700" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Active Organisation</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                </div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span className="truncate max-w-[200px] sm:max-w-xs">{selectedOrg.name}</span>
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0">
                    {selectedOrg.code}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Empanelled Occupational Health &bull; {selectedOrg.type}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                  ORG CODE: {selectedOrg.code}
                </span>
                <span className="text-xs text-slate-500">
                  Location: <strong className="text-slate-700">{selectedOrg.location}, {selectedOrg.district}</strong>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                <span>{selectedOrg.name}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                Single unified dashboard displaying all registered patients, employee health dossiers, blood groups, vital telemetry, and triage status for members affiliated with {selectedOrg.name}.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowAddPatientModal(true)}
                className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4 text-teal-200" />
                <span>+ Add Employee / Student to Roster</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotificationToast(`Occupational health roster for ${selectedOrg.name} exported.`);
                  setTimeout(() => setNotificationToast(null), 3500);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>Export Dossier (CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Telemetry KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block">Total Enrolled Patients</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[11px] text-teal-800 font-extrabold mt-0.5">Under {selectedOrg.name}</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-2xs">
            <span className="text-xs text-rose-800 font-bold block">Immediate</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{redCount}</div>
            <div className="text-[11px] text-rose-600 font-bold mt-0.5">Critical Emergency Triage</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
            <span className="text-xs text-amber-800 font-bold block">Urgent</span>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{yellowCount}</div>
            <div className="text-[11px] text-amber-600 font-bold mt-0.5">Follow-up Required</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
            <span className="text-xs text-emerald-800 font-bold block">Less Urgent / Fit</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{greenCount}</div>
            <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Fit for Regular Duty</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-500 font-bold block">ID Cards Verified</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {totalCount > 0 ? Math.round((verifiedIdCount / totalCount) * 100) : 100}%
            </div>
            <div className="text-[11px] text-teal-700 font-bold mt-0.5">{verifiedIdCount} of {totalCount} verified</div>
          </div>
        </div>

        {/* Emergency Blood Group Bank & Donor Matrix */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Organisation Blood Group Directory &bull; Emergency Donor Bank
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time blood group inventory of enrolled patients for acute emergency matching &amp; trauma readiness.
                </p>
              </div>
            </div>

            {filterBloodGroup !== "All" && (
              <button
                type="button"
                onClick={() => setFilterBloodGroup("All")}
                className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
              >
                Clear Blood Group Filter ({filterBloodGroup})
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {bloodGroupsList.map((bg) => {
              const count = bloodGroupCounts[bg] || 0;
              const isSelected = filterBloodGroup === bg;
              return (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setFilterBloodGroup(isSelected ? "All" : bg)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/30"
                      : "bg-slate-50 hover:bg-rose-50/60 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="text-xs font-black">{bg}</div>
                  <div className={`text-[10px] font-bold ${isSelected ? "text-white/90" : "text-slate-500"}`}>
                    {count} {count === 1 ? "member" : "members"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Member Directory & Health Telemetry Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>All Patient Details ({filteredPatients.length})</span>
                <span className="text-xs font-normal text-slate-500">
                  &bull; Registered under {selectedOrg.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Detailed profile with blood group, uploaded ID card, vital signs telemetry, and triage classification.
              </p>
            </div>

            {/* Search and Filters Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name, UHID, ID, or dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-teal-700"
                />
              </div>

              {/* Priority Filter */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="Immediate">Immediate</option>
                <option value="Urgent">Urgent</option>
                <option value="Less Urgent">Less Urgent / Fit</option>
              </select>

              {/* Blood Group Filter */}
              <select
                value={filterBloodGroup}
                onChange={(e) => setFilterBloodGroup(e.target.value)}
                className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
              >
                <option value="All">All Blood Groups</option>
                {bloodGroupsList.map((bg) => (
                  <option key={bg} value={bg}>
                    Blood Group: {bg}
                  </option>
                ))}
              </select>

              {/* Department Filter */}
              {departmentOptions.length > 0 && (
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Patient Details Table */}
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Patients Found</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No patient records match the selected filter criteria for {selectedOrg.name}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Patient Name &amp; UHID</th>
                    <th className="py-3 px-4">Org Member ID &amp; Dept</th>
                    <th className="py-3 px-4">Blood Group</th>
                    <th className="py-3 px-4">Uploaded ID Card</th>
                    <th className="py-3 px-4">Latest Symptoms</th>
                    <th className="py-3 px-4">Latest Vitals</th>
                    <th className="py-3 px-4">Triage Priority</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredPatients.map((p) => {
                    const isRed = p.triagePriority.includes("Immediate");
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & UHID */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-slate-400 font-normal text-[11px]">
                              ({p.age}y &bull; {p.gender})
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-teal-800">
                            UHID: {p.patientUhid}
                          </div>
                          <div className="text-[10px] text-slate-500">{p.phone}</div>
                        </td>

                        {/* Org Member ID & Department */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800">{p.memberId}</div>
                          <div className="text-[11px] text-slate-600">{p.department}</div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                            {p.category}
                          </span>
                        </td>

                        {/* Blood Group */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                            <Droplet className="w-3 h-3 fill-rose-600 text-rose-600" />
                            <span>{p.bloodGroup}</span>
                          </span>
                        </td>

                        {/* Uploaded ID Card with Thumbnail & Zoom */}
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientForIdCard(p)}
                            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/60 transition-all text-left cursor-pointer group"
                          >
                            <div className="w-10 h-7 rounded bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.idCardUrl ? (
                                <img
                                  src={p.idCardUrl}
                                  alt="ID"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileBadge className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0 pr-1">
                              <span className="text-[11px] font-bold text-teal-900 group-hover:underline flex items-center gap-1">
                                <span>View ID</span>
                                <Eye className="w-3 h-3 text-teal-700" />
                              </span>
                              <span className="text-[9px] text-emerald-700 font-bold block leading-none">
                                Verified
                              </span>
                            </div>
                          </button>
                        </td>

                        {/* Latest Symptoms (Between Uploaded ID Card and Latest Vitals) */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[210px]">
                            {p.latestSymptoms && p.latestSymptoms.length > 0 ? (
                              p.latestSymptoms.map((s, idx) => {
                                const isRoutine =
                                  s.toLowerCase().includes("none") ||
                                  s.toLowerCase().includes("routine") ||
                                  s.toLowerCase().includes("clear") ||
                                  s.toLowerCase().includes("asymptomatic") ||
                                  s.toLowerCase().includes("drill");
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                      isRoutine
                                        ? "bg-slate-50 text-slate-600 border-slate-200"
                                        : "bg-teal-50 text-teal-900 border-teal-200 font-bold"
                                    }`}
                                  >
                                    {s}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">None reported</span>
                            )}
                          </div>
                        </td>

                        {/* Latest Vitals */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            BP: {p.latestVitals.bp} mmHg
                          </div>
                          <div className="text-[10px] text-slate-500">
                            SpO2: <strong className={p.latestVitals.spo2 < 92 ? "text-rose-600" : "text-emerald-700"}>{p.latestVitals.spo2}%</strong> &bull; HR: {p.latestVitals.pulse} bpm
                          </div>
                        </td>

                        {/* Triage Priority */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(
                              p.triagePriority
                            )}`}
                          >
                            {cleanPriorityText(p.triagePriority)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPatientForDossier(p)}
                            className="px-3 py-1 rounded-xl border border-slate-200 text-teal-800 hover:bg-teal-50 text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW UPLOADED ORGANISATION ID CARD                               */}
      {/* ========================================================================= */}
      {selectedPatientForIdCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileBadge className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-black text-slate-900">
                  Organisation ID Card Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientForIdCard(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* ID Card Visual Preview */}
              <div className="w-full bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-md border-2 border-teal-500/40 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-teal-300" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-teal-200">
                      {selectedPatientForIdCard.organizationName}
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black uppercase">
                    ABDM Verified
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                    <img
                      src={
                        selectedPatientForIdCard.idCardUrl ||
                        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60"
                      }
                      alt="ID Card Photo"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-black text-white leading-tight">
                      {selectedPatientForIdCard.name}
                    </div>
                    <div className="text-xs font-mono font-bold text-teal-300">
                      ID: {selectedPatientForIdCard.memberId}
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      Dept: {selectedPatientForIdCard.department}
                    </div>
                    <div className="text-[10px] text-rose-300 font-bold">
                      Blood Group: {selectedPatientForIdCard.bloodGroup}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      UHID: {selectedPatientForIdCard.patientUhid}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Authorised Institutional Credential</span>
                  <span>National Health Registry</span>
                </div>
              </div>

              {/* Patient Credentials Meta */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="font-bold text-slate-800">{selectedPatientForIdCard.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Residential Address:</span>
                  <span className="font-semibold text-slate-700 text-right max-w-[200px] truncate">{selectedPatientForIdCard.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Enrolled &amp; Active
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatientForIdCard(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close ID View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: COMPLETE PATIENT HEALTH DOSSIER                                  */}
      {/* ========================================================================= */}
      {selectedPatientForDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedPatientForDossier.name}</h3>
                <span className="text-xs text-teal-800 font-bold">
                  {selectedPatientForDossier.memberId} &bull; {selectedPatientForDossier.organizationName}
                </span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(selectedPatientForDossier.triagePriority)}`}>
                {cleanPriorityText(selectedPatientForDossier.triagePriority)}
              </span>
            </div>

            {/* Vital Signs & Clinical Vitals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Group</span>
                <span className="font-black text-rose-700 text-sm flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                  <span>{selectedPatientForDossier.bloodGroup}</span>
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Pressure</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPatientForDossier.latestVitals.bp} mmHg</span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Oxygen Saturation</span>
                <span className={`font-bold text-sm ${selectedPatientForDossier.latestVitals.spo2 < 92 ? "text-rose-600 font-black" : "text-emerald-700"}`}>
                  {selectedPatientForDossier.latestVitals.spo2}% SpO2
                </span>
              </div>

              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Pulse Rate</span>
                <span className="font-bold text-slate-900 text-sm">{selectedPatientForDossier.latestVitals.pulse} bpm</span>
              </div>
            </div>

            {/* Demographic Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">National Health UHID:</span>
                <span className="font-mono font-bold text-teal-800">{selectedPatientForDossier.patientUhid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / Division:</span>
                <span className="font-bold text-slate-800">{selectedPatientForDossier.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age &amp; Gender:</span>
                <span className="font-bold text-slate-800">{selectedPatientForDossier.age} Y, {selectedPatientForDossier.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-bold text-slate-800">{selectedPatientForDossier.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Residential Address:</span>
                <span className="font-medium text-slate-700 text-right max-w-xs">{selectedPatientForDossier.address}</span>
              </div>
            </div>

            {/* Latest Symptoms in Dossier */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-bold block">Latest Reported Symptoms</span>
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                {selectedPatientForDossier.latestSymptoms && selectedPatientForDossier.latestSymptoms.length > 0 ? (
                  selectedPatientForDossier.latestSymptoms.map((sym, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 rounded-lg text-xs font-bold shadow-2xs">
                      {sym}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None reported (Routine Checkup)</span>
                )}
              </div>
            </div>

            {/* Occupational Health Observation Note */}
            <div className="text-xs space-y-1">
              <span className="text-slate-500 font-bold block">Occupational Health &amp; Triage Assessment</span>
              <p className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-950 leading-relaxed font-medium">
                {selectedPatientForDossier.healthNotes}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setSelectedPatientForDossier(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Close Dossier
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotificationToast(`Doctor referral slip generated for ${selectedPatientForDossier.name} to CHC Khandapada.`);
                  setSelectedPatientForDossier(null);
                  setTimeout(() => setNotificationToast(null), 3500);
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer"
              >
                Fast-Track CHC Doctor Referral
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ENROLL NEW PATIENT UNDER ORGANISATION                             */}
      {/* ========================================================================= */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <h3 className="text-base font-black text-slate-900">
                  Add Employee / Student to Roster &bull; {selectedOrg.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPatientModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewMember} className="space-y-4 text-xs">
              {/* Category Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Member Type / Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPatientCategory("Employee")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newPatientCategory === "Employee"
                        ? "bg-teal-800 text-white border-teal-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Employee / Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPatientCategory("Student")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newPatientCategory === "Student"
                        ? "bg-teal-800 text-white border-teal-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>Student / Scholar</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Das"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 block">Age *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 38"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block">Gender</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block">Blood Group *</label>
                  <select
                    value={newPatientBloodGroup}
                    onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-teal-700 cursor-pointer text-rose-700"
                  >
                    {bloodGroupsList.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-slate-800 block">Employee / Member ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NAL-8891"
                    value={newPatientMemberId}
                    onChange={(e) => setNewPatientMemberId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Smelter / Transport"
                    value={newPatientDepartment}
                    onChange={(e) => setNewPatientDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Contact Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 94371 00000"
                  value={newPatientPhone}
                  onChange={(e) => setNewPatientPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Residential Address</label>
                <input
                  type="text"
                  placeholder="e.g. Quarter B-18, Nalco Township"
                  value={newPatientAddress}
                  onChange={(e) => setNewPatientAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">Latest Symptoms (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Fever, Cough (or leave as Routine Checkup)"
                  value={newPatientSymptoms}
                  onChange={(e) => setNewPatientSymptoms(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
                />
              </div>

              {/* Upload ID Card Demo */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block">Organisation ID Card</label>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600">
                    {newPatientIdCardFileName ? newPatientIdCardFileName : "Demo verified badge will be attached"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPatientIdCardFileName("employee_id_card.png");
                      setNewPatientIdCardPreview("https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60");
                    }}
                    className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Attach Demo ID
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold cursor-pointer shadow-xs"
                >
                  Enroll Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
