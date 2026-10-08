"use client";

import React from "react";
import Link from "next/link";
import { Activity, CheckCircle2, Stethoscope, ArrowRight } from "lucide-react";
import { TriageTicket, normalizeStatus, formatDate } from "./types";

interface DashboardActiveTicketBannerProps {
  loading: boolean;
  ticketsCount: number;
  activeTicket: TriageTicket | null;
}

export function DashboardActiveTicketBanner({
  loading,
  ticketsCount,
  activeTicket,
}: DashboardActiveTicketBannerProps) {
  if (loading && ticketsCount === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex items-center gap-3.5 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-100 rounded w-1/3" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (activeTicket) {
    const norm = normalizeStatus(activeTicket.status);
    const style =
      norm === "Completed"
        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
        : norm === "Scheduled"
        ? "bg-teal-50 text-teal-800 border-teal-300"
        : norm === "Referred"
        ? "bg-purple-50 text-purple-800 border-purple-300"
        : norm === "Reverted"
        ? "bg-amber-50 text-amber-800 border-amber-300"
        : norm === "Draft"
        ? "bg-slate-100 text-slate-700 border-slate-300"
        : "bg-sky-50 text-sky-800 border-sky-300";

    return (
      <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-white rounded-2xl border border-teal-300/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                Active Encounter #{activeTicket.id.slice(0, 8).toUpperCase()}: {activeTicket.chief_complaint}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
                &bull; {norm}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {formatDate(activeTicket.created_at)}
              </span>
            </div>
            <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
              {activeTicket.ai_recommendation?.clinical_reasoning ||
                "Your triage submission has been logged and assigned to the local Primary Health Centre (PHC) medical team for review."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/patient/timeline/${activeTicket.id}`}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Case Advice &amp; Care</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            All Triage Encounters Up to Date
          </h3>
          <p className="text-xs text-slate-500">
            You have no pending emergency evaluations. Use the symptom check below if you feel unwell.
          </p>
        </div>
      </div>

      <Link
        href="/citizen/symptoms"
        className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0"
      >
        <Stethoscope className="w-4 h-4" />
        <span>Start Symptom Check</span>
      </Link>
    </div>
  );
}
