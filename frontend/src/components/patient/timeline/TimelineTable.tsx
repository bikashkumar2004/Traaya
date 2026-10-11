"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  AlertCircle,
  Plus,
  CheckCheck,
  Copy,
  Eye,
} from "lucide-react";
import { TriageTicket } from "./types";

interface TimelineTableProps {
  loading: boolean;
  error: string | null;
  filteredTickets: TriageTicket[];
  totalTicketsCount: number;
  copiedId: string | null;
  onCopyId: (e: React.MouseEvent, id: string) => void;
  getStatusBadge: (status: string, ticketItem?: TriageTicket) => React.ReactNode;
  getDisplaySymptoms: (ticket: TriageTicket) => string[];
  formatDate: (iso: string) => { date: string; time: string };
}

export const TimelineTable: React.FC<TimelineTableProps> = ({
  loading,
  error,
  filteredTickets,
  totalTicketsCount,
  copiedId,
  onCopyId,
  getStatusBadge,
  getDisplaySymptoms,
  formatDate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {loading ? (
        /* Loading State */
        <div className="p-8 space-y-4 animate-pulse">
          <div className="h-10 bg-slate-100 rounded-xl w-full" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-50 rounded-xl w-full" />
          ))}
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Could not load clinical cases</h3>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7 text-teal-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {totalTicketsCount === 0 ? "No submissions found" : "No matching records"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {totalTicketsCount === 0
                ? "Report your symptoms to generate your first AI triage case and build your clinical timeline."
                : "No cases match your active filters. Try clearing your search or switching filter tabs."}
            </p>
          </div>
          {totalTicketsCount === 0 && (
            <Link
              href="/citizen/symptoms"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment Now</span>
            </Link>
          )}
        </div>
      ) : (
        /* Responsive Table */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-16 text-center">Sl no.</th>
                <th className="py-3.5 px-4 w-36">ID</th>
                <th className="py-3.5 px-4 min-w-[260px]">Symptoms</th>
                <th className="py-3.5 px-4 w-44">Date &amp; Time</th>
                <th className="py-3.5 px-4 w-36">Status</th>
                <th className="py-3.5 px-4 w-28 text-center">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTickets.map((ticket, index) => {
                const dateInfo = formatDate(ticket.created_at);
                const displaySymptoms = getDisplaySymptoms(ticket);
                const displayId = ticket.case_number
                  ? ticket.case_number.startsWith("#")
                    ? ticket.case_number
                    : `#${ticket.case_number}`
                  : `#${ticket.id.slice(0, 8).toUpperCase()}`;
                const isCopied = copiedId === (ticket.case_number || ticket.id);

                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-teal-50/30 transition-colors group"
                  >
                    {/* Sl no. */}
                    <td className="py-4 px-4 text-center font-bold text-slate-500 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </td>

                    {/* ID */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200 group-hover:border-teal-300 transition-colors">
                            {displayId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onCopyId(e, ticket.case_number || ticket.id)}
                            title="Copy Case ID"
                            className="text-slate-400 hover:text-teal-700 p-1 rounded transition-colors"
                          >
                            {isCopied ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {ticket.is_family_member && (
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <span>Family: {ticket.family_member_name || "Dependent"}</span>
                            {ticket.family_member_relationship && (
                              <span className="text-teal-600 font-normal">
                                ({ticket.family_member_relationship})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Symptoms */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {displaySymptoms.length > 0 ? (
                          displaySymptoms.map((sName, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium"
                            >
                              {sName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No symptoms recorded</span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">{dateInfo.date}</div>
                      {dateInfo.time && (
                        <div className="text-[11px] text-slate-400 font-normal">
                          {dateInfo.time}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status, ticket)}
                    </td>

                    {/* View Action */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <Link
                          href={`/citizen/timeline/${ticket.id}`}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-700 transition-all shadow-2xs group/btn"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-600 group-hover/btn:text-white transition-colors" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info bar */}
      {!loading && filteredTickets.length > 0 && (
        <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing <strong className="text-slate-800">{filteredTickets.length}</strong> of{" "}
            <strong className="text-slate-800">{totalTicketsCount}</strong> total clinical cases
          </span>
          <span className="text-[11px] text-slate-400">
            Click &ldquo;View&rdquo; to inspect full AI clinical reasoning, vitals &amp; encounter audit.
          </span>
        </div>
      )}
    </div>
  );
};
