"use client";

import React, { useMemo } from "react";
import { Edit3, Check, X, Loader2 } from "lucide-react";
import { getIndiaStates, getDistrictsForState, getBlocksForDistrict } from "@/lib/india-locations";

export interface PatientDemographicsCardProps {
  userInitials: string;
  patientId: string;
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  dob: string;
  setDob: (val: string) => void;
  age: number | string;
  setAge: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
  addressLine1: string;
  setAddressLine1: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  block: string;
  setBlock: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  onSave?: () => void;
  onCancel?: () => void;
  saving?: boolean;
}

export function PatientDemographicsCard({
  userInitials,
  patientId,
  fullName,
  setFullName,
  phone,
  setPhone,
  email,
  dob,
  setDob,
  age,
  setAge,
  gender,
  setGender,
  bloodGroup,
  setBloodGroup,
  addressLine1,
  setAddressLine1,
  state,
  setState,
  district,
  setDistrict,
  block,
  setBlock,
  city,
  setCity,
  postalCode,
  setPostalCode,
  editMode,
  setEditMode,
  onSave,
  onCancel,
  saving = false,
}: PatientDemographicsCardProps) {
  // Cascading location options for edit mode
  const allStates = useMemo(() => getIndiaStates(), []);
  const availableDistricts = useMemo(() => getDistrictsForState(state), [state]);
  const availableBlocks = useMemo(() => getBlocksForDistrict(state, district), [state, district]);

  const handleStateChange = (nextState: string) => {
    setState(nextState);
    setDistrict("");
    setBlock("");
  };

  const handleDistrictChange = (nextDistrict: string) => {
    setDistrict(nextDistrict);
    setBlock("");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            Profile Details
          </h3>
        </div>

        {editMode ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onCancel ? onCancel : () => setEditMode(false)}
              disabled={saving}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="text-xs text-teal-800 hover:text-teal-900 font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Profile identity badge - Spacious Full Width */}
      <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white font-black text-lg flex items-center justify-center relative shadow-sm">
            {userInitials}
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[9px] text-white">
              ✓
            </span>
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              {fullName}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              UHID: <strong className="font-mono text-slate-800">{patientId}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields Grid - 3 Columns on Large Screens for Wide Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Full Legal Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!editMode}
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700 disabled:opacity-90 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Date of Birth &amp; Age</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={!editMode}
              className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold disabled:opacity-90 transition-colors"
            />
            <input
              type="text"
              value={`${age} Yrs`}
              onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
              disabled={!editMode}
              className="w-24 h-11 px-2 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold text-center disabled:opacity-90"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Gender</label>
          <select
            value={gender.toLowerCase()}
            onChange={(e) => setGender(e.target.value)}
            disabled={!editMode}
            className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 disabled:opacity-90 cursor-pointer"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Primary Mobile</label>
          <div className="relative">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!editMode}
              className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold pr-20 disabled:opacity-90"
            />
            <span className="absolute right-2.5 top-2.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
              Verified
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Email Address</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full h-11 px-3.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-600 font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold">Blood Group</label>
          <input
            type="text"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            disabled={!editMode}
            className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold disabled:opacity-90"
          />
        </div>
      </div>

      {/* Residential Address - Separated into Street, Block, City, District, State & PIN */}
      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between">
          <label className="text-slate-700 font-bold">Residential Address</label>
          <span className="text-[10px] text-slate-400 font-medium">Individual Demographic Attributes</span>
        </div>

        {editMode ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Street / Line 1</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Enter street / house / landmark"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">State</label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 cursor-pointer transition-colors"
              >
                <option value="">Select State / UT</option>
                {allStates.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">District</label>
              {availableDistricts.length > 0 ? (
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 cursor-pointer transition-colors"
                >
                  <option value="">Select District</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  placeholder="Enter district"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 transition-colors"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Block</label>
              {availableBlocks.length > 0 ? (
                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 cursor-pointer transition-colors"
                >
                  <option value="">Select Block</option>
                  {availableBlocks.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder="Enter block"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 transition-colors"
                />
              )}
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city / town"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit PIN"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-medium focus:bg-white focus:outline-teal-700 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Street / Line 1</span>
              <span className="text-xs font-semibold text-slate-900 block truncate" title={addressLine1}>{addressLine1 || "—"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Block</span>
              <span className="text-xs font-semibold text-slate-900 block truncate" title={block}>{block || "—"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">City</span>
              <span className="text-xs font-semibold text-slate-900 block truncate" title={city}>{city || "—"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">District</span>
              <span className="text-xs font-semibold text-slate-900 block truncate" title={district}>{district || "—"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">State</span>
              <span className="text-xs font-semibold text-slate-900 block truncate" title={state}>{state || "—"}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">PIN Code</span>
              <span className="text-xs font-semibold text-slate-900 font-mono block truncate" title={postalCode}>{postalCode || "—"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
