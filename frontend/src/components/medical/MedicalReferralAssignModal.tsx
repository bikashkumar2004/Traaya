"use client";

import React from "react";
import { ArrowRightLeft, X, UserCheck } from "lucide-react";
import {
  HospitalReferral,
  FacilityDoctorStaff,
  getPriorityBadgeClass,
} from "./types";

export interface MedicalReferralAssignModalProps {
  referral: HospitalReferral | null;
  staffDoctors: FacilityDoctorStaff[];
  assignDoctorId: string;
  setAssignDoctorId: (val: string) => void;
  assignTimeInput: string;
  setAssignTimeInput: (val: string) => void;
  onConfirmAssignment: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function MedicalReferralAssignModal({
  referral,
  staffDoctors,
  assignDoctorId,
  setAssignDoctorId,
  assignTimeInput,
  setAssignTimeInput,
  onConfirmAssignment,
  onClose,
}: MedicalReferralAssignModalProps) {
  if (!referral) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Assign Inbound Referral to Doctor</h3>
              <p className="text-xs text-slate-500">Route patient to on-duty specialist &amp; allocate OPD/bay.</p>
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

        {/* Inbound Referral Patient Card */}
        <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-extrabold text-slate-900 text-sm">{referral.patientName}</span>
              <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100/70 px-2 py-0.5 rounded ml-2 border border-purple-200">
                {referral.uhid}
              </span>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(referral.priority)}`}>
              {referral.priority}
            </span>
          </div>
          <div className="text-slate-600 flex items-center gap-3 text-[11px] flex-wrap">
            <span>{referral.age} yrs • {referral.gender}</span>
            <span>•</span>
            <span>Phone: {referral.phone}</span>
            <span>•</span>
            <span>Referred from: <strong className="text-purple-950 font-bold">{referral.referringHospital}</strong></span>
          </div>
          <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-xl border border-purple-200/60">
            <span className="text-[10px] uppercase font-bold text-purple-800 block mb-0.5">
              Referring Physician Directives ({referral.referringDoctor}):
            </span>
            <p className="italic text-slate-700 leading-relaxed">&ldquo;{referral.clinicalNotes}&rdquo;</p>
          </div>
        </div>

        {/* Assignment Form */}
        <form onSubmit={onConfirmAssignment} className="space-y-4 text-xs">
          {/* Doctor Selection */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Doctor Name <span className="text-rose-600">*</span>
            </label>
            <select
              value={assignDoctorId}
              onChange={(e) => setAssignDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700 transition-colors"
            >
              {staffDoctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} • {doc.specialty} ({doc.status})
                </option>
              ))}
            </select>
          </div>

          {/* Consultation Timeline */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              Consultation Timeline <span className="text-rose-600">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={assignTimeInput}
              onChange={(e) => setAssignTimeInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold text-xs focus:bg-white focus:outline-teal-700 transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-teal-200" />
              <span>Confirm Assignment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
