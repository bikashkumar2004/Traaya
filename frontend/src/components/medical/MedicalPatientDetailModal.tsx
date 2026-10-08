"use client";

import React from "react";
import { Users, X } from "lucide-react";
import { BasicMedicalPatient, getPriorityBadgeClass } from "./types";

export interface MedicalPatientDetailModalProps {
  patient: BasicMedicalPatient | null;
  onClose: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function MedicalPatientDetailModal({
  patient,
  onClose,
  getStatusBadge,
}: MedicalPatientDetailModalProps) {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">{patient.name}</h3>
              <span className="font-mono text-xs text-teal-800 font-bold">{patient.patientUhid}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Age / Gender</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{patient.age} yrs • {patient.gender}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Status</span>
            <div className="mt-1">
              {getStatusBadge(patient.status)}
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Contact Phone</span>
            <span className="font-bold text-slate-800 mt-0.5 block">{patient.phone}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Triage Priority</span>
            <span className={`font-bold mt-0.5 inline-block text-[11px] ${getPriorityBadgeClass(patient.triagePriority)}`}>
              {patient.triagePriority}
            </span>
          </div>
          <div className="col-span-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Care Status &amp; Ward</span>
            <span className="font-bold text-teal-800 mt-0.5 block">
              {patient.status} {patient.unitOrWard ? `• ${patient.unitOrWard}` : ""}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
