"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Plus,
  Check,
  Pill,
  Building2,
  User,
  Activity,
  Clock,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { CareReminder } from "./types";

interface RemindersListProps {
  loading: boolean;
  filteredReminders: CareReminder[];
  activeFilter: string;
  onOpenAddModal: () => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RemindersList({
  loading,
  filteredReminders,
  activeFilter,
  onOpenAddModal,
  onToggle,
  onDelete,
}: RemindersListProps) {
  if (loading) {
    return (
      <div className="space-y-3.5">
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (filteredReminders.length === 0) {
    return (
      <div className="space-y-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">
            {activeFilter === "all" ? "No Reminders Scheduled" : "No Reminders in this Category"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            {activeFilter === "all"
              ? "You do not have any reminders or follow-ups scheduled yet. You can add your personalized medications, vitals logs, or doctor review reminders using the button below."
              : "No care reminders found in this category. You can add one anytime."}
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Reminder</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {filteredReminders.map((reminder) => {
        const isDone = reminder.is_completed;
        const isMed = reminder.type === "medication";
        const isConsult = reminder.type === "consultation";
        const isAsha = reminder.type === "asha_visit";

        return (
          <div
            key={reminder.id}
            className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDone
                ? "border-emerald-200 bg-emerald-50/20"
                : "border-slate-200 hover:border-teal-300"
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              {/* Category Icon */}
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isDone
                    ? "bg-emerald-100 text-emerald-700"
                    : isMed
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : isConsult
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : isAsha
                    ? "bg-purple-50 text-purple-800 border border-purple-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {isDone ? (
                  <Check className="w-5 h-5" />
                ) : isMed ? (
                  <Pill className="w-5 h-5" />
                ) : isConsult ? (
                  <Building2 className="w-5 h-5" />
                ) : isAsha ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
              </div>

              {/* Text Details */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                      isDone
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : isMed
                        ? "bg-teal-50 text-teal-800 border-teal-200"
                        : isConsult
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {isDone ? "Completed" : reminder.type.replace(/_/g, " ")}
                  </span>

                  {reminder.scheduled_time && (
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{reminder.scheduled_time}</span>
                    </span>
                  )}

                  {reminder.frequency && (
                    <span className="text-[11px] text-slate-400">
                      &bull; {reminder.frequency}
                    </span>
                  )}
                </div>

                <h4
                  className={`text-base font-bold transition-colors ${
                    isDone ? "line-through text-slate-500" : "text-slate-900"
                  }`}
                >
                  {reminder.title}
                  {reminder.dosage && (
                    <span className="text-xs font-semibold text-slate-500 ml-2">
                      ({reminder.dosage})
                    </span>
                  )}
                </h4>

                {reminder.description && (
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    {reminder.description}
                  </p>
                )}

                {/* Linked Triage Encounter Link */}
                {reminder.ticket_id && (
                  <Link
                    href={`/patient/timeline/${reminder.ticket_id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:underline pt-1"
                  >
                    <span>Related to Clinical Case #{reminder.ticket_id.slice(0, 8).toUpperCase()}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onToggle(reminder.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isDone
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-teal-800 hover:bg-teal-900 text-white"
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${isDone ? "text-slate-500" : "text-white"}`} />
                <span>{isDone ? "Mark Pending" : "Mark as Done"}</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(reminder.id)}
                title="Delete reminder"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
