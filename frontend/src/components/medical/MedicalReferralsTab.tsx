"use client";

import React from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  Check,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import {
  HospitalReferral,
  getPriorityBadgeClass,
} from "./types";

export interface MedicalReferralsTabProps {
  referrals: HospitalReferral[];
  filteredReferrals: HospitalReferral[];
  referralFilter: string;
  setReferralFilter: (val: string) => void;
  pendingReferralsCount: number;
  onAssignReferral: (ref: HospitalReferral) => void;
}

export function MedicalReferralsTab({
  referrals,
  filteredReferrals,
  referralFilter,
  setReferralFilter,
  pendingReferralsCount,
  onAssignReferral,
}: MedicalReferralsTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft className="w-7 h-7 text-purple-700" />
            <span>Inbound Hospital Referrals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Patients transferred from other district CHCs, PHCs, and trauma units. Review clinical case notes and assign to on-duty facility specialists.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-800 flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
            <span>{pendingReferralsCount} Pending Internal Assignment</span>
          </div>
        </div>
      </div>

      {/* Referrals Content Deck */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Hospital Inbound Registry ({referrals.length})
            </h2>
            <p className="text-xs text-slate-500">
              Inter-facility transfers received via district triage network.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["All", "Pending", "Assigned", "Scheduled", "Immediate Priority"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setReferralFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  referralFilter === f
                    ? "bg-purple-800 text-white border-purple-800 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Referrals Cards Grid */}
        <div className="space-y-4">
          {filteredReferrals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-2">
              <ArrowRightLeft className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-600">No inbound referrals matching this filter.</div>
              <p className="text-xs text-slate-400">All transferred patients have been assigned or processed.</p>
            </div>
          ) : (
            filteredReferrals.map((ref) => (
              <div
                key={ref.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs transition-all space-y-3.5"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-base text-slate-900">{ref.patientName}</span>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {ref.uhid}
                    </span>
                    <span className="text-xs text-slate-500">
                      {ref.age} yrs • {ref.gender} • {ref.phone}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(ref.priority)}`}>
                      {ref.priority}
                    </span>

                    {ref.status === "Pending Assignment" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        ⚠️ Awaiting Doctor
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {ref.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Referring Hospital & Doctor Source Badge */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Patient Consent Accepted
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-400">Referred by:</span>
                  <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {ref.referringDoctor}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Facility: {ref.referringHospital}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400 text-[11px]">{ref.referredAt}</span>
                </div>

                {/* Clinical Directives */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-800">
                    Chief Complaint: &ldquo;{ref.chiefComplaint}&rdquo;
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {ref.clinicalNotes}
                  </p>
                </div>

                {/* Bottom Assignment Status / Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
                  {ref.assignedDoctor ? (
                    <div className="text-xs text-slate-700 flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400">Assigned Specialist:</span>
                      <strong className="text-teal-900 font-bold">{ref.assignedDoctor}</strong>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">{ref.assignedDepartment}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded text-[11px] font-semibold">{ref.assignedBay}</span>
                      {ref.assignedTimeline && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 rounded text-[11px]">{ref.assignedTimeline}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Patient awaiting internal doctor assignment to undergo under review process.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onAssignReferral(ref)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      ref.status === "Pending Assignment"
                        ? "bg-teal-800 hover:bg-teal-900 text-white"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-teal-200" />
                    <span>{ref.status === "Pending Assignment" ? "Accept & Start Review" : "Reassign Doctor"}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
