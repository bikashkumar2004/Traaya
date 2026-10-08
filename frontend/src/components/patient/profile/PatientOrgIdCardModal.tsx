"use client";

import React from "react";
import { FileBadge, CheckCircle2, X } from "lucide-react";

export interface PatientOrgIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationAffiliation: {
    organizationName?: string;
    memberId?: string;
    idCardUrl?: string;
  } | null;
}

export function PatientOrgIdCardModal({
  isOpen,
  onClose,
  organizationAffiliation,
}: PatientOrgIdCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Organisation ID Document
              </h3>
              <span className="text-[11px] text-slate-500">
                {organizationAffiliation?.organizationName || "Affiliated Organisation"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-3/2 flex items-center justify-center">
          {organizationAffiliation?.idCardUrl ? (
            <img
              src={organizationAffiliation.idCardUrl}
              alt="Organisation ID Card"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-400 text-xs font-medium">No ID card uploaded</span>
          )}
        </div>

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[10px] block">Member ID:</span>
            <span className="font-mono font-bold text-teal-900">
              {organizationAffiliation?.memberId || "N/A"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] block">Status:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Member</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}
