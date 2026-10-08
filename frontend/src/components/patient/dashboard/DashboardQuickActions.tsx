"use client";

import React from "react";
import Link from "next/link";
import {
  Stethoscope,
  ScanLine,
  Pill,
  FileText,
  ChevronRight,
} from "lucide-react";
import { ReminderStats } from "./types";

interface DashboardQuickActionsProps {
  reminderStats: ReminderStats;
  ticketsCount: number;
}

export function DashboardQuickActions({
  reminderStats,
  ticketsCount,
}: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Symptoms Triage */}
      <Link
        href="/citizen/symptoms"
        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              AI Voice &amp; Text
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-800 transition-colors">
            Check Symptoms
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Express how you feel in English or Indian regional languages for instant clinical priority guidance.
          </p>
        </div>
        <div className="text-xs font-bold text-teal-800 inline-flex items-center gap-1">
          <span>Start Assessment</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Card 2: OCR Slip Upload */}
      <Link
        href="/citizen/upload"
        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ScanLine className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              Prescription OCR
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-800 transition-colors">
            Upload Medical Slip
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Scan doctor handwritten OPD prescriptions, CBC blood tests, or diagnostic slips for instant AI digitization.
          </p>
        </div>
        <div className="text-xs font-bold text-blue-700 inline-flex items-center gap-1">
          <span>Scan Medical Document</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Card 3: Care Reminders & Medicines */}
      <Link
        href="/citizen/reminders"
        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {reminderStats.completed}/{reminderStats.total} Done
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
            Reminders &amp; Doses
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track daily tablets, scheduled PHC follow-up consultations, and frontline ASHA checkups.
          </p>
        </div>
        <div className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
          <span>View Care Schedule</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>

      {/* Card 4: Care Timeline & History */}
      <Link
        href="/citizen/timeline"
        className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {ticketsCount} Encounters
            </span>
          </div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-800 transition-colors">
            Clinical Timeline
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review past triage assessments, AI home care advice, warning signs, and doctor clinical summaries.
          </p>
        </div>
        <div className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
          <span>Explore Records</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}
