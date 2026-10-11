"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

interface Step5IntakeConfirmationProps {
  createdCaseData: any;
  onStartAnother: () => void;
  onOpenQueue: () => void;
}

export function Step5IntakeConfirmation({
  createdCaseData,
  onStartAnother,
  onOpenQueue,
}: Step5IntakeConfirmationProps) {
  if (!createdCaseData) return null;

  return (
    <div className="space-y-6 text-center py-4">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          5. Health Case Generated &bull; Live Database Synchronized
        </span>
        <h2 className="text-2xl font-black text-slate-900 mt-2">
          Case {createdCaseData.id} Created Successfully
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          The intake case is officially logged and forwarded to the clinical triage queue for review.
        </p>
      </div>

      {/* Case Snapshot Card */}
      <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Patient Name:</span>
          <span className="font-bold text-slate-900">{createdCaseData.name}</span>
        </div>
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-500 font-medium">UHID:</span>
          <span className="font-mono font-bold text-slate-900">{createdCaseData.patientId}</span>
        </div>
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Registry Table:</span>
          {createdCaseData.intakeMode === "new" ? (
            <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
              new_patient Table (Profiles untouched)
            </span>
          ) : (
            <span className="font-bold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded border border-blue-300">
              Linked to {createdCaseData.existingPatientSource === "new_patient" ? "new_patient" : "profiles"}
            </span>
          )}
        </div>
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Initial Triage:</span>
          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {createdCaseData.urgency}
          </span>
        </div>
        <div className="flex justify-between pb-2 border-b border-slate-200">
          <span className="text-slate-500 font-medium">Chief Complaint:</span>
          <span className="font-medium text-slate-800 truncate max-w-[200px]">
            {createdCaseData.chiefComplaint}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-medium">Assigned Facility:</span>
          <span className="font-bold text-slate-900">{createdCaseData.facility || "Designated Health Facility"}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onStartAnother}
          className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
        >
          + Start Another Intake
        </button>

        <button
          type="button"
          onClick={onOpenQueue}
          className="w-full sm:w-auto px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          Open in Triage Queue &bull;
        </button>
      </div>
    </div>
  );
}
