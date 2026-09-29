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
import { Database, RefreshCw, CheckCircle2 } from "lucide-react";
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

  // Load real data from live PostgreSQL / Supabase on mount
  const loadData = useCallback(async () => {
    setLoadingDb(true);
    try {
      const result = await fetchLiveNurseQueue();
      setCases(result.cases || []);
      setDbSource(result.source);
    } catch (e) {
      console.warn("Could not load live database records from Supabase:", e);
      setCases([]);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle case review action submission (Persists to database)
  const handleActionSubmit = async (
    actionType: string,
    note: string,
    targetStatus: string,
    scheduleTime?: string,
    revertedQuestions?: { id: string; question: string; answer?: string }[],
    assignedDoctor?: string,
    referralFacility?: string
  ) => {
    if (!selectedCase) return;

    const caseNum = selectedCase.id;

    // Optimistic UI update
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseNum
          ? {
              ...c,
              status: targetStatus,
              quickNotes: note,
              scheduleTime: scheduleTime || c.scheduleTime,
              revertedQuestions: revertedQuestions || c.revertedQuestions,
              facility: referralFacility || c.facility,
            }
          : c
      )
    );

    setNotificationToast(`Case ${caseNum} updated to "${targetStatus}" in database.`);
    setTimeout(() => setNotificationToast(null), 4000);

    // Persist to live PostgreSQL / Supabase
    await submitLiveNurseAction({
      case_number: caseNum,
      action_type: actionType,
      review_note: note,
      target_status: targetStatus,
      assigned_doctor_name: assignedDoctor || "Dr. Ananya Sen, MD",
      referral_destination: referralFacility,
      referal_facility: referralFacility,
      referal_facility_id: referralFacility ? `FAC-${referralFacility.slice(0, 4).toUpperCase()}` : undefined,
      transfer_reason: actionType === "Refer / Escalate" ? note : undefined,
      nurse_id: user?.id,
      nurse_name: user?.fullName || "Nurse Staff",
      schedule_time: scheduleTime,
      reverted_questions: revertedQuestions,
    });

    setSelectedCase(null);
    setActiveTab("activity");
  };

  // Handle new intake case creation (Persists to database)
  const handleAddNewCase = async (newCase: CaseDetails) => {
    // Optimistically prepend to state
    setCases((prev) => [newCase, ...prev]);

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

      {/* Database Connection Status Bar */}
      <div className="flex items-center justify-between px-1 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-teal-700" />
            <span>
              Live Database:{" "}
              <strong className="text-teal-900">
                {dbSource === "api"
                  ? "PostgreSQL via API (Online)"
                  : dbSource === "supabase"
                  ? "Supabase Direct (Online)"
                  : "PostgreSQL Seeded"}
              </strong>
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-slate-500 hidden sm:inline">
              {cases.length} Total Registered Cases
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loadingDb}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-600 hover:text-teal-800 hover:bg-white border border-slate-200 text-[11px] font-semibold transition-all cursor-pointer"
          title="Refresh Queue from Database"
        >
          <RefreshCw className={`w-3 h-3 ${loadingDb ? "animate-spin text-teal-600" : ""}`} />
          <span>{loadingDb ? "Syncing..." : "Refresh Live Data"}</span>
        </button>
      </div>

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
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
          <div className="flex items-center gap-3 text-teal-800 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-teal-600 animate-ping" />
            <span>Loading TriageAssist Nurse Station...</span>
          </div>
        </div>
      }
    >
      <NursePortalContent />
    </Suspense>
  );
}
