"use client";

import React from "react";
import { OrganizationStatsProps } from "./types";

export const OrganizationStats: React.FC<OrganizationStatsProps> = ({
  totalCount,
  redCount,
  yellowCount,
  greenCount,
  verifiedIdCount,
  orgName,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs text-slate-500 font-bold block">Total Enrolled Patients</span>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{totalCount}</div>
        <div className="text-[11px] text-teal-800 font-extrabold mt-0.5">Under {orgName}</div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/30 shadow-2xs">
        <span className="text-xs text-rose-800 font-bold block">Immediate</span>
        <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1">{redCount}</div>
        <div className="text-[11px] text-rose-600 font-bold mt-0.5">Critical Emergency Triage</div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-2xs">
        <span className="text-xs text-amber-800 font-bold block">Urgent</span>
        <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1">{yellowCount}</div>
        <div className="text-[11px] text-amber-600 font-bold mt-0.5">Follow-up Required</div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
        <span className="text-xs text-emerald-800 font-bold block">Less Urgent / Fit</span>
        <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">{greenCount}</div>
        <div className="text-[11px] text-emerald-700 font-bold mt-0.5">Fit for Regular Duty</div>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <span className="text-xs text-slate-500 font-bold block">ID Cards Verified</span>
        <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
          {totalCount > 0 ? Math.round((verifiedIdCount / totalCount) * 100) : 100}%
        </div>
        <div className="text-[11px] text-teal-700 font-bold mt-0.5">{verifiedIdCount} of {totalCount} verified</div>
      </div>
    </div>
  );
};
