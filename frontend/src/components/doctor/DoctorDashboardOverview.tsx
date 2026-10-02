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
  HeartPulse,
  Thermometer,
  Stethoscope,
  Building2,
  ShieldCheck,
  Users,
  Flame,
  Radio
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface DoctorDashboardOverviewProps {
  cases: CaseDetails[];
  reviewedCases: Array<CaseDetails & { doctorNotes?: string; doctorDecision?: string; reviewedAt?: string }>;
  onSelectCase: (caseItem: CaseDetails) => void;
  onNavigateTab: (tab: "queue" | "emergency" | "history" | "facility") => void;
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
  const completedToday = reviewedCases.length;

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
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accepted Cases Today</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {completedToday + 18}
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

      {/* 4. Split Layout: Live Triage Feed & Telemetry Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Queue Ready for Doctor Review */}
        <div className="lg:col-span-2 space-y-3">
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

          <div className="space-y-2.5">
            {cases.slice(0, 4).map((c) => {
              const u = `${c.urgency} ${c.aiSuggestion?.priority || ""}`.toLowerCase();
              const isRed =
                u.includes("immediate") ||
                u.includes("immidiate") ||
                u.includes("red") ||
                u.includes("emergency") ||
                u.includes("critical");
              const isYellow = !isRed && (
                u.includes("yellow") ||
                (u.includes("urgent") && !u.includes("less urgent")) ||
                u.includes("priority 2") ||
                u.includes("priority 3") ||
                u.includes("moderate")
              );
              const isLessUrgent = !isRed && !isYellow && (
                u.includes("less urgent") ||
                u.includes("green") ||
                u.includes("routine") ||
                u.split(/\s+/).includes("low")
              );

              const priorityLabel = isRed
                ? "Immediate"
                : isYellow
                ? "Urgent"
                : "Less Urgent";

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCase(c)}
                  className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">{c.id}</span>
                      <span className="text-xs font-bold text-slate-800">
                        {c.name} ({c.age}y, {c.gender})
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isRed
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isYellow
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {priorityLabel}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {c.submittedTime}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 mt-1 font-medium">
                      {c.chiefComplaint}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                      <span>Location: <strong className="text-slate-700">{c.location}</strong></span>
                      {c.reports && c.reports.length > 0 && (
                        <span className="text-teal-700 font-semibold">
                          &bull; {c.reports.length} report(s) attached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-teal-50 group-hover:bg-teal-700 text-teal-800 group-hover:text-white border border-teal-200 group-hover:border-teal-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>Review Case</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (1 Col): Clinical Vitals & Red Flag Telemetry */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Critical Vitals Radar
                </h3>
              </div>
              <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">
                Live Sensor Sync
              </span>
            </div>

            <div className="space-y-3">
              {/* SpO2 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">SpO2 Desaturation</span>
                  <span className="font-black text-rose-700">1 Critical (&lt; 90%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: "25%" }} />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Oxygenation support indicated for Case #LS1026
                </div>
              </div>

              {/* BP */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Hypertensive Crisis</span>
                  <span className="font-black text-amber-700">2 Elevated (&gt; 160/100)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "40%" }} />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Screening for target organ damage and sublingual labetalol
                </div>
              </div>

              {/* Fever */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">High Febrile Sepsis Risk</span>
                  <span className="font-black text-teal-800">4 Monitored</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: "65%" }} />
                </div>
                <div className="text-[10px] text-slate-500 mt-1.5">
                  Dengue NS1 &amp; Malaria RDK screening protocol active
                </div>
              </div>
            </div>
          </div>

          {/* Quick Doctor Protocol Checklist */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4.5 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>National Clinical Protocols</span>
            </div>
            <ul className="text-xs text-teal-950/80 space-y-1.5 font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-teal-700 font-bold">&bull;</span>
                <span>Jan Aushadhi generic prescribing mandatory for essential list.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-700 font-bold">&bull;</span>
                <span>Referral to CHC Khandapada includes direct 108 trauma pre-alert.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-teal-700 font-bold">&bull;</span>
                <span>All doctor audit overrides cryptographically logged with ABDM token.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
