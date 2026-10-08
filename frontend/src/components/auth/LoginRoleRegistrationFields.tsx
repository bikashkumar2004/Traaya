"use client";

import React from "react";
import { Building2, Tent, MapPin, Pill, FileBadge } from "lucide-react";
import { UserRole } from "@/lib/auth-context";

interface LoginRoleRegistrationFieldsProps {
  selectedRole: UserRole;
  entityName: string;
  setEntityName: (val: string) => void;
  orgType: string;
  setOrgType: (val: string) => void;
  campLocation: string;
  setCampLocation: (val: string) => void;
  licenseNumber: string;
  setLicenseNumber: (val: string) => void;
}

export const LoginRoleRegistrationFields: React.FC<LoginRoleRegistrationFieldsProps> = ({
  selectedRole,
  entityName,
  setEntityName,
  orgType,
  setOrgType,
  campLocation,
  setCampLocation,
  licenseNumber,
  setLicenseNumber,
}) => {
  if (selectedRole === "patient") return null;

  return (
    <div className="space-y-3 p-3.5 bg-teal-50/50 rounded-2xl border border-teal-200/80">
      {selectedRole === "organization" && (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Institution / Organization Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. NIT Rourkela or Nalco PSU Smelter Plant"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Organization Category
            </label>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className="w-full h-10 text-xs sm:text-sm px-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
            >
              <option value="Educational Institute">Educational Institute (University / College / School)</option>
              <option value="PSU / Heavy Industry">PSU / Heavy Industry / Mining Unit</option>
              <option value="Corporate / IT Enterprise">Corporate / IT Enterprise Office</option>
            </select>
          </div>
        </>
      )}

      {selectedRole === "healthcamp" && (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Health Camp / Screening Drive Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Tent className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. Khandapada Rural Triage Camp #4"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Camp Location &amp; Venue
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Gram Panchayat Hall, Khandapada Block"
                value={campLocation}
                onChange={(e) => setCampLocation(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              />
            </div>
          </div>
        </>
      )}

      {(selectedRole === "medical" || (selectedRole as any) === "facility") && (
        <>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Facility / Medical Centre Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Pill className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                required
                placeholder="e.g. CHC Central Jan Aushadhi Pharmacy"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Drug License / Registration No.
            </label>
            <div className="relative">
              <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="e.g. DL-OD-NAY-2022-819"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full h-10 text-xs sm:text-sm pl-9 pr-3 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
