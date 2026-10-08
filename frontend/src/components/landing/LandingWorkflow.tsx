"use client";

import React from "react";
import { Users, Sparkles, HeartPulse, ShieldCheck } from "lucide-react";

export function LandingWorkflow() {
  return (
    <section className="bg-slate-50/60 rounded-3xl border border-slate-200/80 p-8 sm:p-10 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 bg-teal-100/60 px-3 py-1 rounded-full">
          CLINICAL WORKFLOW PROCESS
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          From Rural Clinic to Specialist Review in Minutes
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          A human-in-the-loop workflow that keeps frontline teams and doctors synchronized across diverse healthcare environments.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Step 01 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-300 font-mono">01</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Patient Intake</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Patient or community health worker records symptoms in any conversational Indian local dialect, keyboard, or photograph of prior slip.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-medium border-t border-slate-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span>Offline capture supported</span>
          </div>
        </div>

        {/* Step 02 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-300 font-mono">02</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900">AI Structuring</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Multilingual models parse free text symptoms into standard terminology, map chief complaints, and extract clinical vital signs from lab reports.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-medium border-t border-slate-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span>Standardized clinical terminology</span>
          </div>
        </div>

        {/* Step 03 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-300 font-mono">03</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Frontline Validation</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Nurse or ANM reviews extracted vitals, checks alert flags, confirms history, administers initial triage, and sends record to doctor immediately.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-medium border-t border-slate-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span>Frontline clinical confirmation</span>
          </div>
        </div>

        {/* Step 04 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-slate-300 font-mono">04</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-900">Physician Sign-Off</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Doctor evaluates synthesized summary, confirms diagnosis, adjusts disposition, and digitally signs disposition; patient receives clear instructions.
          </p>
          <div className="pt-2 text-[10px] text-slate-400 font-medium border-t border-slate-100 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            <span>Integrated ABDM compliance report</span>
          </div>
        </div>
      </div>
    </section>
  );
}
