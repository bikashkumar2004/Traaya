"use client";

import React from "react";
import {
  Clock,
  Ambulance,
  Bed,
  Zap,
  ArrowRight,
  Activity,
  HeartPulse,
  Thermometer,
  AlertCircle,
  FileText,
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { EmergencyDispositionType } from "../DoctorEmergencyCasesView";

interface DoctorEmergencyCardProps {
  c: CaseDetails;
  onOpenDispositionModal: (c: CaseDetails, type: EmergencyDispositionType) => void;
  extractCaseVitals: (caseItem: CaseDetails) => {
    spo2: number;
    bp: string;
    pulse: number;
    temp: string;
  };
}

export function DoctorEmergencyCard({
  c,
  onOpenDispositionModal,
  extractCaseVitals,
}: DoctorEmergencyCardProps) {
  const vitals = extractCaseVitals(c);
  const isSevereHypoxia = vitals.spo2 < 90;
  const isHypotensive = vitals.bp.startsWith("90/") || vitals.bp.startsWith("8");

  return (
    <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col">
      {/* Card Top Ribbon */}
      <div className="bg-rose-50/90 px-5 py-3 border-b border-rose-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-rose-950">
            CRITICAL PRIORITY &bull; {c.id}
          </span>
          <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
            UHID: {c.patientId}
          </span>
          {c.nurseName && (
            <span className="text-xs font-medium text-slate-600 hidden sm:inline">
              Triaged by {c.nurseName}
            </span>
          )}
        </div>
        <div className="text-xs text-rose-800 font-bold flex items-center gap-1.5 bg-rose-100/70 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5" />
          <span>Elapsed Wait: {c.submittedTime}</span>
        </div>
      </div>

      {/* Card Main Body */}
      <div className="p-5 sm:p-6 space-y-5">
        {/* Row 1: Patient Details + Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <span>{c.name}</span>
              <span className="text-sm font-normal text-slate-500">
                ({c.age} yrs &bull; {c.gender})
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Residence: <strong className="text-slate-800 font-semibold">{c.location}</strong> &bull; Language: {c.language} &bull; Consent: {c.consent}
            </p>
          </div>

          {/* Quick Trigger Disposition Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenDispositionModal(c, "transfer")}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
            >
              <Ambulance className="w-4 h-4" />
              <span>108 Ambulance Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDispositionModal(c, "admit_bay")}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
            >
              <Bed className="w-4 h-4" />
              <span>Reserve Red Bay</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDispositionModal(c, "stat_protocol")}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>STAT Doctor Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Vitals Telemetry Monitor Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isSevereHypoxia
                ? "bg-rose-100/80 border-rose-300 text-rose-950"
                : "bg-rose-50/60 border-rose-200 text-rose-900"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <Activity className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                SpO2 Saturation
              </div>
              <div className="text-base sm:text-lg font-black leading-tight flex items-center gap-1.5">
                <span>{vitals.spo2}%</span>
                {isSevereHypoxia && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-rose-600 text-white rounded-full font-black uppercase">
                    Severe Hypoxia
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isHypotensive
                ? "bg-amber-100/70 border-amber-300 text-amber-950"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <HeartPulse className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                Blood Pressure
              </div>
              <div className="text-base sm:text-lg font-black leading-tight flex items-center gap-1.5">
                <span>{vitals.bp} mmHg</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <HeartPulse className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                Heart Rate
              </div>
              <div className="text-base sm:text-lg font-black leading-tight">
                {vitals.pulse} <span className="text-xs font-normal text-slate-500">bpm</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
              <Thermometer className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                Temperature
              </div>
              <div className="text-base sm:text-lg font-black leading-tight">
                {vitals.temp}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Chief Complaint & AI Clinical Red Flag Alert Box */}
        <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Chief Complaint &bull; Acute Clinical Assessment
            </span>
            <span className="text-xs font-bold text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200">
              Severity: {c.aiInfo?.severity || "Critical"}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            {c.chiefComplaint}
          </p>
          <div className="text-xs text-rose-950 font-medium pt-1 border-t border-rose-200/80">
            <strong className="text-rose-900">AI Red Flag Alert:</strong> {c.aiSuggestion?.reason}
          </div>
        </div>

        {/* Row 4: Nurse Intake Observations & Facility Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">
              Nurse Triage Intake Observation:
            </span>
            <p className="text-slate-600 leading-relaxed">
              {c.quickNotes || "Patient triaged at desk. Vital telemetry alert transmitted to on-duty medical officer."}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800 block mb-0.5">
                Assigned CHC Facility:
              </span>
              <span className="text-teal-900 font-extrabold text-xs">
                {c.facility || "CHC Khandapada Emergency"} &bull; {c.facilityLocation || "Nayagarh, Odisha"}
              </span>
            </div>
            {c.reports && c.reports.length > 0 && (
              <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>{c.reports.length} report</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
