"use client";

import React from "react";
import Link from "next/link";
import { Building2, Calendar, PhoneCall } from "lucide-react";

export function LandingPilotCta() {
  return (
    <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-200 text-xs font-bold tracking-wider uppercase">
            <Building2 className="w-3.5 h-3.5" />
            <span>READY FOR YOUR FACILITY</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Transform Triage Operations in Your Healthcare Facility
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Partner with TRAAYA to de-congest crowded OPDs, equip frontline workers with assistive intelligence, and create ABDM-compliant clinical records from day one.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm text-center shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4 text-teal-800" />
            <span>Schedule a Hospital Pilot</span>
          </Link>

          <a
            href="mailto:contact@traaya.live"
            className="px-6 py-3.5 rounded-xl bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 text-white font-semibold text-sm text-center transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-teal-300" />
            <span>Email Clinical Solutions Team</span>
          </a>
        </div>
      </div>
    </section>
  );
}
