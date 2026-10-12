"use client";

import React, { useState, useEffect } from "react";
import {
  fetchDoctorsForFacility,
  fetchRegisteredFacilities,
  FacilityDoctorOption,
  RegisteredFacilityOption,
} from "@/lib/nurse-api";
import {
  CaseOverviewTab,
  CaseSecondaryTabs,
  CaseActionDeck,
  CaseReportModal,
  CaseMissingDetailsModal,
} from "./case-review";
import {
  ArrowLeft,
  Edit2,
  FileText,
  AlertTriangle,
  Building2,
  Clock,
  CheckCircle2,
  HelpCircle,
  UserCheck,
  ArrowRightLeft,
  ShieldAlert,
  Lock,
  ChevronDown,
  Sparkles,
  HeartPulse,
  Share2,
  Calendar,
  Activity,
  User,
  Info,
  Check,
  Eye,
  X,
  Stethoscope,
} from "lucide-react";

export interface CaseDetails {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  location: string;
  language: string;
  consent: string;
  quickNotes: string;
  submittedTime: string;
  urgency: string;
  urgencyClass: string;
  status: string;
  chiefComplaint: string;
  nurseName?: string;
  nurseId?: string;
  doctorName?: string;
  doctorId?: string;
  aiInfo: {
    symptoms: string[];
    duration: string;
    severity: string;
    associated: string;
    redFlags: string;
  };
  symptomsData?: {
    symptoms?: string[];
    raw_complaint?: string;
    summary?: string;
    questions_answers?: Record<string, string>;
    raw_qa?: Array<{ question: string; answer: string }>;
  };
  symptoms_data?: any;
  missingDetails: string[];
  reports: string[];
  aiReportAnalysis: string[];
  aiSuggestion: {
    priority: string;
    reason: string;
  };
  facility: string;
  facilityLocation: string;
  facilityId?: string;
  consultationMode?: string;
  scheduleTime?: string;
  revertedQuestions?: { id: string; question: string; answer?: string; answered_at?: string }[];
  referalFacility?: string;
  referalFacilityId?: string;
  transferReason?: string;
  referredFromTicketId?: string;
  referredFromFacility?: string;
  patientReferralStatus?: "Pending" | "Accepted" | "Declined";
  patientReferralAcceptedAt?: string;
  facilityReferralStatus?: "Pending" | "Accepted" | "Declined";
  facilityReferralAcceptedAt?: string;
  referralNotes?: string;
  intakeMode?: "new" | "existing";
  existingPatientId?: string;
  existingPatientSource?: "new_patient" | "profile";
  newPatientId?: string;
  uploadedReportUrl?: string;
  uploadedReportData?: any;
  dischargeReportUrl?: string;
  dischargeReportText?: string;
  reviewedAt?: string;
  updatedAt?: string;
  createdAt?: string;
}

export const FACILITY_OPTIONS = [
  { name: "District Headquarters Hospital (DHH) Nayagarh", type: "District Hospital / Tertiary Referral", distance: "18 km" },
  { name: "Sub-Divisional Hospital (SDH) Nayagarh", type: "Sub-Divisional Secondary Hospital", distance: "22 km" },
  { name: "SCB Medical College & Hospital, Cuttack", type: "Quaternary Multi-Specialty & Trauma", distance: "95 km" },
  { name: "AIIMS Bhubaneswar", type: "Apex Tertiary Referral Institute", distance: "72 km" },
  { name: "Capital Hospital, Bhubaneswar", type: "State Multi-Specialty Referral Hospital", distance: "68 km" },
  { name: "Community Health Centre (CHC) Ranpur", type: "Block Level Specialist CHC", distance: "31 km" },
  { name: "Community Health Centre (CHC) Odagaon", type: "Maternal & Child Health CHC", distance: "26 km" },
];

interface CaseReviewWorkspaceProps {
  caseData: CaseDetails;
  onBack: () => void;
  onSubmitAction: (
    actionType: string,
    note: string,
    targetStatus: string,
    scheduleTime?: string,
    revertedQuestions?: { id: string; question: string; answer?: string; answered_at?: string }[],
    assignedDoctor?: string,
    referralFacility?: string,
    assignedDoctorId?: string,
    referralFacilityId?: string
  ) => void;
  onUpdateCase?: (updated: Partial<CaseDetails>) => void;
}

export function CaseReviewWorkspace({
  caseData,
  onBack,
  onSubmitAction,
  onUpdateCase,
}: CaseReviewWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [selectedAction, setSelectedAction] = useState<string>("Schedule & Forward to Doctor");
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [assignedDoctor, setAssignedDoctor] = useState<string>("");
  const [assignedDoctorId, setAssignedDoctorId] = useState<string | undefined>(undefined);
  const [customDoctor, setCustomDoctor] = useState<string>("");
  const [facilityDoctors, setFacilityDoctors] = useState<FacilityDoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(true);

  // Real registered facilities from database
  const [availableFacilities, setAvailableFacilities] = useState<RegisteredFacilityOption[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [referralFacilityId, setReferralFacilityId] = useState<string>("");
  const [referralFacility, setReferralFacility] = useState<string>("");

  // Fetch real doctors belonging to the same healthcare facility
  useEffect(() => {
    let isMounted = true;
    async function loadDoctors() {
      setLoadingDoctors(true);
      try {
        const docs = await fetchDoctorsForFacility(caseData.facilityId, caseData.facility);
        if (isMounted) {
          setFacilityDoctors(docs);
          if (docs.length > 0) {
            setAssignedDoctor(docs[0].name);
            setAssignedDoctorId(docs[0].id);
          } else {
            setAssignedDoctor("Other");
            setAssignedDoctorId(undefined);
          }
        }
      } catch (err) {
        console.warn("[CaseReview] Error loading facility doctors:", err);
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    }
    loadDoctors();
    return () => {
      isMounted = false;
    };
  }, [caseData.facilityId, caseData.facility]);

  // Fetch real registered facilities strictly from database
  useEffect(() => {
    let isMounted = true;
    async function loadFacilities() {
      setLoadingFacilities(true);
      try {
        const facs = await fetchRegisteredFacilities();
        if (isMounted) {
          setAvailableFacilities(facs);
          if (facs.length > 0) {
            // Default to case's referalFacilityId or first registered facility
            const defaultFac =
              (caseData.referalFacilityId && facs.find((f) => f.id === caseData.referalFacilityId)) ||
              (caseData.referalFacility && facs.find((f) => f.name.toLowerCase().includes(caseData.referalFacility!.toLowerCase()))) ||
              facs[0];
            setReferralFacilityId(defaultFac.id);
            setReferralFacility(defaultFac.name);
          }
        }
      } catch (err) {
        console.warn("[CaseReview] Error loading registered facilities:", err);
      } finally {
        if (isMounted) setLoadingFacilities(false);
      }
    }
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, [caseData.referalFacilityId, caseData.referalFacility]);

  const [referralReason, setReferralReason] = useState<string>("");
  const [resolveNote, setResolveNote] = useState<string>(
    "Case clinical verification completed at PHC triage desk. Symptoms evaluated and resolved."
  );
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [missingModalOpen, setMissingModalOpen] = useState<boolean>(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Reverted Questions list in JSON format
  const [revertedQuestionsList, setRevertedQuestionsList] = useState<string[]>(() => {
    if (caseData.revertedQuestions && caseData.revertedQuestions.length > 0) {
      return caseData.revertedQuestions.map((q) => q.question);
    }
    return [
      "What is your current body temperature reading?",
      "Have you taken any medication since reporting symptoms?",
    ];
  });
  const [newQuestionInput, setNewQuestionInput] = useState<string>("");

  useEffect(() => {
    if (caseData.revertedQuestions && caseData.revertedQuestions.length > 0) {
      setRevertedQuestionsList(caseData.revertedQuestions.map((q) => q.question));
    }
  }, [caseData.id, caseData.revertedQuestions]);

  const actionOptions = [
    {
      id: "Schedule & Forward to Doctor",
      label: "Schedule & Forward to Doctor",
      desc: "Assign slot & send to medical officer",
      icon: UserCheck,
      color: "emerald",
      targetStatus: "Scheduled",
    },
    {
      id: "Request More Information",
      label: "Request More Information",
      desc: "Send follow-up questions to patient",
      icon: HelpCircle,
      color: "sky",
      targetStatus: "Reverted",
    },
    {
      id: "Refer / Escalate",
      label: "Refer / Escalate",
      desc: "Transfer to higher facility",
      icon: ArrowRightLeft,
      color: "amber",
      targetStatus: "Referred",
    },
    {
      id: "Resolve",
      label: "Resolve",
      desc: "Mark case as resolved & complete triage",
      icon: CheckCircle2,
      color: "teal",
      targetStatus: "Completed",
    },
  ];

  const resolveNoteTemplates = [
    "Case clinical verification completed at PHC triage desk. Symptoms evaluated and resolved.",
    "Patient evaluated with normal vitals and symptoms addressed. Resolved and closed.",
    "First aid and symptomatic relief provided at health sub-centre. Completed.",
    "Prescription dispensed and patient advised on home recovery. Resolved.",
    "Follow-up examination normal. No further intervention required. Case completed.",
  ];

  const handleSelectTemplate = (tmpl: string) => {
    setResolveNote(tmpl);
    setTemplateDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actionObj = actionOptions.find((a) => a.id === selectedAction);
    const targetStatus = actionObj ? actionObj.targetStatus : (selectedAction === "Resolve" ? "Completed" : "Scheduled");
    
    setActionSuccessToast(`Action "${selectedAction}" recorded successfully for ${caseData.id}`);
    
    setTimeout(() => {
      let scheduledIso: string | undefined = undefined;
      if (selectedAction === "Schedule & Forward to Doctor") {
        if (scheduleTime) {
          try {
            const parsed = new Date(scheduleTime);
            if (!isNaN(parsed.getTime())) {
              scheduledIso = parsed.toISOString();
            }
          } catch {}
        }
        if (!scheduledIso) {
          const fallback = new Date();
          fallback.setHours(fallback.getHours() + 2);
          scheduledIso = fallback.toISOString();
        }
      }
      const revertedQJson =
        selectedAction === "Request More Information"
          ? (revertedQuestionsList.length > 0
              ? revertedQuestionsList
                  .filter((q) => q.trim().length > 0)
                  .map((q, idx) => {
                    const existing = (caseData.revertedQuestions || []).find(
                      (eq) => eq.question.trim().toLowerCase() === q.trim().toLowerCase() || eq.id === `q_${idx + 1}`
                    );
                    return {
                      id: existing?.id || `q_${idx + 1}`,
                      question: q.trim(),
                      answer: existing?.answer || "",
                      ...(existing?.answered_at ? { answered_at: existing.answered_at } : {}),
                    };
                  })
              : undefined)
          : undefined;

      const finalDoctor =
        selectedAction === "Schedule & Forward to Doctor"
          ? (assignedDoctor === "Other" ? (customDoctor.trim() || "Attending Medical Officer") : assignedDoctor)
          : undefined;

      let finalDoctorId =
        selectedAction === "Schedule & Forward to Doctor"
          ? (assignedDoctor === "Other" ? undefined : assignedDoctorId)
          : undefined;

      // Fallback matching if assignedDoctorId is not yet resolved
      if (selectedAction === "Schedule & Forward to Doctor" && !finalDoctorId && facilityDoctors.length > 0) {
        const found = facilityDoctors.find(
          (d) => d.name === finalDoctor || d.name === assignedDoctor
        );
        if (found) {
          finalDoctorId = found.profileId || found.id;
        } else if (assignedDoctor !== "Other") {
          finalDoctorId = facilityDoctors[0].profileId || facilityDoctors[0].id;
        }
      }

      const selectedFacObj = availableFacilities.find((f) => f.id === referralFacilityId);
      const finalFacility =
        selectedAction === "Refer / Escalate"
          ? (selectedFacObj?.name || referralFacility || "Referral Healthcare Facility")
          : undefined;

      const finalFacilityId =
        selectedAction === "Refer / Escalate"
          ? (referralFacilityId || selectedFacObj?.id)
          : undefined;

      const finalNote =
        selectedAction === "Resolve"
          ? resolveNote
          : selectedAction === "Refer / Escalate"
          ? referralReason.trim()
          : "";

      onSubmitAction(
        selectedAction,
        finalNote,
        targetStatus,
        scheduledIso,
        revertedQJson,
        finalDoctor,
        finalFacility,
        finalDoctorId,
        finalFacilityId
      );
    }, 900);
  };

  const normUrgency = (caseData.urgency || "").toLowerCase();
  const isRed = normUrgency.includes("red") || normUrgency.includes("immed") || normUrgency.includes("emerg");
  const isAmber = normUrgency.includes("amber") || normUrgency.includes("yellow") || normUrgency.includes("urg") || normUrgency.includes("med");

  const priorityBadge = isRed
    ? {
        label: "Red",
        subtext: "Immediate / High",
        bg: "bg-rose-50 border-rose-300 text-rose-900",
        dot: "bg-rose-500 ring-rose-300",
        tag: "text-rose-700",
      }
    : isAmber
    ? {
        label: caseData.urgency === "Amber" ? "Amber" : "Amber / Yellow",
        subtext: "Urgent / Medium",
        bg: "bg-amber-50 border-amber-300 text-amber-900",
        dot: "bg-amber-500 ring-amber-300",
        tag: "text-amber-700",
      }
    : {
        label: "Green",
        subtext: "Routine / Low",
        bg: "bg-emerald-50 border-emerald-300 text-emerald-900",
        dot: "bg-emerald-500 ring-emerald-300",
        tag: "text-emerald-700",
      };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {actionSuccessToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{actionSuccessToast}</span>
        </div>
      )}

      {/* Top Header Row like patient page (no box) */}
      <div className="space-y-4">
        {/* Back Link */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Triage Queue</span>
        </button>

        {/* Case ID, Priority Badges, Submitted Meta */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Case {caseData.id}
              </h1>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <strong className="text-slate-900 font-bold">
                Patient ID: {caseData.patientId}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 self-start lg:self-center shrink-0">
            {/* Highlighted Triage Priority Badge */}
            <div
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2.5 shadow-2xs ${priorityBadge.bg}`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${priorityBadge.dot} ring-2 animate-pulse shrink-0`} />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 leading-none">
                  Triage Priority
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs font-black tracking-tight">
                    {caseData.urgency || priorityBadge.label}
                  </span>
                  <span className={`text-[10px] font-bold ${priorityBadge.tag}`}>
                    ({priorityBadge.subtext})
                  </span>
                </div>
              </div>
            </div>

            {/* Submitted Metadata */}
            <div className="text-left lg:text-right text-xs text-slate-500 shrink-0">
              <div className="font-semibold text-slate-700">
                Submitted {caseData.submittedTime || "21 Sep 2026, 10:24 AM"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Via Mobile App &bull; {caseData.language ? `${caseData.language} \u2192 Translated` : "Odia \u2192 Translated"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Information Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <CaseOverviewTab
            caseData={caseData}
            setActiveTab={setActiveTab}
            setReportModalOpen={setReportModalOpen}
            setMissingModalOpen={setMissingModalOpen}
            onUpdateCase={onUpdateCase}
          />
        </div>

        {/* RIGHT COLUMN: Review & Actions (5 cols) */}
        <CaseActionDeck
          actionOptions={actionOptions}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          caseData={caseData}
          loadingDoctors={loadingDoctors}
          facilityDoctors={facilityDoctors}
          assignedDoctor={assignedDoctor}
          setAssignedDoctor={setAssignedDoctor}
          setAssignedDoctorId={setAssignedDoctorId}
          customDoctor={customDoctor}
          setCustomDoctor={setCustomDoctor}
          scheduleTime={scheduleTime}
          setScheduleTime={setScheduleTime}
          revertedQuestionsList={revertedQuestionsList}
          setRevertedQuestionsList={setRevertedQuestionsList}
          newQuestionInput={newQuestionInput}
          setNewQuestionInput={setNewQuestionInput}
          resolveNote={resolveNote}
          setResolveNote={setResolveNote}
          templateDropdownOpen={templateDropdownOpen}
          setTemplateDropdownOpen={setTemplateDropdownOpen}
          resolveNoteTemplates={resolveNoteTemplates}
          handleSelectTemplate={handleSelectTemplate}
          referralFacility={referralFacility}
          setReferralFacility={setReferralFacility}
          referralFacilityId={referralFacilityId}
          setReferralFacilityId={setReferralFacilityId}
          loadingFacilities={loadingFacilities}
          availableFacilities={availableFacilities}
          referralReason={referralReason}
          setReferralReason={setReferralReason}
          handleSubmit={handleSubmit}
        />
      </div>

      {/* Modals */}
      <CaseReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        caseData={caseData}
      />
      <CaseMissingDetailsModal
        isOpen={missingModalOpen}
        onClose={() => setMissingModalOpen(false)}
        caseData={caseData}
      />
    </div>
  );
}
