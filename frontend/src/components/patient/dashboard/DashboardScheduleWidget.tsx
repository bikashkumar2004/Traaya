"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  ExternalLink,
  ChevronRight,
  Check,
  Pill,
  Building2,
  User,
} from "lucide-react";
import { CareReminder, ReminderStats } from "./types";

interface DashboardScheduleWidgetProps {
  reminders: CareReminder[];
  reminderStats: ReminderStats;
  onToggleReminder: (id: string) => void;
}

export function DashboardScheduleWidget({
  reminders,
  reminderStats,
  onToggleReminder,
}: DashboardScheduleWidgetProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Today&apos;s Medication &amp; Follow-up Schedule
          </h3>
        </div>
        <Link
          href="/citizen/reminders"
          className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1"
        >
          <span>Full Schedule</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Adherence Mini Meter */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            DAILY ADHERENCE
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
            {reminderStats.completed} of {reminderStats.total} Goals Completed
          </div>
          <span className="text-[11px] text-teal-800 font-semibold">
            {reminderStats.rate}% target adherence today
          </span>
        </div>

        <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-teal-200 flex items-center justify-center font-bold text-xs text-teal-800 shrink-0">
          {reminderStats.rate}%
        </div>
      </div>

      {/* List of Today's Items */}
      <div className="space-y-2.5">
        {reminders.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-medium">
              No care reminders or medicines scheduled for today.
            </p>
            <Link
              href="/citizen/reminders"
              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
            >
              <span>Add a reminder</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          reminders.slice(0, 3).map((r) => {
            const isMed = r.type === "medication";
            const isConsult = r.type === "consultation";

            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  r.is_completed
                    ? "bg-emerald-50/30 border-emerald-200 text-slate-500"
                    : "bg-white border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      r.is_completed
                        ? "bg-emerald-100 text-emerald-700"
                        : isMed
                        ? "bg-teal-50 text-teal-800"
                        : isConsult
                        ? "bg-blue-50 text-blue-800"
                        : "bg-purple-50 text-purple-800"
                    }`}
                  >
                    {r.is_completed ? (
                      <Check className="w-4 h-4" />
                    ) : isMed ? (
                      <Pill className="w-4 h-4" />
                    ) : isConsult ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          r.is_completed
                            ? "line-through text-slate-500"
                            : "text-slate-900"
                        }`}
                      >
                        {r.title}
                      </span>
                      {r.dosage && (
                        <span className="text-[11px] text-slate-500">
                          ({r.dosage})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{r.scheduled_time}</span>
                      <span>&bull;</span>
                      <span>{r.frequency}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleReminder(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                    r.is_completed
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      : "bg-teal-800 hover:bg-teal-900 text-white"
                  }`}
                >
                  {r.is_completed ? "Completed" : "Mark Done"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
