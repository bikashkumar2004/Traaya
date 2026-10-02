"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Building2,
  Activity,
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  Stethoscope,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronRight,
  FileCheck,
  Filter,
  ArrowRightLeft,
  Bed,
  Ambulance,
  HeartPulse,
  UserCheck,
} from "lucide-react";

export type MedicalNavTab =
  | "dashboard"
  | "patients"
  | "referrals"
  | "facility"
  | "inventory";

export type MedicalPatientStatus =
  | "Under Review"
  | "Reverted"
  | "Referred"
  | "Scheduled"
  | "Completed";

export interface BasicMedicalPatient {
  id: string;
  patientUhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  triagePriority: "Immediate" | "Urgent" | "Less Urgent" | "Routine / Fit";
  status: MedicalPatientStatus;
  admissionDate: string;
  unitOrWard?: string;
}

export interface HospitalReferral {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  referringDoctor: string;
  referringHospital: string;
  referredAt: string;
  priority: "Immediate" | "Urgent" | "Less Urgent" | "Routine";
  chiefComplaint: string;
  clinicalNotes: string;
  status: "Pending Assignment" | "Assigned" | "Scheduled" | "Completed";
  assignedDoctor?: string;
  assignedDepartment?: string;
  assignedBay?: string;
  assignedTimeline?: string;
  oldFacilityId?: string;
  referalFacilityId?: string;
  scheduleTime?: string;
  patientReferralStatus?: string;
}

function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export interface FacilityDoctorStaff {
  id: string;
  name: string;
  specialty: string;
  department: string;
  room: string;
  shift: string;
  status: "Available" | "On OPD Duty" | "In Emergency Bay" | "Off Duty";
  activeCases: number;
  phone: string;
}

interface InventoryItem {
  id: string;
  drugCode: string;
  genericName: string;
  brandName: string;
  category: "Antibiotic" | "Analgesic" | "Cardiovascular" | "Antidiabetic" | "Respiratory" | "Electrolyte";
  currentStock: number;
  unit: string;
  threshold: number;
  batchNumber: string;
  expiryDate: string;
  status: "Adequate" | "Low Stock" | "Critical";
}

const INITIAL_PATIENTS: BasicMedicalPatient[] = [];
const INITIAL_INVENTORY: InventoryItem[] = [];
const INITIAL_REFERRALS: HospitalReferral[] = [];
const FACILITY_DOCTORS: FacilityDoctorStaff[] = [];

const STORAGE_KEY = "triage_medical_basic_patients";
const REFERRALS_STORAGE_KEY = "triage_medical_inbound_referrals";

function mapToStandardStatus(status?: string): MedicalPatientStatus {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("revert")) return "Reverted";
  if (s.includes("refer")) return "Referred";
  if (s.includes("schedule")) return "Scheduled";
  if (s.includes("complet") || s.includes("discharg") || s.includes("dispens")) return "Completed";
  return "Under Review";
}

function getStoredPatients(): BasicMedicalPatient[] {
  return INITIAL_PATIENTS;
}

function saveStoredPatients(data: BasicMedicalPatient[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error", e);
  }
}

function getStoredReferrals(): HospitalReferral[] {
  if (typeof window === "undefined") return INITIAL_REFERRALS;
  try {
    const raw = localStorage.getItem(REFERRALS_STORAGE_KEY);
    if (!raw) return INITIAL_REFERRALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_REFERRALS;
  } catch {
    return INITIAL_REFERRALS;
  }
}

function saveStoredReferrals(data: HospitalReferral[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REFERRALS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage error", e);
  }
}

export default function MedicalPortalPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Determine displayed medical staff identity
  const isMedicalStaff = user?.role === "facility" || user?.role === "medical" || user?.role === "doctor" || user?.role === "nurse";
  const staffName = isMedicalStaff && user?.fullName && !user.fullName.toLowerCase().startsWith("patient")
    ? user.fullName
    : "Pharm. Rajesh Patra";
  const staffInitials = staffName
    .replace(/^Pharm\.\s*/i, "")
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "RP";
  
  // Navigation Tab matching Doctor Shell
  const [activeTab, setActiveTab] = useState<MedicalNavTab>("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Data States
  const [patients, setPatients] = useState<BasicMedicalPatient[]>([]);
  const [referrals, setReferrals] = useState<HospitalReferral[]>(INITIAL_REFERRALS);
  const [staffDoctors, setStaffDoctors] = useState<FacilityDoctorStaff[]>(FACILITY_DOCTORS);
  const [facilityBeds, setFacilityBeds] = useState({
    totalBeds: 50,
    occupiedBeds: 34,
    icuBeds: { total: 8, occupied: 6 },
    oxygenBeds: { total: 24, occupied: 19 },
    emergencyBays: { total: 6, occupied: 4 },
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  
  // Patient & Referral Filters
  const [patientPriorityFilter, setPatientPriorityFilter] = useState("All");
  const [patientStatusFilter, setPatientStatusFilter] = useState("All");
  const [referralFilter, setReferralFilter] = useState("All");
  const [inventoryCatFilter, setInventoryCatFilter] = useState("ALL");
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState("All");
  
  // Modals & Notifications
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<BasicMedicalPatient | null>(null);
  const [selectedReferralToAssign, setSelectedReferralToAssign] = useState<HospitalReferral | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Assign Doctor Form States
  const [assignDoctorId, setAssignDoctorId] = useState<string>("");
  const [assignTimeInput, setAssignTimeInput] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return toDateTimeLocalString(now);
  });

  // New Patient Form
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<number | string>("");
  const [newGender, setNewGender] = useState("Male");
  const [newPhone, setNewPhone] = useState("");
  const [newStatus, setNewStatus] = useState<MedicalPatientStatus>("Under Review");
  const [newUhid, setNewUhid] = useState(`UHID-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newPriority, setNewPriority] = useState<BasicMedicalPatient["triagePriority"]>("Routine / Fit");

  // Load real data from live database tables
  const loadRealData = async () => {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Resolve facility context
      let targetFacId = user?.facilityId || user?.id;
      if (!targetFacId && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("triageassist_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            targetFacId = parsed?.facilityId || parsed?.id;
          }
        } catch {}
      }

      // 2. Fetch real triage tickets where facility_id is assigned to this facility in triage tickets dataset
      let tickets: any[] = [];
      if (targetFacId && /^[0-9a-fA-F-]{36}$/.test(targetFacId)) {
        const { data: facTickets, error: ticketErr } = await supabase
          .from("triage_tickets")
          .select(`
            *,
            profiles:patient_id(id, full_name, user_id, age, gender, phone),
            new_patient:new_patient_id(id, full_name, uhid, age, gender, phone),
            facility_profile:facility_id(id, full_name, district, state)
          `)
          .eq("facility_id", targetFacId)
          .order("created_at", { ascending: false });

        if (!ticketErr && facTickets) {
          tickets = facTickets;
        }
      } else {
        const { data: allTickets, error: allErr } = await supabase
          .from("triage_tickets")
          .select(`
            *,
            profiles:patient_id(id, full_name, user_id, age, gender, phone),
            new_patient:new_patient_id(id, full_name, uhid, age, gender, phone),
            facility_profile:facility_id(id, full_name, district, state)
          `)
          .order("created_at", { ascending: false });

        if (!allErr && allTickets) {
          tickets = allTickets;
        }
      }

      if (tickets && tickets.length > 0) {
        const mappedPatients: BasicMedicalPatient[] = tickets.map((t: any) => {
          const isFamily = Boolean(t.is_family_member);
          const profile = (Array.isArray(t.profiles) ? t.profiles[0] : t.profiles) || {};
          const newPat = (Array.isArray(t.new_patient) ? t.new_patient[0] : t.new_patient) || {};
          const facProf = (Array.isArray(t.facility_profile) ? t.facility_profile[0] : t.facility_profile) || {};
          const snapshot = t.symptoms_data?.patient_intake_snapshot || {};

          let dischargeDetails: any = null;
          try {
            if (typeof t.discharge_report_text === "string" && t.discharge_report_text.trim().startsWith("{")) {
              const parsed = JSON.parse(t.discharge_report_text);
              dischargeDetails = parsed?.patientDetails || null;
            }
          } catch {}

          const name = isFamily
            ? (t.family_member_name || "Family Dependent")
            : (newPat.full_name || profile.full_name || dischargeDetails?.name || snapshot.name || "Registered Patient");

          const uhid = isFamily
            ? (t.family_member_uhid || t.case_number || "UHID-FAM")
            : (newPat.uhid || profile.user_id || dischargeDetails?.patientId || snapshot.uhid || t.case_number || `UHID-${String(t.id).slice(0, 5)}`);

          let extractedAge = Number(isFamily ? t.family_member_age : (newPat.age ?? profile.age ?? snapshot.age)) || 0;
          if (!extractedAge && dischargeDetails?.ageSex) {
            const ageMatch = String(dischargeDetails.ageSex).match(/\d+/);
            if (ageMatch) extractedAge = parseInt(ageMatch[0], 10);
          }
          const age = extractedAge || 26;

          let rawGender = isFamily
            ? (t.family_member_gender || "Other")
            : (newPat.gender || profile.gender || snapshot.gender || "");
          if (!rawGender && dischargeDetails?.ageSex) {
            if (/male/i.test(dischargeDetails.ageSex)) rawGender = "Male";
            else if (/female/i.test(dischargeDetails.ageSex)) rawGender = "Female";
          }
          const gender = rawGender ? (rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()) : "Male";

          const phone = isFamily
            ? (t.family_member_phone || "")
            : (newPat.phone || profile.phone || snapshot.phone || "+91 8895140540");

          const rawPrio = (t.priority || t.urgency || t.priority_level || "").toLowerCase();
          let triagePriority: BasicMedicalPatient["triagePriority"] = "Routine / Fit";
          if (rawPrio.includes("red") || rawPrio.includes("immediate")) {
            triagePriority = "Immediate";
          } else if (rawPrio.includes("yellow") || rawPrio.includes("urgent")) {
            triagePriority = "Urgent";
          } else if (rawPrio.includes("less")) {
            triagePriority = "Less Urgent";
          } else {
            triagePriority = "Routine / Fit";
          }

          return {
            id: t.id,
            patientUhid: uhid,
            name: name,
            age: age,
            gender: gender,
            phone: phone,
            triagePriority: triagePriority,
            status: mapToStandardStatus(t.status),
            admissionDate: new Date(t.created_at || Date.now()).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            unitOrWard: facProf.full_name || "OPD Triage Desk",
          };
        });

        setPatients(mappedPatients);
        saveStoredPatients(mappedPatients);
      } else {
        setPatients([]);
        saveStoredPatients([]);
      }

      // 3. Inbound Referrals - query triage tickets with patient and facility joins
      // Show ONLY to that facility profile which facility id is present in referal_facility_id
      // AND patient_referral_status MUST be 'Accepted'
      let refTickets: any[] = [];
      if (targetFacId && /^[0-9a-fA-F-]{36}$/.test(targetFacId)) {
        const { data: inboundData, error: refErr } = await supabase
          .from("triage_tickets")
          .select(`
            *,
            profiles:patient_id(id, full_name, user_id, age, gender, phone),
            new_patient:new_patient_id(id, full_name, uhid, age, gender, phone),
            referring_facility:facility_id(id, full_name, district, state)
          `)
          .in("status", ["Referred", "Scheduled", "Under Review"])
          .eq("referal_facility_id", targetFacId)
          .eq("patient_referral_status", "Accepted")
          .order("created_at", { ascending: false });

        if (!refErr && inboundData) {
          refTickets = inboundData;
        }
      }

      if (refTickets.length > 0) {
        const mappedRefs: HospitalReferral[] = refTickets.map((r: any) => {
          const isFamily = Boolean(r.is_family_member);
          const profile = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) || {};
          const newPat = (Array.isArray(r.new_patient) ? r.new_patient[0] : r.new_patient) || {};
          const refFac = (Array.isArray(r.referring_facility) ? r.referring_facility[0] : r.referring_facility) || {};
          const snapshot = r.symptoms_data?.patient_intake_snapshot || {};

          const patName = isFamily
            ? (r.family_member_name || "Family Dependent")
            : (newPat.full_name || profile.full_name || snapshot.name || "Patient");

          const uhid = isFamily
            ? (r.family_member_uhid || r.case_number || "UHID-FAM")
            : (newPat.uhid || profile.user_id || snapshot.uhid || r.case_number || "UHID-GEN");

          const age = Number(isFamily ? r.family_member_age : (newPat.age ?? profile.age ?? snapshot.age)) || 26;
          const rawGender = isFamily
            ? (r.family_member_gender || "Other")
            : (newPat.gender || profile.gender || snapshot.gender || "Other");
          const gender = rawGender ? (rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase()) : "Other";

          const phone = isFamily
            ? (r.family_member_phone || "")
            : (newPat.phone || profile.phone || snapshot.phone || "");

          const rawPrio = (r.priority || r.urgency || "").toLowerCase();
          let priority: HospitalReferral["priority"] = "Routine";
          if (rawPrio.includes("red") || rawPrio.includes("immediate")) priority = "Immediate";
          else if (rawPrio.includes("yellow") || rawPrio.includes("urgent")) priority = "Urgent";
          else if (rawPrio.includes("less")) priority = "Less Urgent";

          const referringFacilityName =
            r.referred_from_facility ||
            refFac.full_name ||
            "Referring Health Facility";

          return {
            id: r.id,
            uhid: uhid,
            patientName: patName,
            age: age,
            gender: gender,
            phone: phone,
            referringDoctor: r.assigned_doctor_name || "Attending Medical Officer",
            referringHospital: referringFacilityName,
            referredAt: new Date(r.patient_referral_accepted_at || r.updated_at || r.created_at || Date.now()).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            priority: priority,
            chiefComplaint: r.symptoms_data?.chief_complaint || r.transfer_reason || "Secondary / Tertiary Medical Evaluation",
            clinicalNotes: r.transfer_reason || r.referral_notes || "",
            status: r.facility_referral_status === "Accepted" ? "Assigned" : "Pending Assignment",
            assignedDoctor: r.facility_referral_status === "Accepted" ? (r.assigned_doctor_name || "Assigned Doctor") : undefined,
            scheduleTime: r.schedule_time || undefined,
            assignedTimeline: r.schedule_time
              ? new Date(r.schedule_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
              : undefined,
            patientReferralStatus: r.patient_referral_status,
            oldFacilityId: r.referred_from_ticket_id || r.referred_from_facility_id || r.facility_id,
            referalFacilityId: r.referal_facility_id,
          };
        });
        setReferrals(mappedRefs);
        saveStoredReferrals(mappedRefs);
      } else {
        setReferrals([]);
        saveStoredReferrals([]);
      }

      // 4. Facility Doctors from real doctor_profiles & profiles
      let docQuery = supabase
        .from("doctor_profiles")
        .select(`
          id,
          profile_id,
          facility_id,
          facility_name,
          designation,
          room_number,
          department,
          qualification,
          availability_status,
          profiles:profile_id(id, full_name, user_id, phone)
        `);

      if (targetFacId && /^[0-9a-fA-F-]{36}$/.test(targetFacId)) {
        docQuery = docQuery.eq("facility_id", targetFacId);
      }

      let { data: realDocs, error: docErr } = await docQuery;
      if (!docErr && (!realDocs || realDocs.length === 0)) {
        const { data: allDocs } = await supabase
          .from("doctor_profiles")
          .select(`
            id,
            profile_id,
            facility_id,
            facility_name,
            designation,
            room_number,
            department,
            qualification,
            availability_status,
            profiles:profile_id(id, full_name, user_id, phone)
          `);
        if (allDocs && allDocs.length > 0) {
          realDocs = allDocs;
        }
      }
      if (!docErr && realDocs && realDocs.length > 0) {
        const mappedDocs: FacilityDoctorStaff[] = realDocs.map((dp: any, idx: number) => {
          const prof = dp.profiles || {};
          return {
            id: dp.profile_id || dp.id,
            name: prof.full_name || "Doctor",
            specialty: dp.qualification || dp.designation || "General Medicine & Emergency OPD",
            department: dp.department || "Department of Medicine",
            room: dp.room_number || `OPD Room ${101 + idx}`,
            shift: "Morning Roster (08:00 AM - 02:00 PM)",
            status: (dp.availability_status as any) || "Available",
            activeCases: 0,
            phone: prof.phone || "+91 94370 00000",
          };
        });
        setStaffDoctors(mappedDocs);
      } else {
        const { data: pDocs } = await supabase.from("profiles").select("*").eq("role", "doctor");
        if (pDocs && pDocs.length > 0) {
          const mappedDocs: FacilityDoctorStaff[] = pDocs.map((doc: any, idx: number) => ({
            id: doc.id,
            name: doc.full_name || "Doctor",
            specialty: "General Medicine",
            department: "Department of Medicine",
            room: `OPD Room ${101 + idx}`,
            shift: "Morning Roster (08:00 AM - 02:00 PM)",
            status: "Available",
            activeCases: 0,
            phone: doc.phone || "+91 94370 00000",
          }));
          setStaffDoctors(mappedDocs);
        }
      }
    } catch (err) {
      console.error("[Medical] Error loading real data from database:", err);
    }
  };

  useEffect(() => {
    // Initial stored state (with legacy corrupted rows filtered)
    setPatients(getStoredPatients());
    setReferrals(getStoredReferrals());

    // Fetch real data from live database tables
    loadRealData();

    // Subscribe to live database updates on triage_tickets
    if (isSupabaseConfigured && supabase) {
      const channel = supabase
        .channel("facility-medical-live-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "triage_tickets" },
          () => {
            loadRealData();
          }
        )
        .subscribe();

      return () => {
        supabase?.removeChannel(channel);
      };
    }
  }, [user?.id, user?.facilityId]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRestock = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, currentStock: item.currentStock + 500, status: "Adequate" }
          : item
      )
    );
    triggerToast("Inventory restocked (+500 units) from Jan Aushadhi depot.");
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUhid.trim()) return;

    const patient: BasicMedicalPatient = {
      id: `MED-P${Date.now().toString().slice(-4)}`,
      patientUhid: newUhid.trim().toUpperCase(),
      name: newName.trim(),
      age: Number(newAge) || 28,
      gender: newGender,
      phone: newPhone.trim() || "+91 94370 00000",
      triagePriority: newPriority,
      status: newStatus,
      admissionDate: "Today, Just now",
      unitOrWard: "General Facility OPD",
    };

    const updated = [patient, ...patients];
    setPatients(updated);
    saveStoredPatients(updated);
    setShowAddModal(false);

    // Persist to live Supabase / PostgreSQL database
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: newPatRow } = await supabase
          .from("new_patient")
          .insert({
            uhid: patient.patientUhid,
            full_name: patient.name,
            age: patient.age,
            gender: patient.gender.toLowerCase(),
            phone: patient.phone,
            location: "Facility Registered",
            preferred_language: "Odia",
            consent_status: "Given",
            intake_notes: "Registered directly via Facility Patients Directory",
          })
          .select("id")
          .maybeSingle();

        if (newPatRow?.id) {
          await supabase.from("triage_tickets").insert({
            case_number: `TR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            new_patient_id: newPatRow.id,
            facility_id: user?.facilityId || user?.id || null,
            status: patient.status,
            priority: patient.triagePriority === "Immediate" ? "Red" : patient.triagePriority === "Urgent" ? "Yellow" : "Green",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          // Refresh live queue from database
          await loadRealData();
        }
      } catch (err) {
        console.warn("[Medical] Notice persisting new registered patient to DB:", err);
      }
    }

    setNewName("");
    setNewAge("");
    setNewPhone("");
    setNewStatus("Under Review");
    setNewUhid(`UHID-${Math.floor(10000 + Math.random() * 90000)}`);
    triggerToast(`Patient ${patient.name} registered and saved to database.`);
  };

  const handleExportCensus = () => {
    const headers = ["UHID", "Name", "Age", "Gender", "Phone", "Status", "Priority", "Date"];
    const rows = patients.map((p) => [
      `"${p.patientUhid}"`,
      `"${p.name}"`,
      p.age,
      `"${p.gender}"`,
      `"${p.phone}"`,
      `"${p.status}"`,
      `"${p.triagePriority}"`,
      `"${p.admissionDate}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Medical_Facility_Patients_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    triggerToast("Patient census exported as CSV.");
  };

  // Confirm Referral Assignment to Doctor
  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferralToAssign) return;

    const chosenDoctor = staffDoctors.find((d) => d.id === assignDoctorId) || staffDoctors[0] || {
      id: assignDoctorId,
      name: "Attending Specialist",
    };

    let scheduledIso: string = new Date().toISOString();
    if (assignTimeInput) {
      try {
        scheduledIso = new Date(assignTimeInput).toISOString();
      } catch {}
    }

    const newFacilityId = selectedReferralToAssign.referalFacilityId || user?.facilityId || user?.id || null;
    const oldFacilityId = selectedReferralToAssign.oldFacilityId || null;
    const oldFacilityName = selectedReferralToAssign.referringHospital || null;

    // Update live triage_tickets table in database
    if (supabase) {
      const { error } = await supabase
        .from("triage_tickets")
        .update({
          facility_id: newFacilityId,
          doctor_id: chosenDoctor.id,
          assigned_doctor_name: chosenDoctor.name,
          referred_from_ticket_id: oldFacilityId,
          referred_from_facility_id: oldFacilityId,
          referred_from_facility: oldFacilityName,
          schedule_time: scheduledIso,
          facility_referral_status: "Accepted",
          facility_referral_accepted_at: new Date().toISOString(),
          status: "Scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedReferralToAssign.id);

      if (error) {
        console.error("[Medical] Error updating referral assignment:", error);
      } else if (chosenDoctor.id) {
        // Increment doctor active cases in database
        try {
          const { data: dp } = await supabase
            .from("doctor_profiles")
            .select("id, active_cases_count")
            .eq("profile_id", chosenDoctor.id)
            .maybeSingle();
          if (dp) {
            await supabase
              .from("doctor_profiles")
              .update({ active_cases_count: (dp.active_cases_count || 0) + 1 })
              .eq("id", dp.id);
          }
        } catch (cntErr) {
          console.warn("[Medical] Notice updating doctor active cases:", cntErr);
        }
      }
    }

    // Refresh real data from live database
    await loadRealData();

    // Increment doctor active cases in local state
    setStaffDoctors((prev) =>
      prev.map((d) => (d.id === chosenDoctor.id ? { ...d, activeCases: d.activeCases + 1 } : d))
    );

    triggerToast(`Inbound referral accepted & assigned to ${chosenDoctor.name}.`);
    setSelectedReferralToAssign(null);
  };

  const handleToggleDoctorStatus = (doctorId: string) => {
    setStaffDoctors((prev) =>
      prev.map((doc) => {
        if (doc.id === doctorId) {
          const nextStatus =
            doc.status === "Available"
              ? "On OPD Duty"
              : doc.status === "On OPD Duty"
              ? "In Emergency Bay"
              : doc.status === "In Emergency Bay"
              ? "Off Duty"
              : "Available";
          return { ...doc, status: nextStatus };
        }
        return doc;
      })
    );
    triggerToast("Doctor duty status updated.");
  };

  // Metrics
  const immediateCount = patients.filter((p) => p.triagePriority === "Immediate").length;
  const urgentCount = patients.filter((p) => p.triagePriority === "Urgent").length;
  const lowStockCount = inventory.filter((i) => i.status === "Low Stock" || i.status === "Critical").length;
  const pendingReferralsCount = referrals.filter((r) => r.status === "Pending Assignment").length;

  // Filtered Patients (Basic Details with Status filter)
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const q = globalSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.patientUhid.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.status.toLowerCase().includes(q);

      const matchesPriority =
        patientPriorityFilter === "All" ||
        p.triagePriority.toLowerCase().includes(patientPriorityFilter.toLowerCase());

      const matchesStatus =
        patientStatusFilter === "All" || p.status === patientStatusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [patients, globalSearch, patientPriorityFilter, patientStatusFilter]);

  // Filtered Referrals
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      const q = globalSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.patientName.toLowerCase().includes(q) ||
        r.uhid.toLowerCase().includes(q) ||
        r.referringHospital.toLowerCase().includes(q) ||
        r.referringDoctor.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.chiefComplaint.toLowerCase().includes(q);

      const matchesFilter =
        referralFilter === "All" || r.status === referralFilter;

      return matchesSearch && matchesFilter;
    });
  }, [referrals, globalSearch, referralFilter]);

  // Filtered Doctors
  const filteredDoctors = useMemo(() => {
    return staffDoctors.filter((doc) => {
      if (selectedSpecialtyFilter === "All") return true;
      return (
        doc.specialty.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase()) ||
        doc.department.toLowerCase().includes(selectedSpecialtyFilter.toLowerCase())
      );
    });
  }, [staffDoctors, selectedSpecialtyFilter]);

  // Filtered Inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const q = globalSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.genericName.toLowerCase().includes(q) ||
        item.brandName.toLowerCase().includes(q) ||
        item.drugCode.toLowerCase().includes(q);

      const matchesCat =
        inventoryCatFilter === "ALL" ||
        (inventoryCatFilter === "LOW" && (item.status === "Low Stock" || item.status === "Critical")) ||
        item.category.toUpperCase() === inventoryCatFilter.toUpperCase();

      return matchesSearch && matchesCat;
    });
  }, [inventory, globalSearch, inventoryCatFilter]);

  const getPriorityBadgeClass = (priority: string) => {
    const norm = (priority || "").toLowerCase();
    if (norm.includes("immediate") || norm.includes("red")) {
      return "bg-rose-50 text-rose-800 border-rose-300 font-extrabold";
    }
    if (norm.includes("urgent") || norm.includes("yellow")) {
      return "bg-amber-50 text-amber-800 border-amber-300 font-extrabold";
    }
    return "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold";
  };

  const getDoctorStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "On OPD Duty":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "In Emergency Bay":
        return "bg-rose-50 text-rose-800 border-rose-300 animate-pulse";
      default:
        return "bg-slate-100 text-slate-600 border-slate-300";
    }
  };

  const getStatusBadge = (status: string) => {
    const norm = mapToStandardStatus(status);
    switch (norm) {
      case "Under Review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300 shadow-2xs">
            Under Review
          </span>
        );
      case "Reverted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
            Reverted
          </span>
        );
      case "Referred":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-300 shadow-2xs">
            Referred
          </span>
        );
      case "Scheduled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-300 shadow-2xs">
            Scheduled
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            Completed
          </span>
        );
    }
  };

  const navItems = [
    {
      id: "dashboard" as MedicalNavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "patients" as MedicalNavTab,
      label: "Patients Directory",
      icon: Users,
      badge: patients.length,
      badgeClass: "bg-teal-100 text-teal-800",
    },
    {
      id: "referrals" as MedicalNavTab,
      label: "Hospital Referrals",
      icon: ArrowRightLeft,
      badge: pendingReferralsCount > 0 ? `${pendingReferralsCount} New` : undefined,
      badgeClass: "bg-purple-100 text-purple-800 font-extrabold animate-pulse",
    },
    {
      id: "facility" as MedicalNavTab,
      label: "Facility Availability",
      icon: Building2,
      badge: `${facilityBeds.totalBeds - facilityBeds.occupiedBeds} Beds`,
      badgeClass: "bg-emerald-100 text-emerald-800 font-bold",
    },
    {
      id: "inventory" as MedicalNavTab,
      label: "Drug Inventory",
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeClass: "bg-rose-100 text-rose-800 font-black",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#f4f7fb] text-slate-800 antialiased font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-teal-800 text-white rounded-xl shadow-xl border border-teal-700 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-teal-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Doctor-style soft blue layout #EAF1FF) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#EAF1FF] text-slate-800 flex flex-col justify-between border-r border-blue-200/70 transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl z-50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Header */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between shrink-0">
            <Link href="/medical" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-teal-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                  Triage<span className="text-teal-700">Assist</span>
                </span>
                <span className="text-[10px] font-semibold text-teal-800 tracking-wide leading-none mt-1">
                  Medical Facility Station
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 w-full text-left cursor-pointer group ${
                    isActive
                      ? "bg-teal-700 text-white shadow-sm font-bold"
                      : "text-slate-700 hover:text-teal-900 hover:bg-white/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-teal-700/80"}`} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? "bg-white text-slate-900" : item.badgeClass || "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Node Context */}
          <div className="p-3 border-t border-blue-200/70 bg-[#dbe8fd]/50 space-y-2 shrink-0">
            <div className="flex items-center gap-2.5 p-2 bg-white/80 rounded-xl border border-blue-200/60">
              <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.facilityName || "Jan Aushadhi CHC Counter"}
                </div>
                <div className="text-[10px] text-teal-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Medical Desk
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {user?.facilityName || "CHC Medical Center"}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Dispensary &amp; Clinical Records</span>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient, UHID, or inventory item..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 font-medium"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Medical Staff Profile Pill matching Doctor/Nurse Shell */}
            <div className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-white">
                  {staffInitials}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <div className="text-xs font-bold text-slate-900">
                  {staffName}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold">
                  Pharmacist in-Charge &bull; DL-OD-NAY-819
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:scale-[1.02] shrink-0 active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Top Header like Doctor/Patient/Nurse page (no box) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Medical Facility Command Center
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Facility Staff: <strong className="text-slate-900">{staffName}</strong> &bull; Monitor patient intake, review facility referrals, track bed occupancy, and manage essential medicine stocks.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-teal-200" />
                    <span>+ Register Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("patients")}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-teal-700" />
                    <span>View Directory</span>
                  </button>
                </div>
              </div>

              {/* Telemetry KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                    <span>Enrolled Patients</span>
                    <Users className="w-4 h-4 text-teal-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{patients.length}</div>
                  <div className="text-[11px] text-teal-800 font-semibold mt-1">Under this facility</div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
                  <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
                    <span>Inbound Referrals</span>
                    <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">{pendingReferralsCount}</div>
                  <div className="text-[11px] text-purple-700 font-semibold mt-1">Awaiting Assignment</div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                    <span>Available Beds</span>
                    <Bed className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
                    {facilityBeds.totalBeds - facilityBeds.occupiedBeds}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    of {facilityBeds.totalBeds} total beds
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
                  <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
                    <span>Immediate / Critical</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">{immediateCount}</div>
                  <div className="text-[11px] text-rose-700 font-semibold mt-1">ER Resuscitation</div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs">
                  <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
                    <span>Drug Inventory</span>
                    <Package className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-2">{inventory.length}</div>
                  <div className="text-[11px] text-teal-700 font-semibold mt-1">Essential Stock Items</div>
                </div>
              </div>

              {/* Inbound Referrals Direct Action Banner */}
              {pendingReferralsCount > 0 && (
                <div className="bg-linear-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-700/80 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-purple-500/50">
                      <ArrowRightLeft className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white tracking-wide">
                          {pendingReferralsCount} Inbound Patient Referrals Awaiting Doctor Assignment
                        </span>
                        <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30">
                          Inter-Hospital Network
                        </span>
                      </div>
                      <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                        Patients transferred by doctors from CHC Khandapada, SDH Nayagarh, and PHC Fategarh. Assign to an on-duty specialist to allocate OPD room and schedule care.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("referrals")}
                    className="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>Manage Referrals ({pendingReferralsCount})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Two Column Grid: Recent Patients & Low Inventory Items */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Recent Patients with Basic Details */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Recent Facility Patients (Basic Details)</h3>
                      <p className="text-xs text-slate-500">Quick demographic registry of arriving and admitted patients.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("patients")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All ({patients.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="pb-2.5">Patient Name</th>
                          <th className="pb-2.5">UHID</th>
                          <th className="pb-2.5">Age / Gender</th>
                          <th className="pb-2.5">Phone</th>
                          <th className="pb-2.5 text-center">Status</th>
                          <th className="pb-2.5 text-right">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {patients.slice(0, 5).map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                            <td className="py-2.5 font-mono text-[11px] text-teal-800 font-bold">{p.patientUhid}</td>
                            <td className="py-2.5 text-slate-600">{p.age} yrs • {p.gender}</td>
                            <td className="py-2.5 text-slate-500">{p.phone}</td>
                            <td className="py-2.5 text-center">
                              {getStatusBadge(p.status)}
                            </td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getPriorityBadgeClass(p.triagePriority)}`}>
                                {p.triagePriority}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right 1 Col: Low Stock Alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Inventory Stock Alerts</h3>
                      <p className="text-xs text-slate-500">Jan Aushadhi depot items near threshold.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("inventory")}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Store</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {inventory
                      .filter((i) => i.status === "Low Stock" || i.status === "Critical")
                      .map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-rose-100 bg-rose-50/20 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">{item.genericName}</div>
                            <div className="text-[10px] text-slate-500">
                              Stock: <strong className="text-rose-700">{item.currentStock}</strong> / {item.threshold} {item.unit}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestock(item.id)}
                            className="px-2.5 py-1 bg-white border border-teal-300 text-teal-800 hover:bg-teal-800 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            + Restock
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENTS DIRECTORY (BASIC DETAILS NOT FULL DETAILS) */}
          {activeTab === "patients" && (
            <div className="space-y-6">
              {/* Top Header like Doctor/Patient/Nurse page (no box) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Facility Patients Directory
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Clean roster showing basic patient identifiers, demographics, status, and triage priority.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-teal-200" />
                    <span>+ Register Patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCensus}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-teal-700" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      All Facility Patients ({patients.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Demographic identifiers and triage care status.
                    </p>
                  </div>
                </div>

              {/* Filters Bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={patientPriorityFilter}
                  onChange={(e) => setPatientPriorityFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:bg-white focus:outline-teal-700"
                >
                  <option value="All">All Priorities</option>
                  <option value="Immediate">Immediate Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Less Urgent">Less Urgent</option>
                  <option value="Routine">Routine / Fit</option>
                </select>

                <select
                  value={patientStatusFilter}
                  onChange={(e) => setPatientStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:bg-white focus:outline-teal-700"
                >
                  <option value="All">All Statuses</option>
                  {(["Under Review", "Reverted", "Referred", "Scheduled", "Completed"] as MedicalPatientStatus[]).map((st) => (
                    <option key={st} value={st}>
                      Status: {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Basic Details Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 w-12 text-center">Sl no.</th>
                        <th className="py-3 px-4">Patient Name</th>
                        <th className="py-3 px-4">UHID</th>
                        <th className="py-3 px-4">Age / Gender</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Triage Priority</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredPatients.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-slate-400">
                            No matching patient records found.
                          </td>
                        </tr>
                      ) : (
                        filteredPatients.map((p, idx) => (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Sl no */}
                            <td className="py-3 px-4 text-center font-bold text-slate-400">
                              {String(idx + 1).padStart(2, "0")}
                            </td>

                            {/* Patient Name */}
                            <td className="py-3 px-4">
                              <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                            </td>

                            {/* UHID */}
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                {p.patientUhid}
                              </span>
                            </td>

                            {/* Age / Gender */}
                            <td className="py-3 px-4 text-slate-700">
                              {p.age} yrs • {p.gender}
                            </td>

                            {/* Contact */}
                            <td className="py-3 px-4 text-slate-600">
                              {p.phone}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3 text-center">
                              {getStatusBadge(p.status)}
                            </td>

                            {/* Priority */}
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(p.triagePriority)}`}>
                                {p.triagePriority}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedPatient(p)}
                                className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-700 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
                  </span>
                  <span className="text-[11px] text-slate-400">Basic details mode active</span>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* TAB: INBOUND HOSPITAL REFERRALS */}
          {activeTab === "referrals" && (
            <div className="space-y-6">
              {/* Top Header like Doctor/Patient/Nurse page (no box) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <ArrowRightLeft className="w-7 h-7 text-purple-700" />
                    <span>Inbound Hospital Referrals</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Patients transferred from other district CHCs, PHCs, and trauma units. Review clinical case notes and assign to on-duty facility specialists.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 flex items-center gap-2 shadow-2xs">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>{pendingReferralsCount} Awaiting Assignment</span>
                  </div>
                </div>
              </div>

              {/* Referrals Content Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Referred Patient Roster ({referrals.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Transferred under Odisha ABDM clinical referral protocol.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {["All", "Pending Assignment", "Assigned", "Scheduled"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setReferralFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          referralFilter === f
                            ? "bg-purple-800 text-white border-purple-800 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {f === "Pending Assignment" ? `⚠️ ${f} (${pendingReferralsCount})` : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Referrals Cards Grid */}
                <div className="space-y-4">
                  {filteredReferrals.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No inbound referral records matching filter.
                    </div>
                  ) : (
                    filteredReferrals.map((ref) => (
                      <div
                        key={ref.id}
                        className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                          ref.status === "Pending Assignment"
                            ? "bg-purple-50/30 border-purple-200 hover:border-purple-400 hover:shadow-xs"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {/* Top Row: UHID, Name, Priority, Referring facility */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-extrabold text-base text-slate-900">{ref.patientName}</span>
                            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              {ref.uhid}
                            </span>
                            <span className="text-xs text-slate-500">
                              {ref.age} yrs • {ref.gender} • {ref.phone}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(ref.priority)}`}>
                              {ref.priority}
                            </span>

                            {ref.status === "Pending Assignment" ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                                ⚠️ Awaiting Doctor
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {ref.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Referring Hospital & Doctor Source Badge */}
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Patient Consent Accepted
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-400">Referred by:</span>
                          <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {ref.referringDoctor}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Facility: {ref.referringHospital}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 text-[11px]">{ref.referredAt}</span>
                        </div>

                        {/* Clinical Directives */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="font-bold text-slate-800">
                            Chief Complaint: &ldquo;{ref.chiefComplaint}&rdquo;
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed">
                            {ref.clinicalNotes}
                          </p>
                        </div>

                        {/* Bottom Assignment Status / Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                          {ref.assignedDoctor ? (
                            <div className="text-xs text-slate-700 flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400">Assigned Specialist:</span>
                              <strong className="text-teal-900 font-bold">{ref.assignedDoctor}</strong>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-600 font-medium">{ref.assignedDepartment}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded text-[11px] font-semibold">{ref.assignedBay}</span>
                              {ref.assignedTimeline && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 rounded text-[11px]">{ref.assignedTimeline}</span>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>Patient awaiting internal doctor assignment to undergo under review process.</span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReferralToAssign(ref);
                              const defaultDoc = staffDoctors.find((d) => d.status === "Available") || staffDoctors[0];
                              if (defaultDoc) setAssignDoctorId(defaultDoc.id);
                              const now = new Date();
                              now.setMinutes(now.getMinutes() + 30);
                              setAssignTimeInput(toDateTimeLocalString(now));
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                              ref.status === "Pending Assignment"
                                ? "bg-teal-800 hover:bg-teal-900 text-white"
                                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <UserCheck className="w-3.5 h-3.5 text-teal-200" />
                            <span>{ref.status === "Pending Assignment" ? "Accept & Start Review" : "Reassign Doctor"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: FACILITY AVAILABILITY */}
          {activeTab === "facility" && (
            <div className="space-y-6">
              {/* Top Header like Doctor/Patient/Nurse page (no box) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Medical Facility &amp; Staff Availability
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Live bed occupancy telemetry, emergency resuscitation capacity, on-duty clinical specialist rosters, and critical hospital infrastructure readiness.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Station Fully Operational</span>
                  </div>
                </div>
              </div>

              {/* Bed Occupancy Telemetry Cards (5 Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Total Bed Capacity</span>
                    <Bed className="w-4 h-4 text-teal-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {facilityBeds.occupiedBeds} <span className="text-sm font-bold text-slate-400">/ {facilityBeds.totalBeds}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    {facilityBeds.totalBeds - facilityBeds.occupiedBeds} Beds Vacant ({Math.round(((facilityBeds.totalBeds - facilityBeds.occupiedBeds)/facilityBeds.totalBeds)*100)}%)
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-teal-700 h-1.5 rounded-full" style={{ width: `${(facilityBeds.occupiedBeds/facilityBeds.totalBeds)*100}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                    <span>Resuscitation Bays</span>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-rose-700">
                    {facilityBeds.emergencyBays.occupied} <span className="text-sm font-bold text-rose-400">/ {facilityBeds.emergencyBays.total}</span>
                  </div>
                  <div className="text-[11px] text-rose-800 font-bold">
                    {facilityBeds.emergencyBays.total - facilityBeds.emergencyBays.occupied} ER Bays Ready
                  </div>
                  <div className="w-full bg-rose-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.emergencyBays.occupied/facilityBeds.emergencyBays.total)*100}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                    <span>ICU / HDU Beds</span>
                    <HeartPulse className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-700">
                    {facilityBeds.icuBeds.occupied} <span className="text-sm font-bold text-amber-400">/ {facilityBeds.icuBeds.total}</span>
                  </div>
                  <div className="text-[11px] text-amber-800 font-bold">
                    {facilityBeds.icuBeds.total - facilityBeds.icuBeds.occupied} Critical Beds Vacant
                  </div>
                  <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.icuBeds.occupied/facilityBeds.icuBeds.total)*100}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                    <span>Oxygen Beds</span>
                    <Activity className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sky-700">
                    {facilityBeds.oxygenBeds.occupied} <span className="text-sm font-bold text-sky-400">/ {facilityBeds.oxygenBeds.total}</span>
                  </div>
                  <div className="text-[11px] text-sky-800 font-bold">
                    {facilityBeds.oxygenBeds.total - facilityBeds.oxygenBeds.occupied} High-Flow O2 Ready
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.oxygenBeds.occupied/facilityBeds.oxygenBeds.total)*100}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Duty Specialists</span>
                    <Users className="w-4 h-4 text-teal-700" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    {staffDoctors.filter((d) => d.status === "Available" || d.status === "On OPD Duty").length} <span className="text-sm font-bold text-slate-400">/ {staffDoctors.length}</span>
                  </div>
                  <div className="text-[11px] text-teal-800 font-bold">Active in Clinic / ER</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-teal-700 h-1.5 rounded-full" style={{ width: `${(staffDoctors.filter((d) => d.status !== "Off Duty").length/staffDoctors.length)*100}%` }} />
                  </div>
                </div>
              </div>

              {/* On-Duty Doctors & Specialists Roster */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-700" />
                      <span>On-Duty Clinical Specialists &amp; Doctors Roster</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Live duty status, consultation rooms, and assigned active patient caseload. Click &quot;Toggle Status&quot; to change doctor availability.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {["All", "Medicine", "Pediatrics", "Orthopedics", "Surgery", "Pulmonology"].map((sp) => (
                      <button
                        key={sp}
                        type="button"
                        onClick={() => setSelectedSpecialtyFilter(sp)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          selectedSpecialtyFilter === sp
                            ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {sp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDoctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                            {doc.name.replace(/^Dr\.\s*/i, "").split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 leading-tight">{doc.name}</div>
                            <div className="text-[11px] text-teal-800 font-semibold">{doc.specialty}</div>
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getDoctorStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Department:</span>
                          <span className="font-semibold text-slate-800">{doc.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Room:</span>
                          <span className="font-mono font-bold text-teal-900 bg-teal-50 px-1.5 rounded">{doc.room}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Shift Roster:</span>
                          <span className="text-slate-700">{doc.shift}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Active Cases:</span>
                          <span className="font-bold text-slate-900">{doc.activeCases} assigned</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                        <span className="text-[10px] text-slate-400 font-mono">{doc.phone}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleDoctorStatus(doc.id)}
                          className="px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:text-white bg-teal-50 hover:bg-teal-700 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Toggle Status ↻
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Hospital Infrastructure Readiness */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <Ambulance className="w-4 h-4" />
                    <span>108 ALS Ambulance</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">Stationed at Ramp</div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Advanced life support defibrillator, ventilator, and trained paramedic on call. Fuel: 95%.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Ready for Emergency Transfer
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                    <Activity className="w-4 h-4" />
                    <span>Central Medical Oxygen</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">4.2 Bar • 98.4% Purity</div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Liquid medical oxygen tank online + 18 back-up jumbo cylinders tested and staged at manifold.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    Manifold Normal
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Operation Theatres (OT)</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">Major OT 1 Active</div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Major OT 2 in standby readiness for emergency lap/cesarean. Minor OT available for trauma dressing.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Surgical Team Active
                  </span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
                    <Package className="w-4 h-4" />
                    <span>Jan Aushadhi Dispensary</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">24/7 Emergency Counter</div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Emergency resuscitative antibiotics, IV fluids, analgesics, and anti-diabetics fully stocked.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Adequate Formulary Stock
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              {/* Top Header like Doctor/Patient/Nurse page (no box) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Essential Drug &amp; Supplies Inventory
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    Jan Aushadhi Kendra dispensary stock register with batch tracking, expiry monitoring, threshold alerts, and depot replenishment.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <div className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs flex items-center gap-2">
                    <span className="text-slate-400">Total Formulations:</span>
                    <span className="text-teal-800 font-extrabold">{inventory.length}</span>
                  </div>
                  {lowStockCount > 0 && (
                    <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 shadow-2xs flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{lowStockCount} Low Stock</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight">
                      Dispensary Stock &amp; Batch Register
                    </h2>
                    <p className="text-xs text-slate-500">
                      Jan Aushadhi Kendra dispensary stock register with batch tracking and threshold monitoring.
                    </p>
                  </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {["ALL", "LOW", "ANTIBIOTIC", "ANALGESIC", "CARDIOVASCULAR", "ANTIDIABETIC"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInventoryCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        inventoryCatFilter === cat
                          ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat === "LOW" ? "⚠️ Low Stock" : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Drug Code</th>
                        <th className="py-3 px-4">Generic Formulation</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 text-center">Batch / Expiry</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-mono font-bold text-teal-800">{item.drugCode}</td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-slate-900 block text-xs">{item.genericName}</span>
                            <span className="text-[10px] text-slate-400">{item.brandName}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{item.category}</td>
                          <td className="py-3 px-4 text-center font-mono text-[11px] text-slate-600">
                            {item.batchNumber} • {item.expiryDate}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-sm ${item.currentStock < item.threshold ? "text-rose-700" : "text-slate-900"}`}>
                              {item.currentStock}
                            </span>{" "}
                            <span className="text-[10px] text-slate-400">{item.unit}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRestock(item.id)}
                              className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              + Restock 500
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          )}
        </main>
      </div>

      {/* QUICK MODAL: VIEW PATIENT BASIC DETAILS */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedPatient.name}</h3>
                  <span className="font-mono text-xs text-teal-800 font-bold">{selectedPatient.patientUhid}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Age / Gender</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedPatient.age} yrs • {selectedPatient.gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Status</span>
                <div className="mt-1">
                  {getStatusBadge(selectedPatient.status)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Contact Phone</span>
                <span className="font-bold text-slate-800 mt-0.5 block">{selectedPatient.phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Triage Priority</span>
                <span className={`font-bold mt-0.5 inline-block text-[11px] ${getPriorityBadgeClass(selectedPatient.triagePriority)}`}>
                  {selectedPatient.triagePriority}
                </span>
              </div>
              <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Care Status &amp; Ward</span>
                <span className="font-bold text-teal-800 mt-0.5 block">
                  {selectedPatient.status} {selectedPatient.unitOrWard ? `• ${selectedPatient.unitOrWard}` : ""}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN INBOUND REFERRAL TO DOCTOR */}
      {selectedReferralToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Assign Inbound Referral to Doctor</h3>
                  <p className="text-xs text-slate-500">Route patient to on-duty specialist &amp; allocate OPD/bay.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReferralToAssign(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inbound Referral Patient Card */}
            <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedReferralToAssign.patientName}</span>
                  <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded ml-2 border border-purple-200">
                    {selectedReferralToAssign.uhid}
                  </span>
                </div>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(selectedReferralToAssign.priority)}`}>
                  {selectedReferralToAssign.priority}
                </span>
              </div>
              <div className="text-slate-600 flex items-center gap-3 text-[11px] flex-wrap">
                <span>{selectedReferralToAssign.age} yrs • {selectedReferralToAssign.gender}</span>
                <span>•</span>
                <span>Phone: {selectedReferralToAssign.phone}</span>
                <span>•</span>
                <span>Referred from: <strong className="text-purple-950 font-bold">{selectedReferralToAssign.referringHospital}</strong></span>
              </div>
              <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200/60">
                <span className="text-[10px] uppercase font-bold text-purple-800 block mb-0.5">
                  Referring Physician Directives ({selectedReferralToAssign.referringDoctor}):
                </span>
                <p className="italic text-slate-700 leading-relaxed">&ldquo;{selectedReferralToAssign.clinicalNotes}&rdquo;</p>
              </div>
            </div>

            {/* Assignment Form */}
            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              {/* Doctor Selection */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  Doctor Name <span className="text-rose-600">*</span>
                </label>
                <select
                  value={assignDoctorId}
                  onChange={(e) => setAssignDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700 transition-colors"
                >
                  {staffDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} • {doc.specialty} ({doc.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Consultation Timeline */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                  Consultation Timeline <span className="text-rose-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={assignTimeInput}
                  onChange={(e) => setAssignTimeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:outline-teal-700 transition-colors"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReferralToAssign(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-teal-200" />
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER PATIENT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Register Patient to Facility</h3>
                  <p className="text-xs text-slate-500">Record basic demographic details.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Patient Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter patient name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    UHID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUhid}
                    onChange={(e) => setNewUhid(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={newAge}
                    onChange={(e) => setNewAge(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as MedicalPatientStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                  >
                    {(["Under Review", "Reverted", "Referred", "Scheduled", "Completed"] as MedicalPatientStatus[]).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Triage Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                >
                  <option value="Immediate">Immediate Priority</option>
                  <option value="Urgent">Urgent Priority</option>
                  <option value="Less Urgent">Less Urgent</option>
                  <option value="Routine / Fit">Routine / Fit</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold cursor-pointer"
                >
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
