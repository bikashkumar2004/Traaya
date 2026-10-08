"use client";

import React from "react";
import { Building2, Tent, ArrowRight } from "lucide-react";
import { UserRole } from "@/lib/auth-context";
import { AuthSetupCategory } from "./types";

interface LoginAlternatePortalsProps {
  setupMode: AuthSetupCategory;
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const LoginAlternatePortals: React.FC<LoginAlternatePortalsProps> = ({
  setupMode,
  selectedRole,
  onSelectRole,
}) => {
  if (setupMode !== "individual" || selectedRole !== "patient") return null;

  return (
    <div className="pt-2 border-t border-slate-100 space-y-2">
      {/* Organization Portal Card */}
      <div className="p-2.5 bg-sky-50/50 hover:bg-sky-50/90 rounded-xl border border-sky-100 transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 border border-sky-200/60 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              Are you representing an Organization (Institute / PSU)?
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Monitor student &amp; employee health telemetry and checkups
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectRole("organization")}
          className="text-xs sm:text-sm font-bold text-sky-800 bg-white hover:bg-sky-100/80 px-3 py-1.5 rounded-lg border border-sky-200 transition-colors shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <span>Sign In</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Health Camp Portal Card */}
      <div className="p-2.5 bg-amber-50/40 hover:bg-amber-50/80 rounded-xl border border-amber-100 transition-all flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 border border-amber-200/60 flex items-center justify-center shrink-0">
            <Tent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              Do you want to start a Temporary Health Camp?
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              Deploy mobile intake tokens, spot vitals &amp; 108 referral
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectRole("healthcamp")}
          className="text-xs sm:text-sm font-bold text-amber-900 bg-white hover:bg-amber-100/80 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <span>Start Camp</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
