"use client";

import React from "react";
import { ShieldCheck, UserCheck, AlertCircle } from "lucide-react";

interface TrustBadgeProps {
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  onToggleVerify?: () => void;
  canVerify?: boolean;
  className?: string;
}

export function TrustBadge({
  verified = false,
  verifiedBy,
  verifiedAt,
  onToggleVerify,
  canVerify = false,
  className = ""
}: TrustBadgeProps) {
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
        verified
          ? "bg-teal-50/60 border-teal-200 text-teal-900"
          : "bg-slate-50 border-slate-200 text-slate-800"
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`p-2 rounded-lg ${
            verified ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-800"
          }`}
        >
          {verified ? <UserCheck className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-wide uppercase text-teal-800">
              Human-in-the-loop Protocol
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                verified ? "bg-teal-200 text-teal-900" : "bg-amber-100 text-amber-800"
              }`}
            >
              {verified ? "Verified by Physician" : "Pending Verification"}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {verified
              ? `Attested by ${verifiedBy || "Attending Medical Officer"}${verifiedAt ? ` on ${verifiedAt}` : ""}`
              : "AI assistive algorithm recommendation • Requires physical doctor sign-off before triage completion"}
          </p>
        </div>
      </div>

      {canVerify && onToggleVerify && (
        <button
          onClick={onToggleVerify}
          type="button"
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-xs whitespace-nowrap ${
            verified
              ? "bg-white border border-teal-300 text-teal-800 hover:bg-teal-50"
              : "bg-teal-700 text-white hover:bg-teal-800 hover:shadow"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {verified ? "Revoke Attestation" : "Attest & Confirm as Doctor"}
        </button>
      )}
    </div>
  );
}
