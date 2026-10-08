"use client";

import React from "react";

export function LandingUrgencySystem() {
  return (
    <section className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          STANDARDIZED TRIAGE METRICS
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Clinical Urgency Classification System
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Clear, algorithmic suggestions that prioritize critical cases while serving routine primary visits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Routine Card */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>ROUTINE</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Response within 1-2 hours</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Standard Ambulatory Clinic Visit
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Non-urgent symptoms and stable vitals. Direct to appropriate regular clinic session, providing general non-clinical lifestyle guidance.
          </p>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
            <span className="font-bold block">Typical Cases:</span>
            <p className="text-emerald-800 text-[11px]">
              Minor seasonal cold, non-acute musculoskeletal aches, routine preventive immunization check.
            </p>
          </div>
        </div>

        {/* Priority Card */}
        <div className="bg-white rounded-2xl border border-amber-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
              <span>PRIORITY</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Observation within 15-30 mins</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Moderate Symptoms Requiring Observation
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Patients requiring expedited observation or point-of-care testing. Flagged for nurse monitoring and doctor evaluation before standard queue.
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
            <span className="font-bold block">Typical Cases:</span>
            <p className="text-amber-800 text-[11px]">
              Persistent fever over 101°F, moderate asthma wheezing, suspected urinary tract infection with dysuria.
            </p>
          </div>
        </div>

        {/* Urgent Card */}
        <div className="bg-white rounded-2xl border border-rose-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
              <span>URGENT / CRITICAL</span>
            </span>
            <span className="text-[11px] text-rose-700 font-bold">Immediate Action Required</span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Stat Transfer / Critical Review
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            Severe symptom indicators or critical vital signs breach. Triggers immediate nurse notification, doctor bedside alert, and emergency transfer readiness.
          </p>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs text-rose-900 space-y-1">
            <span className="font-bold block">Emergency Triggers:</span>
            <p className="text-rose-800 text-[11px]">
              Chest pain/crushing discomfort, SpO2 &lt; 90%, altered mental status, severe pediatric dehydration, obstetric red flags.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
