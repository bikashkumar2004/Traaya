"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DoctorShell, DoctorNavTab } from "@/components/doctor/DoctorShell";
import { DoctorDashboardOverview } from "@/components/doctor/DoctorDashboardOverview";
import { DoctorReviewQueueView, isForwardedByNurseOrDoctor } from "@/components/doctor/DoctorReviewQueueView";
import { DoctorEmergencyCasesView } from "@/components/doctor/DoctorEmergencyCasesView";
import { DoctorReviewHistoryView, ReviewedCaseRecord } from "@/components/doctor/DoctorReviewHistoryView";
import { DoctorProfileView } from "@/components/doctor/DoctorProfileView";
import { FacilityAvailabilityView } from "@/components/nurse/FacilityAvailabilityView";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { fetchLiveNurseQueue, submitLiveNurseAction } from "@/lib/nurse-api";
import { CheckCircle2, RefreshCw } from "lucide-react";

function DoctorPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab") as DoctorNavTab | null;
  const [activeTab, setActiveTab] = useState<DoctorNavTab>(tabParam || "dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Live queues initialized empty, populated from real Supabase database
  const [queueCases, setQueueCases] = useState<CaseDetails[]>([]);
  const [reviewedCases, setReviewedCases] = useState<ReviewedCaseRecord[]>([]);
  const [selectedModalCase, setSelectedModalCase] = useState<CaseDetails | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam && ["dashboard", "queue", "emergency", "history", "facility", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: DoctorNavTab) => {
    setActiveTab(tab);
    if (tab !== "queue") {
      setSelectedModalCase(null);
    }
    router.push(`/doctor?tab=${tab}`);
  };

  // Fetch live cases forwarded from Supabase / nurse triage tickets
  const loadLiveCases = useCallback(async () => {
    try {
      const liveRes = await fetchLiveNurseQueue();
      if (liveRes && liveRes.cases) {
        const liveDoctorQueue = liveRes.cases
          .filter((item: CaseDetails) => isForwardedByNurseOrDoctor(item) || item.urgency === "Immediate" || item.urgency === "High Priority" || item.urgency === "Urgent")
          .map((item: CaseDetails) => ({
            ...item,
            nurseName: item.nurseName || "Nurse Priya S.",
            status:
              item.status === "Forwarded to Doctor"
                ? `Forwarded by ${item.nurseName || "Nurse Priya S."}`
                : item.status,
          }));
        setQueueCases(liveDoctorQueue);

        const liveReviewed = liveRes.cases
          .filter((item: CaseDetails) => item.status === "Completed History" || item.status === "Verified" || item.status.includes("Doctor Completed") || item.status.includes("Prescription Ready"))
          .map((item: CaseDetails) => ({
            id: item.id,
            patientId: item.patientId,
            name: item.name,
            age: item.age,
            gender: item.gender,
            phone: item.phone,
            location: item.location,
            language: item.language,
            consent: item.consent,
            quickNotes: item.quickNotes,
            submittedTime: item.submittedTime,
            urgency: item.urgency,
            urgencyClass: item.urgencyClass,
            status: item.status,
            category: "Complete" as const,
            chiefComplaint: item.chiefComplaint,
            aiInfo: item.aiInfo,
            missingDetails: item.missingDetails,
            reports: item.reports,
            aiReportAnalysis: item.aiReportAnalysis,
            aiSuggestion: item.aiSuggestion,
            facility: item.facility,
            facilityLocation: item.facilityLocation,
            doctorDiagnosis: "Physician verified clinical encounter",
            treatmentPlan: "Follow prescribed medication regimen and hydration",
            prescribedMeds: item.reports,
            reviewedAt: item.submittedTime,
            attendingDoctor: "Dr. Kavita Verma, MD"
          }));
        setReviewedCases(liveReviewed);
      }
    } catch (err) {
      console.warn("Could not load live doctor queue from database:", err);
      setQueueCases([]);
      setReviewedCases([]);
    }
  }, []);

  useEffect(() => {
    loadLiveCases();
  }, [loadLiveCases]);

  // Red Emergency count (Immediate / Red)
  const redCases = queueCases.filter((c) => {
    const u = `${c.urgency} ${c.aiSuggestion?.priority || ""}`.toLowerCase();
    if (u.includes("yellow") || u.includes("less urgent") || u.includes("green") || u.includes("routine")) {
      return false;
    }
    return (
      u.includes("immediate") ||
      u.includes("immidiate") ||
      u.includes("red") ||
      u.includes("emergency") ||
      u.includes("critical") ||
      u.includes("high")
    );
  });

  // Accept / Complete Case Review
  const handleAcceptCase = (
    caseItem: CaseDetails,
    decision: string,
    notes: string,
    prescriptionsText?: string
  ) => {
    // 1. Remove from review queue
    setQueueCases((prev) => prev.filter((c) => c.id !== caseItem.id));

    // Determine clinical status & category for history audit
    let actionStatus = "Under Review";
    let actionCategory = "Under Review";

    if (decision === "Confirm Triage & Approve") {
      actionStatus = "Under Review";
      actionCategory = "Under Review";
    } else if (decision === "Issue e-Prescription & Discharge" || decision.toLowerCase().includes("prescription")) {
      actionStatus = "Complete";
      actionCategory = "Complete";
    } else if (decision === "Refer" || decision.startsWith("Refer")) {
      actionStatus = "Referred";
      actionCategory = "Referred";
    } else if (decision === "Admit to Ward / Observation" || decision.toLowerCase().includes("ward") || decision.toLowerCase().includes("admit")) {
      actionStatus = "Under Review";
      actionCategory = "Under Review";
    } else if (decision === "Teleconsultation Video Call") {
      actionStatus = "Teleconsultation Conducted";
      actionCategory = "Teleconsultation";
    } else {
      actionStatus = decision;
      actionCategory = decision;
    }

    // 2. Add to review history
    const completedRecord: ReviewedCaseRecord = {
      ...caseItem,
      status: actionStatus,
      category: actionCategory,
      doctorDecision: decision,
      doctorNotes: notes,
      prescriptions: prescriptionsText || "",
      reviewedAt: "Just now",
      attendingDoctor: "Dr. Kavita Verma, MD",
    };
    setReviewedCases((prev) => [completedRecord, ...prev]);

    // 3. Update backend/database if live
    submitLiveNurseAction({
      case_number: caseItem.id,
      action_type: decision,
      review_note: notes,
      target_status: actionStatus,
      assigned_doctor_name: "Dr. Kavita Verma, MD",
    }).catch(() => {});

    // 4. Navigate to review history to show details with status
    setActiveTab("history");
    setSelectedModalCase(null);
    router.push("/doctor?tab=history");
  };

  return (
    <DoctorShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      queueCount={queueCases.length}
      emergencyCount={redCases.length}
      historyCount={reviewedCases.length}
    >
      {/* TAB 1: DASHBOARD */}
      {activeTab === "dashboard" && (
        <DoctorDashboardOverview
          cases={queueCases}
          reviewedCases={reviewedCases}
          onSelectCase={(c) => {
            setSelectedModalCase(c);
            setActiveTab("queue");
          }}
          onNavigateTab={(t) => handleTabChange(t)}
        />
      )}

      {/* TAB 2: REVIEW QUEUE */}
      {activeTab === "queue" && (
        <DoctorReviewQueueView
          cases={queueCases}
          onAcceptCase={handleAcceptCase}
          selectedCase={selectedModalCase}
          onSelectCase={setSelectedModalCase}
        />
      )}

      {/* TAB 3: EMERGENCY CASES (RED LEVEL TRIAGE) */}
      {activeTab === "emergency" && (
        <DoctorEmergencyCasesView
          cases={queueCases}
          onAcceptCase={handleAcceptCase}
          onOpenCaseModal={(c) => {
            setSelectedModalCase(c);
          }}
        />
      )}

      {/* TAB 4: REVIEW HISTORY (ACCEPTED CASES) */}
      {activeTab === "history" && (
        <DoctorReviewHistoryView
          reviewedCases={reviewedCases}
          onUpdateCase={(updatedCase) => {
            setReviewedCases((prev) =>
              prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
            );
          }}
        />
      )}

      {/* TAB 5: FACILITY AVAILABILITY */}
      {activeTab === "facility" && (
        <FacilityAvailabilityView />
      )}

      {/* TAB 6: MY PROFILE */}
      {activeTab === "profile" && (
        <DoctorProfileView />
      )}
    </DoctorShell>
  );
}

export default function DoctorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <RefreshCw className="w-5 h-5 animate-spin text-teal-700" />
            <span>Loading Doctor Clinical Hub...</span>
          </div>
        </div>
      }
    >
      <DoctorPortalContent />
    </Suspense>
  );
}
