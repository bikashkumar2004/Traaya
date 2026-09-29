"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { 
  Activity, 
  Stethoscope, 
  ClipboardCheck, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  Play, 
  Pause, 
  Users, 
  HeartPulse, 
  FileText, 
  Lock, 
  Globe2, 
  UserCheck, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  PhoneCall, 
  ChevronRight,
  Clock,
  Scan,
  Zap,
  Layers,
  ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const { setLanguage, language } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<"patient" | "nurse" | "doctor">("doctor");

  return (
    <div className="space-y-20 pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
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
                    className="w-7 h-7 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
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

      {/* ========================================================================= */}
      {/* 2. STATS / METRICS BANNER */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 3. DESIGNED FOR EVERY NODE IN THE CONTINUUM OF CARE */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            A TRIAGE ENGINE FOR EVERY NEED
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Every Node in the Continuum of Care
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            TriageAssist aligns patients, frontline workers, and doctors through a unified, sync-resilient clinical language tailored for resource-constrained environments.
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
              href="/patient"
              className="w-full py-2.5 px-3 text-center rounded-xl bg-teal-50 text-teal-800 font-bold text-xs hover:bg-teal-100 transition-colors"
            >
              Open Patient Portal &rarr;
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

      {/* ========================================================================= */}
      {/* 4. FROM RURAL CLINIC TO SPECIALIST REVIEW IN MINUTES (WORKFLOW) */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 5. CLINICAL URGENCY CLASSIFICATION SYSTEM */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 6. TRUST, SAFETY & INDIAN REGULATORY COMPLIANCE */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 7. TRANSFORM TRIAGE OPERATIONS IN YOUR FACILITY (CTA BANNER) */}
      {/* ========================================================================= */}
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
              Partner with TriageAssist to de-congest crowded OPDs, equip frontline workers with assistive intelligence, and create ABDM-compliant clinical records from day one.
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
              href="mailto:contact@triageassist.gov.in"
              className="px-6 py-3.5 rounded-xl bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 text-white font-semibold text-sm text-center transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-teal-300" />
              <span>Email Clinical Solutions Team</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. MANDATORY CLINICAL MEDICAL DISCLAIMER BOX */}
      {/* ========================================================================= */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-slate-600 text-xs leading-relaxed space-y-1.5">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>MANDATORY CLINICAL MEDICAL PRACTICE DISCLAIMER</span>
        </div>
        <p className="text-[11px] text-slate-500">
          <strong>Notice:</strong> TriageAssist is an algorithmic prioritization and tele-triage administrative support tool only. It does not provide medical diagnoses, treatment plans, or emergency triage intervention. The suggestions shown are non-prescriptive assistance mechanisms intended solely to augment registered medical practitioners and are not meant to substitute human clinical judgment in patient care or medical emergencies.
        </p>
      </section>
    </div>
  );
}
