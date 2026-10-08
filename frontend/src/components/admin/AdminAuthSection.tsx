"use client";

import React from "react";
import { UserRole } from "@/lib/auth-context";
import {
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { RegisteredFacility } from "./types";

interface AdminAuthSectionProps {
  activeRole: UserRole;
  fullName: string;
  setFullName: (val: string) => void;
  userId: string;
  setUserId: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  primaryFacilityName: string;
  setPrimaryFacilityName: (val: string) => void;
  registeredFacilities: RegisteredFacility[];
  verifiedFacility: RegisteredFacility | null;
  setVerifiedFacility: (facility: RegisteredFacility | null) => void;
  isVerifyingFacility: boolean;
  facilityVerificationError: string | null;
  setFacilityVerificationError: (err: string | null) => void;
}

export const AdminAuthSection: React.FC<AdminAuthSectionProps> = ({
  activeRole,
  fullName,
  setFullName,
  userId,
  setUserId,
  phone,
  setPhone,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  primaryFacilityName,
  setPrimaryFacilityName,
  registeredFacilities,
  verifiedFacility,
  setVerifiedFacility,
  isVerifyingFacility,
  facilityVerificationError,
  setFacilityVerificationError,
}) => {
  const isFacilityOrOrg =
    activeRole === "facility" ||
    activeRole === "medical" ||
    activeRole === "organization" ||
    activeRole === "healthcamp";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <KeyRound className="w-4 h-4 text-teal-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          1. Authentication &amp; Common Identity ({activeRole.toUpperCase()})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {activeRole === "facility" || activeRole === "medical"
              ? "Facility / Centre Name"
              : activeRole === "organization"
              ? "Organization Name"
              : activeRole === "healthcamp"
              ? "Camp / MMU Name"
              : "Full Legal / Professional Name"}{" "}
            <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={
              activeRole === "facility" || activeRole === "medical"
                ? "e.g. Jan Aushadhi Kendra & CHC Pathology Counter"
                : activeRole === "organization"
                ? "e.g. NALCO Smelter & Power Complex"
                : activeRole === "healthcamp"
                ? "e.g. Nayagarh Mobile Medical Outreach Fleet #4"
                : "e.g. Dr. Ramesh Mohanty"
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Universal User ID / Identifier
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder={
              activeRole === "patient"
                ? "PAT-991204"
                : activeRole === "doctor"
                ? "DOC-4412"
                : activeRole === "nurse"
                ? "NUR-0021"
                : activeRole === "facility" || activeRole === "medical"
                ? "FAC-001"
                : activeRole === "organization"
                ? "ORG-NALCO-01"
                : activeRole === "healthcamp"
                ? "CMP-001"
                : "ADM-0001"
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-teal-300 font-mono placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Phone Number (for SMS &amp; OTP login) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9437100001"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@triageassist.org"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 pr-10 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isFacilityOrOrg && (
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Assigned Facility {activeRole === "nurse" && <span className="text-teal-400 font-normal">(Database Verification)</span>}
              </label>
              {isVerifyingFacility ? (
                <span className="text-[10px] text-teal-400 flex items-center gap-1 font-mono">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                </span>
              ) : verifiedFacility ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Database Verified
                </span>
              ) : primaryFacilityName.trim() ? (
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" /> Not Verified
                </span>
              ) : null}
            </div>

            <div className="relative">
              <input
                type="text"
                list="admin-registered-facilities"
                value={primaryFacilityName}
                onChange={(e) => setPrimaryFacilityName(e.target.value)}
                placeholder="e.g. FAC-357 or Jan Aushadhi Kendra"
                className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none transition-colors ${
                  verifiedFacility
                    ? "border-emerald-500/80 focus:border-emerald-400 ring-1 ring-emerald-500/30"
                    : primaryFacilityName.trim()
                    ? "border-rose-500/80 focus:border-rose-400 ring-1 ring-rose-500/30"
                    : "border-slate-700 focus:border-teal-400"
                }`}
              />
              {verifiedFacility && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 absolute right-3 top-2.5 pointer-events-none" />
              )}
            </div>

            <datalist id="admin-registered-facilities">
              {registeredFacilities.map((fac) => (
                <option key={fac.id} value={fac.facility_name}>
                  {fac.user_id ? `[${fac.user_id}] ` : ""}{fac.facility_name} ({fac.city || fac.district || "Registered"})
                </option>
              ))}
            </datalist>

            {/* Verification Status Details */}
            {verifiedFacility ? (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-emerald-300">
                      Verified: {verifiedFacility.facility_name} {verifiedFacility.user_id && `[${verifiedFacility.user_id}]`}
                    </div>
                    <div className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                      Facility ID: <span className="underline">{verifiedFacility.id}</span>
                      {verifiedFacility.city && ` • ${verifiedFacility.city}`}
                      {verifiedFacility.district && `, ${verifiedFacility.district}`}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/40 shrink-0">
                  ID Linked ✓
                </span>
              </div>
            ) : primaryFacilityName.trim() && !isVerifyingFacility ? (
              <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-rose-300">
                      Facility Not Found in Database
                    </div>
                    <div className="text-[11px] text-rose-400/80 mt-0.5">
                      {facilityVerificationError || "No registered facility found in database. Enter a valid facility name or code."}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-full border border-rose-500/40 shrink-0">
                  Unverified ✕
                </span>
              </div>
            ) : null}

            {/* Registered Facilities Quick-Pills */}
            {registeredFacilities.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Registered Facilities in Database:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {registeredFacilities.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setPrimaryFacilityName(f.facility_name);
                        setVerifiedFacility(f);
                        setFacilityVerificationError(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        verifiedFacility?.id === f.id
                          ? "bg-teal-500/20 border-teal-400 text-teal-200"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {f.user_id ? `[${f.user_id}] ` : ""}{f.facility_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
