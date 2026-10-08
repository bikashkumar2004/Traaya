"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { submitLiveNurseAction, fetchRegisteredFacilities, RegisteredFacilityOption } from "@/lib/nurse-api";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Video,
  AlertTriangle,
  ArrowRightLeft,
} from "lucide-react";
import {
  DoctorPrintSlipModal,
  DoctorInPersonCheckupModal,
  DoctorHistoryDetailView,
  DoctorHistoryListView,
  HistoryDisposition,
} from "./history";

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
  const [disposition, setDisposition] = useState<HistoryDisposition>("Issue e-Prescription & Discharge");
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
      } catch {}
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

  const doctorCases = reviewedCases.filter((c) => {
    if (activeDoctorId) {
      return Boolean(c.doctorId && c.doctorId === activeDoctorId);
    }
    return true;
  });

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

  // -------------------------------------------------------------
  // IN-PAGE CASE DETAILS VIEW
  // -------------------------------------------------------------
  if (selectedCaseToReview) {
    const statusConfig = getStatusConfig(
      selectedCaseToReview.status,
      selectedCaseToReview.doctorDecision,
      selectedCaseToReview.category
    );
    const priorityConfig = getPriorityConfig(
      selectedCaseToReview.urgency,
      selectedCaseToReview.urgencyClass,
      selectedCaseToReview.aiSuggestion?.priority
    );
    const actionDetails = extractActionDetails(selectedCaseToReview.doctorNotes);

    return (
      <div className="space-y-5">
        <DoctorHistoryDetailView
          selectedCaseToReview={selectedCaseToReview}
          activeModalTab={activeModalTab}
          setActiveModalTab={setActiveModalTab}
          onBack={() => setSelectedCaseToReview(null)}
          onPrint={(c) => setSelectedCaseToPrint(c)}
          onOpenCheckup={handleOpenCheckup}
          isAwaitingCheckup={isAwaitingCheckup}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
          actionDetails={actionDetails}
        />

        {successToast && (
          <div className="fixed top-20 right-6 z-70 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
        )}

        <DoctorInPersonCheckupModal
          isOpen={isInPersonModalOpen}
          onClose={() => setIsInPersonModalOpen(false)}
          selectedCaseToReview={selectedCaseToReview}
          examNotes={examNotes}
          setExamNotes={setExamNotes}
          disposition={disposition}
          setDisposition={setDisposition}
          checkupMedName={checkupMedName}
          setCheckupMedName={setCheckupMedName}
          checkupMedDose={checkupMedDose}
          setCheckupMedDose={setCheckupMedDose}
          checkupMedFrequency={checkupMedFrequency}
          setCheckupMedFrequency={setCheckupMedFrequency}
          checkupAdditionalMed={checkupAdditionalMed}
          setCheckupAdditionalMed={setCheckupAdditionalMed}
          availableFacilities={availableFacilities}
          loadingFacilities={loadingFacilities}
          checkupReferralFacilityId={checkupReferralFacilityId}
          setCheckupReferralFacilityId={setCheckupReferralFacilityId}
          checkupReferralHospital={checkupReferralHospital}
          setCheckupReferralHospital={setCheckupReferralHospital}
          checkupReferralReason={checkupReferralReason}
          setCheckupReferralReason={setCheckupReferralReason}
          checkupWardUnit={checkupWardUnit}
          setCheckupWardUnit={setCheckupWardUnit}
          checkupWardCareNotes={checkupWardCareNotes}
          setCheckupWardCareNotes={setCheckupWardCareNotes}
          onCompleteCheckup={handleCompleteCheckup}
        />

        <DoctorPrintSlipModal
          caseToPrint={selectedCaseToPrint}
          onClose={() => setSelectedCaseToPrint(null)}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // HISTORY LIST VIEW
  // -------------------------------------------------------------
  return (
    <>
      <DoctorHistoryListView
        doctorCases={doctorCases}
        filteredHistory={filteredHistory}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        getCategoryCount={getCategoryCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSelectCaseToPrint={(c) => setSelectedCaseToPrint(c)}
        onSelectCaseToReview={(c) => {
          setSelectedCaseToReview(c);
          setActiveModalTab("Overview");
        }}
        getStatusConfig={getStatusConfig}
        getPriorityConfig={getPriorityConfig}
        extractActionDetails={extractActionDetails}
      />

      <DoctorPrintSlipModal
        caseToPrint={selectedCaseToPrint}
        onClose={() => setSelectedCaseToPrint(null)}
      />
    </>
  );
}
