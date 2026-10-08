"use client";

import React from "react";
import { CheckCircle2, Copy, Check, ExternalLink } from "lucide-react";
import { AdminRecentAccount } from "./types";

interface AdminRecentAccountsProps {
  recentAccounts: AdminRecentAccount[];
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onDirectLogin: (acc: AdminRecentAccount) => void;
}

export const AdminRecentAccounts: React.FC<AdminRecentAccountsProps> = ({
  recentAccounts,
  copiedKey,
  onCopy,
  onDirectLogin,
}) => {
  if (recentAccounts.length === 0) return null;

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Recently Provisioned Test Accounts ({recentAccounts.length})</span>
        </h2>
        <span className="text-xs text-slate-400">Click below to copy or test login</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {recentAccounts.map((acc, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 space-y-2.5 hover:border-teal-500/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {acc.role}
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {acc.userId}
              </span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{acc.fullName}</div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Phone: <span className="font-mono text-slate-200">{acc.phone}</span></span>
                <button
                  type="button"
                  onClick={() => onCopy(acc.phone, `phone-${idx}`)}
                  className="text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `phone-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="text-slate-400 flex items-center justify-between">
                <span>Password: <span className="font-mono text-slate-200">{acc.password}</span></span>
                <button
                  type="button"
                  onClick={() => onCopy(acc.password, `pwd-${idx}`)}
                  className="text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `pwd-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="text-slate-400 truncate">
                Email: <span className="text-slate-300">{acc.email}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onDirectLogin(acc)}
                className="px-3 py-1.5 rounded-lg bg-teal-600/30 hover:bg-teal-600 text-teal-200 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Direct Login as {acc.role.toUpperCase()}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const copyPayload = `Role: ${acc.role}\nUser ID: ${acc.userId}\nName: ${acc.fullName}\nPhone: ${acc.phone}\nEmail: ${acc.email}\nPassword: ${acc.password}`;
                  onCopy(copyPayload, `all-${idx}`);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
              >
                {copiedKey === `all-${idx}` ? "✓ Copied All" : "Copy All"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
