"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Volume2,
  Play,
  Pause,
  ShieldAlert,
  UserCheck,
  ChevronRight,
} from "lucide-react";

export function LandingHero() {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  return (
    <section className="relative pt-6 lg:pt-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Headline, Copy & CTAs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top compliance pill badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse"></span>
            <span>SECURE DIGITAL HEALTH &bull; HL7 FHIR COMPLIANT &bull; ISO 27001</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
            AI-Assisted Triage Support for India&apos;s Frontline Healthcare
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
            A human-in-the-loop, non-diagnostic, privacy-first platform that organizes clinical priorities and patient flow at point of care in 12+ Indian languages — empowering ANMs, community hospitals, and primary clinics.
          </p>

          {/* CTAs: 2 Distinct Portals (Individual & Organization vs Health Workers) */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/login?setup=individual"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-xl bg-white border-2 border-slate-200 hover:border-teal-700 hover:bg-teal-50/50 text-slate-800 font-bold text-sm shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Users className="w-4 h-4 text-teal-700" />
              <span>Individual &amp; Organization</span>
            </Link>

            <Link
              href="/login?setup=health_worker"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-md shadow-teal-950/15 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Stethoscope className="w-4 h-4" />
              <span>Health Workers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Dual Setup Micro-Labels */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span><strong>Setup 1:</strong> Patient, Institute/PSU &amp; Camps</span>
            </span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span><strong>Setup 2:</strong> Nurses, Doctors &amp; Medical Centers</span>
            </span>
          </div>

          {/* Trust checkmarks under buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>No patient PII stored</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Digital Health Standards Compliance</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Offline-First Architecture</span>
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Clinical Intake Card Mockup */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-teal-200/90 shadow-xl p-5 sm:p-6 space-y-4 relative overflow-hidden ring-1 ring-teal-500/10">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  P1
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Patient 1482 &bull; 32 Y / Male</span>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Sub-District Hospital, Wardha &bull; Intake 09:42 AM
                  </div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                Digital ID Linked
              </span>
            </div>

            {/* Voice / Field Note snippet */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Doctor Voice / Field Note Snippet</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">0:32 sec</span>
              </div>

              {/* Simulated Audio Waveform Bar */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="w-7 h-7 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>

                <div className="flex-1 flex items-center gap-0.5 h-6">
                  {[6, 12, 18, 24, 16, 8, 14, 20, 26, 18, 12, 22, 28, 14, 8, 16, 24, 18, 10, 14, 20, 12, 6, 14, 22, 16, 8, 12, 18].map((h, i) => (
                    <span
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        isPlayingAudio ? "bg-teal-600 animate-pulse" : "bg-teal-300"
                      }`}
                      style={{ height: `${h}px` }}
                    />
                  ))}
                </div>
              </div>

              {/* Voice transcript + translation */}
              <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                <p className="font-medium text-slate-900 leading-snug">
                  &ldquo;Patient reports high fever for three days, accompanied by severe chills and acute breathlessness.&rdquo;
                </p>
                <p className="text-slate-500 text-[10px] leading-tight">
                  Voice Note Transcribed &bull; 3-day history of high fever with rigors and breathlessness.
                </p>
              </div>
            </div>

            {/* Vitals Telemetry Row */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                <span className="text-[10px] text-rose-700 font-bold block">SpO2</span>
                <span className="text-sm font-extrabold text-rose-800 tabular-nums">91%</span>
                <span className="text-[9px] text-rose-600 block">Hypoxemia</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold block">BP</span>
                <span className="text-sm font-bold text-slate-800 tabular-nums">138/88</span>
                <span className="text-[9px] text-slate-500 block">mmHg</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                <span className="text-[10px] text-amber-700 font-bold block">Pulse</span>
                <span className="text-sm font-bold text-amber-800 tabular-nums">108</span>
                <span className="text-[9px] text-amber-700 block">bpm</span>
              </div>
              <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                <span className="text-[10px] text-rose-700 font-bold block">Temp</span>
                <span className="text-sm font-bold text-rose-800 tabular-nums">102.4</span>
                <span className="text-[9px] text-rose-600 block">°F</span>
              </div>
            </div>

            {/* AI Recommendation Alert Box */}
            <div className="bg-teal-50/80 border border-teal-200 p-3 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>AI Risk Suggestion: Priority 1</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  Observation Required
                </span>
              </div>
              <p className="text-[11px] text-slate-700 leading-tight">
                Acute Febrile Illness with Borderline Hypoxemia. Stat Rapid Dengue NS1 / Malaria test recommended.
              </p>
            </div>

            {/* Footer Link to Decision Station */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Physician Sign-Off Required</span>
              </span>

              <Link
                href="/doctor/decision?id=TR-9041"
                className="font-bold text-teal-800 hover:text-teal-900 hover:underline flex items-center gap-1"
              >
                <span>Evaluate Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
