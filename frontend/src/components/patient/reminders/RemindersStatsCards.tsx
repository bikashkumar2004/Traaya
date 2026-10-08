"use client";

import React from "react";
import Link from "next/link";
import { Pill, Building2, PhoneCall, ExternalLink } from "lucide-react";
import { ReminderStats } from "./types";

interface RemindersStatsCardsProps {
  stats: ReminderStats;
  facilityName?: string;
}

export function RemindersStatsCards({ stats, facilityName }: RemindersStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Adherence */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            TODAY&apos;S ADHERENCE
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
            {stats.completed} / {stats.total}{" "}
            <span className="text-xs font-normal text-slate-500">Completed</span>
          </div>
          <span className="text-[10px] text-teal-800 font-semibold block mt-0.5">
            {stats.rate}% target adherence today
          </span>
        </div>

        <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-teal-200 flex items-center justify-center font-bold text-xs text-teal-800">
          {stats.rate}%
        </div>
      </div>

      {/* Next Medication */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            UPCOMING MEDICATION
          </span>
          <Pill className="w-4 h-4 text-teal-700" />
        </div>
        <div className="text-sm font-bold text-slate-900 truncate">
          {stats.nextMed?.title || "No pending medications"}
        </div>
        <div className="text-[11px] text-slate-600">
          {stats.nextMed ? `${stats.nextMed.scheduled_time || "Scheduled"} • ${stats.nextMed.dosage || "Routine"}` : "All doses up to date"}
        </div>
        <div className="text-[10px] text-teal-800 font-medium pt-0.5 truncate">
          {stats.nextMed?.description || "All prescribed care protocols are up to date."}
        </div>
      </div>

      {/* Clinical Consult Follow-up */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
            CLINICAL FOLLOW-UP
          </span>
          <Building2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-sm font-bold text-slate-900 truncate">
          {stats.nextConsult?.title || "No scheduled consultations"}
        </div>
        <div className="text-[11px] text-slate-600 truncate">
          {stats.nextConsult
            ? `${stats.nextConsult.metadata?.facility || facilityName || "Community Health Centre"} • ${stats.nextConsult.metadata?.department || "General OPD"}`
            : "None upcoming"}
        </div>
        {stats.nextConsult?.ticket_id ? (
          <Link
            href={`/patient/timeline/${stats.nextConsult.ticket_id}`}
            className="text-[10px] text-teal-800 font-bold hover:underline inline-flex items-center gap-1 pt-0.5"
          >
            <span>View Linked Encounter</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </Link>
        ) : (
          <div className="text-[10px] text-slate-500 pt-0.5">
            {stats.nextConsult ? "Scheduled clinical evaluation" : "No clinical reviews scheduled."}
          </div>
        )}
      </div>

      {/* Frontline Home Visit */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
            ASHA COMMUNITY VISIT
          </span>
          <PhoneCall className="w-4 h-4 text-teal-700" />
        </div>
        <div className="text-sm font-bold text-slate-900 truncate">
          {stats.ashaVisit?.title || "No ASHA visits scheduled"}
        </div>
        <div className="text-[11px] text-slate-600 truncate">
          {stats.ashaVisit
            ? (stats.ashaVisit.metadata?.asha_name || "Community Health Worker (ASHA)")
            : "None upcoming"}
        </div>
        <div className="text-[10px] text-slate-500 pt-0.5">
          {stats.ashaVisit
            ? (stats.ashaVisit.metadata?.area ? `Sector: ${stats.ashaVisit.metadata.area}` : (stats.ashaVisit.metadata?.phone || "Frontline Support Active"))
            : "Community outreach will appear when scheduled."}
        </div>
      </div>
    </div>
  );
}
