"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  Clock,
  Check,
  Building2,
} from "lucide-react";
import { FamilyDependent } from "@/lib/auth-context";

export interface SymptomSuccessScreenProps {
  submittedTicket: any;
  effectivePatientName: string;
  selectedDependent: FamilyDependent | null;
  effectiveRelation: string;
  effectivePatientAge: number | string;
  effectivePatientGender: string;
  effectivePatientUhid: string;
  selectedFacilityName: string;
  presentBlock: string;
  onStartNew: () => void;
}

export function SymptomSuccessScreen({
  submittedTicket,
  effectivePatientName,
  selectedDependent,
  effectiveRelation,
  effectivePatientAge,
  effectivePatientGender,
  effectivePatientUhid,
  selectedFacilityName,
  presentBlock,
  onStartNew,
}: SymptomSuccessScreenProps) {
  const isDraft = submittedTicket.status === "Draft";

  return (
    <div
      className={`bg-white border rounded-3xl p-6 sm:p-10 text-slate-900 shadow-sm space-y-6 animate-in fade-in ${
        isDraft ? "border-amber-200" : "border-emerald-200/90"
      }`}
    >
      <div className="flex items-center gap-3.5 border-b border-slate-100 pb-5">
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
            isDraft
              ? "bg-amber-50 text-amber-600 border-amber-200"
              : "bg-emerald-50 text-emerald-600 border-emerald-200"
          }`}
        >
          {isDraft ? (
            <FileText className="w-8 h-8" />
          ) : (
            <CheckCircle2 className="w-8 h-8" />
          )}
        </div>
        <div>
          <div
            className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isDraft ? "text-amber-700" : "text-emerald-700"
            }`}
          >
            {isDraft ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Case Saved as Draft</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Ticket Generated &amp; Synced to Supabase Database</span>
              </>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
            Ticket ID: {submittedTicket.ticket_number || submittedTicket.case_number || "TR-9182"}
          </h2>
        </div>
      </div>

      {/* Patient Details Banner */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
            Triage Patient
          </span>
          <strong className="text-slate-950 font-bold text-sm">
            {effectivePatientName}{" "}
            {selectedDependent ? (
              <span className="text-teal-800 text-xs font-semibold">
                ({effectiveRelation})
              </span>
            ) : (
              <span className="text-slate-500 text-xs font-semibold">(Self)</span>
            )}
          </strong>
        </div>
        <div>
          <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
            Demographics &amp; UHID
          </span>
          <span className="text-slate-800 font-bold">
            {effectivePatientAge} yrs &bull; {effectivePatientGender} &bull;{" "}
            <span className="font-mono text-teal-800">{effectivePatientUhid}</span>
          </span>
        </div>
      </div>

      {/* Designated Facility Only */}
      <div className="p-4.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
        <span className="text-slate-500 uppercase text-[11px] font-bold tracking-wider block">
          Designated Facility
        </span>
        <div className="text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-2.5">
          <Building2 className="w-4.5 h-4.5 text-teal-700 shrink-0" />
          <span>
            {selectedFacilityName ||
              submittedTicket.facility_name ||
              submittedTicket.assigned_facility ||
              submittedTicket.ticket?.present_address?.facility_name ||
              (presentBlock
                ? `PHC ${presentBlock} Emergency & Clinical Desk`
                : "Designated Health Facility")}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <Link
          href="/citizen/timeline"
          className="w-full sm:w-auto px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>View in Timeline / Drafts</span>
        </Link>
        <Link
          href="/citizen"
          className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>View on Citizen Dashboard</span>
        </Link>
        <button
          type="button"
          onClick={onStartNew}
          className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all"
        >
          {isDraft ? "Start New Report" : "Submit Another Symptom Report"}
        </button>
      </div>
    </div>
  );
}
