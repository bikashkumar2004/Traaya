"use client";

import React from "react";
import { ShieldAlert, Sparkles, RotateCcw } from "lucide-react";

interface AdminHeaderProps {
  onQuickFill: () => void;
  onClear: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onQuickFill,
  onClear,
}) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <img
            src="/traaya-logo.png"
            alt="TRAAYA Logo"
            className="h-10 w-auto object-contain shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              TRAAYA Admin Test Console
            </h1>
            <p className="text-xs text-slate-400">
              Universal Multi-Role Registration &amp; QA Data Provisioning Workbench
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onQuickFill}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>⚡ Quick Fill Test Data</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
