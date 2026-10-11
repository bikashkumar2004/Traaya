"use client";

import React from "react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  Stethoscope,
  Building2,
  Users,
  ListChecks,
  UserCheck,
  FileText
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DoctorDashboardOverviewProps {
  cases: CaseDetails[];
  reviewedCases: Array<CaseDetails & { doctorNotes?: string; doctorDecision?: string; reviewedAt?: string }>;
  onSelectCase: (caseItem: CaseDetails) => void;
  onNavigateTab: (tab: "queue" | "emergency" | "history" | "facility") => void;
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
  return {
    label: "Less Urgent",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
}

function formatReviewStatus(status: string, nurseName?: string) {
  const st = (status || "").toLowerCase().trim();
  const name = nurseName || "Nurse Staff";
  if (
    st === "scheduled" ||
    st.includes("scheduled") ||
    status === "Forwarded to Doctor" ||
    st === "forwarded to doctor" ||
    st.includes("forwarded")
  ) {
    return `Forwarded by ${name}`;
  }
  return status || `Forwarded by ${name}`;
}

export function DoctorDashboardOverview({
  cases,
  reviewedCases,
  onSelectCase,
  onNavigateTab,
}: DoctorDashboardOverviewProps) {
  const { user } = useAuth();
  // Compute emergency red cases (Immediate / Red)
  const redCases = cases.filter((c) => {
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

  const pendingNurseForwarded = cases.length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const completedToday = reviewedCases.filter((c) => {
    const rawDate = (c as any).updated_at || c.updatedAt;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d >= todayStart;
        }
      } catch {}
    }
    return true;
  }).length;

  return (
    <div className="space-y-6">
      {/* 1. Unboxed Header like Nurse / Patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Doctor Clinical Decision Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Attending Physician: <strong className="text-slate-900">{user?.fullName ? (user.fullName.toLowerCase().startsWith("dr") ? user.fullName : `Dr. ${user.fullName}`) : "Attending Medical Officer"}</strong> &bull; Review nurse-verified triage submissions, escalate red-flag cases, and issue immediate clinical orders.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab("queue")}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-teal-200" />
            <span>Review Queue ({pendingNurseForwarded})</span>
          </button>
          {redCases.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab("emergency")}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>Emergency Red ({redCases.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Forwarded Queue */}
        <div 
          onClick={() => onNavigateTab("queue")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Forwarded by Nurse</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {pendingNurseForwarded}
          </div>
          <div className="text-xs text-teal-700 font-semibold mt-1 flex items-center gap-1">
            <span>Awaiting MO Consultation</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Critical Emergency Cases */}
        <div 
          onClick={() => onNavigateTab("emergency")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Critical Red Triage</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">
            {redCases.length}
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
            <span>Immediate resuscitation order</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Completed Reviews */}
        <div 
          onClick={() => onNavigateTab("history")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cases Completed Today</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {completedToday}
          </div>
          <div className="text-xs text-blue-700 font-semibold mt-1 flex items-center gap-1">
            <span>Prescriptions &amp; discharge logged</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Bed & Facility Occupancy */}
        <div 
          onClick={() => onNavigateTab("facility")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ICU &amp; Emergency Beds</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            6 <span className="text-xs text-slate-500 font-normal">/ 24 Available</span>
          </div>
          <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
            <span>Oxygen Pressure 98% Normal</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Emergency Priority Highlight (If Red Cases Exist) */}
      {redCases.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                  RED PRIORITY ALERT
                </span>
                <span className="text-xs font-bold text-slate-700">{redCases[0].id} &bull; {redCases[0].name} ({redCases[0].age}y, {redCases[0].gender})</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1">
                {redCases[0].chiefComplaint}
              </p>
              <div className="text-xs text-rose-800 font-medium mt-0.5">
                AI Clinical Flag: {redCases[0].aiSuggestion.reason}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onSelectCase(redCases[0])}
              className="w-full md:w-auto px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Examine &amp; Order</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Live Triage Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Patients Forwarded by Nurse Station
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("queue")}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({cases.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
            <ListChecks className="w-10 h-10 mx-auto text-slate-400" />
            <div className="font-bold text-slate-700 text-sm">
              No forwarded cases found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Only cases forwarded by a nurse or doctor appear in this review queue.
              <br />
              Try switching your search query or priority filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.slice(0, 4).map((item) => {
              const urgencyMeta = formatUrgencyLabel(item.urgency, item.aiSuggestion?.priority);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectCase(item)}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left Info: Case ID, Priority badge, Forwarded, Slot, Submitted Time, Patient ID, Name, Highlighted Symptoms */}
                  <div className="space-y-2.5 min-w-0 flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-extrabold text-slate-900 tracking-tight">
                        Case {item.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${urgencyMeta.badgeClass}`}
                      >
                        {urgencyMeta.label}
                      </span>

                      {/* Forwarded by Nurse Staff */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        <UserCheck className="w-3 h-3 text-purple-600" />
                        <span>{formatReviewStatus(item.status, item.nurseName)}</span>
                      </span>

                      {/* Slot Badge */}
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

                      {/* Submission Time */}
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Submitted {item.submittedTime}</span>
                      </span>
                    </div>

                    {/* Patient Identity row: Patient ID and Name */}
                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">
                        Patient ID: <span className="font-mono text-slate-900 font-bold">{item.patientId}</span>
                      </span>
                      {item.name && (
                        <>
                          <span className="text-slate-300">&bull;</span>
                          <span className="font-medium text-slate-700">
                            Name: <span className="font-semibold text-slate-900">{item.name}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* HIGHLIGHTED SYMPTOMS & CLINICAL PRESENTATION */}
                    <div className="pt-1 flex flex-wrap items-center gap-2">
                      {(() => {
                        const rawList =
                          (item.symptomsData?.symptoms && item.symptomsData.symptoms.length > 0)
                            ? item.symptomsData.symptoms
                            : (item.aiInfo?.symptoms && item.aiInfo.symptoms.length > 0)
                            ? item.aiInfo.symptoms
                            : [];

                        const symptomsList = rawList.length > 0 ? rawList : [item.chiefComplaint || "General Symptoms"];

                        return (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/90 text-teal-900 shadow-2xs">
                              <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                                SYMPTOMS:
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {symptomsList[0]}
                              </span>
                            </div>

                            {symptomsList.slice(1, 4).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                              >
                                +{s}
                              </span>
                            ))}
                          </>
                        );
                      })()}

                      {/* Medical Report Attached Badge */}
                      {((item.reports && item.reports.length > 0) || item.uploadedReportUrl) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <FileText className="w-3 h-3 text-blue-600" />
                          <span>Report Attached</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Action: Review Case Button */}
                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(item);
                      }}
                      className="px-5 py-2.5 bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer group"
                    >
                      <span>Review Case</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
