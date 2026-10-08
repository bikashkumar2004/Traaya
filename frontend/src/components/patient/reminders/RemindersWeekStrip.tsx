"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { WeekDayItem, ReminderStats } from "./types";

interface RemindersWeekStripProps {
  stats: ReminderStats;
  weekDays: WeekDayItem[];
}

export function RemindersWeekStrip({ stats, weekDays }: RemindersWeekStripProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Active Weekly Schedule{" "}
            <span className="text-xs text-slate-400 font-normal">
              &bull; {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
            </span>
          </h3>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          {stats.completed} of {stats.total} care goals completed
        </div>
      </div>

      {/* 7 Days Row */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center">
        {weekDays.map((d, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl border transition-all ${
              d.active
                ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div
              className={`text-[10px] font-bold uppercase tracking-wider ${
                d.active ? "text-teal-200" : "text-slate-400"
              }`}
            >
              {d.day}
            </div>
            <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums">
              {d.date}
            </div>
            <div
              className={`text-[10px] font-semibold mt-1 flex items-center justify-center gap-1 ${
                d.active ? "text-teal-100" : "text-slate-500"
              }`}
            >
              {d.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />}
              <span>{d.active ? `${stats.completed}/${stats.total} Done` : "Care Active"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
