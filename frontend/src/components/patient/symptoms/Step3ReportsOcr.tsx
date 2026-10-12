"use client";

import React, { useState, useMemo } from "react";
import {
  RefreshCw,
  Upload,
  FileCheck,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  Calendar,
  Building2,
  User,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Pill,
} from "lucide-react";

export interface OcrParameter {
  name: string;
  value: string;
  unit: string;
  reference_range?: string;
  status: string;
  alert_level?: string;
  clinical_significance?: string;
}

export interface OcrSection {
  title: string;
  items: string[];
}

export interface OcrSummaryDetails {
  overview?: string;
  health_status?: string;
  urgency?: string;
  abnormal_findings?: any[];
  normal_findings?: string[];
  lifestyle_tips?: string[];
  clinical_flags?: string[];
}

export interface OcrData {
  patient_name?: string;
  patient_dob?: string;
  doctor_name?: string;
  lab_name?: string;
  test_name: string;
  report_date?: string;
  parameters: OcrParameter[];
  sections?: OcrSection[];
  medical_issues?: string[];
  treatments?: string[];
  lifestyle_advice?: string[];
  clinical_flags?: string[];
  patient_summary?: string;
  summary_details?: OcrSummaryDetails;
  ai_summary?: string;
  raw_model_output?: string;
  model?: string;
  missing_information?: any[];
}

export interface UploadedReportInfo {
  fileName: string;
  fileSize: string;
  status: string;
}

export interface Step3ReportsOcrProps {
  isScanningOcr: boolean;
  extractedSymptoms: string[];
  symptomText: string;
  uploadedReport: UploadedReportInfo | null;
  setUploadedReport: (val: UploadedReportInfo | null) => void;
  ocrData: OcrData | null;
  setOcrData: (val: OcrData | null) => void;
  reportInquiryAnswers?: Record<string, string>;
  setReportInquiryAnswers?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoadSample: (testType: string, filename: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
  isGeneratingQuestions?: boolean;
}

export function Step3ReportsOcr({
  isScanningOcr,
  uploadedReport,
  setUploadedReport,
  ocrData,
  setOcrData,
  handleFileUpload,
  onBack,
  onContinue,
  onSaveDraft,
  isSavingDraft,
  isSubmitting,
  isGeneratingQuestions = false,
}: Step3ReportsOcrProps) {
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ABNORMAL" | "NORMAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showRawOutput, setShowRawOutput] = useState(false);

  const parameters = useMemo(() => ocrData?.parameters || [], [ocrData]);
  const sections = useMemo(() => ocrData?.sections || [], [ocrData]);

  // Counts for parameters
  const abnormalCount = useMemo(
    () => parameters.filter((p) => p.status === "HIGH" || p.status === "LOW").length,
    [parameters]
  );
  const normalCount = useMemo(
    () => parameters.filter((p) => p.status === "NORMAL" || !p.status).length,
    [parameters]
  );

  // Filtered parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.value.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterStatus === "ABNORMAL") {
        return p.status === "HIGH" || p.status === "LOW";
      }
      if (filterStatus === "NORMAL") {
        return p.status === "NORMAL" || !p.status;
      }
      return true;
    });
  }, [parameters, searchQuery, filterStatus]);

  // Document summary text directly from model extraction
  const summaryText =
    ocrData?.ai_summary ||
    ocrData?.patient_summary ||
    ocrData?.summary_details?.overview ||
    "";

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Upload any document</span>
          </h2>
          {/* <p className="text-xs text-slate-500 mt-0.5">
            Uploaded document data extracted directly by your custom medical vision model.
          </p> */}
        </div>
      </div>

      {/* Scanning in progress loader */}
      {isScanningOcr && (
        <div className="p-8 bg-teal-50/70 border border-teal-200 rounded-2xl text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-950">
              Processing Document with Medical OCR Model...
            </h4>
            <p className="text-xs text-teal-700 mt-0.5">
              Extracting patient info, clinical vitals, lab results, diagnoses, and medical summaries.
            </p>
          </div>
        </div>
      )}

      {/* STATE 1: No report uploaded yet */}
      {!uploadedReport && !isScanningOcr && (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-700 bg-slate-50/70 rounded-2xl p-8 text-center space-y-3 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm sm:text-base text-slate-900 font-extrabold">
                Upload Here
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload any annual summaries, lab tests, prescriptions, or clinical notes in JPG, PNG, or PDF format.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <label className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Browse Document</span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: Document uploaded & processed */}
      {uploadedReport && ocrData && !isScanningOcr && (
        <div className="space-y-6">
          {/* File Header Banner */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900">
                    {uploadedReport.fileName}
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-full">
                    {uploadedReport.fileSize}
                  </span>
                  
                </div>
                <div className="text-xs text-slate-600 font-medium flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-slate-800">{ocrData.test_name}</span>
                  
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadedReport(null);
                  setOcrData(null);
                }}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Remove Report</span>
              </button>
            </div>
          </div>

          {/* Dynamic Metadata Strip (Only displays fields that are present) */}
          <div className="flex flex-wrap gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs">
            {ocrData.test_name && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">Document:</span>
                <strong className="text-slate-800">{ocrData.test_name}</strong>
              </div>
            )}

            {ocrData.patient_name && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <User className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">Patient:</span>
                <strong className="text-slate-800">{ocrData.patient_name}</strong>
              </div>
            )}

            {ocrData.patient_dob && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">DOB:</span>
                <strong className="text-slate-800">{ocrData.patient_dob}</strong>
              </div>
            )}

            {ocrData.doctor_name && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">Doctor:</span>
                <strong className="text-slate-800">{ocrData.doctor_name}</strong>
              </div>
            )}

            {ocrData.lab_name && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">Facility:</span>
                <strong className="text-slate-800">{ocrData.lab_name}</strong>
              </div>
            )}

            {ocrData.report_date && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-slate-500 font-medium">Date:</span>
                <strong className="text-slate-800">{ocrData.report_date}</strong>
              </div>
            )}
          </div>

          {/* Model Summary Paragraph */}
          {summaryText && (
            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-teal-950 font-bold">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Extracted Summary</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-normal bg-white/80 p-3 rounded-xl border border-teal-100">
                {summaryText}
              </p>
            </div>
          )}

          {/* 1. Measured Vitals & Lab Biomarkers (Only shown if parameters exist) */}
          {parameters.length > 0 && (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Review of Vitals and Lab Results ({parameters.length})
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("ALL")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filterStatus === "ALL"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    All ({parameters.length})
                  </button>
                  {abnormalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus("ABNORMAL")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterStatus === "ABNORMAL"
                          ? "bg-amber-600 text-white shadow-2xs"
                          : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      <span>Abnormal ({abnormalCount})</span>
                    </button>
                  )}
                  {normalCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterStatus("NORMAL")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        filterStatus === "NORMAL"
                          ? "bg-emerald-700 text-white shadow-2xs"
                          : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      <span>Normal ({normalCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Parameters Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Parameter / Metric</th>
                      <th className="py-2.5 px-4">Extracted Value</th>
                      {parameters.some((p) => p.reference_range) && (
                        <th className="py-2.5 px-4">Standard Reference</th>
                      )}
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredParameters.map((param, idx) => {
                      const isHigh = param.status === "HIGH";
                      const isLow = param.status === "LOW";
                      const isAbnormal = isHigh || isLow;

                      return (
                        <tr
                          key={idx}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            isAbnormal ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {param.name}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-mono font-bold text-slate-900">
                              {param.unit && param.unit !== "Finding" && !String(param.value || "").toLowerCase().includes(param.unit.toLowerCase())
                                ? `${param.value} ${param.unit}`
                                : param.value}
                            </span>
                          </td>
                          {parameters.some((p) => p.reference_range) && (
                            <td className="py-2.5 px-4 text-slate-600">
                              {param.reference_range
                                ? (param.unit && param.unit !== "Finding" && !String(param.reference_range || "").toLowerCase().includes(param.unit.toLowerCase())
                                    ? `${param.reference_range} ${param.unit}`
                                    : param.reference_range)
                                : "-"}
                            </td>
                          )}
                          <td className="py-2.5 px-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
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
                              <span>{param.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Dynamic Sections (Medical Issues, Treatments, Lifestyle Advice, etc.) */}
          {sections.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((section, sIdx) => {
                // If section is vitals and we already showed the table, don't duplicate
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

          {/* 3. Raw Model Extraction Toggle */}
          {ocrData.raw_model_output && (
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
                    {ocrData.raw_model_output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Symptoms</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            disabled={isScanningOcr || isGeneratingQuestions}
            className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {isGeneratingQuestions ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Follow-Up Questions...</span>
              </>
            ) : uploadedReport ? (
              <>
                <span>Correlate &amp; Continue to Questions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Skip Report &amp; Continue to Questions</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
