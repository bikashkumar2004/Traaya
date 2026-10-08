"use client";

import React from "react";
import { UserRole } from "@/lib/auth-context";

interface LoginPhoneOtpInputProps {
  selectedRole: UserRole;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  onSendOtp: () => void;
  isSendingOtp: boolean;
  countdown: number;
  otpSent: boolean;
  otp: string[];
  onOtpChange: (index: number, val: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

export const LoginPhoneOtpInput: React.FC<LoginPhoneOtpInputProps> = ({
  selectedRole,
  phoneNumber,
  setPhoneNumber,
  onSendOtp,
  isSendingOtp,
  countdown,
  otpSent,
  otp,
  onOtpChange,
  onKeyDown,
  inputRefs,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm sm:text-base font-bold text-slate-800 mb-1">
          {selectedRole === "patient"
            ? "Mobile Phone Number"
            : selectedRole === "organization"
            ? "Admin Official Mobile"
            : selectedRole === "healthcamp"
            ? "Camp Coordinator Mobile"
            : "Duty Phone / Mobile Number"}
          <span className="text-rose-600 ml-0.5">*</span>
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none">
            <span className="text-sm font-bold text-slate-600">🇮🇳 +91</span>
          </div>
          <input
            type="tel"
            required
            maxLength={10}
            placeholder="Enter 10-digit mobile number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
            className="w-full h-12 text-sm sm:text-base pl-[74px] pr-28 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700 transition-colors"
          />
          <button
            type="button"
            onClick={onSendOtp}
            disabled={isSendingOtp || countdown > 0}
            className="absolute right-2 px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 text-white disabled:text-slate-500 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            {isSendingOtp ? "Sending..." : countdown > 0 ? `${countdown}s` : otpSent ? "Resend" : "Send OTP"}
          </button>
        </div>
      </div>

      {/* 6-Digit OTP Block */}
      {otpSent && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <label className="text-sm sm:text-base font-bold text-slate-800">
              Enter 6-Digit Verification Code
            </label>
            <span className="text-xs sm:text-sm font-semibold text-teal-700">SMS Dispatched</span>
          </div>
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => onOtpChange(idx, e.target.value)}
                onKeyDown={(e) => onKeyDown(idx, e)}
                className="w-11 sm:w-14 h-12 text-center text-lg sm:text-xl font-black bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-teal-700 transition-colors"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
