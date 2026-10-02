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
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, RefreshCw } from "lucide-react";

function DoctorPortalContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const tabParam = searchParams.get("tab") as DoctorNavTab | null;
  const [activeTab, setActiveTab] = useState<DoctorNavTab>(tabParam || "dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Live queues — start with empty arrays for SSR/client agreement
  const [queueCases, setQueueCases] = useState<CaseDetails[]>([]);
  const [reviewedCases, setReviewedCases] = useState<ReviewedCaseRecord[]>([]);
  const [selectedModalCase, setSelectedModalCase] = useState<CaseDetails | null>(null);

  // Hydrate cached doctor data from sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      const cachedQueue = sessionStorage.getItem("triage_cached_doctor_queue");
      if (cachedQueue) setQueueCases(JSON.parse(cachedQueue));
      const cachedReviewed = sessionStorage.getItem("triage_cached_doctor_reviewed");
      if (cachedReviewed) setReviewedCases(JSON.parse(cachedReviewed));
    } catch {}
  }, []);

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

  // Resolve active doctor profile ID & name
  let activeDoctorId = user?.id;
  let activeDoctorName = user?.fullName;

  if (!activeDoctorId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeDoctorId = parsed?.id || parsed?.userId;
        activeDoctorName = parsed?.fullName || activeDoctorName;
      }
    } catch {}
  }

  // Fetch live cases forwarded from Supabase / nurse triage tickets
  const loadLiveCases = useCallback(async () => {
    try {
      const liveRes = await fetchLiveNurseQueue({
        facilityId: user?.facilityId || null,
        facilityName: user?.facilityName || null,
        doctorId: activeDoctorId || null,
      });

      if (liveRes && liveRes.cases) {
        // 1. Live doctor review queue:
        // Exclude under review cases; show only scheduled cases matching this doctor's ID
        const liveDoctorQueue = liveRes.cases
          .filter((item: CaseDetails) => {
            // Must match this logged-in doctor by ID or full name
            const matchesDoctor =
              (item.doctorId && activeDoctorId && (item.doctorId === activeDoctorId || item.doctorId === user?.id || item.doctorId === user?.userId)) ||
              (item.doctorName && activeDoctorName && (item.doctorName.toLowerCase().trim() === activeDoctorName.toLowerCase().trim() || item.doctorName.toLowerCase().includes(activeDoctorName.toLowerCase()) || activeDoctorName.toLowerCase().includes(item.doctorName.toLowerCase())));

            if (!matchesDoctor) {
              return false;
            }

            // Exclude under review, draft, reverted, or completed/resolved cases
            const sLow = (item.status || "").toLowerCase().trim();
            if (
              sLow === "under review" ||
              sLow.includes("under review") ||
              sLow === "awaiting nurse review" ||
              sLow === "draft" ||
              sLow.includes("revert") ||
              sLow.includes("awaiting patient") ||
              sLow === "completed" ||
              sLow === "resolved" ||
              sLow.includes("completed history")
            ) {
              return false;
            }

            // Must be a scheduled case
            const isScheduled =
              sLow === "scheduled" ||
              sLow === "schedule" ||
              sLow.includes("scheduled") ||
              sLow.includes("schedule") ||
              Boolean(item.scheduleTime);

            return isScheduled;
          })
          .map((item: CaseDetails) => ({
            ...item,
            nurseName: item.nurseName || "Nurse Staff",
            status:
              item.status === "Forwarded to Doctor"
                ? `Forwarded by ${item.nurseName || "Nurse Staff"}`
                : item.status,
          }));
        setQueueCases(liveDoctorQueue);

        // 2. Doctor Review History:
        // STRICTLY show only cases where doctorId or doctorName matches THIS logged-in doctor!
        const liveReviewed = liveRes.cases
          .filter((item: CaseDetails) => {
            const isCompletedOrReferred =
              item.status === "Completed" ||
              item.status === "Referred" ||
              item.status === "Complete" ||
              item.status === "Completed History" ||
              item.status === "Verified" ||
              item.status.includes("Doctor Completed") ||
              item.status.includes("Prescription Ready") ||
              item.status.includes("Discharge");

            if (!isCompletedOrReferred) return false;

            // Filter by doctor matching the logged-in doctor
            const matchesDoctor =
              (item.doctorId && activeDoctorId && (item.doctorId === activeDoctorId || item.doctorId === user?.id || item.doctorId === user?.userId)) ||
              (item.doctorName && activeDoctorName && (item.doctorName.toLowerCase().trim() === activeDoctorName.toLowerCase().trim() || item.doctorName.toLowerCase().includes(activeDoctorName.toLowerCase()) || activeDoctorName.toLowerCase().includes(item.doctorName.toLowerCase())));

            return Boolean(matchesDoctor);
          })
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
            category: item.status === "Referred" ? "Referred" : "Complete",
            chiefComplaint: item.chiefComplaint,
            aiInfo: item.aiInfo,
            missingDetails: item.missingDetails,
            reports: item.reports,
            aiReportAnalysis: item.aiReportAnalysis,
            aiSuggestion: item.aiSuggestion,
            facility: item.facility,
            facilityLocation: item.facilityLocation,
            consultationMode: item.consultationMode,
            scheduleTime: item.scheduleTime,
            referalFacility: item.referalFacility,
            transferReason: item.transferReason,
            doctorId: item.doctorId,
            doctorName: item.doctorName,
            doctorDiagnosis: item.quickNotes || "Physician verified clinical encounter",
            doctorDecision:
              item.status === "Referred"
                ? `Refer (${item.referalFacility || "Hospital"})`
                : "Generate Report & Discharge",
            treatmentPlan: item.quickNotes || "Follow prescribed clinical regimen",
            prescribedMeds: item.reports,
            reviewedAt: item.submittedTime,
            attendingDoctor: item.doctorName || activeDoctorName || "Doctor",
          }));
        setReviewedCases(liveReviewed);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_cached_doctor_queue", JSON.stringify(liveDoctorQueue));
          sessionStorage.setItem("triage_cached_doctor_reviewed", JSON.stringify(liveReviewed));
        }
      }
    } catch (err) {
      console.warn("Could not load live doctor queue from database:", err);
      setQueueCases([]);
      setReviewedCases([]);
    }
  }, [user?.facilityId, user?.facilityName, activeDoctorId, activeDoctorName]);

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
    prescriptionsText?: string,
    referralData?: { destination: string; facilityId?: string; transferReason: string }
  ) => {
    // 1. Remove from review queue
    setQueueCases((prev) => prev.filter((c) => c.id !== caseItem.id));

    // Determine clinical status & category for history audit
    let actionStatus = "Under Review";
    let actionCategory = "Under Review";

    if (
      decision === "Generate Report & Discharge" ||
      decision.toLowerCase().includes("report") ||
      decision.toLowerCase().includes("discharge")
    ) {
      actionStatus = "Complete";
      actionCategory = "Complete";
    } else if (decision === "Issue e-Prescription & Discharge" || decision.toLowerCase().includes("prescription")) {
      actionStatus = "Complete";
      actionCategory = "Complete";
    } else if (decision === "Refer" || decision.startsWith("Refer")) {
      actionStatus = "Referred";
      actionCategory = "Referred";
    } else if (decision === "Teleconsultation Video Call") {
      actionStatus = "Teleconsultation Conducted";
      actionCategory = "Teleconsultation";
    } else {
      actionStatus = decision;
      actionCategory = decision;
    }

    // Resolve active doctor profile ID & name
    let activeDoctorId = user?.id;
    let activeDoctorName = user?.fullName || "Dr. Ramesh Chandra Mohanty";

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

    // 2. Add to review history
    const completedRecord: ReviewedCaseRecord = {
      ...caseItem,
      status: actionStatus,
      category: actionCategory,
      doctorDecision: decision,
      doctorNotes: notes,
      prescriptions: prescriptionsText || "",
      reviewedAt: "Just now",
      attendingDoctor: activeDoctorName,
      doctorId: activeDoctorId || caseItem.doctorId,
      doctorName: activeDoctorName || caseItem.doctorName,
      referalFacility: referralData?.destination || caseItem.referalFacility,
      referalFacilityId: referralData?.facilityId || caseItem.referalFacilityId,
      transferReason: referralData?.transferReason || caseItem.transferReason,
      patientReferralStatus: decision.toLowerCase().includes("refer") ? "Pending" : caseItem.patientReferralStatus,
      facilityReferralStatus: decision.toLowerCase().includes("refer") ? "Pending" : caseItem.facilityReferralStatus,
    };
    setReviewedCases((prev) => [completedRecord, ...prev]);

    // 3. Update backend/database if live with doctor_id
    submitLiveNurseAction({
      case_number: caseItem.id,
      action_type: decision,
      review_note: decision.toLowerCase().includes("refer") ? (referralData?.transferReason || "") : notes,
      target_status: actionStatus,
      assigned_doctor_name: activeDoctorName,
      doctor_id: activeDoctorId,
      doctor_name: activeDoctorName,
      referal_facility: referralData?.destination,
      referral_destination: referralData?.destination,
      referal_facility_id: referralData?.facilityId,
      transfer_reason: referralData?.transferReason,
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
          currentDoctorId={activeDoctorId}
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
