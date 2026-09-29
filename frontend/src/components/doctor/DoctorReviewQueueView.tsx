"use client";

import React, { useState, useEffect } from "react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  ListChecks,
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  UserCheck,
  ArrowRightLeft,
  Lock,
  Sparkles,
  HeartPulse,
  Calendar,
  Activity,
  Info,
  Check,
  FileText,
  Pill,
  Building2,
  X,
  Edit2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2
} from "lucide-react";

interface DoctorReviewQueueViewProps {
  cases: CaseDetails[];
  onAcceptCase: (
    caseItem: CaseDetails,
    decision: string,
    notes: string,
    prescription?: string
  ) => void;
  selectedCase: CaseDetails | null;
  onSelectCase: (caseItem: CaseDetails | null) => void;
}

export function isForwardedByNurseOrDoctor(c: CaseDetails): boolean {
  if (!c) return false;
  const status = (c.status || "").toLowerCase().trim();
  const notes = (c.quickNotes || "").toLowerCase().trim();

  // Exclude non-forwarded intake/triage statuses
  if (
    status === "awaiting nurse review" ||
    status === "draft" ||
    status === "registered" ||
    status === "pending triage"
  ) {
    return false;
  }

  // Explicitly check for forwarded status by nurse or doctor
  const hasForwardedStatus =
    status.includes("forwarded by nurse") ||
    status.includes("forwarded by doctor") ||
    status.includes("forwarded by dr") ||
    status.includes("forwarded to doctor") ||
    status.includes("forwarded to mo") ||
    status.includes("forwarded to medical officer") ||
    status.startsWith("forwarded by") ||
    status === "forwarded to doctor" ||
    (status.includes("forward") &&
      (status.includes("nurse") ||
        status.includes("doctor") ||
        status.includes("dr") ||
        status.includes("mo")));

  const hasForwardedNotes =
    notes.includes("forwarded by nurse") ||
    notes.includes("forwarded by doctor") ||
    notes.includes("forwarded by dr") ||
    notes.includes("forwarded to doctor") ||
    notes.includes("forwarding to on-duty") ||
    notes.includes("forwarding to dr");

  return hasForwardedStatus || hasForwardedNotes;
}

function formatReviewStatus(status: string, nurseName?: string) {
  if (status === "Forwarded to Doctor" || status.toLowerCase() === "forwarded to doctor") {
    return `Forwarded by ${nurseName || "Nurse Priya S."}`;
  }
  return status;
}

function formatUrgencyLabel(urgency?: string, aiPriority?: string) {
  const combined = `${urgency || ""} ${aiPriority || ""}`.toLowerCase();
  if (
    combined.includes("immediate") ||
    combined.includes("immidiate") ||
    combined.includes("red") ||
    combined.includes("emergency") ||
    combined.includes("critical")
  ) {
    return {
      label: "Immediate",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
    };
  }
  if (
    combined.includes("less urgent") ||
    combined.includes("green") ||
    combined.includes("routine") ||
    combined.includes("low")
  ) {
    return {
      label: "Less Urgent",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }
  if (
    combined.includes("urgent") ||
    combined.includes("yellow") ||
    combined.includes("priority") ||
    combined.includes("medium")
  ) {
    return {
      label: "Urgent",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }
  return {
    label: "Less Urgent",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
}

export function DoctorReviewQueueView({
  cases,
  onAcceptCase,
  selectedCase,
  onSelectCase,
}: DoctorReviewQueueViewProps) {
  // Queue list filtering
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [queueSearch, setQueueSearch] = useState<string>("");

  // Review Workspace state
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [selectedAction, setSelectedAction] = useState<string>("Confirm Triage & Approve");
  const [reviewNote, setReviewNote] = useState<string>("");

  // Dynamic Action Inputs
  // 1. Confirm Triage: Hospital Checkup Timeline
  const [checkupTimeline, setCheckupTimeline] = useState<string>("Within 24 Hours (Next Morning OPD)");

  // 2. Prescription: Medicine Name, Dose, Frequency
  const [medName, setMedName] = useState<string>("Tab Paracetamol 500mg");
  const [medDose, setMedDose] = useState<string>("500mg (1 Tablet)");
  const [medFrequency, setMedFrequency] = useState<string>("TDS (3 times daily) x 3 days");

  // 3. Refer Action: Medical Center to Refer
  const [referralHospital, setReferralHospital] = useState<string>("District Hospital (DH) Nayagarh");

  // 4. Teleconsultation Video Call States
  const [videoCallModalOpen, setVideoCallModalOpen] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isVideoMuted, setIsVideoMuted] = useState<boolean>(false);
  const [hasConductedTeleconsult, setHasConductedTeleconsult] = useState<boolean>(false);
  const [teleconsultAlertOpen, setTeleconsultAlertOpen] = useState<boolean>(false);

  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [actionSuccessToast, setActionSuccessToast] = useState<string | null>(null);

  // Teleconsultation call timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (videoCallModalOpen) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [videoCallModalOpen]);

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

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
      id: "Confirm Triage & Approve",
      label: "Confirm Triage & Approve",
      desc: "Authorize triage and clear patient for outpatient care",
      icon: CheckCircle2,
      color: "emerald",
      targetStatus: "Under Review",
    },
    {
      id: "Issue e-Prescription & Discharge",
      label: "Issue e-Prescription & Discharge",
      desc: "Provide generic Rx and outpatient discharge instructions",
      icon: Pill,
      color: "teal",
      targetStatus: "Complete",
    },
    {
      id: "Admit to Ward / Observation",
      label: "Admit to Ward / Observation",
      desc: "Assign observation bed or inpatient ward at CHC",
      icon: Building2,
      color: "sky",
      targetStatus: "Under Review",
    },
    {
      id: "Refer",
      label: "Refer",
      desc: "Escalate to District Hospital specialized care",
      icon: ArrowRightLeft,
      color: "amber",
      targetStatus: "Referred",
    },
    {
      id: "Teleconsultation Video Call",
      label: "Teleconsultation (Video Call)",
      desc: "Initiate live clinical video call with patient",
      icon: Video,
      color: "indigo",
      targetStatus: "Teleconsultation Conducted",
    },
  ];

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    // After teleconsultation, prompt doctor to take action on primary clinical actions
    if (selectedAction === "Teleconsultation Video Call") {
      setTeleconsultAlertOpen(true);
      return;
    }

    let finalPrescription = "";
    let finalNotes = reviewNote.trim();

    if (selectedAction === "Confirm Triage & Approve") {
      finalNotes = finalNotes
        ? `${finalNotes}\n\n[Hospital Checkup Timeline]: ${checkupTimeline}`
        : `[Hospital Checkup Timeline]: ${checkupTimeline}`;
    } else if (selectedAction === "Issue e-Prescription & Discharge") {
      finalPrescription = `1. ${medName} | Dose: ${medDose} | Frequency: ${medFrequency}`;
      finalNotes = finalNotes
        ? `${finalNotes}\n\n[Prescription Issued]: ${medName} (${medDose}, ${medFrequency})`
        : `[Prescription Issued]: ${medName} (${medDose}, ${medFrequency})`;
    } else if (selectedAction === "Refer" || selectedAction.startsWith("Refer")) {
      finalNotes = finalNotes
        ? `${finalNotes}\n\n[Referred Hospital/Facility]: ${referralHospital}`
        : `[Referred Hospital/Facility]: ${referralHospital}`;
    }

    setActionSuccessToast(`Clinical action "${selectedAction}" recorded successfully for ${selectedCase.id}`);

    setTimeout(() => {
      onAcceptCase(selectedCase, selectedAction, finalNotes, finalPrescription);
      setActionSuccessToast(null);
      onSelectCase(null);
    }, 900);
  };

  // Filter queue cases: show only cases forwarded by nurse or doctor
  const forwardedCases = cases.filter(isForwardedByNurseOrDoctor);

  const filteredCases = forwardedCases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.patientId.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(queueSearch.toLowerCase()));

    let matchesPriority = true;
    if (filterPriority === "Immediate") {
      const u = (c.urgency || "").toLowerCase();
      matchesPriority = u.includes("immediate") || u.includes("red") || u.includes("emergency");
    } else if (filterPriority === "Urgent") {
      const u = (c.urgency || "").toLowerCase();
      matchesPriority =
        (u.includes("urgent") && !u.includes("less urgent")) ||
        u.includes("yellow") ||
        u.includes("priority");
    } else if (filterPriority === "Less Urgent") {
      const u = (c.urgency || "").toLowerCase();
      matchesPriority = u.includes("less urgent") || u.includes("green") || u.includes("routine");
    }

    return matchesSearch && matchesPriority;
  });

  // -------------------------------------------------------------
  // VIEW 1: CASE REVIEW WORKSPACE (Matches CaseReviewWorkspace.tsx)
  // -------------------------------------------------------------
  if (selectedCase) {
    return (
      <div className="space-y-5">
        {/* Toast Notification */}
        {actionSuccessToast && (
          <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionSuccessToast}</span>
          </div>
        )}

        {/* Top Header Row like patient & nurse page (no box) */}
        <div className="space-y-4">
          {/* Back Link */}
          <button
            type="button"
            onClick={() => onSelectCase(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Review Queue</span>
          </button>

          {/* Case ID, Priority Badges, Submitted Meta */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Case {selectedCase.id}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    formatUrgencyLabel(selectedCase.urgency, selectedCase.aiSuggestion?.priority).badgeClass
                  }`}
                >
                  {formatUrgencyLabel(selectedCase.urgency, selectedCase.aiSuggestion?.priority).label}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {formatReviewStatus(selectedCase.status, selectedCase.nurseName)}
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                <strong className="text-slate-900 font-bold">
                  Patient ID: {selectedCase.patientId}
                </strong>
                <span>&bull;</span>
                <span>Name: {selectedCase.name}</span>
                <span>&bull;</span>
                <span>Age: {selectedCase.age}</span>
                <span>&bull;</span>
                <span>{selectedCase.gender}</span>
                <span>&bull;</span>
                <span>Location: {selectedCase.location}</span>
              </div>
            </div>

            <div className="text-left lg:text-right text-xs text-slate-500 shrink-0">
              <div className="font-semibold text-slate-700">
                Forwarded: {selectedCase.submittedTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Via CHC Nurse Station &bull; Verified by {selectedCase.nurseName || "Nurse Priya S."}
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Name</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Age / Gender</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.age} / {selectedCase.gender}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Phone</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.phone}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Location</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.location}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Language</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.language}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Consent</span>
                        <span className="font-semibold text-emerald-700">
                          {selectedCase.consent}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Assigned Facility</span>
                        <span className="font-semibold text-slate-800">
                          {selectedCase.facility}
                        </span>
                      </div>
                      <div className="py-1">
                        <span className="text-slate-400 block mb-1">Nurse Quick Notes</span>
                        <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                          {selectedCase.quickNotes}
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
                    &ldquo;{selectedCase.chiefComplaint}&rdquo;
                  </p>

                  {selectedCase.aiInfo && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Duration</span>
                        <span className="font-bold text-slate-800">
                          {selectedCase.aiInfo.duration}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Severity</span>
                        <span className="font-bold text-slate-800">
                          {selectedCase.aiInfo.severity}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Associated</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {selectedCase.aiInfo.associated}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 block">Red Flags</span>
                        <span className="font-bold text-rose-700 truncate block">
                          {selectedCase.aiInfo.redFlags}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedCase.aiInfo?.symptoms && selectedCase.aiInfo.symptoms.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">
                        Reported Symptoms:
                      </span>
                      {selectedCase.aiInfo.symptoms.map((s, idx) => (
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
                {selectedCase.reports && selectedCase.reports.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-slate-900">
                          Attached Medical Documents ({selectedCase.reports.length})
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReportModalOpen(true)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                      >
                        View Full Document
                      </button>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{selectedCase.reports[0]}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          Verified via OCR
                        </span>
                      </div>
                      {selectedCase.aiReportAnalysis && (
                        <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                          {selectedCase.aiReportAnalysis.map((item, idx) => (
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
                {selectedCase.aiSuggestion && (
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
                          {selectedCase.aiSuggestion.priority}
                        </span>
                      </div>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {selectedCase.aiSuggestion.reason}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "Symptoms & Timeline" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Symptom Progression &amp; Timeline
                </h2>
                <div className="relative border-l-2 border-teal-200 ml-3 space-y-5 text-xs">
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Symptom Onset (3 Days Ago)</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Patient experienced sudden onset fever with body ache and generalized fatigue.
                    </p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Night Cough &amp; Anorexia (1 Day Ago)</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Dry cough worsened at night; reduced oral intake reported by family.
                    </p>
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-white" />
                    <div className="font-bold text-slate-900">Nurse Triage Verification (Today)</div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">
                      Intake verified at CHC triage desk; temperature recorded 100.8°F. Forwarded for doctor order.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Q&A History" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Clinical Intake Questionnaire Responses
                </h2>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Do you have breathing difficulty or chest tightness?
                    </div>
                    <div className="text-teal-800 font-bold mt-1">No &bull; Mild shortness of breath only after coughing</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Any history of Diabetes, Hypertension, or Kidney disease?
                    </div>
                    <div className="text-slate-700 mt-1">No chronic illness disclosed</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-semibold text-slate-800">
                      Have you taken any medication before visiting?
                    </div>
                    <div className="text-slate-700 mt-1">1 Tab Paracetamol 650mg taken yesterday evening with temporary relief</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Medical Reports" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Diagnostic Documents &amp; Automated Lab Parser
                </h2>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Complete Blood Count (CBC) Panel &bull; blood_test_report.jpeg
                    </span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Extracted via OCR
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">Hemoglobin</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">13.8 g/dL</div>
                      <span className="text-[9px] text-emerald-600 font-semibold">Normal</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-amber-300 text-center bg-amber-50/40">
                      <span className="text-[10px] text-amber-800 font-medium">WBC Count</span>
                      <div className="text-sm font-bold text-amber-900 mt-0.5">11,500 /µL</div>
                      <span className="text-[9px] text-amber-700 font-semibold">Mildly Elevated</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">Platelets</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">2.2 Lakh/µL</div>
                      <span className="text-[9px] text-emerald-600 font-semibold">Normal</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">ESR</span>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">24 mm/hr</div>
                      <span className="text-[9px] text-slate-500 font-semibold">Borderline</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AI Summary" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">
                  TriageAssist Clinical Intelligence Summary
                </h2>
                <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                  <p>
                    <strong>Clinical Rationale:</strong> The patient presents with acute febrile illness of 3 days duration accompanied by systemic manifestations (myalgia, severe fatigue, headache). Mild leukocytosis (11,500 /µL) supports an active inflammatory etiology requiring differential diagnosis (Viral fever, Dengue, or early Typhoid prevalent in Nayagarh district).
                  </p>
                  <p>
                    <strong>Recommended Interventions:</strong> Immediate oral temperature and BP check, hydration encouragement, and doctor empirical prescription with generic antipyretic.
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
                    <span>Intake verified and forwarded by Nurse Priya S.</span>
                    <span className="text-slate-400">10:35 AM</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                    <span>Opened for medical officer examination by Dr. Kavita Verma</span>
                    <span className="text-teal-700 font-medium">Just now</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Doctor Review & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Doctor Review &amp; Actions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Authorize clinical actions and record clinical review notes.
                </p>
              </div>

              {/* Notice if Teleconsultation was conducted */}
              {hasConductedTeleconsult && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="leading-snug">
                      <strong>Teleconsultation Completed:</strong> Please select an action below (Confirm Triage, Prescription, or Refer) to record patient disposition.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTeleconsultAlertOpen(true)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs transition-colors"
                  >
                    Take Action
                  </button>
                </div>
              )}

              {/* Select Action List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Action
                </label>

                <div className="space-y-2">
                  {actionOptions.map((act) => {
                    const Icon = act.icon;
                    const isSelected = selectedAction === act.id;

                    let activeColors = "bg-teal-700 text-white border-teal-800 shadow-sm";
                    if (act.id === "Confirm Triage & Approve") {
                      activeColors = isSelected ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                    } else if (act.id === "Issue e-Prescription & Discharge") {
                      activeColors = isSelected ? "bg-teal-700 text-white border-teal-800 shadow-sm" : "border-slate-200 hover:border-slate-300";
                    } else if (act.id === "Admit to Ward / Observation") {
                      activeColors = isSelected ? "bg-sky-600 text-white border-sky-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                    } else if (act.id === "Refer" || act.id === "Refer to DH Nayagarh") {
                      activeColors = isSelected ? "bg-amber-600 text-white border-amber-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                    } else if (act.id === "Teleconsultation Video Call") {
                      activeColors = isSelected ? "bg-indigo-600 text-white border-indigo-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
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

              {/* ACTION-SPECIFIC DYNAMIC INPUTS */}
              {/* 1. When Confirm Triage & Approve: Show Checkup Timeline Input */}
              {selectedAction === "Confirm Triage & Approve" && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                    <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Hospital Checkup Timeline</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Set the expected timeline for patient to report for in-person doctor checkup at the hospital.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Timeline for Checkup Patient in Hospital
                    </label>
                    <input
                      type="text"
                      value={checkupTimeline}
                      onChange={(e) => setCheckupTimeline(e.target.value)}
                      placeholder="e.g. Within 2 hours, Today by 4:00 PM, Within 24 Hours..."
                      className="w-full px-3 py-2 bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-950">Quick Presets:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        "Immediate (Within 1 hr)",
                        "Today (Within 4 hrs)",
                        "Within 24 Hours (Next Morning OPD)",
                        "Within 48 Hours",
                        "Within 1 Week",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCheckupTimeline(preset)}
                          className={`px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-colors cursor-pointer ${
                            checkupTimeline === preset
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                              : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100/70"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. When Issue e-Prescription & Discharge: Show 3 Inputs (Medicine Name, Dose, Frequency) */}
              {selectedAction === "Issue e-Prescription & Discharge" && (
                <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2 text-teal-950 font-bold text-xs">
                    <Pill className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>e-Prescription Medicine Formulation</span>
                  </div>
                  <p className="text-[11px] text-teal-900 leading-relaxed">
                    Enter the medicine name, dosage, and frequency for generic dispensation.
                  </p>

                  <div className="space-y-2.5">
                    {/* Input 1: Medicine Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>1. Medicine Name</span>
                        <span className="text-[10px] font-semibold text-teal-700">Generic Formula</span>
                      </label>
                      <input
                        type="text"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        placeholder="e.g. Tab Paracetamol 500mg, Amoxicillin 500mg, ORS Solution..."
                        className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                      />
                    </div>

                    {/* Input 2: Dose */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>2. Dose</span>
                        <span className="text-[10px] font-semibold text-teal-700">Strength &amp; Unit</span>
                      </label>
                      <input
                        type="text"
                        value={medDose}
                        onChange={(e) => setMedDose(e.target.value)}
                        placeholder="e.g. 500mg (1 Tablet), 1 Packet in 1L water, 5ml syrup..."
                        className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                      />
                    </div>

                    {/* Input 3: Frequency */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                        <span>3. Frequency</span>
                        <span className="text-[10px] font-semibold text-teal-700">Schedule &amp; Duration</span>
                      </label>
                      <input
                        type="text"
                        value={medFrequency}
                        onChange={(e) => setMedFrequency(e.target.value)}
                        placeholder="e.g. TDS (3 times daily) x 3 days, BD (Twice daily), SOS..."
                        className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                        {["OD (Once daily)", "BD (Twice daily)", "TDS (3x daily)", "QID (4x daily)", "SOS (As needed)"].map((freq) => (
                          <button
                            key={freq}
                            type="button"
                            onClick={() => setMedFrequency(`${freq} x 3 days`)}
                            className="px-2 py-0.5 text-[10px] bg-white border border-teal-200 hover:bg-teal-100/70 text-teal-900 rounded-md font-semibold cursor-pointer"
                          >
                            {freq}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. When Refer Action: Show Input to Choose Medical to Refer */}
              {(selectedAction === "Refer" || selectedAction.startsWith("Refer")) && (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                    <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Choose Medical Center to Refer</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Select the hospital or medical institution for patient referral and higher-level care.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Destination Medical / Hospital
                    </label>
                    <select
                      value={referralHospital}
                      onChange={(e) => setReferralHospital(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all cursor-pointer"
                    >
                      <option value="District Hospital (DH) Nayagarh">District Hospital (DH) Nayagarh</option>
                      <option value="AIIMS Bhubaneswar (Tertiary Care Super Specialty)">AIIMS Bhubaneswar (Tertiary Care Super Specialty)</option>
                      <option value="SCB Medical College & Hospital, Cuttack">SCB Medical College &amp; Hospital, Cuttack</option>
                      <option value="Sub-Divisional Hospital (SDH) Banapur">Sub-Divisional Hospital (SDH) Banapur</option>
                      <option value="Capital Hospital, Bhubaneswar">Capital Hospital, Bhubaneswar</option>
                      <option value="CHC Daspalla Secondary Emergency Unit">CHC Daspalla Secondary Emergency Unit</option>
                      <option value="Other Medical Facility">Other Medical Center / Hospital...</option>
                    </select>
                  </div>

                  {referralHospital === "Other Medical Facility" && (
                    <div>
                      <input
                        type="text"
                        placeholder="Type custom medical center / hospital name..."
                        onChange={(e) => setReferralHospital(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4. When Teleconsultation Action: Video Call Option */}
              {selectedAction === "Teleconsultation Video Call" && (
                <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                    <Video className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span>Teleconsultation (Video Call)</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    Initiate live audio-video consultation with patient {selectedCase.name} ({selectedCase.phone}).
                  </p>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                    <div className="text-xs min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        {selectedCase.name} ({selectedCase.patientId})
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Language: {selectedCase.language} &bull; {selectedCase.phone}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoCallModalOpen(true);
                        setCallDuration(0);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 animate-pulse"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Video Call</span>
                    </button>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-amber-950">Next Action Required:</span>
                      <p className="text-[11px] leading-relaxed">
                        After concluding the live video call, an alert prompt will ask you to choose a definitive clinical disposition: <strong>Confirm Triage &amp; Approve</strong> (Under Review), <strong>Issue e-Prescription &amp; Discharge</strong> (Complete), or <strong>Refer</strong> (Referred).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Add Review Note Form */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Doctor Review Note &amp; Differential Diagnosis
                </label>

                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value.slice(0, 1000))}
                  placeholder="Write clinical assessment, differential diagnosis, and doctor orders here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 outline-hidden transition-all"
                />
              </div>

              {/* Submit Action Button */}
              <button
                type="button"
                onClick={handleSubmitReview}
                className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Submit Clinical Decision</span>
              </button>

              {/* Audit Disclaimer Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Actions are logged for ABDM clinical audit. Please ensure all prescriptions and diagnoses are verified.
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
                  <span>blood_test_report.jpeg</span>
                </div>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 bg-slate-100 rounded-xl text-center border border-slate-200 text-xs text-slate-500">
                <FileText className="w-12 h-12 text-teal-700 mx-auto mb-2 opacity-80" />
                <div className="font-bold text-slate-800">Diagnostic Laboratory Report Slip</div>
                <div className="text-[11px] mt-1 text-slate-400">CBC Panel &bull; Patient {selectedCase.patientId}</div>
              </div>
            </div>
          </div>
        )}

        {/* Teleconsultation Video Call Modal */}
        {videoCallModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 text-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]">
              {/* Modal Header */}
              <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Clinical Teleconsultation &bull; {selectedCase.name}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                        {formatCallTime(callDuration)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Encrypted Teleconsultation Channel &bull; Patient ID: {selectedCase.patientId}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoCallModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Screen Area */}
              <div className="relative bg-slate-950 flex-1 min-h-[340px] sm:min-h-[400px] flex items-center justify-center p-4">
                {/* Simulated Patient Video Stream */}
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col items-center justify-center overflow-hidden border border-slate-700/60 shadow-inner">
                  {/* Telemetry HUD top left */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] space-y-0.5 z-10">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Video Connected ({selectedCase.language})</span>
                    </div>
                    <div className="text-slate-300 font-mono text-[9px]">
                      SpO2: 98% &bull; Pulse: 78 bpm &bull; HD Video
                    </div>
                  </div>

                  {/* Patient Avatar & Feed Simulation */}
                  <div className="text-center space-y-3 z-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-teal-600 to-indigo-600 mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-white/10">
                      {selectedCase.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-100">{selectedCase.name}</div>
                      <div className="text-xs text-slate-400 max-w-md mx-auto px-4">
                        &ldquo;{selectedCase.chiefComplaint}&rdquo;
                      </div>
                    </div>
                  </div>

                  {/* Doctor Picture-in-Picture (PiP) bottom right */}
                  <div className="absolute bottom-3 right-3 w-28 h-20 sm:w-36 sm:h-24 bg-slate-800/90 rounded-xl border-2 border-slate-600 overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-1 z-10 backdrop-blur-xs">
                    {isVideoMuted ? (
                      <VideoOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center mb-0.5">
                          Dr
                        </div>
                        <span className="text-[9px] font-bold text-slate-200">Dr. Kavita Verma</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Video Call Controls Toolbar */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400 font-medium hidden sm:block">
                  Live clinical channel encrypted &bull; Speak clearly into your microphone
                </div>

                <div className="flex items-center gap-3 mx-auto sm:mx-0">
                  {/* Mic Mute Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`p-3 rounded-full transition-colors cursor-pointer ${
                      isMicMuted ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                    title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsVideoMuted(!isVideoMuted)}
                    className={`p-3 rounded-full transition-colors cursor-pointer ${
                      isVideoMuted ? "bg-rose-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                    title={isVideoMuted ? "Turn On Camera" : "Turn Off Camera"}
                  >
                    {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setVideoCallModalOpen(false);
                      setHasConductedTeleconsult(true);
                      setReviewNote((prev) =>
                        prev
                          ? `${prev}\n\n[Teleconsultation]: Live video call completed (${formatCallTime(callDuration)}). Evaluated patient via live video and discussed clinical findings.`
                          : `[Teleconsultation]: Live video call completed (${formatCallTime(callDuration)}). Evaluated patient via live video and discussed clinical findings.`
                      );
                      setTeleconsultAlertOpen(true);
                    }}
                    className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Consultation</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POST-TELECONSULTATION ACTION ALERT MODAL */}
        {teleconsultAlertOpen && selectedCase && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-300 overflow-hidden space-y-0">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black">Action Required After Teleconsultation</h3>
                    <p className="text-[10px] text-amber-100">Live consultation concluded for {selectedCase.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTeleconsultAlertOpen(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  The live teleconsultation with {selectedCase.name} has concluded. Please select one of the clinical actions below to finalize patient disposition:
                </p>

                <div className="space-y-2.5">
                  {/* Option 1: Confirm Triage & Approve */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction("Confirm Triage & Approve");
                      setTeleconsultAlertOpen(false);
                    }}
                    className="w-full p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">1. Confirm Triage &amp; Approve</div>
                        <div className="text-[10px] text-emerald-800">Set hospital checkup timeline &bull; Status: Under Review</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 2: Issue e-Prescription & Discharge */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction("Issue e-Prescription & Discharge");
                      setTeleconsultAlertOpen(false);
                    }}
                    className="w-full p-3.5 rounded-xl border border-teal-300 bg-teal-50 hover:bg-teal-100 text-left flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-teal-950">2. Issue e-Prescription &amp; Discharge</div>
                        <div className="text-[10px] text-teal-800">Write medicine, dose &amp; frequency &bull; Status: Complete</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-teal-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 3: Refer */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction("Refer");
                      setTeleconsultAlertOpen(false);
                    }}
                    className="w-full p-3.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-left flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <ArrowRightLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-amber-950">3. Refer</div>
                        <div className="text-[10px] text-amber-800">Choose hospital to refer &bull; Status: Referred</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 4: Admit to Ward */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction("Admit to Ward / Observation");
                      setTeleconsultAlertOpen(false);
                    }}
                    className="w-full p-3 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 text-left flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-sky-950">4. Admit to Ward / Observation</div>
                        <div className="text-[10px] text-sky-800">Assign inpatient bed &bull; Status: Under Review</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-700 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: QUEUE LIST VIEW (Matches TriageQueueView.tsx EXACTLY)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Queue Header like Patient & Nurse page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span>Active Triage Queue &bull; CHC Khandapada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incoming Review Queue ({filteredCases.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Review patient cases forwarded by nursing staff or attending doctors for clinical authorization.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar (matching TriageQueueView.tsx) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Case # or Patient ID..."
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-teal-600"
          />
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "All", label: "All Priorities" },
            { id: "Immediate", label: "Immediate" },
            { id: "Urgent", label: "Urgent" },
            { id: "Less Urgent", label: "Less Urgent" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPriority(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterPriority === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items List (Matching TriageQueueView.tsx exactly) */}
      <div className="space-y-3">
        {filteredCases.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info: Case #, urgency, status, patient meta, chief complaint */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  Case {item.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    formatUrgencyLabel(item.urgency, item.aiSuggestion?.priority).badgeClass
                  }`}
                >
                  {formatUrgencyLabel(item.urgency, item.aiSuggestion?.priority).label}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                  {formatReviewStatus(item.status, item.nurseName)}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">
                  Patient ID: {item.patientId}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  Submitted: {item.submittedTime}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  {item.location}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-1 italic max-w-2xl pt-0.5">
                &ldquo;{item.chiefComplaint}&rdquo;
              </p>
            </div>

            {/* Right Action: Review Button with ArrowRight */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onSelectCase(item)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
            <ListChecks className="w-10 h-10 mx-auto text-slate-400" />
            <div className="font-bold text-slate-700 text-sm">
              No forwarded cases found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Only cases forwarded by a nurse or doctor appear in this review queue. Try switching your search query or priority filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
