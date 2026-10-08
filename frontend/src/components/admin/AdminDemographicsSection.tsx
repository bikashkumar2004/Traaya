"use client";

import React from "react";
import { UserRole } from "@/lib/auth-context";
import { MapPin } from "lucide-react";

interface AdminDemographicsSectionProps {
  activeRole: UserRole;
  gender: string;
  setGender: (val: string) => void;
  dob: string;
  handleDobChange: (val: string) => void;
  age: number | string;
  setAge: (val: number | string) => void;
  addressLine1: string;
  setAddressLine1: (val: string) => void;
  state: string;
  handleStateChange: (val: string) => void;
  district: string;
  handleDistrictChange: (val: string) => void;
  block: string;
  setBlock: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  allStates: string[];
  availableDistricts: string[];
  availableBlocks: string[];
}

export const AdminDemographicsSection: React.FC<AdminDemographicsSectionProps> = ({
  activeRole,
  gender,
  setGender,
  dob,
  handleDobChange,
  age,
  setAge,
  addressLine1,
  setAddressLine1,
  state,
  handleStateChange,
  district,
  handleDistrictChange,
  block,
  setBlock,
  city,
  setCity,
  postalCode,
  setPostalCode,
  allStates,
  availableDistricts,
  availableBlocks,
}) => {
  const isFacilityOrOrg =
    activeRole === "facility" ||
    activeRole === "medical" ||
    activeRole === "organization" ||
    activeRole === "healthcamp";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
        <MapPin className="w-4 h-4 text-teal-400" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          {isFacilityOrOrg
            ? "2. Facility Location & Address Information"
            : "2. Demographics & Address Information"}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {!isFacilityOrOrg && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
              />
            </div>
          </>
        )}

        <div className={isFacilityOrOrg ? "col-span-2 sm:col-span-4 lg:col-span-3" : "col-span-2 sm:col-span-3"}>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {activeRole === "facility" || activeRole === "medical" ? "Facility Address Line 1" : "Address Line 1"}
          </label>
          <input
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            placeholder="e.g. Hospital Road, Main CHC Campus"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
          <select
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            <option value="">Select State / UT</option>
            {allStates.map((st) => (
              <option key={st} value={st} className="bg-slate-900 text-white">
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">District</label>
          {availableDistricts.length > 0 ? (
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              <option value="">{state ? "Select District" : "Select State First"}</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              disabled={!state}
              placeholder={state ? "Enter district" : "Select state first"}
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-50"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Block</label>
          {availableBlocks.length > 0 ? (
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              <option value="">{district ? "Select Block" : "Select District First"}</option>
              {availableBlocks.map((b) => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              disabled={!district}
              placeholder={district ? "Enter block" : "Select district first"}
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400 disabled:opacity-50"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">PIN Code</label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-teal-400"
          />
        </div>
      </div>
    </div>
  );
};
