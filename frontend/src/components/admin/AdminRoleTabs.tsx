"use client";

import React from "react";
import { UserRole } from "@/lib/auth-context";
import {
  UserCheck,
  Stethoscope,
  HeartPulse,
  Pill,
  Building2,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { AdminRoleTabItem } from "./types";

const ROLE_TABS: AdminRoleTabItem[] = [
  { id: "patient", label: "Patient", icon: UserCheck, color: "text-emerald-700 border-emerald-500 bg-emerald-50", badge: "PAT-XXXXXX" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, color: "text-cyan-700 border-cyan-500 bg-cyan-50", badge: "DOC-XXXX" },
  { id: "nurse", label: "Nurse", icon: HeartPulse, color: "text-rose-700 border-rose-500 bg-rose-50", badge: "NUR-XXXX" },
  { id: "facility", label: "Facility / Pharmacy", icon: Pill, color: "text-indigo-700 border-indigo-500 bg-indigo-50", badge: "FAC-XXX" },
  { id: "organization", label: "Organization", icon: Building2, color: "text-amber-700 border-amber-500 bg-amber-50", badge: "ORG-XXX" },
  { id: "healthcamp", label: "Health Camp / MMU", icon: Truck, color: "text-teal-700 border-teal-500 bg-teal-50", badge: "CMP-XXX" },
  { id: "admin", label: "System Admin", icon: ShieldAlert, color: "text-purple-700 border-purple-500 bg-purple-50", badge: "ADM-XXXX" },
];

interface AdminRoleTabsProps {
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const AdminRoleTabs: React.FC<AdminRoleTabsProps> = ({
  activeRole,
  onSelectRole,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {ROLE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isSelected = activeRole === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectRole(tab.id)}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
              isSelected
                ? "bg-slate-800 border-teal-400 ring-2 ring-teal-400/40 shadow-lg text-white"
                : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Icon className={`w-5 h-5 ${isSelected ? "text-teal-400" : "text-slate-400"}`} />
              <span className="text-[10px] font-mono uppercase bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-300">
                {tab.badge}
              </span>
            </div>
            <span className="text-xs font-bold truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
