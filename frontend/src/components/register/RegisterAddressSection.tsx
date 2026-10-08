"use client";

import React from "react";

interface RegisterAddressSectionProps {
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

export const RegisterAddressSection: React.FC<RegisterAddressSectionProps> = ({
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
  return (
    <div className="space-y-4 pt-4 border-t border-slate-200">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
        Address
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Address Line 1 <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter address line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            State <span className="text-rose-600">*</span>
          </label>
          <select
            required
            value={state}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 cursor-pointer"
          >
            <option value="">Select State / UT</option>
            {allStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            District <span className="text-rose-600">*</span>
          </label>
          {availableDistricts.length > 0 ? (
            <select
              required
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 cursor-pointer"
            >
              <option value="">{state ? "Select District" : "Select State First"}</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              disabled={!state}
              placeholder={state ? "Enter district" : "Select state first"}
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 disabled:opacity-60"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Block <span className="text-rose-600">*</span>
          </label>
          {availableBlocks.length > 0 ? (
            <select
              required
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 cursor-pointer"
            >
              <option value="">{district ? "Select Block" : "Select District First"}</option>
              {availableBlocks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              required
              disabled={!district}
              placeholder={district ? "Enter block" : "Select district first"}
              value={block}
              onChange={(e) => setBlock(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 disabled:opacity-60"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            City <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter city / town"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Postal Code <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={6}
            placeholder="Enter 6-digit PIN code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 font-mono"
          />
        </div>
      </div>
    </div>
  );
};
