"use client";

import React from "react";
import { Eye } from "lucide-react";
import { CareReminder } from "./types";

interface RemindersFilterBarProps {
  reminders: CareReminder[];
  activeFilter: string;
  onSelectFilter: (filterId: string) => void;
}

export function RemindersFilterBar({
  reminders,
  activeFilter,
  onSelectFilter,
}: RemindersFilterBarProps) {
  const tabs = [
    { id: "all", label: `All (${reminders.length})` },
    {
      id: "medication",
      label: `Medications (${reminders.filter((r) => r.type === "medication").length})`,
    },
    {
      id: "consultation",
      label: `Doctor Consults (${reminders.filter((r) => r.type === "consultation").length})`,
    },
    {
      id: "asha_visit",
      label: `ASHA Visits (${reminders.filter((r) => r.type === "asha_visit").length})`,
    },
    {
      id: "vitals_log",
      label: `Vitals Checks (${reminders.filter((r) => r.type === "vitals_log").length})`,
    },
  ];

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {tabs.map((tab) => {
          const isSel = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSel
                  ? "bg-teal-800 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
        <Eye className="w-3.5 h-3.5 text-slate-400" />
        <span>Showing: {activeFilter.replace(/_/g, " ").toUpperCase()}</span>
      </div>
    </div>
  );
}
