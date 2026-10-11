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
  Building2,
  Menu,
  X,
  Search,
  LogOut,
  Stethoscope,
  CheckCircle2,
  ArrowRightLeft,
} from "lucide-react";
import {
  MedicalNavTab,
  MedicalPatientStatus,
  BasicMedicalPatient,
  HospitalReferral,
  FacilityDoctorStaff,
  FacilityBeds,
  InventoryItem,
  toDateTimeLocalString,
  mapToStandardStatus,
  MedicalDashboardTab,
  MedicalPatientsTab,
  MedicalReferralsTab,
  MedicalFacilityTab,
  MedicalInventoryTab,
  MedicalPatientDetailModal,
  MedicalReferralAssignModal,
  MedicalRegisterPatientModal,
} from "@/components/medical";

export type {
  MedicalNavTab,
  MedicalPatientStatus,
  BasicMedicalPatient,
  HospitalReferral,
  FacilityDoctorStaff,
};

const INITIAL_PATIENTS: BasicMedicalPatient[] = [];
const INITIAL_INVENTORY: InventoryItem[] = [];
const INITIAL_REFERRALS: HospitalReferral[] = [];
const FACILITY_DOCTORS: FacilityDoctorStaff[] = [];

const STORAGE_KEY = "triage_medical_basic_patients";
const REFERRALS_STORAGE_KEY = "triage_medical_inbound_referrals";

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
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("facility-medical-live-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "triage_tickets" },
          () => {
            loadRealData();
          }
        )
        .subscribe();
    }

    // Auto-refresh interval (every 6 seconds) as fallback so data is always fresh
    const pollInterval = setInterval(() => {
      loadRealData();
    }, 6000);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(pollInterval);
    };
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
    const targetRefId = selectedReferralToAssign.id;

    // Optimistic UI: immediately close modal and update local referral card
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === targetRefId
          ? {
              ...r,
              status: "Assigned",
              assignedDoctor: chosenDoctor.name,
              scheduleTime: scheduledIso,
              assignedTimeline: new Date(scheduledIso).toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            }
          : r
      )
    );
    setStaffDoctors((prev) =>
      prev.map((d) => (d.id === chosenDoctor.id ? { ...d, activeCases: d.activeCases + 1 } : d))
    );
    setSelectedReferralToAssign(null);
    triggerToast(`Inbound referral accepted & assigned to ${chosenDoctor.name}.`);

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
        .eq("id", targetRefId);

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

  const openAssignModal = (ref: HospitalReferral) => {
    setSelectedReferralToAssign(ref);
    const defaultDoc = staffDoctors.find((d) => d.status === "Available") || staffDoctors[0];
    if (defaultDoc) setAssignDoctorId(defaultDoc.id);
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    setAssignTimeInput(toDateTimeLocalString(now));
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
    <div className="flex min-h-screen bg-[#F3F9F7] text-slate-800 antialiased font-sans">
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

      {/* LEFT SIDEBAR (Doctor-style soft blue layout #ffffff) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-[#ffffff] text-slate-800 flex flex-col justify-between border-r border-blue-200/70 transition-transform duration-200 ${
          mobileSidebarOpen ? "translate-x-0 shadow-2xl z-50" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Brand Header */}
          <div className="p-4 border-b border-blue-200/60 flex items-center justify-between shrink-0">
            <Link href="/medical" className="flex items-center gap-2.5 group">
              <img
                src="/traaya-logo.png"
                alt="TRAAYA Logo"
                className="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-black text-base tracking-tight text-slate-900 leading-tight">
                  TRAAYA
                </span>
                <span className="text-[10px] font-semibold text-teal-800 tracking-wide leading-none mt-0.5">
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
            <MedicalDashboardTab
              staffName={staffName}
              patients={patients}
              pendingReferralsCount={pendingReferralsCount}
              facilityBeds={facilityBeds}
              immediateCount={immediateCount}
              inventory={inventory}
              onRegisterPatient={() => setShowAddModal(true)}
              onViewPatients={() => setActiveTab("patients")}
              onViewReferrals={() => setActiveTab("referrals")}
              onViewInventory={() => setActiveTab("inventory")}
              onRestock={handleRestock}
              getStatusBadge={getStatusBadge}
            />
          )}

          {/* TAB 2: PATIENTS DIRECTORY */}
          {activeTab === "patients" && (
            <MedicalPatientsTab
              patients={patients}
              filteredPatients={filteredPatients}
              patientPriorityFilter={patientPriorityFilter}
              setPatientPriorityFilter={setPatientPriorityFilter}
              patientStatusFilter={patientStatusFilter}
              setPatientStatusFilter={setPatientStatusFilter}
              onRegisterPatient={() => setShowAddModal(true)}
              onExportCensus={handleExportCensus}
              onSelectPatient={(p) => setSelectedPatient(p)}
              getStatusBadge={getStatusBadge}
            />
          )}

          {/* TAB 3: INBOUND REFERRALS */}
          {activeTab === "referrals" && (
            <MedicalReferralsTab
              referrals={referrals}
              filteredReferrals={filteredReferrals}
              referralFilter={referralFilter}
              setReferralFilter={setReferralFilter}
              pendingReferralsCount={pendingReferralsCount}
              onAssignReferral={(ref) => openAssignModal(ref)}
            />
          )}

          {/* TAB 4: FACILITY TELEMETRY & DOCTORS */}
          {activeTab === "facility" && (
            <MedicalFacilityTab
              facilityBeds={facilityBeds}
              staffDoctors={staffDoctors}
              filteredDoctors={filteredDoctors}
              selectedSpecialtyFilter={selectedSpecialtyFilter}
              setSelectedSpecialtyFilter={setSelectedSpecialtyFilter}
              onToggleDoctorStatus={handleToggleDoctorStatus}
            />
          )}

          {/* TAB 5: INVENTORY */}
          {activeTab === "inventory" && (
            <MedicalInventoryTab
              inventory={inventory}
              filteredInventory={filteredInventory}
              inventoryCatFilter={inventoryCatFilter}
              setInventoryCatFilter={setInventoryCatFilter}
              lowStockCount={lowStockCount}
              onRestock={handleRestock}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: PATIENT DETAIL */}
      <MedicalPatientDetailModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
        getStatusBadge={getStatusBadge}
      />

      {/* MODAL 2: ASSIGN INBOUND REFERRAL */}
      <MedicalReferralAssignModal
        referral={selectedReferralToAssign}
        staffDoctors={staffDoctors}
        assignDoctorId={assignDoctorId}
        setAssignDoctorId={setAssignDoctorId}
        assignTimeInput={assignTimeInput}
        setAssignTimeInput={setAssignTimeInput}
        onConfirmAssignment={handleConfirmAssignment}
        onClose={() => setSelectedReferralToAssign(null)}
      />

      {/* MODAL 3: REGISTER PATIENT */}
      <MedicalRegisterPatientModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPatientSubmit}
        newName={newName}
        setNewName={setNewName}
        newUhid={newUhid}
        setNewUhid={setNewUhid}
        newPhone={newPhone}
        setNewPhone={setNewPhone}
        newAge={newAge}
        setNewAge={setNewAge}
        newGender={newGender}
        setNewGender={setNewGender}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        newPriority={newPriority}
        setNewPriority={setNewPriority}
      />
    </div>
  );
}
