"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { fetchRegisteredFacilities, RegisteredFacilityOption } from "@/lib/nurse-api";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  UserCheck,
  Video,
  Building2,
  Languages,
  AlertTriangle,
  X,
} from "lucide-react";
import { generateDischargePdf } from "@/lib/generateDischargePdf";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";
import {
  DoctorDischargeModal,
  DoctorVideoCallModal,
  DoctorReportModal,
  DoctorQueueListView,
  DoctorDecisionDeck,
  DoctorCaseTabs,
  DoctorActionOption,
} from "./queue";

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

  // 2. Yellow / Urgent Priority
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
  const [dischargeCondition, setDischargeCondition] = useState<string>("Recovered & Clinically Stable");
  const [dischargeAdvice, setDischargeAdvice] = useState<string>("Take prescribed medication on schedule, maintain hydration, and rest. Return immediately if red-flag symptoms reappear.");
  const [dischargeFollowUp, setDischargeFollowUp] = useState<string>("Routine follow-up in OPD after 5 days if required");

  // Groq AI Clinical Discharge Workspace States
  const [isGeneratingDischarge, setIsGeneratingDischarge] = useState<boolean>(false);
  const [dischargeModalOpen, setDischargeModalOpen] = useState<boolean>(false);
  const [dischargeReportData, setDischargeReportData] = useState<DischargeReportPayload | null>(null);
  const [isEditingDischarge, setIsEditingDischarge] = useState<boolean>(false);
  const [isSavingDischarge, setIsSavingDischarge] = useState<boolean>(false);

  // 3. Refer Action
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

  // Clinical Actions
  const actionOptions: DoctorActionOption[] = [
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
  // VIEW 1: CASE REVIEW WORKSPACE
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

        {/* Top Header Row */}
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
            <DoctorCaseTabs
              activeTab={activeTab}
              selectedCase={selectedCase}
              onViewReport={() => setReportModalOpen(true)}
            />
          </div>

          {/* RIGHT COLUMN: Doctor Review & Actions (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {hasConductedTeleconsult && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-amber-950 animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="leading-snug">
                    <strong>Teleconsultation Completed:</strong> Please select an action below (Generate Report &amp; Discharge or Refer) to record patient disposition.
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

            <DoctorDecisionDeck
              selectedCase={selectedCase}
              actionOptions={actionOptions}
              selectedAction={selectedAction}
              setSelectedAction={setSelectedAction}
              dischargeReportData={dischargeReportData}
              isGeneratingDischarge={isGeneratingDischarge}
              handleGenerateDischargeReport={handleGenerateDischargeReport}
              setDischargeModalOpen={setDischargeModalOpen}
              referralHospital={referralHospital}
              setReferralHospital={setReferralHospital}
              referralFacilityId={referralFacilityId}
              setReferralFacilityId={setReferralFacilityId}
              availableFacilities={availableFacilities}
              loadingFacilities={loadingFacilities}
              transferReason={transferReason}
              setTransferReason={setTransferReason}
              setVideoCallModalOpen={setVideoCallModalOpen}
              setCallDuration={setCallDuration}
              reviewNote={reviewNote}
              setReviewNote={setReviewNote}
              handleSubmitReview={handleSubmitReview}
            />
          </div>
        </div>

        {/* Report Modal */}
        <DoctorReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          selectedCase={selectedCase}
        />

        {/* Official Hospital Discharge Summary Verification Modal */}
        <DoctorDischargeModal
          isOpen={dischargeModalOpen}
          onClose={() => setDischargeModalOpen(false)}
          dischargeReportData={dischargeReportData}
          setDischargeReportData={setDischargeReportData}
          isEditingDischarge={isEditingDischarge}
          setIsEditingDischarge={setIsEditingDischarge}
          selectedCase={selectedCase}
          isSavingDischarge={isSavingDischarge}
          handleSaveAndAuthorizeDischarge={handleSaveAndAuthorizeDischarge}
        />

        {/* Teleconsultation Video Call Modal */}
        <DoctorVideoCallModal
          isOpen={videoCallModalOpen}
          onClose={() => setVideoCallModalOpen(false)}
          selectedCase={selectedCase}
          callDuration={callDuration}
          formatCallTime={formatCallTime}
          isMicMuted={isMicMuted}
          setIsMicMuted={setIsMicMuted}
          isVideoMuted={isVideoMuted}
          setIsVideoMuted={setIsVideoMuted}
          onEndCall={() => {
            setVideoCallModalOpen(false);
            setHasConductedTeleconsult(true);
            setReviewNote((prev) =>
              prev
                ? `${prev}\n\n[Teleconsultation]: Live video call completed (${formatCallTime(callDuration)}). Evaluated patient via live video and discussed clinical findings.`
                : `[Teleconsultation]: Live video call completed (${formatCallTime(callDuration)}). Evaluated patient via live video and discussed clinical findings.`
            );
            setTeleconsultAlertOpen(true);
          }}
        />

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
  // VIEW 2: QUEUE LIST VIEW
  // -------------------------------------------------------------
  return (
    <DoctorQueueListView
      filteredCases={filteredCases}
      totalCount={totalCount}
      redCount={redCount}
      yellowCount={yellowCount}
      greenCount={greenCount}
      filterPriority={filterPriority}
      setFilterPriority={setFilterPriority}
      queueSearch={queueSearch}
      setQueueSearch={setQueueSearch}
      onSelectCase={onSelectCase}
      formatUrgencyLabel={formatUrgencyLabel}
      formatReviewStatus={formatReviewStatus}
    />
  );
}
