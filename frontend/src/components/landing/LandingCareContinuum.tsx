"use client";

import React from "react";
import Link from "next/link";
import { Users, ClipboardCheck, Stethoscope, CheckCircle2 } from "lucide-react";

export function LandingCareContinuum() {
  return (
    <section className="space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          A TRIAGE ENGINE FOR EVERY NEED
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Designed for Every Node in the Continuum of Care
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          TRAAYA aligns patients, frontline workers, and doctors through a unified, sync-resilient clinical language tailored for resource-constrained environments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: For Patients & Families */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition-all space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700">Citizen Intake</span>
              <h3 className="text-lg font-bold text-slate-900">For Patients &amp; Families</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Report symptoms by voice in regional languages, visual symptom selection, track visits, and receive clear non-alarming guidance on care timing without medical jargon.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Regional Voice &amp; Text in 12+ Languages</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Reassuring, non-diagnostic guidance</span>
              </li>
            </ul>
          </div>

          <Link
            href="/citizen"
            className="w-full py-2.5 px-3 text-center rounded-xl bg-teal-50 text-teal-800 font-bold text-xs hover:bg-teal-100 transition-colors"
          >
            Open Citizen Portal &rarr;
          </Link>
        </div>

        {/* Card 2: For ASHA & Frontline Nurses */}
        <div className="bg-white rounded-2xl border border-teal-300 ring-1 ring-teal-500/20 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-teal-700 text-white flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700">Front-Line Triage</span>
                <h3 className="text-lg font-bold text-slate-900">For ASHA &amp; Frontline Nurses</h3>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
                Field Ready
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Instantly parse handwritten OPD slips with OCR, run structured vitals intake with out-of-bracket alerts, and transfer clinical summary directly to the doctor&apos;s queue.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Optical Scan for Prescriptions &amp; Labs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Auto-sync upon reconnection</span>
              </li>
            </ul>
          </div>

          <Link
            href="/nurse"
            className="w-full py-2.5 px-3 text-center rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors shadow-xs"
          >
            Open Health Worker Station &rarr;
          </Link>
        </div>

        {/* Card 3: For Doctors & Medical Officers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between hover:border-slate-400 hover:shadow-md transition-all space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Doctor Workstation</span>
              <h3 className="text-lg font-bold text-slate-900">For Doctors &amp; Medical Officers</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review pre-structured, chronological patient summaries with confidence scores, sign off on care pathways, and maintain compliance-ready audit trails for Ayushman Bharat.
            </p>
            <ul className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Pre-clustered priority queue</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>Immutable doctor attestation log</span>
              </li>
            </ul>
          </div>

          <Link
            href="/doctor"
            className="w-full py-2.5 px-3 text-center rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Open Doctor Station &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
