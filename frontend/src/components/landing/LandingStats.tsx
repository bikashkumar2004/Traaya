"use client";

import React from "react";

export function LandingStats() {
  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
        <div className="space-y-1">
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
            450+
          </div>
          <div className="text-xs font-bold text-slate-800">Primary Health Centres</div>
          <div className="text-[11px] text-slate-500">Active in 8 Indian states</div>
        </div>

        <div className="space-y-1 pt-4 md:pt-0">
          <div className="text-3xl sm:text-4xl font-black text-teal-800 tabular-nums tracking-tight">
            1.2M+
          </div>
          <div className="text-xs font-bold text-slate-800">Triaged Cases</div>
          <div className="text-[11px] text-slate-500">Processed with 0 data leaks</div>
        </div>

        <div className="space-y-1 pt-4 md:pt-0">
          <div className="text-3xl sm:text-4xl font-black text-slate-900 tabular-nums tracking-tight">
            12
          </div>
          <div className="text-xs font-bold text-slate-800">Indian Languages</div>
          <div className="text-[11px] text-slate-500">Voice, text &amp; script engine</div>
        </div>

        <div className="space-y-1 pt-4 md:pt-0">
          <div className="text-3xl sm:text-4xl font-black text-emerald-700 tabular-nums tracking-tight">
            42%
          </div>
          <div className="text-xs font-bold text-slate-800">Reduced Wait Times</div>
          <div className="text-[11px] text-slate-500">At high-volume OPD centers</div>
        </div>
      </div>
    </section>
  );
}
