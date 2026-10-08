"use client";

import React from "react";

interface DoctorStatsData {
  activeCases: number;
  emergencyReferrals: number;
  completeCases: number;
  teleconsults: number;
}

interface DoctorProfileStatsProps {
  stats: DoctorStatsData;
}

export function DoctorProfileStats({ stats }: DoctorProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-500 font-medium">Active Cases</span>
        <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
          {stats.activeCases}
        </div>
        <div className="text-[11px] text-teal-700 font-medium mt-0.5">
          Currently in review queue
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-500 font-medium">Emergency Referrals</span>
        <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">
          {stats.emergencyReferrals}
        </div>
        <div className="text-[11px] text-rose-600 font-medium mt-0.5">
          Referrals &amp; transfers logged
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-500 font-medium">Completed Cases</span>
        <div className="text-2xl font-black text-emerald-800 mt-1 tabular-nums">
          {stats.completeCases}
        </div>
        <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
          Verified &amp; prescribed
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs text-slate-500 font-medium">Teleconsultations</span>
        <div className="text-2xl font-black text-blue-900 mt-1 tabular-nums">
          {stats.teleconsults}
        </div>
        <div className="text-[11px] text-blue-700 font-medium mt-0.5">
          Online / remote consults
        </div>
      </div>
    </div>
  );
}
