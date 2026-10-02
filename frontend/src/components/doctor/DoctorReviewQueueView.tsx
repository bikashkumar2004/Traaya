"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { fetchRegisteredFacilities, RegisteredFacilityOption } from "@/lib/nurse-api";
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
  Maximize2,
  Eye,
  Printer,
  Download,
  Languages,
  Loader2,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { generateDischargePdf } from "@/lib/generateDischargePdf";
import { DischargeReportPayload, DischargeReportMedication } from "@/app/api/doctor/generate-discharge/route";

interface DoctorReviewQueueViewProps {
  cases: CaseDetails[];
  onAcceptCase: (
    caseItem: CaseDetails,
    decision: string,
    notes: string,
    prescription?: string,
    referralData?: { destination: string; facilityId?: string; transferReason: string }
  ) => void;
  selectedCase: CaseDetails | null;
  onSelectCase: (caseItem: CaseDetails | null) => void;
}

export function isForwardedByNurseOrDoctor(
  c: CaseDetails,
  targetDoctorId?: string | null,
  targetDoctorName?: string | null
): boolean {
  if (!c) return false;
  const status = (c.status || "").toLowerCase().trim();

  // Exclude under review, draft, reverted, or completed/resolved cases
  if (
    status === "under review" ||
    status.includes("under review") ||
    status === "awaiting nurse review" ||
    status === "draft" ||
    status === "registered" ||
    status === "pending triage" ||
    status === "completed" ||
    status === "resolved" ||
    status === "completed history" ||
    status === "verified" ||
    status.includes("doctor completed") ||
    status.includes("prescription ready") ||
    status.includes("revert") ||
    status.includes("awaiting patient")
  ) {
    return false;
  }

  // Must have a doctorId or doctorName
  if (!c.doctorId && !c.doctorName) {
    return false;
  }

  // If targetDoctorId or targetDoctorName is provided, must match that doctor
  if (targetDoctorId || targetDoctorName) {
    const cleanDocId = (targetDoctorId || "").trim().toLowerCase();
    const cleanCaseDocId = (c.doctorId || "").trim().toLowerCase();
    const cleanDocName = (targetDoctorName || "").trim().toLowerCase();
    const cleanCaseDocName = (c.doctorName || "").trim().toLowerCase();

    const matchesId = Boolean(cleanDocId && cleanCaseDocId && cleanDocId === cleanCaseDocId);
    const matchesName = Boolean(
      cleanDocName &&
      cleanCaseDocName &&
      (cleanDocName === cleanCaseDocName ||
        cleanCaseDocName.includes(cleanDocName) ||
        cleanDocName.includes(cleanCaseDocName))
    );

    if (!matchesId && !matchesName) {
      return false;
    }
  }

  // Show only scheduled cases
  const isScheduled =
    status === "scheduled" ||
    status === "schedule" ||
    status.includes("scheduled") ||
    status.includes("schedule") ||
    Boolean(c.scheduleTime);

  return isScheduled;
}

export function formatReviewStatus(status: string, nurseName?: string, scheduleTime?: string) {
  const st = (status || "").toLowerCase().trim();
  const name = nurseName || "Nurse Priya S.";

  if (
    st === "scheduled" ||
    st.includes("scheduled") ||
    status === "Forwarded to Doctor" ||
    st === "forwarded to doctor" ||
    st.includes("forwarded")
  ) {
    return `Forwarded by ${name}`;
  }

  return status;
}

function formatUrgencyLabel(urgency?: string, aiPriority?: string) {
  const combined = `${urgency || ""} ${aiPriority || ""}`.toLowerCase();

  // 1. Red / Immediate Priority
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

  // 2. Yellow / Urgent Priority (Checked before green so "yellow" is never misidentified as "low")
  if (
    combined.includes("yellow") ||
    (combined.includes("urgent") && !combined.includes("less urgent")) ||
    combined.includes("priority 2") ||
    combined.includes("priority 3") ||
    combined.includes("medium")
  ) {
    return {
      label: "Urgent",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    };
  }

  // 3. Green / Less Urgent Priority
  if (
    combined.includes("green") ||
    combined.includes("less urgent") ||
    combined.includes("routine") ||
    combined.includes("non-urgent") ||
    combined.split(/\s+/).includes("low")
  ) {
    return {
      label: "Less Urgent",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
  }

  return {
    label: "Urgent",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  };
}

export function DoctorReviewQueueView({
  cases,
  onAcceptCase,
  selectedCase,
  onSelectCase,
}: DoctorReviewQueueViewProps) {
  const { user } = useAuth();
  // Queue list filtering
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [queueSearch, setQueueSearch] = useState<string>("");

  // Review Workspace state
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [selectedAction, setSelectedAction] = useState<string>("Generate Report & Discharge");
  const [reviewNote, setReviewNote] = useState<string>("");

  // Dynamic Action Inputs
  // 1. Generate Report & Discharge Dynamic Inputs
  const [dischargeCondition, setDischargeCondition] = useState<string>("Recovered & Clinically Stable");
  const [dischargeAdvice, setDischargeAdvice] = useState<string>("Take prescribed medication on schedule, maintain hydration, and rest. Return immediately if red-flag symptoms reappear.");
  const [dischargeFollowUp, setDischargeFollowUp] = useState<string>("Routine follow-up in OPD after 5 days if required");
  const [dischargeSlipPreviewOpen, setDischargeSlipPreviewOpen] = useState<boolean>(false);

  // Groq AI Clinical Discharge Workspace States
  const [isGeneratingDischarge, setIsGeneratingDischarge] = useState<boolean>(false);
  const [dischargeModalOpen, setDischargeModalOpen] = useState<boolean>(false);
  const [dischargeReportData, setDischargeReportData] = useState<DischargeReportPayload | null>(null);
  const [isEditingDischarge, setIsEditingDischarge] = useState<boolean>(false);
  const [isSavingDischarge, setIsSavingDischarge] = useState<boolean>(false);

  // 3. Refer Action: Medical Center to Refer strictly from database & Transfer Reason
  const [availableFacilities, setAvailableFacilities] = useState<RegisteredFacilityOption[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState<boolean>(true);
  const [referralFacilityId, setReferralFacilityId] = useState<string>("");
  const [referralHospital, setReferralHospital] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");

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
            const defaultFac =
              (selectedCase?.referalFacilityId && facs.find((f) => f.id === selectedCase.referalFacilityId)) ||
              (selectedCase?.referalFacility && facs.find((f) => f.name.toLowerCase().includes(selectedCase.referalFacility!.toLowerCase()))) ||
              facs[0];
            setReferralFacilityId(defaultFac.id);
            setReferralHospital(defaultFac.name);
          }
        }
      } catch (err) {
        console.warn("[DoctorReviewQueue] Error loading facilities:", err);
      } finally {
        if (isMounted) setLoadingFacilities(false);
      }
    }
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, [selectedCase?.referalFacilityId, selectedCase?.referalFacility]);

  // Reset discharge and referral data when selectedCase changes
  useEffect(() => {
    setDischargeReportData(null);
    setIsEditingDischarge(false);
    setTransferReason(selectedCase?.transferReason || "");
    if (selectedCase?.referalFacilityId) {
      setReferralFacilityId(selectedCase.referalFacilityId);
      const match = availableFacilities.find((f) => f.id === selectedCase.referalFacilityId);
      if (match) setReferralHospital(match.name);
    } else if (selectedCase?.referalFacility) {
      const match = availableFacilities.find((f) => f.name.toLowerCase().includes(selectedCase.referalFacility!.toLowerCase()));
      if (match) {
        setReferralFacilityId(match.id);
        setReferralHospital(match.name);
      }
    }
  }, [selectedCase?.id, selectedCase?.transferReason, selectedCase?.referalFacilityId, selectedCase?.referalFacility, availableFacilities]);

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

  // Clinical Actions: Merged e-Prescription & Discharge into unified NABH Discharge Report
  const actionOptions = [
    {
      id: "Generate Report & Discharge",
      label: "Generate Report & Discharge",
      desc: "Compile official clinical discharge report and release patient",
      icon: FileText,
      color: "emerald",
      targetStatus: "Complete",
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

  // Groq API Discharge Summary Generation (gpt-oss-120b)
  const handleGenerateDischargeReport = async () => {
    if (!selectedCase) return;
    setIsGeneratingDischarge(true);
    try {
      const res = await fetch("/api/doctor/generate-discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: selectedCase.name,
          age: selectedCase.age,
          gender: selectedCase.gender,
          patientId: selectedCase.patientId,
          admissionDate: selectedCase.submittedTime || new Date().toLocaleDateString("en-IN"),
          dischargeDate: new Date().toLocaleDateString("en-IN"),
          modeOfAdmission:
            selectedCase.consultationMode === "online"
              ? "Teleconsultation / Online Triage"
              : "Outpatient Clinical Triage / Walk-in",
          chiefComplaint: selectedCase.chiefComplaint,
          symptoms: selectedCase.aiInfo?.symptoms || [],
          vitals: (selectedCase as any).vitals || {},
          doctorNotes: reviewNote,
          doctorName: "Dr. Kavita Verma, MD",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate discharge report");
      }

      const data = await res.json();
      if (data.report) {
        setDischargeReportData(data.report);
        setDischargeCondition(data.report.dischargeCondition || "Recovered & Clinically Stable");
        setDischargeFollowUp(data.report.followUpInstructions?.recommendedFollowUp || "Routine follow-up in OPD after 5 days if required");
        setDischargeAdvice(data.report.followUpInstructions?.lifestyleDietaryInstructions || "");
        setDischargeModalOpen(true);
        setIsEditingDischarge(false);
      }
    } catch (err: any) {
      console.error("[generateDischargeReport Error]", err);
      alert("Unable to generate report right now. Please verify your network or API keys.");
    } finally {
      setIsGeneratingDischarge(false);
    }
  };

  // Authorize & Save Verified Discharge Summary to Supabase Storage & DB
  const handleSaveAndAuthorizeDischarge = async () => {
    if (!selectedCase || !dischargeReportData) return;
    setIsSavingDischarge(true);
    try {
      // 1. Generate standard 2-page NABH PDF
      const pdfDoc = generateDischargePdf(dischargeReportData);
      const pdfBase64 = pdfDoc.output("datauristring").split(",")[1];

      // 2. Trigger browser download of PDF
      pdfDoc.save(`${selectedCase.patientId || selectedCase.id}_Discharge_Summary.pdf`);

      // 3. Save to Supabase Storage & Database
      await fetch("/api/doctor/save-discharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseNumber: selectedCase.id,
          ticketId: (selectedCase as any).ticketId || (selectedCase as any).dbId,
          patientUhid: selectedCase.patientId,
          patientName: selectedCase.name,
          reportData: dischargeReportData,
          pdfBase64,
          doctorNotes: reviewNote || dischargeReportData.clinicalSummary,
          doctorName: user?.fullName || dischargeReportData.physician.name,
          doctorId: user?.id,
        }),
      });

      // 4. Compile prescription line
      const rxText = dischargeReportData.prescribedMedications
        .map((m, i) => `${i + 1}. ${m.name} | ${m.dosage} | ${m.frequency} (${m.duration})`)
        .join("\n");

      setActionSuccessToast(
        `Discharge authorized! PDF saved to storage & database for ${selectedCase.id}`
      );
      setDischargeModalOpen(false);

      setTimeout(() => {
        onAcceptCase(
          selectedCase,
          "Generate Report & Discharge",
          dischargeReportData.clinicalSummary,
          rxText
        );
        setActionSuccessToast(null);
        onSelectCase(null);
      }, 1000);
    } catch (err: any) {
      console.error("[saveDischarge Error]", err);
      alert("Error saving discharge report. Please check connection.");
    } finally {
      setIsSavingDischarge(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    // After teleconsultation, prompt doctor to take action on primary clinical actions
    if (selectedAction === "Teleconsultation Video Call") {
      setTeleconsultAlertOpen(true);
      return;
    }

    if (selectedAction === "Generate Report & Discharge") {
      if (!dischargeReportData) {
        handleGenerateDischargeReport();
        return;
      }
      setDischargeModalOpen(true);
      return;
    }

    let finalPrescription = "";
    let finalNotes = reviewNote.trim();
    let referralData: { destination: string; facilityId?: string; transferReason: string } | undefined;

    if (selectedAction === "Refer" || selectedAction.startsWith("Refer")) {
      const chosenFac = availableFacilities.find((f) => f.id === referralFacilityId);
      const finalDest = chosenFac?.name || referralHospital || "Referral Medical Facility";
      const finalFacId = referralFacilityId || chosenFac?.id;
      referralData = {
        destination: finalDest,
        facilityId: finalFacId,
        transferReason: transferReason.trim(),
      };
      const reasonPart = transferReason.trim() ? `\n[Transfer Reason]: ${transferReason.trim()}` : "";
      finalNotes = finalNotes
        ? `${finalNotes}\n\n[Referred Hospital/Facility]: ${finalDest}${reasonPart}`
        : `[Referred Hospital/Facility]: ${finalDest}${reasonPart}`;
    }

    setActionSuccessToast(`Clinical action "${selectedAction}" recorded successfully for ${selectedCase.id}`);

    setTimeout(() => {
      onAcceptCase(selectedCase, selectedAction, finalNotes, finalPrescription, referralData);
      setActionSuccessToast(null);
      onSelectCase(null);
    }, 900);
  };

  // Filter queue cases: show only scheduled cases assigned to this doctor
  let activeDocId = user?.id;
  if (!activeDocId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeDocId = parsed?.id || parsed?.userId;
      }
    } catch {}
  }
  let activeDocName = user?.fullName;
  if (!activeDocName && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeDocName = parsed?.fullName || parsed?.name;
      }
    } catch {}
  }
  const forwardedCases = cases.filter((c) => isForwardedByNurseOrDoctor(c, activeDocId, activeDocName));

  const totalCount = forwardedCases.length;
  const redCount = forwardedCases.filter((c) => {
    return formatUrgencyLabel(c.urgency, c.aiSuggestion?.priority).label === "Immediate";
  }).length;
  const yellowCount = forwardedCases.filter((c) => {
    return formatUrgencyLabel(c.urgency, c.aiSuggestion?.priority).label === "Urgent";
  }).length;
  const greenCount = forwardedCases.filter((c) => {
    return formatUrgencyLabel(c.urgency, c.aiSuggestion?.priority).label === "Less Urgent";
  }).length;

  const filteredCases = forwardedCases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.patientId.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(queueSearch.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(queueSearch.toLowerCase()));

    let matchesPriority = true;
    const priorityLabel = formatUrgencyLabel(c.urgency, c.aiSuggestion?.priority).label;
    if (filterPriority === "Immediate") {
      matchesPriority = priorityLabel === "Immediate";
    } else if (filterPriority === "Urgent") {
      matchesPriority = priorityLabel === "Urgent";
    } else if (filterPriority === "Less Urgent") {
      matchesPriority = priorityLabel === "Less Urgent";
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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>{formatReviewStatus(selectedCase.status, selectedCase.nurseName, selectedCase.scheduleTime)}</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border inline-flex items-center gap-1.5 ${
                  selectedCase.consultationMode === "online"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  {selectedCase.consultationMode === "online" ? (
                    <Video className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>Mode: {selectedCase.consultationMode === "online" ? "Online Teleconsult" : "In-Person Walk-in"}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 inline-flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-teal-600" />
                  <span>Language: {selectedCase.language || "Odia"}</span>
                </span>
              </div>

              <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
                <strong className="text-slate-900 font-bold">
                  Patient ID: {selectedCase.patientId}
                </strong>
                <span>&bull;</span>
                <span>Name: <strong className="text-slate-900 font-bold">{selectedCase.name}</strong></span>
                <span>&bull;</span>
                <span>Age/Sex: <strong className="text-slate-800">{selectedCase.age} yrs / {selectedCase.gender}</strong></span>
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
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-400">Consultation Mode</span>
                        <span className="font-semibold text-indigo-700 capitalize">
                          {selectedCase.consultationMode === "online" ? "Online Teleconsult" : (selectedCase.consultationMode || "In-Person Walk-in")}
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
                      <strong>Teleconsultation Completed:</strong> Please select an action below (Generate Report &amp; Discharge, Prescription, or Refer) to record patient disposition.
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
                    if (act.id === "Generate Report & Discharge") {
                      activeColors = isSelected ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
                    } else if (act.id === "Issue e-Prescription & Discharge") {
                      activeColors = isSelected ? "bg-teal-700 text-white border-teal-800 shadow-sm" : "border-slate-200 hover:border-slate-300";
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

              {/* 1. When Generate Report & Discharge: Clean Groq AI Generator Card (No manual input fields) */}
              {selectedAction === "Generate Report & Discharge" && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Official Clinical Discharge Summary &amp; Rx</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-emerald-900 leading-relaxed">
                    Generate NABH-standard discharge report and clinical prescription matching the official state hospital format.
                  </p>

                  {/* Clean Generate Button as requested */}
                  <div className="pt-1">
                    {!dischargeReportData ? (
                      <button
                        type="button"
                        disabled={isGeneratingDischarge}
                        onClick={handleGenerateDischargeReport}
                        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        {isGeneratingDischarge ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>Synthesizing Discharge Report...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                            <span>⚡ Generate AI Clinical Discharge Report</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-800 truncate">
                                Discharge Report Ready
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {dischargeReportData.prescribedMedications?.length || 0} Medications &bull; Ready for doctor verification
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDischargeModalOpen(true)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Verify &amp; Edit</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isGeneratingDischarge}
                            onClick={handleGenerateDischargeReport}
                            className="flex-1 py-1.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center"
                          >
                            {isGeneratingDischarge ? "Regenerating..." : "🔄 Regenerate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (dischargeReportData) {
                                const doc = generateDischargePdf(dischargeReportData);
                                doc.save(`${selectedCase.patientId || selectedCase.id}_Discharge_Summary.pdf`);
                              }
                            }}
                            className="py-1.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-slate-800">
                        Destination Medical / Hospital
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
                        const match = availableFacilities.find((f) => f.id === val);
                        if (match) setReferralHospital(match.name);
                      }}
                      disabled={loadingFacilities}
                      className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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

                  {/* Transfer Reason Field */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[11px] font-bold text-slate-800">
                      Transfer Reason &amp; Clinical Justification
                    </label>
                    <textarea
                      rows={3}
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="e.g. Higher-level secondary care required, ICU bed needed, specialized cardiology/trauma evaluation..."
                      className="w-full p-2.5 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
                    />
                  </div>
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
                        After concluding the live video call, an alert prompt will ask you to choose a definitive clinical disposition: <strong>Generate Report &amp; Discharge</strong> (Complete), <strong>Issue e-Prescription &amp; Discharge</strong> (Complete), or <strong>Refer</strong> (Referred).
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

        {/* Official Hospital Discharge Summary Verification & Authorization Workspace Modal */}
        {dischargeModalOpen && dischargeReportData && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
              {/* Modal Sticky Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 shrink-0">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Govt. of Odisha Health Department
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Clinical Discharge Summary Verification
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review and verify all clinical findings, treatments, and prescriptions prior to authorizing patient discharge.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Mode Toggle: Preview vs Edit */}
                  <button
                    type="button"
                    onClick={() => setIsEditingDischarge(!isEditingDischarge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                      isEditingDischarge
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditingDischarge ? "Editing Report" : "Edit Report"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDischargeModalOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Document Container */}
              <div className="overflow-y-auto pr-1 space-y-6 flex-1 text-slate-800 text-xs">
                {/* 1. Document Format & Metadata Header */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-sm text-slate-900">Hospital Discharge Summary Format</span>
                    <span className="text-[11px] text-teal-800 font-semibold">Standard NABH / Odisha Health Template</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Document ID</span>
                      <strong className="text-slate-900">{dischargeReportData.documentId}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Document Version</span>
                      <strong className="text-slate-900">{dischargeReportData.documentVersion}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Document Category</span>
                      <strong className="text-slate-900">{dischargeReportData.documentCategory}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Issue Date</span>
                      <strong className="text-slate-900">{dischargeReportData.issueDate}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">
                    This document serves as a standardized template for recording patient discharge information. It provides a structured format to capture essential details about a patient&apos;s hospital stay, treatment, and condition at the time of discharge.
                  </p>
                </div>

                {/* 2. Hospital Identification */}
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-base font-black text-teal-950">{dischargeReportData.hospitalName}</div>
                    <div className="text-[11px] text-teal-900">{dischargeReportData.hospitalAddress}</div>
                    <div className="text-[11px] text-teal-800 font-medium">{dischargeReportData.contactInfo}</div>
                  </div>
                  <div className="px-3 py-1 bg-white text-teal-900 border border-teal-300 rounded-xl text-[11px] font-bold shrink-0 self-start sm:self-center">
                    Official Encounter Summary
                  </div>
                </div>

                {/* 3. Patient Details Section */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Patient Details</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 1</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Name</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.patientDetails.name}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              patientDetails: { ...dischargeReportData.patientDetails, name: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <strong className="text-slate-900 font-extrabold">{dischargeReportData.patientDetails.name}</strong>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age / Sex</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.patientDetails.ageSex}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              patientDetails: { ...dischargeReportData.patientDetails, ageSex: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <strong className="text-slate-900 font-semibold">{dischargeReportData.patientDetails.ageSex}</strong>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Patient ID / MRN</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.patientDetails.patientId}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              patientDetails: { ...dischargeReportData.patientDetails, patientId: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <strong className="text-slate-900 font-mono font-bold">{dischargeReportData.patientDetails.patientId}</strong>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Admission</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.patientDetails.dateOfAdmission}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              patientDetails: { ...dischargeReportData.patientDetails, dateOfAdmission: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <span className="text-slate-800 font-medium">{dischargeReportData.patientDetails.dateOfAdmission}</span>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Discharge</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.patientDetails.dateOfDischarge}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              patientDetails: { ...dischargeReportData.patientDetails, dateOfDischarge: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <span className="text-slate-800 font-medium">{dischargeReportData.patientDetails.dateOfDischarge}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Admission Details */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Admission Details</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 2</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Reason for Admission / Presentation
                      </label>
                      {isEditingDischarge ? (
                        <textarea
                          rows={2}
                          value={dischargeReportData.admissionDetails.reasonForAdmission}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              admissionDetails: { ...dischargeReportData.admissionDetails, reasonForAdmission: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {dischargeReportData.admissionDetails.reasonForAdmission}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mode of Admission</label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.admissionDetails.modeOfAdmission}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              admissionDetails: { ...dischargeReportData.admissionDetails, modeOfAdmission: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px]">
                          {dischargeReportData.admissionDetails.modeOfAdmission}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Clinical Summary */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Clinical Summary &amp; Differential Diagnosis</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 3</span>
                  </div>
                  {isEditingDischarge ? (
                    <textarea
                      rows={3}
                      value={dischargeReportData.clinicalSummary}
                      onChange={(e) =>
                        setDischargeReportData({
                          ...dischargeReportData,
                          clinicalSummary: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line">
                      {dischargeReportData.clinicalSummary}
                    </p>
                  )}
                </div>

                {/* 6. Treatment Provided */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Treatment Provided &amp; Investigations</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 4</span>
                  </div>
                  {isEditingDischarge ? (
                    <textarea
                      rows={2}
                      value={dischargeReportData.treatmentProvided}
                      onChange={(e) =>
                        setDischargeReportData({
                          ...dischargeReportData,
                          treatmentProvided: e.target.value,
                        })
                      }
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium leading-relaxed">
                      {dischargeReportData.treatmentProvided}
                    </p>
                  )}
                </div>

                {/* 7. Discharge Condition */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Condition on Discharge</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 5</span>
                  </div>
                  {isEditingDischarge ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={dischargeReportData.dischargeCondition}
                        onChange={(e) =>
                          setDischargeReportData({
                            ...dischargeReportData,
                            dischargeCondition: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium focus:border-teal-600 outline-hidden"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          "Recovered & Clinically Stable",
                          "Symptomatically Relieved",
                          "Afebrile & Ambulatory",
                          "Mild Symptoms - Home Care",
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() =>
                              setDischargeReportData({
                                ...dischargeReportData,
                                dischargeCondition: preset,
                              })
                            }
                            className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded-md font-semibold text-slate-700 cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {dischargeReportData.dischargeCondition}
                      </span>
                    </div>
                  )}
                </div>

                {/* 8. Prescribed Medications at Discharge */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Prescribed Medications at Discharge</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 6</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase bg-slate-50">
                          <th className="p-2 w-8">#</th>
                          <th className="p-2">Medication Name</th>
                          <th className="p-2">Dosage</th>
                          <th className="p-2">Frequency</th>
                          <th className="p-2">Duration</th>
                          {isEditingDischarge && <th className="p-2 w-10 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dischargeReportData.prescribedMedications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="p-2 font-bold text-slate-500">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-800">
                              {isEditingDischarge ? (
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={(e) => {
                                    const next = [...dischargeReportData.prescribedMedications];
                                    next[idx].name = e.target.value;
                                    setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs font-semibold focus:border-teal-600 outline-hidden"
                                />
                              ) : (
                                med.name
                              )}
                            </td>
                            <td className="p-2 text-slate-700">
                              {isEditingDischarge ? (
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={(e) => {
                                    const next = [...dischargeReportData.prescribedMedications];
                                    next[idx].dosage = e.target.value;
                                    setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                                />
                              ) : (
                                med.dosage
                              )}
                            </td>
                            <td className="p-2 text-slate-700">
                              {isEditingDischarge ? (
                                <input
                                  type="text"
                                  value={med.frequency}
                                  onChange={(e) => {
                                    const next = [...dischargeReportData.prescribedMedications];
                                    next[idx].frequency = e.target.value;
                                    setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                                />
                              ) : (
                                med.frequency
                              )}
                            </td>
                            <td className="p-2 text-slate-700">
                              {isEditingDischarge ? (
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => {
                                    const next = [...dischargeReportData.prescribedMedications];
                                    next[idx].duration = e.target.value;
                                    setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                                  }}
                                  className="w-full px-2 py-1 border border-slate-300 rounded-md text-xs focus:border-teal-600 outline-hidden"
                                />
                              ) : (
                                med.duration
                              )}
                            </td>
                            {isEditingDischarge && (
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = dischargeReportData.prescribedMedications.filter((_, i) => i !== idx);
                                    setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isEditingDischarge && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = [
                          ...dischargeReportData.prescribedMedications,
                          { name: "New Generic Medicine", dosage: "1 Tablet", frequency: "OD", duration: "3 days" },
                        ];
                        setDischargeReportData({ ...dischargeReportData, prescribedMedications: next });
                      }}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Medication</span>
                    </button>
                  )}
                </div>

                {/* 9. Follow-Up Instructions */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="font-black text-slate-900 uppercase tracking-wide text-[11px] flex items-center justify-between border-b border-slate-100 pb-2">
                    <span>Follow-Up Instructions</span>
                    <span className="text-[10px] text-slate-500 font-normal">Section 7</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        1. Recommended Follow-Up
                      </label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.followUpInstructions.recommendedFollowUp}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              followUpInstructions: {
                                ...dischargeReportData.followUpInstructions,
                                recommendedFollowUp: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium">
                          {dischargeReportData.followUpInstructions.recommendedFollowUp}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        2. Next Follow-Up Date / Guidance
                      </label>
                      {isEditingDischarge ? (
                        <input
                          type="text"
                          value={dischargeReportData.followUpInstructions.nextFollowUpDate}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              followUpInstructions: {
                                ...dischargeReportData.followUpInstructions,
                                nextFollowUpDate: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium">
                          {dischargeReportData.followUpInstructions.nextFollowUpDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        3. Lifestyle / Dietary Instructions
                      </label>
                      {isEditingDischarge ? (
                        <textarea
                          rows={2}
                          value={dischargeReportData.followUpInstructions.lifestyleDietaryInstructions}
                          onChange={(e) =>
                            setDischargeReportData({
                              ...dischargeReportData,
                              followUpInstructions: {
                                ...dischargeReportData.followUpInstructions,
                                lifestyleDietaryInstructions: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium focus:border-teal-600 outline-hidden"
                        />
                      ) : (
                        <p className="text-slate-800 font-medium leading-relaxed">
                          {dischargeReportData.followUpInstructions.lifestyleDietaryInstructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 10. Signatures and Disclaimer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Doctor Signature Block */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Physician Name &amp; Signature</div>
                    <div className="font-extrabold text-slate-900">{dischargeReportData.physician.name}</div>
                    <div className="text-[11px] text-slate-600">{dischargeReportData.physician.qualification} &bull; Reg: {dischargeReportData.physician.regNo}</div>
                    <div className="pt-2 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Digitally Verified &amp; Authorized Physician</span>
                    </div>
                  </div>

                  {/* Patient Acknowledgment */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Patient Acknowledgment</div>
                    <p className="text-[11px] text-slate-600 italic">
                      &ldquo;I acknowledge that I have received and understood the above discharge summary and instructions.&rdquo;
                    </p>
                    <div className="pt-2 text-[10px] font-semibold text-slate-500">
                      Patient / Guardian Signed on File &bull; Date: {dischargeReportData.patientDetails.dateOfDischarge}
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-3 bg-slate-100 rounded-xl text-[10px] text-slate-500 leading-relaxed border border-slate-200">
                  <strong className="text-slate-700">Disclaimer: </strong>
                  {dischargeReportData.disclaimer}
                </div>
              </div>

              {/* Modal Sticky Bottom Action Bar */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>
                    Authorization will generate the NABH PDF, upload to Supabase storage, record in DB, and discharge patient.
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Download PDF Preview */}
                  <button
                    type="button"
                    onClick={() => {
                      const doc = generateDischargePdf(dischargeReportData);
                      doc.save(`${selectedCase.patientId || selectedCase.id}_Discharge_Summary.pdf`);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  {/* Verify & Complete Discharge */}
                  <button
                    type="button"
                    disabled={isSavingDischarge}
                    onClick={handleSaveAndAuthorizeDischarge}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSavingDischarge ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Saving PDF &amp; Completing Discharge...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Verify &amp; Authorize Discharge</span>
                      </>
                    )}
                  </button>
                </div>
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
                  {/* Option 1: Generate Report & Discharge */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAction("Generate Report & Discharge");
                      setTeleconsultAlertOpen(false);
                    }}
                    className="w-full p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-left flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">1. Generate Report &amp; Discharge</div>
                        <div className="text-[10px] text-emerald-800">Compile official clinical report &bull; Status: Complete</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Option 2: Refer */}
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
                        <div className="text-xs font-bold text-amber-950">2. Refer</div>
                        <div className="text-[10px] text-amber-800">Choose hospital to refer &bull; Status: Referred</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incoming Review Queue ({filteredCases.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Review patient cases forwarded by nursing staff or attending doctors for clinical authorization.
          </p>
        </div>
      </div>

      {/* Priority Metric Cards Grid (Matching requested design) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total In Queue Card */}
        <div
          onClick={() => setFilterPriority("All")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "All"
              ? "border-slate-900 ring-2 ring-slate-200"
              : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Scheduled Queue</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tabular-nums">
            {totalCount}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Scheduled for consultation
          </div>
        </div>

        {/* Red Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Immediate" ? "All" : "Immediate")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Immediate"
              ? "border-rose-500 ring-2 ring-rose-100"
              : "border-slate-200 hover:border-rose-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Red Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1.5 tabular-nums">
            {redCount}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Immediate attention needed
          </div>
        </div>

        {/* Yellow Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Urgent" ? "All" : "Urgent")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Urgent"
              ? "border-amber-500 ring-2 ring-amber-100"
              : "border-slate-200 hover:border-amber-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Yellow Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5 tabular-nums">
            {yellowCount}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Urgent clinical review
          </div>
        </div>

        {/* Green Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Less Urgent" ? "All" : "Less Urgent")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Less Urgent"
              ? "border-emerald-500 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Green Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5 tabular-nums">
            {greenCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Routine &bull; Stable condition
          </div>
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  <UserCheck className="w-3 h-3 text-purple-600" />
                  <span>{formatReviewStatus(item.status, item.nurseName, item.scheduleTime)}</span>
                </span>
                {item.scheduleTime && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    <Clock className="w-3 h-3 text-teal-600" />
                    <span>
                      {(() => {
                        try {
                          const d = new Date(item.scheduleTime);
                          return `Slot: ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                        } catch {
                          return "Scheduled";
                        }
                      })()}
                    </span>
                  </span>
                )}
                {/* Consultation Mode Badge */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                  item.consultationMode === "online"
                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                }`}>
                  {item.consultationMode === "online" ? (
                    <Video className="w-3 h-3 text-indigo-600" />
                  ) : (
                    <Building2 className="w-3 h-3 text-blue-600" />
                  )}
                  <span>{item.consultationMode === "online" ? "Online Teleconsult" : "In-Person Walk-in"}</span>
                </span>
                {/* Preferred Language Badge */}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                  <Languages className="w-3 h-3 text-teal-600" />
                  <span>{item.language || "Odia"}</span>
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">
                  Patient ID: {item.patientId}
                </span>
                <span>&bull;</span>
                <span className="font-medium text-slate-700">
                  Name: {item.name}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  {item.age} yrs &bull; {item.gender}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  {item.location}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-1 italic max-w-2xl pt-0.5">
                &ldquo;{item.chiefComplaint}&rdquo;
              </p>

              <p className="text-xs text-slate-500">
                Submitted: {item.submittedTime}
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
