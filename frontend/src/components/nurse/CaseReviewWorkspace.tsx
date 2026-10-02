"use client";

import React, { useState, useEffect } from "react";
import {
  fetchDoctorsForFacility,
  fetchRegisteredFacilities,
  FacilityDoctorOption,
  RegisteredFacilityOption,
} from "@/lib/nurse-api";
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
}

export function CaseReviewWorkspace({
  caseData,
  onBack,
  onSubmitAction,
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
  const [revertedQuestionsList, setRevertedQuestionsList] = useState<string[]>([
    "What is your current body temperature reading?",
    "Have you taken any medication since reporting symptoms?",
  ]);
  const [newQuestionInput, setNewQuestionInput] = useState<string>("");

  const tabs = [
    "Overview",
    "Symptoms & Timeline",
    "Q&A History",
    "Medical Reports",
    "AI Summary",
    "Activity Log",
  ];

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
      const scheduledIso =
        selectedAction === "Schedule & Forward to Doctor" && scheduleTime
          ? new Date(scheduleTime).toISOString()
          : undefined;
      const revertedQJson =
        selectedAction === "Request More Information"
          ? (revertedQuestionsList.length > 0
              ? revertedQuestionsList
                  .filter((q) => q.trim().length > 0)
                  .map((q, idx) => ({
                    id: `q_${idx + 1}`,
                    question: q.trim(),
                    answer: "",
                  }))
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                High Priority
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {caseData.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
                caseData.consultationMode !== "offline"
                  ? "bg-teal-50 text-teal-800 border-teal-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}>
                {caseData.consultationMode !== "offline" ? "💻 Online Teleconsult" : "🏥 In-Person OPD"}
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <strong className="text-slate-900 font-bold">
                Patient ID: {caseData.patientId}
              </strong>
              <span>&bull;</span>
              <span>Age: {caseData.age}</span>
              <span>&bull;</span>
              <span>{caseData.gender}</span>
              <span>&bull;</span>
              <span>Location: {caseData.location}</span>
            </div>
          </div>

          <div className="text-left lg:text-right text-xs text-slate-500 shrink-0">
            <div className="font-semibold text-slate-700">
              Submitted 21 Sep 2026, 10:24 AM
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Via Mobile App &bull; Odia &rarr; Translated
            </div>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-1 border-b border-slate-200 pt-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-teal-700 text-teal-900 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Information Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeTab === "Overview" && (
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
                  <button
                    type="button"
                    onClick={() => alert("Nurse edit mode for patient record")}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Specs */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Name</span>
                      <span className="font-semibold text-slate-800">
                        {caseData.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Age / Gender</span>
                      <span className="font-semibold text-slate-800">
                        {caseData.age} / {caseData.gender}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-semibold text-slate-800">
                        {caseData.phone}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Location</span>
                      <span className="font-semibold text-slate-800">
                        {caseData.location}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Language</span>
                      <span className="font-semibold text-slate-800">
                        {caseData.language}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Consent</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {caseData.consent}
                      </span>
                    </div>
                    {caseData.scheduleTime && (
                      <div className="flex justify-between py-1 border-t border-slate-100 pt-1.5">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Scheduled:
                        </span>
                        <span className="font-bold text-emerald-900">
                          {new Date(caseData.scheduleTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Quick Notes Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Quick Notes
                      </span>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {caseData.quickNotes}
                      </p>
                      {caseData.revertedQuestions && caseData.revertedQuestions.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-amber-900 bg-amber-50/80 p-2.5 rounded-lg text-[11px] space-y-1.5">
                          <strong className="block text-[10px] uppercase font-bold text-amber-800">
                            Reverted Questions ({caseData.revertedQuestions.length}):
                          </strong>
                          <div className="space-y-1">
                            {caseData.revertedQuestions.map((q, idx) => (
                              <div key={idx} className="bg-white p-2 rounded-md border border-amber-200/80 text-xs">
                                <div className="font-semibold text-slate-800">Q{idx + 1}: {q.question}</div>
                                {q.answer ? (
                                  <div className="text-emerald-700 font-bold mt-1 text-[11px] flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Answer: {q.answer}</span>
                                  </div>
                                ) : (
                                  <div className="text-amber-700 italic mt-0.5 text-[10px]">
                                    Awaiting patient reply...
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-teal-700 font-medium pt-2">
                      Verified by triage reception
                    </div>
                  </div>
                </div>
              </div>

              {/* Chief Complaint Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <span>Chief Complaint</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 italic leading-relaxed">
                  &ldquo;{caseData.chiefComplaint}&rdquo;
                </div>
              </div>

              {/* AI Extracted Key Information Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>AI Extracted Key Information</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("AI Summary")}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View details</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Symptoms:</strong>{" "}
                      {caseData.aiInfo.symptoms.join(", ")}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Duration:</strong>{" "}
                      {caseData.aiInfo.duration}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Severity:</strong>{" "}
                      {caseData.aiInfo.severity}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Associated:</strong>{" "}
                      {caseData.aiInfo.associated}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
                    <div>
                      <strong className="text-slate-900 font-semibold">Red flags:</strong>{" "}
                      <span className="text-emerald-700 font-medium">
                        {caseData.aiInfo.redFlags}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Missing Details Warning Banner (Only show if missing details exist) */}
              {caseData.missingDetails && caseData.missingDetails.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 text-xs text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Some important details are missing:</span>{" "}
                      {caseData.missingDetails.join(", ")}.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMissingModalOpen(true)}
                    className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs rounded-xl shadow-2xs shrink-0 transition-colors cursor-pointer"
                  >
                    View missing details
                  </button>
                </div>
              )}

              {/* Medical Reports & AI Analysis Side-by-Side Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Reports Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
                    <FileText className="w-4 h-4 text-teal-700" />
                    <span>Medical Reports ({caseData.reports.length})</span>
                  </div>

                  {caseData.reports.length === 0 ? (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center gap-2.5 text-slate-500">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-medium text-slate-600">No medical reports attached</div>
                        <div className="text-[10px] text-slate-400">Patient did not upload any external lab/diagnostic documents</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {caseData.reports.map((repName, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate" title={repName}>
                                {repName}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {caseData.submittedTime ? `Submitted ${caseData.submittedTime}` : "Uploaded with intake"}
                              </div>
                            </div>
                          </div>
                          {caseData.uploadedReportUrl ? (
                            <a
                              href={caseData.uploadedReportUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0"
                            >
                              View
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReportModalOpen(true)}
                              className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                            >
                              View
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Report Analysis Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-900 text-sm font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>AI Report Analysis</span>
                    </div>
                  </div>

                  {caseData.aiReportAnalysis && caseData.aiReportAnalysis.length > 0 ? (
                    <>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {caseData.aiReportAnalysis.map((item, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="text-[11px] leading-tight">{item}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => setActiveTab("Medical Reports")}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <span>View full analysis</span>
                        <span>&rarr;</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                      <div className="font-medium text-slate-600">No lab reports attached</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Automated OCR and lab panel parsing will activate when documents are uploaded.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Triage Status & Assigned Facility Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Triage Status */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <span>Current Triage Status (AI Suggestion)</span>
                  </div>
                  <div>
                    {(() => {
                      const p = (caseData.aiSuggestion?.priority || caseData.urgency || "Yellow").toLowerCase();
                      const isRed = p.includes("red") || p.includes("immediate");
                      const isGreen = p.includes("green") || p.includes("less urgent") || p.includes("routine");
                      const badgeClass = isRed
                        ? "bg-rose-100 text-rose-900 border-rose-300"
                        : isGreen
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-amber-100 text-amber-900 border-amber-300";
                      const Icon = isRed ? ShieldAlert : isGreen ? CheckCircle2 : AlertTriangle;
                      const iconColor = isRed ? "text-rose-700" : isGreen ? "text-emerald-700" : "text-amber-700";

                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${badgeClass}`}>
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                          <span>{caseData.aiSuggestion?.priority || caseData.urgency || "Yellow"}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {caseData.aiSuggestion?.reason || "Clinical triage assessment recommended."}
                  </p>
                </div>

                {/* Assigned Facility */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Building2 className="w-4 h-4 text-teal-700" />
                      <span>Assigned Facility</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-bold text-slate-900">
                        {caseData.facility}
                      </div>
                      <div className="text-xs text-slate-500">
                        {caseData.facilityLocation}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => alert(`Assigned Facility: ${caseData.facility} (${caseData.facilityLocation})`)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Other Tabs content */}
          {activeTab === "Symptoms & Timeline" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Symptom Progression & Clinical Timeline
              </h2>
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="pl-8 relative">
                  <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-800">
                    3 Days Ago (Onset)
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mild body aches, general malaise after manual agriculture labor. Low fever noticed in evening.
                  </p>
                </div>
                <div className="pl-8 relative">
                  <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-800">
                    Yesterday (Escalation)
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    High fever developed with nighttime dry cough and headache. Self-administered paracetamol with partial relief.
                  </p>
                </div>
                <div className="pl-8 relative">
                  <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-white" />
                  <div className="text-xs font-bold text-slate-800">
                    Today &bull; 10:24 AM (Triage Submission)
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Persistent weakness, severe body pain, loss of appetite. Submitted triage via mobile app in Odia language.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Q&A History" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Patient Adaptive Questionnaire Responses
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">
                    Q: Are you experiencing any breathing difficulties or chest pain?
                  </div>
                  <div className="text-slate-700 mt-1">
                    A: No chest pain, only cough at night when lying down.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">
                    Q: Have you had any chills or shivering episodes?
                  </div>
                  <div className="text-slate-700 mt-1">
                    A: Yes, shivering yesterday night before taking paracetamol.
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">
                    Q: Any chronic medical conditions (Diabetes, Hypertension, Asthma)?
                  </div>
                  <div className="text-amber-800 mt-1 font-medium">
                    A: Unanswered (Marked for nurse verification)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Medical Reports" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Diagnostic Documents &amp; Automated Lab Parser
              </h2>
              {caseData.reports.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-700">No Medical Reports Uploaded</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    The patient did not submit any diagnostic slips or lab test reports with this intake.
                  </p>
                </div>
              ) : (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      {caseData.reports[0] || "Diagnostic Report"}
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Uploaded File
                    </span>
                  </div>
                  {caseData.aiReportAnalysis && caseData.aiReportAnalysis.length > 0 ? (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-bold text-slate-600">Extracted Findings &amp; Summary:</div>
                      {caseData.aiReportAnalysis.map((item, i) => (
                        <div key={i} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No automated parameters extracted for this report.</p>
                  )}
                  {caseData.uploadedReportUrl && (
                    <div className="pt-2">
                      <a
                        href={caseData.uploadedReportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open Original Document</span>
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "AI Summary" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                TriageAssist Clinical Intelligence Summary
              </h2>
              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  <strong>Clinical Rationale:</strong> The patient presents with acute febrile illness of 3 days duration accompanied by systemic manifestations (myalgia, severe fatigue, headache). Mild leukocytosis (11,500 /µL) supports an active inflammatory or bacterial/viral etiology requiring differential diagnosis (Viral fever, Dengue, or early Typhoid prevalent in Nayagarh district).
                </p>
                <p>
                  <strong>Recommended Interventions:</strong> Immediate oral temperature and BP check at PHC desk, hydration encouragement, and assignment to Dr. Ananya Sen for empirical prescription and malarial smear if fever exceeds 101.5°F.
                </p>
              </div>
            </div>
          )}

          {activeTab === "Activity Log" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Audit &amp; Action Trail</h2>
              <div className="text-xs space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span>Reported via Odia Mobile App by Patient</span>
                  <span className="text-slate-400">10:24 AM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span>AI Automated Triage assigned: Yellow (Priority 2)</span>
                  <span className="text-slate-400">10:25 AM</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span>Opened for clinical review by Nurse Priya S.</span>
                  <span className="text-teal-700 font-medium">Just now</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Nurse Review & Actions (Image 4 right side) (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Nurse Review &amp; Actions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Take appropriate action after reviewing the case.
              </p>
            </div>

            {/* Role Disclaimer Box (Image 4) */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-sky-950">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sky-900">
                  Your Role: Nurse
                </strong>
                <span className="leading-relaxed text-[11px] text-sky-900/90">
                  You can review, request more information, add notes, and forward to authorized professionals. You cannot finalize diagnosis.
                </span>
              </div>
            </div>

            {/* Select Action List (Image 4: 5 Actions) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Select Action
              </label>

              <div className="space-y-2">
                {actionOptions.map((act) => {
                  const Icon = act.icon;
                  const isSelected = selectedAction === act.id;

                  // Custom styling matching action types
                  let activeColors = "border-teal-600 bg-teal-50/60 ring-2 ring-teal-200";
                  if (act.id === "Schedule & Forward to Doctor") {
                    activeColors = isSelected ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                  } else if (act.id === "Request More Information") {
                    activeColors = isSelected ? "bg-sky-600 text-white border-sky-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                  } else if (act.id === "Refer / Escalate") {
                    activeColors = isSelected ? "bg-amber-600 text-white border-amber-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                  } else if (act.id === "Resolve") {
                    activeColors = isSelected ? "bg-teal-700 text-white border-teal-800 shadow-sm" : "border-slate-200 hover:border-slate-300";
                  }

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setSelectedAction(act.id)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? activeColors
                          : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {act.label}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {act.desc}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold shrink-0">&rarr;</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule & Forward to Doctor Section: Choose Doctor & Consultation Schedule */}
            {selectedAction === "Schedule & Forward to Doctor" && (
              <div className="space-y-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl animate-in fade-in duration-200">
                {/* Choose Doctor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Choose Doctor</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {loadingDoctors
                        ? "Checking Facility Roster..."
                        : `${caseData.facility ? caseData.facility.split(" ")[0] : "Facility"} Roster (${facilityDoctors.length})`}
                    </span>
                  </div>

                  <select
                    value={assignedDoctor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedDoctor(val);
                      if (val === "Other") {
                        setAssignedDoctorId(undefined);
                      } else {
                        const matched = facilityDoctors.find((d) => d.name === val || d.id === val || d.profileId === val);
                        setAssignedDoctorId(matched?.profileId || matched?.id);
                      }
                    }}
                    disabled={loadingDoctors}
                    className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  >
                    {facilityDoctors.length > 0 ? (
                      facilityDoctors.map((doc) => (
                        <option key={doc.id} value={doc.name}>
                          {doc.name} — {doc.role} ({doc.room || doc.department})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No doctors currently registered at {caseData.facility || "this facility"}
                      </option>
                    )}
                    <option value="Other">Other Doctor (Enter Custom Name)...</option>
                  </select>

                  {assignedDoctor === "Other" && (
                    <input
                      type="text"
                      value={customDoctor}
                      onChange={(e) => setCustomDoctor(e.target.value)}
                      placeholder="Enter doctor's full name & specialty..."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                  )}
                </div>

                {/* Consultation Schedule Date & Time */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Consultation Schedule Date & Time</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Doctor Queue
                    </span>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <p className="text-[10px] text-emerald-800">
                  Ticket will be forwarded to {assignedDoctor === "Other" ? (customDoctor || "selected doctor") : assignedDoctor} and scheduled into physician OPD queue.
                </p>
              </div>
            )}

            {/* Reverted Questions Builder when Request More Information is selected */}
            {selectedAction === "Request More Information" && (
              <div className="space-y-3 p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-sky-950 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-sky-700" />
                    <span>Questions for Patient (JSON Format)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                    {revertedQuestionsList.length} Questions
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {revertedQuestionsList.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-sky-200 text-xs shadow-2xs"
                    >
                      <span className="text-slate-800 font-medium break-words">
                        <strong className="text-sky-900 mr-1">Q{qIdx + 1}:</strong> {q}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRevertedQuestionsList((prev) => prev.filter((_, i) => i !== qIdx))
                        }
                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                        title="Remove question"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new question row */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newQuestionInput}
                    onChange={(e) => setNewQuestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newQuestionInput.trim()) {
                          setRevertedQuestionsList((prev) => [...prev, newQuestionInput.trim()]);
                          setNewQuestionInput("");
                        }
                      }
                    }}
                    placeholder="Type follow-up question for patient..."
                    className="flex-1 p-2 bg-white border border-sky-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQuestionInput.trim()) {
                        setRevertedQuestionsList((prev) => [...prev, newQuestionInput.trim()]);
                        setNewQuestionInput("");
                      }
                    }}
                    className="px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Write Resolve Note Form - Only shown when nurse clicks on Resolve */}
            {selectedAction === "Resolve" && (
              <div className="space-y-2 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Write Resolve Note</span>
                  </label>

                  {/* Templates Dropdown Button */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                      className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-teal-200 shadow-2xs"
                    >
                      <span>Templates</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {templateDropdownOpen && (
                      <div
                        className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs space-y-1"
                        onMouseLeave={() => setTemplateDropdownOpen(false)}
                      >
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Select Resolve Template
                        </div>
                        {resolveNoteTemplates.map((tmpl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectTemplate(tmpl)}
                            className="w-full text-left p-2 rounded-lg hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs transition-colors cursor-pointer"
                          >
                            {tmpl}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value.slice(0, 1000))}
                  placeholder="Write clinical resolution note to complete case and save to database resolve_notes..."
                  className="w-full p-3 bg-white border border-teal-300 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 outline-hidden transition-all font-medium"
                />
                <div className="flex items-center justify-between text-[10px] text-teal-800">
                  <span>Saved to database resolve_notes &amp; status set to Completed</span>
                  <span>{resolveNote.length}/1000</span>
                </div>
              </div>
            )}

            {/* Choose Facility when Refer / Escalate is selected */}
            {selectedAction === "Refer / Escalate" && (
              <div className="space-y-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-amber-950 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Choose Referral Facility</span>
                    </label>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                      Database Verified Facilities
                    </span>
                  </div>

                  <select
                    value={referralFacilityId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReferralFacilityId(val);
                      const f = availableFacilities.find((fac) => fac.id === val);
                      if (f) setReferralFacility(f.name);
                    }}
                    disabled={loadingFacilities}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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
                  <label className="text-[11px] font-semibold text-amber-900">
                    Referral / Transfer Reason
                  </label>
                  <input
                    type="text"
                    value={referralReason}
                    onChange={(e) => setReferralReason(e.target.value)}
                    placeholder="e.g. Higher diagnostic imaging required, surgical evaluation..."
                    className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
                  />
                </div>

                <p className="text-[10px] text-amber-800">
                  Case will be transferred and escalated to {referralFacility || "selected facility"} with patient telemetry.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Submit Action</span>
            </button>

            {/* Audit Disclaimer Banner (Image 4 bottom) */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
              <span>
                Actions are logged for audit. Please ensure all information is verified.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>{caseData.reports[0] || "Medical Document"}</span>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3">
              <FileText className="w-10 h-10 text-teal-700 mx-auto opacity-80" />
              <div className="text-center">
                <div className="font-bold text-slate-800 text-sm">
                  {caseData.reports[0] || "Diagnostic Report"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Attached to case {caseData.id} &bull; {caseData.submittedTime ? `Submitted ${caseData.submittedTime}` : "Uploaded by patient"}
                </div>
              </div>
              {caseData.aiReportAnalysis && caseData.aiReportAnalysis.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-left space-y-1">
                  <div className="font-bold text-slate-700 text-[11px]">Analysis &amp; Findings:</div>
                  {caseData.aiReportAnalysis.map((item, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600">&bull; {item}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-1">
              {caseData.uploadedReportUrl ? (
                <a
                  href={caseData.uploadedReportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl"
                >
                  Download / View File
                </a>
              ) : <div />}
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Details Modal */}
      {missingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Missing Patient Intake Information</span>
              </div>
              <button
                onClick={() => setMissingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <p>The following clinical data points were not captured during intake:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-800">
                {caseData.missingDetails && caseData.missingDetails.length > 0 ? (
                  caseData.missingDetails.map((item, idx) => (
                    <li key={idx} className="font-medium">
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="italic text-slate-500">No missing details identified</li>
                )}
              </ul>
            </div>
            <div className="text-right pt-2">
              <button
                onClick={() => setMissingModalOpen(false)}
                className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
