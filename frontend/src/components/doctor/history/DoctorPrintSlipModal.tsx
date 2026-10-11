"use client";

import React from "react";
import { Printer } from "lucide-react";
import { ReviewedCaseRecord } from "../DoctorReviewHistoryView";
import { openHospitalDischargeReport } from "@/lib/pdf/openDischargeReport";

interface DoctorPrintSlipModalProps {
  caseToPrint: ReviewedCaseRecord | null;
  onClose: () => void;
}

export function DoctorPrintSlipModal({ caseToPrint, onClose }: DoctorPrintSlipModalProps) {
  if (!caseToPrint) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
        <div className="text-center border-b border-slate-200 pb-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-800">
            Government of Odisha &bull; Health &amp; Family Welfare
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-1">
            District Civil Hospital &bull; Clinical Triage Summary
          </h3>
          <p className="text-xs text-slate-500">ABDM Digital Health Record &bull; 256-bit AES Token</p>
        </div>

        <div className="text-xs space-y-2 border-b border-slate-200 pb-3">
          <div className="flex justify-between">
            <span className="text-slate-500">Case Number:</span>
            <span className="font-bold">{caseToPrint.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Patient Name:</span>
            <span className="font-bold">{caseToPrint.name} ({caseToPrint.age}y &bull; {caseToPrint.gender})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">UHID:</span>
            <span className="font-bold">{caseToPrint.patientId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Decision:</span>
            <span className="font-bold text-emerald-700">{caseToPrint.doctorDecision || "Accepted & Cleared"}</span>
          </div>
          <div className="pt-1">
            <span className="text-slate-500 block">Assessment:</span>
            <p className="font-semibold text-slate-800 mt-0.5">{caseToPrint.doctorNotes || "Cleared for standard treatment"}</p>
          </div>
          {caseToPrint.prescriptions && (
            <div className="pt-1">
              <span className="text-slate-500 block">Prescription:</span>
              <pre className="font-mono text-slate-800 text-[11px] whitespace-pre-wrap mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">{caseToPrint.prescriptions}</pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Attending Doctor: <strong>Dr. Kavita Verma, MD</strong></span>
          <span>Reg: <strong>MCI-2012-09412</strong></span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              openHospitalDischargeReport(caseToPrint);
              onClose();
            }}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Open Discharge Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
