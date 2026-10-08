"use client";

import React from "react";
import { X } from "lucide-react";

interface RegisterEmailOtpModalProps {
  showEmailModal: boolean;
  onClose: () => void;
  email: string;
  emailOtp: string;
  setEmailOtp: (val: string) => void;
  emailOtpError: string | null;
  emailCountdown: number;
  emailSending: boolean;
  emailVerifying: boolean;
  onResendOtp: () => void;
  onVerifyOtp: () => void;
}

export const RegisterEmailOtpModal: React.FC<RegisterEmailOtpModalProps> = ({
  showEmailModal,
  onClose,
  email,
  emailOtp,
  setEmailOtp,
  emailOtpError,
  emailCountdown,
  emailSending,
  emailVerifying,
  onResendOtp,
  onVerifyOtp,
}) => {
  if (!showEmailModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 relative border border-slate-200 text-center space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header / Subheading */}
        <div className="pt-2">
          <div className="text-xs font-bold text-slate-800 tracking-tight">
            National Telemedicine Service
          </div>
        </div>

        {/* Phone Illustration with OTP badge */}
        <div className="flex justify-center py-1">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center relative">
            <div className="w-12 h-16 rounded-xl border-2 border-slate-700 bg-white flex flex-col items-center justify-center shadow-xs">
              <div className="w-3 h-0.5 bg-slate-400 rounded-full mb-1" />
              <div className="px-1.5 py-0.5 rounded bg-orange-500 text-white text-[9px] font-extrabold shadow-2xs animate-pulse">
                OTP
              </div>
            </div>
          </div>
        </div>

        {/* Title & Email text */}
        <div>
          <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Verify
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            We have sent a code to your registered email address
          </p>
          <p className="text-xs font-bold text-slate-800 break-all mt-0.5">
            {email}
          </p>
        </div>

        {/* Input & Error */}
        <div className="space-y-1.5 text-left">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={emailOtp}
            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full text-xs px-3.5 py-2.5 bg-white border border-rose-400 focus:border-rose-600 rounded-xl text-slate-900 focus:outline-none"
          />
          {emailOtpError && (
            <div className="text-[11px] text-rose-600 font-semibold">
              {emailOtpError}
            </div>
          )}
        </div>

        {/* Resend link */}
        <div className="text-[11px] text-slate-500">
          {emailCountdown > 0 ? (
            <span>
              Resend OTP in{" "}
              <strong className="text-blue-700">
                {emailCountdown < 10 ? `0${emailCountdown}` : emailCountdown}s
              </strong>
            </span>
          ) : (
            <button
              type="button"
              disabled={emailSending}
              onClick={onResendOtp}
              className="text-blue-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
            >
              {emailSending ? "Sending..." : "Resend OTP"}
            </button>
          )}
        </div>

        {/* Verify CTA */}
        <button
          type="button"
          disabled={emailVerifying}
          onClick={onVerifyOtp}
          className="w-full py-2.5 bg-[#061559] hover:bg-[#0b1746] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          {emailVerifying ? "Verifying OTP..." : "Verify"}
        </button>
      </div>
    </div>
  );
};
