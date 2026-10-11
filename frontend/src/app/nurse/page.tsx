"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { NurseShell, NurseNavTab } from "@/components/nurse/NurseShell";
import { NurseDashboardOverview } from "@/components/nurse/NurseDashboardOverview";
import { PatientIntakeWorkflow } from "@/components/nurse/PatientIntakeWorkflow";
import { TriageQueueView } from "@/components/nurse/TriageQueueView";
import { CaseReviewWorkspace, CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { CaseActivityView } from "@/components/nurse/CaseActivityView";
import { FacilityAvailabilityView } from "@/components/nurse/FacilityAvailabilityView";
import { NurseProfileView } from "@/components/nurse/NurseProfileView";
import {
  fetchLiveNurseQueue,
  submitLiveNurseAction,
  submitLiveNurseIntake,
} from "@/lib/nurse-api";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

function NursePortalContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as NurseNavTab) || "dashboard";

  const [activeTab, setActiveTab] = useState<NurseNavTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cases, setCases] = useState<CaseDetails[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const [dbSource, setDbSource] = useState<"api" | "supabase" | "fallback">("supabase");
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Hydrate cached nurse cases from sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("triage_cached_nurse_cases");
      if (cached) {
        setCases(JSON.parse(cached));
        setLoadingDb(false);
      }
    } catch {}
  }, []);

  // Load real data from live PostgreSQL / Supabase on mount (facility-scoped)
  const loadData = useCallback(async () => {
    try {
      const result = await fetchLiveNurseQueue({
        facilityId: user?.facilityId || null,
        facilityName: user?.facilityName || null,
        nurseId: user?.id || null,
      });
      const loadedCases = result.cases || [];
      setCases(loadedCases);
      setDbSource(result.source);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("triage_cached_nurse_cases", JSON.stringify(loadedCases));
      }
    } catch (e) {
      console.warn("Could not load live database records from Supabase:", e);
      setCases([]);
    } finally {
      setLoadingDb(false);
    }
  }, [user?.facilityId, user?.facilityName, user?.id]);

  useEffect(() => {
    loadData();

    // 1. Live Supabase Realtime subscription on triage_tickets
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("nurse-portal-live-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "triage_tickets" },
          () => {
            loadData();
          }
        )
        .subscribe();
    }

    // 2. Auto-refresh polling every 6 seconds as fallback
    const interval = setInterval(() => {
      loadData();
    }, 6000);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
  }, [loadData]);

  // Handle case review action submission (Persists to database)
  const handleActionSubmit = async (
    actionType: string,
    note: string,
    targetStatus: string,
    scheduleTime?: string,
    revertedQuestions?: { id: string; question: string; answer?: string }[],
    assignedDoctor?: string,
    referralFacility?: string,
    assignedDoctorId?: string,
    referralFacilityId?: string
  ) => {
    if (!selectedCase) return;

    const caseNum = selectedCase.id;

    const finalTargetStatus =
      actionType === "Schedule & Forward to Doctor" ||
      targetStatus.toLowerCase() === "schedule" ||
      targetStatus.toLowerCase() === "scheduled"
        ? "Scheduled"
        : targetStatus;

    // Resolve active nurse ID referencing profiles table
    let activeNurseId = user?.id;
    let activeNurseName = user?.fullName;

    if (!activeNurseId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("triageassist_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          activeNurseId = parsed?.id;
          activeNurseName = parsed?.fullName || activeNurseName;
        }
      } catch {
        // ignore
      }
    }

    // Optimistic UI update
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseNum
          ? {
              ...c,
              status: finalTargetStatus,
              nurseId: activeNurseId || c.nurseId,
              nurseName: activeNurseName || c.nurseName,
              doctorId: assignedDoctorId || c.doctorId,
              doctorName: assignedDoctor || c.doctorName,
              quickNotes: note,
              scheduleTime: scheduleTime || c.scheduleTime,
              revertedQuestions: revertedQuestions || c.revertedQuestions,
              facility: referralFacility || c.facility,
              referalFacility: referralFacility || c.referalFacility,
              referalFacilityId: referralFacilityId || c.referalFacilityId,
            }
          : c
      )
    );

    setNotificationToast(`Case ${caseNum} updated to "${finalTargetStatus}" in database.`);
    setTimeout(() => setNotificationToast(null), 4000);

    // Persist to live PostgreSQL / Supabase
    await submitLiveNurseAction({
      case_number: caseNum,
      action_type: actionType,
      review_note: note,
      target_status: finalTargetStatus,
      doctor_id: assignedDoctorId,
      doctor_name: assignedDoctor,
      referral_destination: referralFacility,
      referal_facility: referralFacility,
      referal_facility_id: referralFacilityId,
      transfer_reason: actionType === "Refer / Escalate" ? note : undefined,
      nurse_id: activeNurseId,
      nurse_name: activeNurseName || "Nurse Staff",
      schedule_time: scheduleTime,
      reverted_questions: revertedQuestions,
    });

    // Refresh live queue from database to ensure complete synchronization
    await loadData();

    setSelectedCase(null);
    setActiveTab("activity");
  };

  // Handle new intake case creation (Persists to database)
  const handleAddNewCase = async (newCase: CaseDetails) => {
    // Optimistically prepend to state, filtering duplicate id if any
    setCases((prev) => [newCase, ...prev.filter((c) => c.id !== newCase.id)]);

    setNotificationToast(`Case ${newCase.id} pushed to live triage queue database.`);
    setTimeout(() => setNotificationToast(null), 4000);

    // Persist to live PostgreSQL / Supabase
    await submitLiveNurseIntake(newCase);
  };

  const handleSelectCaseForReview = (c: CaseDetails) => {
    setSelectedCase(c);
    setActiveTab("queue");
  };

  return (
    <NurseShell
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab !== "queue") {
          setSelectedCase(null);
        }
      }}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* Real database synchronization toast */}
      {notificationToast && (
        <div className="fixed top-20 right-6 z-50 bg-teal-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-700 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{notificationToast}</span>
        </div>
      )}


      {/* 1. DASHBOARD VIEW */}
      {activeTab === "dashboard" && (
        <NurseDashboardOverview
          queueCount={cases.filter((c) => (c.status || "").toLowerCase().trim() === "under review" || (c.status || "").toLowerCase().trim() === "awaiting nurse review").length}
          recentCases={cases.filter((c) => (c.status || "").toLowerCase().trim() === "under review" || (c.status || "").toLowerCase().trim() === "awaiting nurse review").slice(0, 3)}
          onNavigate={(tab) => setActiveTab(tab)}
          onReviewCase={handleSelectCaseForReview}
        />
      )}

      {/* 2. PATIENT INTAKE WORKFLOW (5 Steps from Image 2) */}
      {activeTab === "intake" && (
        <PatientIntakeWorkflow
          onCaseCreated={handleAddNewCase}
          onCancel={() => setActiveTab("queue")}
        />
      )}

      {/* 3. TRIAGE QUEUE & REVIEW WORKSPACE (Image 3 & Image 4) */}
      {activeTab === "queue" && (
        selectedCase ? (
          <CaseReviewWorkspace
            caseData={selectedCase}
            onBack={() => setSelectedCase(null)}
            onSubmitAction={handleActionSubmit}
            onUpdateCase={(updated) => {
              setSelectedCase((prev) => (prev ? { ...prev, ...updated } : null));
              setCases((prev) =>
                prev.map((c) => (c.id === selectedCase.id ? { ...c, ...updated } : c))
              );
            }}
          />
        ) : (
          <TriageQueueView
            cases={cases}
            onSelectCase={handleSelectCaseForReview}
            onOpenIntake={() => setActiveTab("intake")}
          />
        )
      )}

      {/* 4. CASE ACTIVITY (All, Forwarded to Doctor, Referrals & Escalations, Completed History) */}
      {activeTab === "activity" && (
        <CaseActivityView
          initialCases={cases}
          currentNurseId={user?.id}
          onViewCase={handleSelectCaseForReview}
        />
      )}

      {/* 5. FACILITY AVAILABILITY (Doctor/Staff A, Nurse/Staff B, Doctor/Staff C) */}
      {activeTab === "facility" && <FacilityAvailabilityView />}

      {/* 6. NURSE PROFILE VIEW (like patient profile) */}
      {activeTab === "profile" && <NurseProfileView />}
    </NurseShell>
  );
}

export default function NursePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F3F9F7]">
          <div className="flex items-center gap-3 text-teal-800 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-teal-600 animate-ping" />
            <span>Loading TRAAYA Nurse Station...</span>
          </div>
        </div>
      }
    >
      <NursePortalContent />
    </Suspense>
  );
}
