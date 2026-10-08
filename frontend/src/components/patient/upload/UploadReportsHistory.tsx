"use client";

import React from "react";
import { RefreshCw, FileText, Calendar, Eye, ExternalLink } from "lucide-react";
import { StoredReport } from "./types";

interface UploadReportsHistoryProps {
  isLoadingHistory: boolean;
  reportsHistory: StoredReport[];
  onRefresh: () => void;
  onSelectReport: (report: StoredReport) => void;
}

export function UploadReportsHistory({
  isLoadingHistory,
  reportsHistory,
  onRefresh,
  onSelectReport,
}: UploadReportsHistoryProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Your Stored Reports &amp; Lab History
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Access your previous reports stored in Supabase cloud storage anytime
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Refresh reports"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? "animate-spin" : ""}`} />
        </button>
      </div>

      {isLoadingHistory ? (
        <div className="py-10 text-center space-y-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-700" />
          <p className="text-xs font-semibold">Loading your stored reports...</p>
        </div>
      ) : reportsHistory.length === 0 ? (
        <div className="py-10 text-center space-y-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">No Medical Reports Uploaded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your first lab test or prescription above to keep an organized, secure medical locker and see your plain-language summary.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportsHistory.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs hover:border-teal-300 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 bg-teal-50 text-teal-800 rounded-xl shrink-0">
                    <FileText className="w-5 h-5 text-teal-700" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {report.status || "Completed"}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                    {report.report_type || report.report_summary?.file_name || "Medical Report"}
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(report.created_at || report.uploaded_at || Date.now()).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span>{report.report_summary?.file_size || "1.5 MB"}</span>
                  </div>
                </div>

                {(report.report_summary?.overview || report.patient_summary) && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {report.report_summary?.overview || report.patient_summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectReport(report)}
                  className="flex-1 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Summary</span>
                </button>

                {report.file_url && (
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                    title="Open file in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
