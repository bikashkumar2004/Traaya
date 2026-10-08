"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Check, Droplet } from "lucide-react";

interface RegisterBasicInfoSectionProps {
  firstName: string;
  setFirstName: (val: string) => void;
  middleName: string;
  setMiddleName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  dob: string;
  handleDobChange: (val: string) => void;
  age: number | string;
  setAge: (val: number | string) => void;
  mobileNumber: string;
  email: string;
  setEmail: (val: string) => void;
  isEmailVerified: boolean;
  setIsEmailVerified: (val: boolean) => void;
  emailSending: boolean;
  onTriggerEmailOtp: () => void;
  gender: "male" | "female" | "others" | "";
  setGender: (val: "male" | "female" | "others" | "") => void;
  bloodGroup: string;
  setBloodGroup: (val: string) => void;
}

export const RegisterBasicInfoSection: React.FC<RegisterBasicInfoSectionProps> = ({
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  dob,
  handleDobChange,
  age,
  setAge,
  mobileNumber,
  email,
  setEmail,
  isEmailVerified,
  setIsEmailVerified,
  emailSending,
  onTriggerEmailOtp,
  gender,
  setGender,
  bloodGroup,
  setBloodGroup,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
        Basic Info
      </h2>

      {/* Names: First, Middle, Last */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            First Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Middle Name
          </label>
          <input
            type="text"
            placeholder="Enter middle name (optional)"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Last Name <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
          />
        </div>
      </div>

      {/* DOB, Age, Mobile Number, Email */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* DOB & Age */}
        <div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DOB <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-xs px-2 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
              />
            </div>
          </div>
        </div>

        {/* Mobile Number (Verified) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mobile Number
          </label>
          <div className="relative">
            <input
              type="text"
              disabled
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-semibold cursor-not-allowed pr-9"
            />
            <div className="absolute right-3 top-2.5 text-emerald-600" title="Verified Mobile">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Email (with Validate Email / OTP verification) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              required
              placeholder="Enter email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailVerified(false);
              }}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 pr-9"
            />
            {isEmailVerified ? (
              <div className="absolute right-3 top-2.5 text-emerald-600" title="Email Verified">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="absolute right-3 top-2.5 text-rose-500" title="Email not verified">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Validate Email Trigger */}
          <div className="mt-1 flex items-center justify-between text-xs">
            {isEmailVerified ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                <Check className="w-3 h-3" /> Email Verified
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-semibold text-[11px]">Validate Email</span>
                <button
                  type="button"
                  disabled={emailSending}
                  onClick={onTriggerEmailOtp}
                  className="text-blue-700 hover:text-blue-900 disabled:opacity-50 font-bold text-[11px] underline cursor-pointer"
                >
                  {emailSending ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row: Gender & Blood Group */}
      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gender Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Gender <span className="text-rose-600">*</span>
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                gender === "male"
                  ? "bg-blue-50 border-blue-600 text-blue-800 shadow-2xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>♂</span>
              <span>Male</span>
            </button>

            <button
              type="button"
              onClick={() => setGender("female")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                gender === "female"
                  ? "bg-rose-50 border-rose-600 text-rose-800 shadow-2xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>♀</span>
              <span>Female</span>
            </button>

            <button
              type="button"
              onClick={() => setGender("others")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                gender === "others"
                  ? "bg-amber-50 border-amber-600 text-amber-900 shadow-2xs"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>⚥</span>
              <span>Others</span>
            </button>
          </div>
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <Droplet className="w-3.5 h-3.5 text-rose-600" />
            <span>Blood Group</span> <span className="text-rose-600">*</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBloodGroup(bg)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  bloodGroup === bg
                    ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-400/30"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:border-rose-200"
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
