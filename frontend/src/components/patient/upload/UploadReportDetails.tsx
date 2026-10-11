"use client";

import React, { useState } from "react";
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  Sparkles,
  Activity,
  Pill,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  TrendingUp,
  TrendingDown,
  User,
  Calendar,
  Stethoscope,
} from "lucide-react";
import { StoredReport, SummaryDetails, AnalyteParameter } from "./types";

interface UploadReportDetailsProps {
  activeReport: StoredReport;
  onDismiss: () => void;
}

export function UploadReportDetails({
  activeReport,
  onDismiss,
}: UploadReportDetailsProps) {
  const [showRawOutput, setShowRawOutput] = useState(false);

  const summary: any = activeReport?.report_summary || activeReport?.summary_details || {};
  const patientSummaryText = summary?.overview || activeReport?.patient_summary || "";
  const reportFileName = summary?.file_name || activeReport?.file_name || activeReport?.report_type || "Medical Report";
  const reportFileSize = summary?.file_size || activeReport?.file_size || "1.5 MB";
  const reportLabName = summary?.lab_name || activeReport?.lab_name || null;
  const reportTestDate =
    summary?.test_date ||
    activeReport?.test_date ||
    (activeReport?.created_at ? new Date(activeReport.created_at).toLocaleDateString() : null);

  const patientName = summary?.patient_name || activeReport?.patient_name || null;
  const patientDob = summary?.patient_dob || activeReport?.patient_dob || null;
  const doctorName = summary?.doctor_name || activeReport?.doctor_name || null;

  const parameters: AnalyteParameter[] =
    summary?.parameters || activeReport?.ocr_extracted_metrics?.parameters || [];
  const sections: Array<{ title: string; items: string[] }> =
    summary?.sections || activeReport?.sections || [];
  const rawModelOutput: string | null =
    summary?.raw_model_output || activeReport?.raw_model_output || null;

  const healthStatus = summary?.health_status || "Normal";

  return (
    <div className="bg-white rounded-3xl border border-teal-200/90 p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300 text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-2xl shrink-0">
            <FileCheck className="w-6 h-6 text-teal-800" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {activeReport.report_type}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                  healthStatus === "Normal"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : healthStatus === "Action Required"
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : "bg-amber-100 text-amber-900 border-amber-200"
                }`}
              >
                {healthStatus === "Normal" && <CheckCircle2 className="w-3.5 h-3.5" />}
                {healthStatus !== "Normal" && <AlertTriangle className="w-3.5 h-3.5" />}
                <span>{healthStatus}</span>
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>
                <strong>File:</strong> {reportFileName}
              </span>
              <span>&bull;</span>
              <span>{reportFileSize}</span>
              {reportLabName && (
                <>
                  <span>&bull;</span>
                  <span>{reportLabName}</span>
                </>
              )}
              {reportTestDate && (
                <>
                  <span>&bull;</span>
                  <span>Date: {reportTestDate}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions: View Stored File & Close */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {activeReport.file_url && (
            <a
              href={activeReport.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Document File</span>
            </a>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Dismiss current view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Metadata Strip (Only fields present) */}
      <div className="flex flex-wrap gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
        {patientName && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-slate-500 font-medium">Patient:</span>
            <strong className="text-slate-800">{patientName}</strong>
          </div>
        )}

        {patientDob && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-slate-500 font-medium">DOB:</span>
            <strong className="text-slate-800">{patientDob}</strong>
          </div>
        )}

        {doctorName && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-slate-500 font-medium">Clinician:</span>
            <strong className="text-slate-800">{doctorName}</strong>
          </div>
        )}

        {reportTestDate && (
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="text-slate-500 font-medium">Date:</span>
            <strong className="text-slate-800">{reportTestDate}</strong>
          </div>
        )}
      </div>

      {/* Summary Card */}
      {patientSummaryText && (
        <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-teal-950 font-bold">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Extracted Clinical Summary</span>
          </div>
          <p className="text-slate-700 leading-relaxed font-normal bg-white/80 p-3 rounded-xl border border-teal-100">
            {patientSummaryText}
          </p>
        </div>
      )}

      {/* 1. Measured Biomarkers & Vitals Table (Only when parameters exist) */}
      {parameters.length > 0 && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
              <Activity className="w-4 h-4 text-teal-700" />
              <span>Extracted Vitals &amp; Parameters ({parameters.length})</span>
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3 sm:px-4 sm:py-3">Biomarker / Test Name</th>
                <th className="p-3 sm:px-4 sm:py-3">Extracted Result</th>
                {parameters.some((p) => p.reference_range) && (
                  <th className="p-3 sm:px-4 sm:py-3">Reference Range</th>
                )}
                <th className="p-3 sm:px-4 sm:py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {parameters.map((p, idx) => {
                const isHigh = p.status === "HIGH";
                const isLow = p.status === "LOW";
                const isAbnormal = isHigh || isLow;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 sm:px-4 sm:py-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 sm:px-4 sm:py-3 font-mono font-bold">
                      {p.value} <span className="text-[11px] font-normal text-slate-500">{p.unit}</span>
                    </td>
                    {parameters.some((param) => param.reference_range) && (
                      <td className="p-3 sm:px-4 sm:py-3 text-slate-500">{p.reference_range || "-"}</td>
                    )}
                    <td className="p-3 sm:px-4 sm:py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          isHigh
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : isLow
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {isHigh && <TrendingUp className="w-3 h-3 text-rose-700" />}
                        {isLow && <TrendingDown className="w-3 h-3 text-amber-700" />}
                        {!isAbnormal && <Check className="w-3 h-3 text-emerald-700" />}
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Dynamic Extracted Sections */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section, sIdx) => {
            const secTitleLower = section.title.toLowerCase();
            const isVitalsSec = secTitleLower.includes("vital") || secTitleLower.includes("lab result");
            if (isVitalsSec && parameters.length > 0) return null;

            const isIssues = secTitleLower.includes("issue") || secTitleLower.includes("diagnos");
            const isTreatments = secTitleLower.includes("treatment") || secTitleLower.includes("medication") || secTitleLower.includes("hospital");

            return (
              <div
                key={sIdx}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  {isIssues ? (
                    <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  ) : isTreatments ? (
                    <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <Pill className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    {section.title}
                  </h4>
                </div>

                <div className="space-y-1.5 text-xs">
                  {section.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className="flex items-start gap-2 p-2 bg-slate-50/70 rounded-lg text-slate-800 leading-snug"
                    >
                      <span className="text-teal-700 font-bold shrink-0 mt-0.5">&bull;</span>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Raw Model Extraction Drawer */}
      {rawModelOutput && (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
          <button
            type="button"
            onClick={() => setShowRawOutput(!showRawOutput)}
            className="w-full px-4 py-3 text-left font-bold text-xs text-slate-700 hover:text-slate-900 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <span>Verbatim Model Extraction Output</span>
            </div>
            {showRawOutput ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showRawOutput && (
            <div className="p-4 border-t border-slate-200 bg-white">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-96">
                {rawModelOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
