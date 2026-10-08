"use client";

import React from "react";
import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { TriageTicket } from "./types";

interface DashboardVitalsWidgetProps {
  activeTicket: TriageTicket | null;
}

export function DashboardVitalsWidget({ activeTicket }: DashboardVitalsWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Latest Vitals Telemetry
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          Verified Baseline
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        {/* Temp */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Body Temperature</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            {activeTicket?.vitals?.temperature || "98.4°F"}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Resting Normal</span>
        </div>

        {/* BP */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            120/80
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Optimal Range</span>
        </div>

        {/* Pulse */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            74 <span className="text-xs font-normal text-slate-500">bpm</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Regular Rhythm</span>
        </div>

        {/* SpO2 */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">SpO2 Oxygen</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            98 <span className="text-xs font-normal text-slate-500">%</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">Good Oxygenation</span>
        </div>
      </div>

      <Link
        href="/citizen/reminders"
        className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
      >
        <HeartPulse className="w-3.5 h-3.5" />
        <span>Log Daily Vitals in Health Locker</span>
      </Link>
    </div>
  );
}
