"use client";

import React from "react";
import { CaseDetails } from "./CaseReviewWorkspace";
import {
  LayoutDashboard,
  UserPlus,
  ListChecks,
  History,
  Building2,
  Clock,
  HeartPulse,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  Sparkles
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";

interface NurseDashboardOverviewProps {
  queueCount: number;
  recentCases: CaseDetails[];
  onNavigate: (tab: any) => void;
  onReviewCase: (c: CaseDetails) => void;
}

export function NurseDashboardOverview({
  queueCount,
  recentCases,
  onNavigate,
  onReviewCase,
}: NurseDashboardOverviewProps) {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      {/* Top Welcome Header like patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>{user?.facilityName || "Community Health Centre (CHC) Khandapada"} &bull; Station Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Nurse Command Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Welcome, <strong className="text-slate-900">{user?.fullName || "Nurse Staff"}</strong>. Review incoming symptom submissions, verify lab reports, and manage patient flow across clinical officers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate("intake")}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Patient Intake</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("queue")}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ListChecks className="w-4 h-4 text-teal-300" />
            <span>Triage Queue</span>
          </button>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate("queue")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">In Triage Queue</span>
            <ListChecks className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
            {queueCount}
          </div>
          <div className="text-[11px] text-teal-800 font-semibold mt-1 flex items-center gap-1">
            <span>Awaiting nurse review</span>
            <span>&rarr;</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate("activity")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Forwarded Today</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
            18
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Handed off to Medical Officers
          </div>
        </div>

        <div
          onClick={() => onNavigate("activity")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Referrals / SDH</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-rose-700 mt-2 tabular-nums">
            2
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Emergency transfers active
          </div>
        </div>

        <div
          onClick={() => onNavigate("facility")}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Clinicians on Duty</span>
            <Building2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2 tabular-nums">
            2 Available
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Doctor / Staff A active
          </div>
        </div>
      </div>

      {/* Priority Action Card for Incoming Triage Cases */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              High Priority Cases Pending Review
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immediate attention required for cases flagged by AI symptom analysis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("queue")}
            className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Queue ({queueCount})</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="space-y-3">
          {recentCases.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-teal-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-sm">
                    {item.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.urgencyClass}`}>
                    {item.urgency}
                  </span>
                  <span className="text-xs text-slate-500">
                    Patient: <strong>{item.patientId}</strong> ({item.age}y &bull; {item.gender})
                  </span>
                  <span className="text-xs text-slate-400">
                    &bull; Submitted: {item.submittedTime}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1 italic">
                  &ldquo;{item.chiefComplaint}&rdquo;
                </p>
              </div>

              <button
                type="button"
                onClick={() => onReviewCase(item)}
                className="px-4 py-2 bg-slate-900 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
