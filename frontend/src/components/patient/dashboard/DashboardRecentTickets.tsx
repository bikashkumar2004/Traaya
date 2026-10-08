"use client";

import React from "react";
import Link from "next/link";
import { Activity, ChevronRight } from "lucide-react";
import { TriageTicket, normalizeStatus, formatDate } from "./types";

interface DashboardRecentTicketsProps {
  tickets: TriageTicket[];
}

export function DashboardRecentTickets({ tickets }: DashboardRecentTicketsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Recent Triage Encounters
          </h3>
        </div>
        <Link
          href="/citizen/timeline"
          className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1"
        >
          <span>View All ({tickets.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          No previous triage records found.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.slice(0, 3).map((ticket) => {
            const norm = normalizeStatus(ticket.status);
            const style =
              norm === "Completed"
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : norm === "Scheduled"
                ? "bg-teal-50 text-teal-800 border-teal-300"
                : norm === "Referred"
                ? "bg-purple-50 text-purple-800 border-purple-300"
                : norm === "Reverted"
                ? "bg-amber-50 text-amber-800 border-amber-300"
                : norm === "Draft"
                ? "bg-slate-100 text-slate-700 border-slate-300"
                : "bg-sky-50 text-sky-800 border-sky-300";

            return (
              <div
                key={ticket.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">
                      {ticket.chief_complaint}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style}`}>
                      {norm}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      #{ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Logged on {formatDate(ticket.created_at)} &bull; Vitals: Temp {ticket.vitals?.temperature || "98.4°F"}
                  </p>
                </div>

                <Link
                  href={`/citizen/timeline/${ticket.id}`}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs self-start sm:self-auto shrink-0 inline-flex items-center gap-1"
                >
                  <span>Advice &amp; Care</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
