"use client";

import React from "react";
import { FileBadge, X, Building2, BadgeCheck } from "lucide-react";
import { OrganizationPatient } from "@/lib/organization-data";

interface OrganizationIdCardModalProps {
  patient: OrganizationPatient | null;
  onClose: () => void;
}

export const OrganizationIdCardModal: React.FC<OrganizationIdCardModalProps> = ({
  patient,
  onClose,
}) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-black text-slate-900">
              Organisation ID Card Verification
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* ID Card Visual Preview */}
          <div className="w-full bg-slate-900 rounded-2xl p-4 text-white space-y-3 shadow-md border-2 border-teal-500/40 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-300" />
                <span className="text-[11px] font-black uppercase tracking-wider text-teal-200">
                  {patient.organizationName}
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black uppercase">
                ABDM Verified
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                <img
                  src={
                    patient.idCardUrl ||
                    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=60"
                  }
                  alt="ID Card Photo"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="text-sm font-black text-white leading-tight">
                  {patient.name}
                </div>
                <div className="text-xs font-mono font-bold text-teal-300">
                  ID: {patient.memberId}
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  Dept: {patient.department}
                </div>
                <div className="text-[10px] text-rose-300 font-bold">
                  Blood Group: {patient.bloodGroup}
                </div>
                <div className="text-[9px] text-slate-400">
                  UHID: {patient.patientUhid}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-[9px] text-slate-400">
              <span>Authorised Institutional Credential</span>
              <span>National Health Registry</span>
            </div>
          </div>

          {/* Patient Credentials Meta */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-bold text-slate-800">{patient.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Residential Address:</span>
              <span className="font-semibold text-slate-700 text-right max-w-[200px] truncate">{patient.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Verification Status:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" /> Enrolled &amp; Active
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Close ID View
          </button>
        </div>
      </div>
    </div>
  );
};
