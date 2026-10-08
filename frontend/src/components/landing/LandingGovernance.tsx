"use client";

import React from "react";
import { ShieldAlert, Lock, Globe2, UserCheck } from "lucide-react";

export function LandingGovernance() {
  return (
    <section className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          CLINICAL GOVERNANCE
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Trust, Safety &amp; Indian Regulatory Compliance
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Built according to National Digital Health Blueprint (NDHB) guidelines, with absolute data residency and rigorous physician oversight at every clinical juncture.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Bento 1: Strictly Non-Diagnostic */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-teal-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Strictly Non-Diagnostic</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            System generates triage suggestions and differential considerations based on published guidelines. Never issues authoritative diagnosis—final decision rests solely with licensed medical officer.
          </p>
        </div>

        {/* Bento 2: Data Privacy & ABDM Ready */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-teal-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Data Privacy &amp; ABDM Ready</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Zero cloud storage of raw PII without consent. Architecture compliant with the Digital Personal Data Protection Act (DPDP) and Ayushman Bharat Digital Mission Level 2 standards.
          </p>
        </div>

        {/* Bento 3: Dialect-Native Accuracy */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-teal-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Globe2 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Dialect-Native Accuracy</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Acoustic models tuned to native Indian accents (Hindi, Tamil, Telugu, Marathi, Bengali, and Kannada). Designed for low literacy and medical jargon misinterpretation.
          </p>
        </div>

        {/* Bento 4: Human-in-the-Loop Always */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 shadow-xs hover:border-teal-300 transition-all">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Human-in-the-Loop Always</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every recommended care pathway requires explicit physical sign-off by a verified physician before completion. Full audit trails maintained for hospital governance.
          </p>
        </div>
      </div>
    </section>
  );
}
