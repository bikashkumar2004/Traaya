"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { submitLiveNurseAction, fetchRegisteredFacilities, RegisteredFacilityOption } from "@/lib/nurse-api";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  History,
  Search,
  CheckCircle2,
  Calendar,
  Stethoscope,
  Pill,
  Building2,
  FileText,
  Printer,
  ShieldCheck,
  ArrowRight,
  ArrowRightLeft,
  ArrowLeft,
  Clock,
  Video,
  Eye,
  User,
  Activity,
  AlertTriangle,
  X,
  HeartPulse,
  Sparkles,
  Check,
  Languages
} from "lucide-react";

export interface ReviewedCaseRecord extends CaseDetails {
  category?: string;
  doctorNotes?: string;
  doctorDecision?: string;
  prescriptions?: string;
  reviewedAt?: string;
  attendingDoctor?: string;
}

interface DoctorReviewHistoryViewProps {
  reviewedCases: ReviewedCaseRecord[];
  currentDoctorId?: string;
  onSelectCase?: (caseItem: CaseDetails) => void;
  onUpdateCase?: (updatedCase: ReviewedCaseRecord) => void;
}

export function resolveCategory(c: ReviewedCaseRecord): string {
  if (c.category) {
    if (c.category.toLowerCase().includes("refer")) return "Referred";
    return "Complete";
  }
  const s = `${c.status || ""} ${c.doctorDecision || ""}`.toLowerCase();
  if (s.includes("refer")) {
    return "Referred";
  }
  return "Complete";
}

function getStatusConfig(status?: string, decision?: string, category?: string) {
  const s = `${category || ""} ${status || ""} ${decision || ""}`.toLowerCase();

  if (s.includes("under review") || (decision && (decision.toLowerCase().includes("confirm triage") || decision.toLowerCase().includes("admit") || decision.toLowerCase().includes("ward")))) {
    return {
      label: "Under Review",
      category: "Under Review",
      icon: Clock,
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      iconClass: "text-amber-600",
      categoryBadgeClass: "bg-amber-100 text-amber-900 border-amber-300",
    };
  }
  if (s.includes("complete") || s.includes("prescription") || s.includes("rx")) {
    return {
      label: "Complete",
      category: "Complete",
      icon: CheckCircle2,
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-300",
      iconClass: "text-emerald-600",
      categoryBadgeClass: "bg-emerald-100 text-emerald-900 border-emerald-300",
    };
  }
  if (s.includes("refer")) {
    return {
      label: "Referred",
      category: "Referred",
      icon: ArrowRightLeft,
      badgeClass: "bg-indigo-50 text-indigo-900 border-indigo-300",
      iconClass: "text-indigo-600",
      categoryBadgeClass: "bg-indigo-100 text-indigo-900 border-indigo-300",
    };
  }
  if (s.includes("ward") || s.includes("admitted") || s.includes("observation")) {
    return {
      label: "Admitted to Ward",
      category: "Admitted",
      icon: Building2,
      badgeClass: "bg-sky-50 text-sky-900 border-sky-300",
      iconClass: "text-sky-600",
      categoryBadgeClass: "bg-sky-100 text-sky-900 border-sky-300",
    };
  }
  if (s.includes("teleconsult") || s.includes("video")) {
    return {
      label: "Teleconsultation Conducted",
      category: "Teleconsultation",
      icon: Video,
      badgeClass: "bg-blue-50 text-blue-900 border-blue-300",
      iconClass: "text-blue-600",
      categoryBadgeClass: "bg-blue-100 text-blue-900 border-blue-300",
    };
  }

  return {
    label: status || "Complete",
    category: "Complete",
    icon: ShieldCheck,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
    iconClass: "text-slate-600",
    categoryBadgeClass: "bg-slate-100 text-slate-900 border-slate-300",
  };
}

function getPriorityConfig(urgency?: string, urgencyClass?: string, aiPriority?: string) {
  const combined = `${urgency || ""} ${urgencyClass || ""} ${aiPriority || ""}`.toLowerCase();

  // 1. Immediate
  if (
    combined.includes("immediate") ||
    combined.includes("immidiate") ||
    combined.includes("red") ||
    combined.includes("emergency") ||
    combined.includes("critical") ||
    combined.includes("high")
  ) {
    return {
      label: "Immediate",
      badgeClass: "bg-rose-50 text-rose-900 border-rose-300",
      iconClass: "text-rose-600",
      icon: AlertTriangle,
    };
  }

  // 2. Urgent / Yellow Priority
  if (
    combined.includes("yellow") ||
    (combined.includes("urgent") && !combined.includes("less urgent")) ||
    combined.includes("priority 2") ||
    combined.includes("priority 3") ||
    combined.includes("moderate") ||
    combined.includes("medium")
  ) {
    return {
      label: "Urgent",
      badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
      iconClass: "text-amber-600",
      icon: Clock,
    };
  }

  // 3. Less Urgent / Green Priority
  if (
    combined.includes("green") ||
    combined.includes("less urgent") ||
    combined.includes("routine") ||
    combined.includes("non-urgent") ||
    combined.split(/\s+/).includes("low")
  ) {
    return {
      label: "Less Urgent",
      badgeClass: "bg-emerald-50 text-emerald-900 border-emerald-300",
      iconClass: "text-emerald-600",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Urgent",
    badgeClass: "bg-amber-50 text-amber-900 border-amber-300",
    iconClass: "text-amber-600",
    icon: Clock,
  };
}

function extractActionDetails(notes?: string) {
  if (!notes) return { cleanNotes: "", timeline: null, referral: null, ward: null, teleconsult: false };

  let timeline: string | null = null;
  let referral: string | null = null;
  let ward: string | null = null;
  let teleconsult = false;

  const timelineMatch = notes.match(/\[Hospital Checkup Timeline\]:\s*([^\n]+)/);
  if (timelineMatch) timeline = timelineMatch[1].trim();

  const referralMatch = notes.match(/\[Referred Hospital\/Facility\]:\s*([^\n]+)/);
  if (referralMatch) referral = referralMatch[1].trim();

  const wardMatch = notes.match(/\[Inpatient Admission\]:\s*([^\n]+)/);
  if (wardMatch) ward = wardMatch[1].trim();

  if (notes.includes("[Teleconsultation]")) {
    teleconsult = true;
  }

  // Clean notes from internal tags
  const cleanNotes = notes
    .replace(/\[Hospital Checkup Timeline\]:\s*[^\n]+/g, "")
    .replace(/\[Referred Hospital\/Facility\]:\s*[^\n]+/g, "")
    .replace(/\[Inpatient Admission\]:\s*[^\n]+/g, "")
    .replace(/\[Ward Care Notes\]:\s*[^\n]+/g, "")
    .replace(/\[Prescription Issued\]:\s*[^\n]+/g, "")
    .replace(/\[Teleconsultation\]:[^\n]+/g, "")
    .trim();

  return { cleanNotes, timeline, referral, ward, teleconsult };
}

export function DoctorReviewHistoryView({
  reviewedCases,
  currentDoctorId,
  onSelectCase,
  onUpdateCase,
}: DoctorReviewHistoryViewProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCaseToPrint, setSelectedCaseToPrint] = useState<ReviewedCaseRecord | null>(null);
  const [selectedCaseToReview, setSelectedCaseToReview] = useState<ReviewedCaseRecord | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<string>("Overview");

  // In-Person Checkup & Prescribe state for arriving patients
  const [isInPersonModalOpen, setIsInPersonModalOpen] = useState(false);
  const [examNotes, setExamNotes] = useState("");
  const [disposition, setDisposition] = useState<"Issue e-Prescription & Discharge" | "Admit to Ward" | "Refer to Hospital">("Issue e-Prescription & Discharge");
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // 1. e-Prescription dynamic inputs
  const [checkupMedName, setCheckupMedName] = useState("Tab Amoxicillin-Clav 625mg");
  const [checkupMedDose, setCheckupMedDose] = useState("625mg (1 Tablet)");
  const [checkupMedFrequency, setCheckupMedFrequency] = useState("BD (Twice daily) x 5 days");
  const [checkupAdditionalMed, setCheckupAdditionalMed] = useState("Inj. Tetanus Toxoid 0.5ml IM Stat\nTab Paracetamol 500mg SOS x 3 days");

  // 2. Refer to Hospital dynamic inputs strictly from database
  const [availableFacilities, setAvailableFacilities] = useState<RegisteredFacilityOption[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [checkupReferralFacilityId, setCheckupReferralFacilityId] = useState("");
  const [checkupReferralHospital, setCheckupReferralHospital] = useState("");
  const [checkupReferralReason, setCheckupReferralReason] = useState("Specialty clinical management and secondary trauma assessment required.");

  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      setLoadingFacilities(true);
      try {
        const facs = await fetchRegisteredFacilities();
        if (isMounted) {
          setAvailableFacilities(facs);
          if (facs.length > 0) {
            setCheckupReferralFacilityId(facs[0].id);
            setCheckupReferralHospital(facs[0].name);
          }
        }
      } catch (err) {
        console.warn("[DoctorHistory] Error loading registered facilities:", err);
      } finally {
        if (isMounted) setLoadingFacilities(false);
      }
    }
    loadFacilities();
    return () => { isMounted = false; };
  }, []);

  // 3. Admit to Ward dynamic inputs
  const [checkupWardUnit, setCheckupWardUnit] = useState("Emergency Observation Unit (Bed 04)");
  const [checkupWardCareNotes, setCheckupWardCareNotes] = useState("Admit for 24-hour observation, vitals monitoring, and regular antiseptic dressing.");

  const isAwaitingCheckup = (c?: ReviewedCaseRecord | null) => {
    if (!c) return false;
    const decision = (c.doctorDecision || "").toLowerCase();
    const status = (c.status || "").toLowerCase();
    // If the decision was already Admit to Ward, or Issue e-Prescription & Discharge, or Refer, checkup is done
    if (
      decision.includes("admit") ||
      decision.includes("ward") ||
      decision.includes("discharge") ||
      decision.includes("prescription") ||
      decision.includes("refer")
    ) {
      return false;
    }
    const hasPrescription = !!(c.prescriptions && c.prescriptions.trim().length > 0);
    return (status.includes("under review") || decision.includes("confirm triage")) && !hasPrescription;
  };

  const handleOpenCheckup = (c: ReviewedCaseRecord) => {
    setExamNotes(
      c.chiefComplaint.toLowerCase().includes("abrasion") || c.chiefComplaint.toLowerCase().includes("cut")
        ? "Wound inspected: 2cm clean superficial laceration on right forearm. Antiseptic betadine dressing completed. Patient afebrile, vitals normal."
        : `Physical examination completed for ${c.name}. Vitals normal. Patient oriented and responsive. Cleared for prescribed therapy.`
    );
    setCheckupMedName(
      c.chiefComplaint.toLowerCase().includes("cut") || c.chiefComplaint.toLowerCase().includes("abrasion")
        ? "Tab Amoxicillin-Clav 625mg"
        : "Tab Paracetamol 500mg"
    );
    setCheckupMedDose(
      c.chiefComplaint.toLowerCase().includes("cut") || c.chiefComplaint.toLowerCase().includes("abrasion")
        ? "625mg (1 Tablet)"
        : "500mg (1 Tablet)"
    );
    setCheckupMedFrequency(
      c.chiefComplaint.toLowerCase().includes("cut") || c.chiefComplaint.toLowerCase().includes("abrasion")
        ? "BD (Twice daily) after food x 5 days"
        : "TDS (3 times daily) x 3 days"
    );
    setCheckupAdditionalMed(
      c.chiefComplaint.toLowerCase().includes("cut") || c.chiefComplaint.toLowerCase().includes("abrasion")
        ? "Inj. Tetanus Toxoid 0.5ml IM Stat\nTab Paracetamol 500mg SOS x 3 days"
        : "Tab Cetirizine 10mg OD HS x 5 days"
    );
    if (c.referalFacilityId) {
      setCheckupReferralFacilityId(c.referalFacilityId);
      const match = availableFacilities.find((f) => f.id === c.referalFacilityId);
      if (match) setCheckupReferralHospital(match.name);
    } else if (c.referalFacility) {
      const match = availableFacilities.find((f) => f.name.toLowerCase().includes(c.referalFacility!.toLowerCase()));
      if (match) {
        setCheckupReferralFacilityId(match.id);
        setCheckupReferralHospital(match.name);
      }
    } else if (availableFacilities.length > 0) {
      setCheckupReferralFacilityId(availableFacilities[0].id);
      setCheckupReferralHospital(availableFacilities[0].name);
    }
    setCheckupReferralReason("Specialty surgical/orthopedic evaluation and secondary care.");
    setCheckupWardUnit("Emergency Observation Unit (Bed 04)");
    setCheckupWardCareNotes("Admit for 24-hour observation, vitals monitoring, and regular antiseptic dressing.");
    setDisposition("Issue e-Prescription & Discharge");
    setIsInPersonModalOpen(true);
  };

  const handleCompleteCheckup = () => {
    if (!selectedCaseToReview) return;

    let finalStatus = "Complete";
    let finalCategory = "Complete";
    let finalDecision = "Issue e-Prescription & Discharge";
    let finalPrescriptions = "";
    let finalNotes = examNotes.trim();

    if (disposition === "Issue e-Prescription & Discharge") {
      finalStatus = "Complete";
      finalCategory = "Complete";
      finalDecision = "Issue e-Prescription & Discharge";
      finalPrescriptions = `1. ${checkupMedName} | Dose: ${checkupMedDose} | Frequency: ${checkupMedFrequency}`;
      if (checkupAdditionalMed.trim()) {
        const additionalLines = checkupAdditionalMed
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean);
        additionalLines.forEach((l, idx) => {
          const num = idx + 2;
          finalPrescriptions += `\n${num}. ${l.replace(/^\d+[\.\)]\s*/, "")}`;
        });
      }
      finalNotes = `${finalNotes}\n\n[Prescription Issued]: ${checkupMedName} (${checkupMedDose}, ${checkupMedFrequency})`;
    } else if (disposition === "Admit to Ward") {
      // User requirement: status remains Under Review, Action Taken is Admit to Ward
      finalStatus = "Under Review";
      finalCategory = "Under Review";
      finalDecision = "Admit to Ward";
      finalPrescriptions = "";
      finalNotes = `${finalNotes}\n\n[Inpatient Admission]: ${checkupWardUnit}\n[Ward Care Notes]: ${checkupWardCareNotes}`;
    } else if (disposition === "Refer to Hospital") {
      const chosenFac = availableFacilities.find((f) => f.id === checkupReferralFacilityId);
      const destination = chosenFac?.name || checkupReferralHospital || "Referral Medical Facility";
      finalStatus = "Referred";
      finalCategory = "Referred";
      finalDecision = "Refer to Hospital";
      finalPrescriptions = "";
      finalNotes = `${finalNotes}\n\n[Referred Hospital/Facility]: ${destination}\n[Referral Reason]: ${checkupReferralReason}`;
    }

    const chosenFac = availableFacilities.find((f) => f.id === checkupReferralFacilityId);
    const destination =
      disposition === "Refer to Hospital"
        ? (chosenFac?.name || checkupReferralHospital || "Referral Medical Facility")
        : undefined;

    const finalFacilityId =
      disposition === "Refer to Hospital"
        ? (checkupReferralFacilityId || chosenFac?.id)
        : undefined;

    // Resolve active doctor profile ID & name
    let activeDoctorId = user?.id;
    let activeDoctorName = user?.fullName || selectedCaseToReview.attendingDoctor || "Dr. Ramesh Chandra Mohanty";
    if (!activeDoctorId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("triageassist_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          activeDoctorId = parsed?.id;
          activeDoctorName = parsed?.fullName || activeDoctorName;
        }
      } catch {
        // ignore
      }
    }

    const updatedCase: ReviewedCaseRecord = {
      ...selectedCaseToReview,
      status: finalStatus,
      category: finalCategory,
      doctorDecision: finalDecision,
      doctorNotes: finalNotes,
      prescriptions: finalPrescriptions,
      reviewedAt: "Just now (In-person checkup)",
      attendingDoctor: activeDoctorName,
      referalFacility: destination || selectedCaseToReview.referalFacility,
      referalFacilityId: finalFacilityId || selectedCaseToReview.referalFacilityId,
      transferReason: (disposition === "Refer to Hospital" ? checkupReferralReason : undefined) || selectedCaseToReview.transferReason,
    };

    setSelectedCaseToReview(updatedCase);
    onUpdateCase?.(updatedCase);

    // Persist to live Supabase / triage_tickets table with doctor_id and referal_facility_id
    submitLiveNurseAction({
      case_number: selectedCaseToReview.id,
      action_type: finalDecision,
      review_note: disposition === "Refer to Hospital" ? checkupReferralReason.trim() : finalNotes,
      target_status: finalStatus,
      assigned_doctor_name: activeDoctorName,
      doctor_id: activeDoctorId,
      doctor_name: activeDoctorName,
      referal_facility: destination,
      referral_destination: destination,
      referal_facility_id: finalFacilityId,
      transfer_reason: disposition === "Refer to Hospital" ? checkupReferralReason.trim() : undefined,
    }).catch(() => {});

    setIsInPersonModalOpen(false);
    setSuccessToast(`Clinical action recorded: ${finalDecision} for Case ${updatedCase.id}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Resolve active doctor ID
  let activeDoctorId = currentDoctorId || user?.id;
  if (!activeDoctorId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeDoctorId = parsed?.id || parsed?.userId;
      }
    } catch {}
  }

  // Strictly filter reviewed cases by activeDoctorId so other doctors' cases are never displayed
  const doctorCases = reviewedCases.filter((c) => {
    if (activeDoctorId) {
      return Boolean(c.doctorId && c.doctorId === activeDoctorId);
    }
    return true;
  });

  // Available categories with counts (All Categories, Complete, Referred)
  const categories = ["All", "Complete", "Referred"];
  const getCategoryCount = (cat: string) => {
    if (cat === "All") return doctorCases.length;
    return doctorCases.filter((c) => resolveCategory(c) === cat).length;
  };

  const filteredHistory = doctorCases.filter((c) => {
    const cat = resolveCategory(c);
    const matchesCategory =
      selectedCategory === "All" || cat.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.doctorDecision || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.doctorNotes || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Helper for Print Slip Modal
  const renderPrintSlipModal = () => {
    if (!selectedCaseToPrint) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
          <div className="text-center border-b border-slate-200 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-teal-800">
              Government of Odisha &bull; Health &amp; Family Welfare
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              District Civil Hospital &bull; Clinical Triage Summary
            </h3>
            <p className="text-xs text-slate-500">ABDM Digital Health Record &bull; 256-bit AES Token</p>
          </div>

          <div className="text-xs space-y-2 border-b border-slate-200 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Case Number:</span>
              <span className="font-bold">{selectedCaseToPrint.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold">{selectedCaseToPrint.name} ({selectedCaseToPrint.age}y &bull; {selectedCaseToPrint.gender})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UHID:</span>
              <span className="font-bold">{selectedCaseToPrint.patientId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Decision:</span>
              <span className="font-bold text-emerald-700">{selectedCaseToPrint.doctorDecision || "Accepted & Cleared"}</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-500 block">Assessment:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{selectedCaseToPrint.doctorNotes || "Cleared for standard treatment"}</p>
            </div>
            {selectedCaseToPrint.prescriptions && (
              <div className="pt-1">
                <span className="text-slate-500 block">Prescription:</span>
                <pre className="font-mono text-slate-800 text-[11px] whitespace-pre-wrap mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">{selectedCaseToPrint.prescriptions}</pre>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Attending MO: <strong>Dr. Kavita Verma, MD</strong></span>
            <span>Reg: <strong>MCI-2012-09412</strong></span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedCaseToPrint(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper for In-Person Clinical Checkup Modal
  const renderInPersonCheckupModal = () => {
    if (!isInPersonModalOpen || !selectedCaseToReview) return null;
    return (
      <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
                <span>Patient In-Person Arrival Check-in</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Conduct In-Person Checkup &amp; Prescribe
              </h3>
              <p className="text-xs text-slate-500">
                {selectedCaseToReview.name} ({selectedCaseToReview.age}y &bull; {selectedCaseToReview.gender}) &bull; UHID: {selectedCaseToReview.patientId} &bull; Case {selectedCaseToReview.id}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsInPersonModalOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600 uppercase text-[10px]">Triage Chief Complaint:</span>
            <p className="text-slate-800 font-semibold mt-0.5">{selectedCaseToReview.chiefComplaint}</p>
          </div>

          {/* 1. Physical Examination Findings */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
              <span>Physical Examination Findings &amp; Clinical Assessment</span>
            </label>
            <textarea
              rows={3}
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              placeholder="Record vitals, wound condition, examination findings, and clinical diagnosis..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-teal-600 focus:border-teal-600 resize-none font-medium leading-relaxed bg-white"
            />
          </div>

          {/* 2. Clinical Disposition & Outcome (PRESENT ABOVE e-Prescription) */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Clinical Disposition &amp; Outcome</span>
              <span className="text-[10px] text-teal-700 font-semibold">Select clinical action</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: "Issue e-Prescription & Discharge" as const,
                  label: "e-Prescription & Discharge",
                  desc: "Prescribe medicines & outpatient discharge",
                  icon: Pill,
                  activeColor: "bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600",
                },
                {
                  id: "Admit to Ward" as const,
                  label: "Admit to Ward",
                  desc: "Inpatient bed (Status: Under Review)",
                  icon: Building2,
                  activeColor: "bg-sky-50 border-sky-600 text-sky-950 ring-1 ring-sky-600",
                },
                {
                  id: "Refer to Hospital" as const,
                  label: "Refer to Hospital",
                  desc: "Transfer to higher trauma center",
                  icon: ArrowRightLeft,
                  activeColor: "bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600",
                },
              ].map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = disposition === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDisposition(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? opt.activeColor
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-slate-900" : "text-slate-500"}`} />
                      <span className="font-bold text-xs">{opt.label}</span>
                    </div>
                    <span className="text-[10px] opacity-75 mt-1 leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DYNAMIC INPUTS BASED ON CLINICAL DISPOSITION */}

          {/* Option 1: e-Prescription & Discharge inputs */}
          {disposition === "Issue e-Prescription & Discharge" && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-teal-700" />
                  <span>e-Prescription &amp; Medication Formulation</span>
                </label>
                <span className="text-[10px] text-teal-800 font-semibold">Formulation for dispensary</span>
              </div>

              {/* Quick suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[
                  { name: "Tab Amoxicillin-Clav 625mg", dose: "625mg (1 Tablet)", freq: "BD (Twice daily) x 5 days" },
                  { name: "Inj. Tetanus Toxoid", dose: "0.5ml IM Stat", freq: "STAT (Immediate)" },
                  { name: "Tab Paracetamol 500mg", dose: "500mg (1 Tablet)", freq: "SOS (As needed) x 3 days" },
                  { name: "Tab Pantoprazole 40mg", dose: "40mg (1 Tablet)", freq: "OD (Once daily AC) x 5 days" },
                  { name: "Antiseptic Betadine Dressing", dose: "Local application", freq: "Once daily x 3 days" },
                ].map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCheckupMedName(item.name);
                      setCheckupMedDose(item.dose);
                      setCheckupMedFrequency(item.freq);
                    }}
                    className="px-2 py-1 bg-white hover:bg-teal-100 hover:text-teal-950 border border-teal-200 rounded-md text-[10px] font-semibold text-teal-900 transition-colors cursor-pointer"
                  >
                    + {item.name.replace("Tab ", "").replace("Inj. ", "")}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Medicine Name */}
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Medicine Name
                  </label>
                  <input
                    type="text"
                    value={checkupMedName}
                    onChange={(e) => setCheckupMedName(e.target.value)}
                    placeholder="e.g. Tab Amoxicillin-Clav 625mg"
                    className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                  />
                </div>

                {/* Dose */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Dose &amp; Strength
                  </label>
                  <input
                    type="text"
                    value={checkupMedDose}
                    onChange={(e) => setCheckupMedDose(e.target.value)}
                    placeholder="e.g. 625mg (1 Tablet)"
                    className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                  />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={checkupMedFrequency}
                    onChange={(e) => setCheckupMedFrequency(e.target.value)}
                    placeholder="e.g. BD x 5 days"
                    className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                  />
                </div>
              </div>

              {/* Frequency Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-teal-800 font-bold">Frequency Presets:</span>
                {["OD (Once daily)", "BD (Twice daily)", "TDS (3x daily)", "SOS (As needed)"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setCheckupMedFrequency(`${f} x 3 days`)}
                    className="px-2 py-0.5 text-[10px] bg-white border border-teal-200 hover:bg-teal-100 text-teal-900 rounded-md font-semibold cursor-pointer"
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Additional Prescriptions */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Additional Prescriptions / Specific Instructions
                </label>
                <textarea
                  rows={2}
                  value={checkupAdditionalMed}
                  onChange={(e) => setCheckupAdditionalMed(e.target.value)}
                  placeholder="e.g. Inj. Tetanus Toxoid 0.5ml IM Stat&#10;Tab Paracetamol 500mg SOS x 3 days"
                  className="w-full p-2.5 font-mono border border-teal-300 rounded-xl text-xs text-slate-800 focus:outline-teal-600 resize-none leading-relaxed bg-white"
                />
              </div>
            </div>
          )}

          {/* Option 2: Refer to Hospital inputs */}
          {disposition === "Refer to Hospital" && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Choose Medical Center to Refer</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Select the target medical institution for secondary or tertiary patient transfer.
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">
                    Destination Medical / Hospital
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Database Verified Facilities
                  </span>
                </div>
                <select
                  value={checkupReferralFacilityId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCheckupReferralFacilityId(val);
                    const match = availableFacilities.find((f) => f.id === val);
                    if (match) setCheckupReferralHospital(match.name);
                  }}
                  disabled={loadingFacilities}
                  className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  {loadingFacilities ? (
                    <option value="">Loading facilities from database...</option>
                  ) : availableFacilities.length > 0 ? (
                    availableFacilities.map((fac) => {
                      const locParts = [fac.block, fac.district, fac.state].filter(Boolean);
                      const locText = locParts.length ? ` — ${locParts.join(", ")}` : "";
                      return (
                        <option key={fac.id} value={fac.id}>
                          {fac.name}{locText}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>No registered facilities found in database</option>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-800">
                  Reason for Referral / Transfer Urgency
                </label>
                <textarea
                  rows={2}
                  value={checkupReferralReason}
                  onChange={(e) => setCheckupReferralReason(e.target.value)}
                  placeholder="Specify clinical reasons for referral and transport instructions..."
                  className="w-full p-2.5 border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-amber-600 resize-none leading-relaxed bg-white"
                />
              </div>
            </div>
          )}

          {/* Option 3: Admit to Ward inputs */}
          {disposition === "Admit to Ward" && (
            <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-950 font-bold text-xs">
                  <Building2 className="w-4 h-4 text-sky-700 shrink-0" />
                  <span>Inpatient Ward &amp; Bed Assignment</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Status: Under Review
                </span>
              </div>
              <p className="text-[11px] text-sky-900 leading-relaxed">
                Assign patient to inpatient bed for observation and continuous round care. Status will remain <strong>Under Review</strong> and Action Taken will be updated to <strong>Admit to Ward</strong>.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-800">
                  Select Inpatient Ward / Unit
                </label>
                <select
                  value={checkupWardUnit}
                  onChange={(e) => setCheckupWardUnit(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-sky-300 focus:border-sky-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden cursor-pointer"
                >
                  <option value="Emergency Observation Unit (Bed 04)">Emergency Observation Unit (Bed 04)</option>
                  <option value="General Medicine Male Ward (Bed 12)">General Medicine Male Ward (Bed 12)</option>
                  <option value="General Medicine Female Ward (Bed 07)">General Medicine Female Ward (Bed 07)</option>
                  <option value="Trauma & Orthopedic Ward (Bed 08)">Trauma &amp; Orthopedic Ward (Bed 08)</option>
                  <option value="Surgical Inpatient Ward (Bed 02)">Surgical Inpatient Ward (Bed 02)</option>
                  <option value="Pediatric Observation Ward (Bed 06)">Pediatric Observation Ward (Bed 06)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-800">
                  Admission Care &amp; Monitoring Orders
                </label>
                <textarea
                  rows={2}
                  value={checkupWardCareNotes}
                  onChange={(e) => setCheckupWardCareNotes(e.target.value)}
                  placeholder="Record nursing round instructions, vitals frequency, and inpatient care notes..."
                  className="w-full p-2.5 border border-sky-300 rounded-xl text-xs text-slate-800 focus:outline-sky-600 resize-none leading-relaxed bg-white"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsInPersonModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCompleteCheckup}
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
                disposition === "Issue e-Prescription & Discharge"
                  ? "bg-teal-800 hover:bg-teal-900"
                  : disposition === "Admit to Ward"
                  ? "bg-sky-800 hover:bg-sky-900"
                  : "bg-indigo-800 hover:bg-indigo-900"
              }`}
            >
              {disposition === "Issue e-Prescription & Discharge" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Authorize e-Prescription &amp; Discharge</span>
                </>
              ) : disposition === "Admit to Ward" ? (
                <>
                  <Building2 className="w-4 h-4 text-sky-300" />
                  <span>Admit to Ward (Under Review)</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 text-indigo-300" />
                  <span>Authorize Referral &amp; Transfer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // IN-PAGE CASE DETAILS VIEW (Matches Review Queue Page Exactly)
  // -------------------------------------------------------------
  if (selectedCaseToReview) {
    const statusConfig = getStatusConfig(
      selectedCaseToReview.status,
      selectedCaseToReview.doctorDecision,
      selectedCaseToReview.category
    );
    const StatusIcon = statusConfig.icon;
    const priorityConfig = getPriorityConfig(
      selectedCaseToReview.urgency,
      selectedCaseToReview.urgencyClass,
      selectedCaseToReview.aiSuggestion?.priority
    );
    const PriorityIcon = priorityConfig.icon;
    const { cleanNotes, timeline, referral, ward, teleconsult } = extractActionDetails(
      selectedCaseToReview.doctorNotes
    );

    return (
      <div className="space-y-5">
        {/* Top Header Row like patient & nurse page (no box) */}
        <div className="space-y-4">
          {/* Back Button */}
          <button
            type="button"
            onClick={() => setSelectedCaseToReview(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Review History</span>
          </button>

          {/* Case ID, Priority Badges, Status & Meta */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Case {selectedCaseToReview.id}
                </h1>
                <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                  UHID: {selectedCaseToReview.patientId}
                </span>

                {/* PRIORITY BADGE */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${priorityConfig.badgeClass}`}
                >
                  <PriorityIcon className={`w-3.5 h-3.5 ${priorityConfig.iconClass}`} />
                  <span>Priority: {priorityConfig.label}</span>
                </span>

                {/* STATUS BADGE */}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusConfig.badgeClass}`}
                >
                  <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />
                  <span>Status: {statusConfig.label}</span>
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                <strong className="text-slate-900 font-bold">
                  {selectedCaseToReview.name}
                </strong>
                <span>&bull;</span>
                <span>{selectedCaseToReview.age} yrs &bull; {selectedCaseToReview.gender}</span>
                <span>&bull;</span>
                <span>Phone: {selectedCaseToReview.phone}</span>
                <span>&bull;</span>
                <span>Location: {selectedCaseToReview.location}</span>
                <span>&bull;</span>
                <span>Language: {selectedCaseToReview.language}</span>
                <span>&bull;</span>
                <span>Consent: <strong className="text-emerald-700">{selectedCaseToReview.consent}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Reviewed: <strong>{selectedCaseToReview.reviewedAt || "Recently"}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedCaseToPrint(selectedCaseToReview)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>

          {/* Tabs Row */}
          <div className="flex items-center gap-1 border-b border-slate-200 pt-1 overflow-x-auto scrollbar-none">
            {[
              "Overview",
              "Symptoms & Timeline",
              "Q&A History",
              "Medical Reports",
              "AI Summary",
              "Activity Log",
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveModalTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  activeModalTab === tab
                    ? "border-teal-700 text-teal-900 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Clinical Grid (Matching Review Queue Page) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Clinical Information Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {activeModalTab === "Overview" && (
              <>
                {/* Patient Overview Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Patient Overview
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Name</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Age / Gender</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.age} yrs &bull; {selectedCaseToReview.gender}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.phone}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Location</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.location}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Language</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.language}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Consent</span>
                        <span className="font-semibold text-emerald-700">
                          {selectedCaseToReview.consent} (Biometric / OTP)
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Assigned Facility</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCaseToReview.facility}
                        </span>
                      </div>
                      <div className="py-1">
                        <span className="text-slate-400 block mb-1">Nurse Quick Notes</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                          {selectedCaseToReview.quickNotes || "No notes recorded during triage intake."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chief Complaint & Reported Symptoms Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Chief Complaint &amp; Reported Symptoms
                    </h2>
                  </div>

                  <p className="text-xs text-slate-700 italic bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                    &ldquo;{selectedCaseToReview.chiefComplaint}&rdquo;
                  </p>

                  {selectedCaseToReview.aiInfo && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-bold text-slate-800">
                          {selectedCaseToReview.aiInfo.duration}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Severity</span>
                        <span className="font-bold text-slate-800">
                          {selectedCaseToReview.aiInfo.severity}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Associated</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedCaseToReview.aiInfo.associated}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Red Flags</span>
                        <span className="font-bold text-rose-700 truncate block">
                          {selectedCaseToReview.aiInfo.redFlags}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedCaseToReview.aiInfo?.symptoms && selectedCaseToReview.aiInfo.symptoms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">
                        Reported Symptoms:
                      </span>
                      {selectedCaseToReview.aiInfo.symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagnostic Documents & Lab Slip Parser */}
                {selectedCaseToReview.reports && selectedCaseToReview.reports.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Attached Medical Documents ({selectedCaseToReview.reports.length})
                        </h2>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{selectedCaseToReview.reports[0]}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Verified via OCR &bull; ABDM Synced
                        </span>
                      </div>
                      {selectedCaseToReview.aiReportAnalysis && (
                        <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                          {selectedCaseToReview.aiReportAnalysis.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Intelligence Summary Card */}
                {selectedCaseToReview.aiSuggestion && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">
                        AI Clinical Suggestion
                      </h2>
                    </div>
                    <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 text-xs space-y-1">
                      <div className="font-bold text-teal-950 flex items-center gap-1.5">
                        <span>Recommended Priority:</span>
                        <span className="text-teal-800 underline">
                          {selectedCaseToReview.aiSuggestion.priority}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {selectedCaseToReview.aiSuggestion.reason}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeModalTab === "Symptoms & Timeline" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Symptom Progression &amp; Timeline
                </h2>
                <div className="relative border-l-2 border-teal-200 ml-3 space-y-5 text-xs">
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Symptom Onset ({selectedCaseToReview.aiInfo?.duration || "Initial"})</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Patient experienced symptoms: {selectedCaseToReview.chiefComplaint}.
                    </p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Symptom Progression &amp; Associated Features</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Associated findings: {selectedCaseToReview.aiInfo?.associated || "None"}. Severity noted as {selectedCaseToReview.aiInfo?.severity || "Mild"}.
                    </p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Nurse Triage Verification</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Intake verified at CHC triage desk; submitted {selectedCaseToReview.submittedTime}. Forwarded for doctor authorization.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === "Q&A History" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Clinical Intake Questionnaire Responses
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Do you have breathing difficulty or chest tightness?
                    </div>
                    <div className="text-teal-800 font-bold mt-1">No &bull; Mild shortness of breath only after exertion/coughing</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Any history of Diabetes, Hypertension, or Kidney disease?
                    </div>
                    <div className="text-slate-700 mt-1">No chronic illness disclosed</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Current medications or known drug allergies?
                    </div>
                    <div className="text-slate-700 mt-1">None reported</div>
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === "Medical Reports" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Diagnostic Reports &amp; Lab Data
                </h2>
                {selectedCaseToReview.reports && selectedCaseToReview.reports.length > 0 ? (
                  <div className="space-y-3">
                    {selectedCaseToReview.reports.map((rep, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-teal-700" />
                            <span>{rep}</span>
                          </span>
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                            Verified via OCR &bull; ABDM Synced
                          </span>
                        </div>
                        {selectedCaseToReview.aiReportAnalysis && (
                          <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-slate-200">
                            {selectedCaseToReview.aiReportAnalysis.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No physical diagnostic slips were scanned during initial triage intake.
                  </div>
                )}
              </div>
            )}

            {activeModalTab === "AI Summary" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  AI Clinical Intelligence Summary
                </h2>
                {selectedCaseToReview.aiSuggestion && (
                  <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200 text-xs space-y-2">
                    <div className="font-bold text-teal-950 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-700" />
                      <span>Suggested Priority: <strong className="underline">{selectedCaseToReview.aiSuggestion.priority}</strong></span>
                    </div>
                    <p className="text-slate-800 leading-relaxed text-xs">
                      {selectedCaseToReview.aiSuggestion.reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === "Activity Log" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Clinical Audit Trail
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">Triage Intake Registered</strong>
                      <span className="text-slate-500">Submitted by patient at primary center</span>
                    </div>
                    <span className="text-slate-400 font-medium">{selectedCaseToReview.submittedTime}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">Forwarded to Attending Medical Officer</strong>
                      <span className="text-slate-500">Verified by {selectedCaseToReview.nurseName || "Nurse Priya S."}</span>
                    </div>
                    <span className="text-slate-400 font-medium">{selectedCaseToReview.submittedTime}</span>
                  </div>
                  <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <strong className="text-teal-950 block">Physician Authorization Completed</strong>
                      <span className="text-teal-800">{selectedCaseToReview.doctorDecision || "Accepted"} &bull; {selectedCaseToReview.status}</span>
                    </div>
                    <span className="text-teal-800 font-bold">{selectedCaseToReview.reviewedAt || "Recently"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Doctor Review & Actions Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Doctor Review &amp; Orders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorized clinical decision and active follow-up orders.
                </p>
              </div>

              {/* Status, Priority and Action banner */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-slate-500">Current Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusConfig.badgeClass}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-slate-500">Triage Priority:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${priorityConfig.badgeClass}`}>
                    <PriorityIcon className={`w-3.5 h-3.5 ${priorityConfig.iconClass}`} />
                    <span>{priorityConfig.label}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-slate-500">Action Taken:</span>
                  <strong className="text-slate-900">{selectedCaseToReview.doctorDecision || "Standard Follow-up"}</strong>
                </div>
              </div>

              {/* Timeline if present */}
              {timeline && (
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Hospital Checkup Timeline:</span>
                  </span>
                  <p className="text-emerald-900 font-bold text-sm pl-5.5">{timeline}</p>
                </div>
              )}

              {/* Inpatient Ward Bed Assignment if present */}
              {ward && (
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1">
                  <span className="text-sky-950 font-bold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-sky-700" />
                    <span>Inpatient Ward Bed Assignment:</span>
                  </span>
                  <p className="text-sky-900 font-bold text-sm pl-5.5">{ward}</p>
                </div>
              )}

              {/* Referral destination if present */}
              {referral && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                  <span className="text-amber-950 font-bold flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                    <span>Referred Medical Center / Hospital:</span>
                  </span>
                  <p className="text-amber-900 font-bold text-sm pl-5.5">{referral}</p>
                </div>
              )}

              {/* Teleconsultation note if present */}
              {teleconsult && (
                <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-xs flex items-center gap-2">
                  <Video className="w-4 h-4 text-indigo-700 shrink-0" />
                  <span className="text-indigo-950 font-bold">Clinical video consultation conducted with patient</span>
                </div>
              )}

              {/* Clinical Assessment Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor Assessment &amp; Clinical Notes
                </label>
                <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-semibold">
                  {cleanNotes || "Triage verified and cleared for clinical follow-up."}
                </div>
              </div>

              {/* e-Prescription if present */}
              {selectedCaseToReview.prescriptions && (!selectedCaseToReview.doctorDecision || !selectedCaseToReview.doctorDecision.toLowerCase().includes("refer")) ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-700" />
                    <span>e-Prescription Authorized</span>
                  </label>
                  <pre className="font-mono text-xs text-slate-900 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    {selectedCaseToReview.prescriptions}
                  </pre>
                </div>
              ) : (selectedCaseToReview.status === "Referred" || (selectedCaseToReview.doctorDecision && selectedCaseToReview.doctorDecision.toLowerCase().includes("refer"))) ? (
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-indigo-950">Patient Referred to Higher Facility</span>
                    <span className="text-[11px] text-indigo-800">
                      Emergency referral authorized. Outpatient e-prescription not issued; definitive medication and specialized treatment will be managed at the destination hospital.
                    </span>
                  </div>
                </div>
              ) : selectedCaseToReview.doctorDecision && selectedCaseToReview.doctorDecision.toLowerCase().includes("admit") ? (
                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-sky-950">Inpatient Care: Ward Bed Assigned</span>
                    <span className="text-[11px] text-sky-800">
                      Patient admitted to inpatient observation ward. Status remains Under Review with active round care.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block text-amber-950">Prescription Status: Pending In-Person Examination</span>
                    <span className="text-[11px] text-amber-800">
                      Triage confirmed for facility visit. Medication will be prescribed by the attending physician following physical checkup.
                    </span>
                  </div>
                </div>
              )}

              {/* Attending Doctor */}
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Attending MO:</span>
                <strong className="text-slate-900">{selectedCaseToReview.attendingDoctor || "Dr. Kavita Verma, MD"}</strong>
              </div>

              {/* Workspace Action Buttons */}
              <div className="space-y-2 pt-2">
                {isAwaitingCheckup(selectedCaseToReview) && (
                  <button
                    type="button"
                    onClick={() => handleOpenCheckup(selectedCaseToReview)}
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    <Stethoscope className="w-4 h-4 text-teal-200" />
                    <span>In-Person Checkup &amp; Prescribe</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCaseToPrint(selectedCaseToReview)}
                  className="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Clinical Summary Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCaseToReview(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
                >
                  Back to Review History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Success Toast */}
        {successToast && (
          <div className="fixed top-20 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
        )}

        {/* IN-PERSON CHECKUP MODAL IF TRIGGERED */}
        {renderInPersonCheckupModal()}

        {/* PRINT SLIP MODAL IF TRIGGERED */}
        {renderPrintSlipModal()}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Header (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Review History &bull; Completed Actions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Clinical audit log categorized by workflow: <strong>Complete</strong> (Discharge &amp; e-Prescription) and <strong>Referred</strong> (Hospital Transfer).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            Total Completed: <strong className="text-teal-800">{doctorCases.length}</strong>
          </span>
        </div>
      </div>

      {/* 3 Metric Cards for All Categories, Complete, Referred (matching Review Queue page design) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* All Categories Card */}
        <div
          onClick={() => setSelectedCategory("All")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "All"
              ? "border-slate-800 ring-2 ring-slate-100"
              : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">All Categories</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tabular-nums">
            {doctorCases.length}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Total reviewed &amp; completed
          </div>
        </div>

        {/* Complete Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === "Complete" ? "All" : "Complete")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "Complete"
              ? "border-emerald-500 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Complete</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5 tabular-nums">
            {getCategoryCount("Complete")}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Discharge &amp; e-Prescription
          </div>
        </div>

        {/* Referred Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === "Referred" ? "All" : "Referred")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "Referred"
              ? "border-indigo-500 ring-2 ring-indigo-100"
              : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Referred</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1.5 tabular-nums">
            {getCategoryCount("Referred")}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Transferred to medical center
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, UHID, status or category..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-700 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{cat === "All" ? "All Categories" : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* History Cases List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-slate-800">No Review History Records Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedCategory !== "All"
              ? `No records found in category "${selectedCategory}". Try selecting "All Categories".`
              : "Once you examine and authorize patient cases in the Review Queue, they will be archived here with full clinical audit details."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredHistory.map((c) => {
            const statusConfig = getStatusConfig(c.status, c.doctorDecision, c.category);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(c.urgency, c.urgencyClass, c.aiSuggestion?.priority);
            const PriorityIcon = priorityConfig.icon;
            const { cleanNotes, timeline, referral, ward, teleconsult } = extractActionDetails(c.doctorNotes);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info: Badges, Demographics, Complaint, Referral, Timestamps */}
                <div className="space-y-1.5 min-w-0">
                  {/* Top Badge Row */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900 tracking-tight">
                      Case {c.id}
                    </span>

                    {/* Priority Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig.badgeClass}`}
                    >
                      {priorityConfig.label}
                    </span>

                    {/* Status / Clinical Decision Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfig.badgeClass}`}>
                      <StatusIcon className={`w-3 h-3 ${statusConfig.iconClass}`} />
                      <span>{c.doctorDecision || statusConfig.label}</span>
                    </span>

                    {/* Consultation Mode Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      c.consultationMode === "online"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}>
                      {c.consultationMode === "online" ? (
                        <Video className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <Building2 className="w-3 h-3 text-blue-600" />
                      )}
                      <span>{c.consultationMode === "online" ? "Online Teleconsult" : "In-Person Walk-in"}</span>
                    </span>

                    {/* Preferred Language Badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                      <Languages className="w-3 h-3 text-teal-600" />
                      <span>{c.language || "Odia"}</span>
                    </span>
                  </div>

                  {/* Patient Demographics Row */}
                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      Patient ID: {c.patientId}
                    </span>
                    {c.name && (
                      <>
                        <span>&bull;</span>
                        <span className="font-medium text-slate-700">Name: {c.name}</span>
                      </>
                    )}
                    {(c.age || c.gender) && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">
                          {c.age ? `${c.age} yrs` : ""} {c.age && c.gender ? "•" : ""} {c.gender || ""}
                        </span>
                      </>
                    )}
                    {c.location && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">{c.location}</span>
                      </>
                    )}
                  </div>

                  {/* Chief Complaint Quote */}
                  <p className="text-xs text-slate-600 line-clamp-1 italic max-w-2xl pt-0.5">
                    &ldquo;{c.chiefComplaint}&rdquo;
                  </p>

                  {/* Referral Info if Referred */}
                  {(referral || c.referalFacility) && (
                    <div className="text-xs text-indigo-950 font-semibold flex items-center gap-2 flex-wrap">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>Referred to: <strong className="text-indigo-900">{referral || c.referalFacility}</strong></span>
                      {c.patientReferralStatus === "Accepted" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Patient Accepted
                        </span>
                      ) : c.patientReferralStatus === "Declined" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          ✕ Patient Declined
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ Awaiting Patient Consent
                        </span>
                      )}
                      {c.facilityReferralStatus === "Accepted" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          ✓ Under Review at Facility
                        </span>
                      )}
                      {(c.transferReason || cleanNotes) && (
                        <span className="text-slate-500 font-normal">
                          &bull; Reason: {c.transferReason || cleanNotes}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Line: Submitted Time and Reviewed Time */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span>Submitted: {c.submittedTime || "Recently"}</span>
                    <span>&bull;</span>
                    <span className="text-teal-800 font-semibold">Reviewed: {c.reviewedAt || "Recently"}</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCaseToPrint(c)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCaseToReview(c);
                      setActiveModalTab("Overview");
                    }}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRINT CLINICAL SLIP MODAL */}
      {renderPrintSlipModal()}
    </div>
  );
}
