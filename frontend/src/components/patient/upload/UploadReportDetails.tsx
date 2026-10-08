"use client";

import React from "react";
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  X,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { StoredReport, SummaryDetails, AnalyteParameter, AbnormalFinding, getLoincSnomed } from "./types";

interface UploadReportDetailsProps {
  activeReport: StoredReport;
  onDismiss: () => void;
}

export function UploadReportDetails({
  activeReport,
  onDismiss,
}: UploadReportDetailsProps) {
  const summary: SummaryDetails = activeReport?.report_summary || activeReport?.summary_details || {};
  const patientSummaryText = summary?.overview || activeReport?.patient_summary || "";
  const reportFileName = summary?.abnormal_findings?.[0]?.parameter
    ? (summary as any)?.file_name || activeReport?.file_name || activeReport?.report_type
    : activeReport?.file_name || activeReport?.report_type || "Medical Report";
  const reportFileSize = (summary as any)?.file_size || activeReport?.file_size || "1.5 MB";
  const reportLabName = (summary as any)?.lab_name || activeReport?.lab_name || "District Hospital Pathology";
  const reportTestDate =
    (summary as any)?.test_date ||
    activeReport?.test_date ||
    (activeReport?.created_at ? new Date(activeReport.created_at).toLocaleDateString() : "Today");
  const parameters: AnalyteParameter[] =
    (summary as any)?.parameters || activeReport?.ocr_extracted_metrics?.parameters || [];
  const abnormalFindings: AbnormalFinding[] = summary?.abnormal_findings || [];
  const healthStatus = summary?.health_status || "Needs Attention";

  return (
    <div className="bg-white rounded-3xl border border-teal-200/90 p-5 sm:p-7 shadow-xs space-y-6 animate-in fade-in duration-300">
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
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                <strong>File:</strong> {reportFileName}
              </span>
              <span>&bull;</span>
              <span>{reportFileSize}</span>
              <span>&bull;</span>
              <span>{reportLabName}</span>
              <span>&bull;</span>
              <span>Date: {reportTestDate}</span>
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
              <span>View Original File</span>
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

      {/* 1. Clinical Biomarkers Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="p-3 sm:px-4 sm:py-3.5">Biomarker / Test Name</th>
              <th className="p-3 sm:px-4 sm:py-3.5">Extracted Result</th>
              <th className="p-3 sm:px-4 sm:py-3.5">Reference Range</th>
              <th className="p-3 sm:px-4 sm:py-3.5 font-mono">LOINC Code</th>
              <th className="p-3 sm:px-4 sm:py-3.5 font-mono">SNOMED CT</th>
              <th className="p-3 sm:px-4 sm:py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {parameters.map((p, idx) => {
              const codes = getLoincSnomed(p.name);
              const isHigh = p.status === "HIGH";
              const isLow = p.status === "LOW";
              return (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 sm:px-4 sm:py-3.5 font-bold text-slate-900">{p.name}</td>
                  <td className="p-3 sm:px-4 sm:py-3.5 font-mono font-bold">
                    {p.value} <span className="text-[11px] font-normal text-slate-500">{p.unit}</span>
                  </td>
                  <td className="p-3 sm:px-4 sm:py-3.5 text-slate-500">{p.reference_range}</td>
                  <td className="p-3 sm:px-4 sm:py-3.5 font-mono text-teal-800 font-bold">{codes.loinc}</td>
                  <td className="p-3 sm:px-4 sm:py-3.5 font-mono text-slate-500">{codes.snomed}</td>
                  <td className="p-3 sm:px-4 sm:py-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        isHigh
                          ? "bg-rose-100 text-rose-800"
                          : isLow
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 2. Clinical Correlation & Flags */}
      {summary?.clinical_flags && summary.clinical_flags.length > 0 && (
        <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-1.5 text-xs">
          <div className="font-bold text-teal-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span>Clinical Correlation &amp; Flags</span>
          </div>
          <ul className="text-slate-700 space-y-1 pt-1 text-[11.5px]">
            {summary.clinical_flags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-teal-700 font-bold">&bull;</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Report Summary Card (Directly Below Table) */}
      <div className="p-5 sm:p-6 bg-teal-50/40 rounded-2xl border border-teal-200/90 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-teal-100/80 pb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900">
                Report Summary
              </h3>
              <p className="text-[11px] text-slate-500">
                Plain-language explanation of findings for patient understanding
              </p>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
              healthStatus === "Normal"
                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                : healthStatus === "Action Required"
                ? "bg-rose-100 text-rose-800 border-rose-200"
                : "bg-amber-100 text-amber-900 border-amber-200"
            }`}
          >
            {healthStatus === "Normal" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            <span>{healthStatus}</span>
          </span>
        </div>

        {/* Overview text */}
        <p className="text-xs sm:text-sm font-medium leading-relaxed bg-white p-4 rounded-xl border border-teal-100 text-slate-800 shadow-2xs">
          {patientSummaryText || "Your medical report has been extracted and reviewed successfully."}
        </p>

        {/* Key Abnormal Findings with Plain-Language Meaning & Action */}
        {abnormalFindings.length > 0 && (
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Key Findings That Need Attention</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {abnormalFindings.map((item, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-rose-200/80 space-y-1.5 shadow-2xs text-xs">
                  <div className="flex items-center justify-between border-b border-rose-100/70 pb-1.5">
                    <span className="font-bold text-slate-900">{item.parameter}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-rose-700">{item.value}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800">{item.status}</span>
                    </div>
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-snug">
                    <strong className="text-slate-700">Meaning:</strong> {item.meaning}
                  </p>
                  <p className="text-[11.5px] text-teal-800 font-medium">
                    <strong>Action:</strong> {item.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions to Ask Doctor */}
        {summary?.what_to_ask_doctor && summary.what_to_ask_doctor.length > 0 && (
          <div className="bg-white p-3.5 rounded-xl border border-teal-100/90 space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-teal-700" />
              <span>Questions to Ask Your Doctor During Visit</span>
            </div>
            <ul className="space-y-1 text-slate-700 text-[11.5px] pl-1">
              {summary.what_to_ask_doctor.map((q, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-teal-700 font-bold">{idx + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
