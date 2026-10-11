"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

export function LandingDisclaimer() {
  return (
    <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-600 text-xs leading-relaxed space-y-1.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-700">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>MANDATORY CLINICAL MEDICAL PRACTICE DISCLAIMER</span>
      </div>
      <p className="text-[11px] text-slate-500">
        <strong>Notice:</strong> TRAAYA is an algorithmic prioritization and tele-triage administrative support tool only. It does not provide medical diagnoses, treatment plans, or emergency triage intervention. The suggestions shown are non-prescriptive assistance mechanisms intended solely to augment registered medical practitioners and are not meant to substitute human clinical judgment in patient care or medical emergencies.
      </p>
    </section>
  );
}
