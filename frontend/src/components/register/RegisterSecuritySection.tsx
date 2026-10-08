"use client";

import React from "react";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

interface RegisterSecuritySectionProps {
  hasDisability: "no" | "yes" | "";
  setHasDisability: (val: "no" | "yes" | "") => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
}

export const RegisterSecuritySection: React.FC<RegisterSecuritySectionProps> = ({
  hasDisability,
  setHasDisability,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
}) => {
  return (
    <>
      {/* SECTION 3: Disabilities Question */}
      <div className="pt-4 border-t border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Do you have any disabilities? <span className="text-rose-600">*</span>
        </label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="disability"
              checked={hasDisability === "no"}
              onChange={() => setHasDisability("no")}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span>No</span>
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="radio"
              name="disability"
              checked={hasDisability === "yes"}
              onChange={() => setHasDisability("yes")}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Yes</span>
          </label>
        </div>
      </div>

      {/* SECTION 4: Create Password */}
      <div className="pt-4 border-t border-slate-200 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Set Account Password
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Set a secure password so you can sign in anytime using either Mobile OTP or your Email and Password.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Create Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 text-center">
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-3 bg-[#061559] hover:bg-[#0b1746] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
        >
          {loading ? (
            <span>Saving Profile...</span>
          ) : (
            <>
              <span>Save &amp; Access Health Portal</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </>
  );
};
