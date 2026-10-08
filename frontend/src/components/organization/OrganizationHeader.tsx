"use client";

import React from "react";
import Link from "next/link";
import { Building2, LogOut } from "lucide-react";
import { RegisteredOrganization } from "@/lib/organization-data";

interface OrganizationHeaderProps {
  selectedOrg: RegisteredOrganization;
  onSignOut: () => void;
}

export const OrganizationHeader: React.FC<OrganizationHeaderProps> = ({
  selectedOrg,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
                Triage<span className="text-teal-700">Assist</span>
              </span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 ml-2">
                Organisation Single Dashboard
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Logged-In Organisation Badge (Read-only, strictly secured to this organization) */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-2xl shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-teal-700" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                <span>Active Organisation</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              </div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="truncate max-w-[200px] sm:max-w-xs">{selectedOrg.name}</span>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 shrink-0">
                  {selectedOrg.code}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
