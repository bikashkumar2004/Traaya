"use client";

import React from "react";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileBadge,
  Upload,
} from "lucide-react";
import { REGISTERED_ORGANIZATIONS } from "@/lib/organization-data";
import { OrgVerificationStatus } from "./types";

interface RegisterOrganizationSectionProps {
  isFromOrganization: "no" | "yes" | "";
  setIsFromOrganization: (val: "no" | "yes" | "") => void;
  selectedOrgId: string;
  setSelectedOrgId: (val: string) => void;
  employeeId: string;
  setEmployeeId: (val: string) => void;
  verificationStatus: OrgVerificationStatus | null;
  setVerificationStatus: (val: OrgVerificationStatus | null) => void;
  isVerifying: boolean;
  onVerifyAffiliation: () => void;
  idCardFileName: string;
  idCardPreview: string;
  onIdCardFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveIdCard: () => void;
}

export const RegisterOrganizationSection: React.FC<RegisterOrganizationSectionProps> = ({
  isFromOrganization,
  setIsFromOrganization,
  selectedOrgId,
  setSelectedOrgId,
  employeeId,
  setEmployeeId,
  verificationStatus,
  setVerificationStatus,
  isVerifying,
  onVerifyAffiliation,
  idCardFileName,
  idCardPreview,
  onIdCardFileChange,
  onRemoveIdCard,
}) => {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      <div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-700" />
          <span>Organisation Affiliation</span>
        </h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Are you an employee, student, or member of an empanelled institution or corporate body?
        </p>
      </div>

      {/* Question: Are you from any organisation? */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Are you from any organisation? <span className="text-rose-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setIsFromOrganization("no")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isFromOrganization === "no"
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span>No (Individual Citizen)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFromOrganization("yes")}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isFromOrganization === "yes"
                ? "bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/20"
                : "bg-white border-slate-300 text-slate-700 hover:bg-teal-50 hover:border-teal-300"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Yes (From an Organisation)</span>
          </button>
        </div>
      </div>

      {/* Conditional Organization Fields */}
      {isFromOrganization === "yes" && (
        <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-teal-950 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Select Registered Organisation &amp; Provide Member Details</span>
          </div>

          {/* Choose Organisation Dropdown */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-800">
              Choose Organisation (Already Registered) <span className="text-rose-600">*</span>
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setVerificationStatus(null);
              }}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-teal-700 font-semibold cursor-pointer"
            >
              {REGISTERED_ORGANIZATIONS.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.code} &bull; {org.district})
                </option>
              ))}
            </select>
          </div>

          {/* Employee / Member ID with Instant Verify Button */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800">
              Employee / Student / Member ID <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required={isFromOrganization === "yes"}
                  placeholder="e.g. NAL-4019, NAL-3882, or your assigned ID"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    setVerificationStatus(null);
                  }}
                  className={`w-full text-xs px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 focus:outline-teal-700 font-mono font-bold ${
                    verificationStatus?.verified
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : verificationStatus && !verificationStatus.verified
                      ? "border-rose-400 ring-2 ring-rose-400/20"
                      : "border-teal-300"
                  }`}
                />
                {verificationStatus?.verified && (
                  <span className="absolute right-3 top-2.5 text-emerald-600 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={onVerifyAffiliation}
                disabled={!employeeId.trim() || isVerifying}
                className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                {isVerifying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{verificationStatus?.verified ? "Re-verify" : "Verify"}</span>
              </button>
            </div>

            {/* Verification Result Feedback */}
            {verificationStatus && (
              <div
                className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 ${
                  verificationStatus.verified
                    ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                    : "bg-rose-50 border-rose-300 text-rose-950"
                }`}
              >
                {verificationStatus.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <p className="font-bold">{verificationStatus.message}</p>
                  {verificationStatus.verified && verificationStatus.member && (
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-emerald-800 font-semibold pt-0.5">
                      <span>Roster Name: <strong>{verificationStatus.member.name}</strong></span>
                      <span>&bull;</span>
                      <span>Category: <strong>{verificationStatus.member.category}</strong></span>
                      <span>&bull;</span>
                      <span>Department: <strong>{verificationStatus.member.department || "Operations"}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Upload ID Card Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Upload Organisation ID Card <span className="text-rose-600">*</span>
            </label>

            <div className="border-2 border-dashed border-teal-300 rounded-2xl p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <FileBadge className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {idCardFileName ? idCardFileName : "Upload Employee / Student ID Card"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Supports PNG, JPG, JPEG, or PDF (Max 5MB)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Browse File</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={onIdCardFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* ID Card Thumbnail Preview */}
            {idCardPreview && (
              <div className="p-3 bg-white border border-teal-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={idCardPreview}
                    alt="ID Preview"
                    className="w-12 h-8 object-cover rounded-lg border border-slate-200 shadow-2xs"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">ID Document Attached</span>
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for verification
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRemoveIdCard}
                  className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
