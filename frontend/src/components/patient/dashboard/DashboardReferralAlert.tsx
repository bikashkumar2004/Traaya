"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Building2, ArrowRight } from "lucide-react";
import { TriageTicket, normalizeStatus } from "./types";

interface DashboardReferralAlertProps {
  activeTicket: TriageTicket | null;
}

export function DashboardReferralAlert({ activeTicket }: DashboardReferralAlertProps) {
  if (!activeTicket || normalizeStatus(activeTicket.status) !== "Referred") {
    return null;
  }

  const isAccepted = activeTicket.patient_referral_status === "Accepted";

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
        isAccepted
          ? "bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-300"
          : "bg-gradient-to-r from-purple-50 via-pink-50/30 to-white border-purple-300 shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              isAccepted ? "bg-emerald-600 text-white" : "bg-purple-700 text-white"
            }`}
          >
            {isAccepted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Building2 className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                {isAccepted
                  ? "Referral Consent Confirmed & Transferred"
                  : "Action Required: Hospital Referral Consent Pending"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isAccepted
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-purple-100 text-purple-900 border-purple-300 animate-pulse"
                }`}
              >
                {isAccepted ? "✓ Consent Given" : "Consent Needed"}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
              {isAccepted ? (
                <>
                  Your consent to transfer to{" "}
                  <strong className="text-emerald-950 font-bold">
                    {activeTicket.referal_facility || "Tertiary Specialist Hospital"}
                  </strong>{" "}
                  has been submitted. The receiving hospital is reviewing your case.
                </>
              ) : (
                <>
                  Your attending clinician has recommended referral to{" "}
                  <strong className="text-purple-950 font-bold">
                    {activeTicket.referal_facility || "Tertiary Specialist Hospital"}
                  </strong>
                  . Reason:{" "}
                  <em>&ldquo;{activeTicket.transfer_reason || "Tertiary evaluation"}&rdquo;</em>.
                  Please review and provide consent to transfer your digital health records.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Link
            href={`/patient/timeline/${activeTicket.id}`}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              isAccepted
                ? "bg-white hover:bg-slate-50 text-slate-800 border border-slate-300"
                : "bg-purple-700 hover:bg-purple-800 text-white"
            }`}
          >
            <span>
              {isAccepted ? "View Referral Status" : "Review & Accept Transfer"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
