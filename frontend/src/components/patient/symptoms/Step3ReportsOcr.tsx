"use client";

import React from "react";
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
  AlertTriangle,
} from "lucide-react";

export interface OcrParameter {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: string;
}

export interface OcrMissingInformation {
  id: string;
  question: string;
  options: string[];
}

export interface OcrData {
  lab_name: string;
  test_name: string;
  report_date: string;
  parameters: OcrParameter[];
  clinical_flags?: string[];
  missing_information?: OcrMissingInformation[];
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
  reportInquiryAnswers: Record<string, string>;
  setReportInquiryAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoadSample: (testType: string, filename: string) => void;
  onBack: () => void;
  onContinue: () => void;
  onSaveDraft: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
}

export function Step3ReportsOcr({
  isScanningOcr,
  extractedSymptoms,
  symptomText,
  uploadedReport,
  setUploadedReport,
  ocrData,
  setOcrData,
  reportInquiryAnswers,
  setReportInquiryAnswers,
  handleFileUpload,
  handleLoadSample,
  onBack,
  onContinue,
  onSaveDraft,
  isSavingDraft,
  isSubmitting,
}: Step3ReportsOcrProps) {
  // Helper to verify if an OCR inquiry question has been answered
  const isInquiryAnswered = (inqId: string): boolean => {
    const ans = (reportInquiryAnswers[inqId] || "").trim();
    if (!ans) return false;
    if (ans === "Other" || ans === "Other:" || ans === "Other (Please specify)" || ans === "Other: ") {
      return false;
    }
    if (ans.startsWith("Other:") && !ans.replace(/^Other:\s*/, "").trim()) {
      return false;
    }
    return true;
  };

  const allInquiriesAnswered =
    !ocrData?.missing_information ||
    ocrData.missing_information.length === 0 ||
    ocrData.missing_information.every((inq) => isInquiryAnswered(inq.id));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
          Medical Reports &amp; Laboratory OCR (Optional)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload blood tests, prescriptions, or imaging reports. Questions are generated dynamically by correlating your report with previous symptoms following eSanjeevani teleconsultation standards.
        </p>
      </div>

      {/* Scanning in progress loader */}
      {isScanningOcr && (
        <div className="p-8 bg-teal-50/60 border border-teal-200 rounded-2xl text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-full bg-teal-800 text-white flex items-center justify-center mx-auto shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-teal-950">
              Scanning Document &amp; Correlating with Clinical History...
            </h4>
            <p className="text-xs text-teal-700 mt-0.5">
              Cross-referencing report markers with {extractedSymptoms.length > 0 ? extractedSymptoms.join(", ") : "your symptoms"} and previous responses.
            </p>
          </div>
        </div>
      )}

      {/* STATE 1: No report uploaded yet (initial state) */}
      {!uploadedReport && !isScanningOcr && (
        <div className="space-y-6">
          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-700 bg-slate-50/70 rounded-2xl p-7 text-center space-y-3 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center mx-auto shadow-2xs">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <div className="text-sm sm:text-base text-slate-900 font-extrabold">
                Drop your medical document here or browse
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Upload lab reports (CBC, LFT, Blood Sugar, KFT, Urinalysis, Prescriptions) in PDF, JPG, or PNG.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <label className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95">
                <Upload className="w-4 h-4" />
                <span>Browse &amp; Upload Document</span>
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
          {/* Verified File Header */}
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">
                    {uploadedReport.fileName}
                  </span>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-full">
                    {uploadedReport.fileSize}
                  </span>
                </div>
                <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{uploadedReport.status}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUploadedReport(null);
                  setOcrData(null);
                  setReportInquiryAnswers({});
                }}
                className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Change / Remove Report</span>
              </button>
            </div>
          </div>

          {/* Structured Laboratory Findings */}
          <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {ocrData.lab_name}
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                  {ocrData.test_name}
                </h3>
              </div>
              <span className="text-xs font-mono text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 self-start sm:self-auto font-bold">
                Report Date: {ocrData.report_date}
              </span>
            </div>

            {/* Parameters Table */}
            <div className="divide-y divide-slate-100 text-xs">
              {ocrData.parameters.map((param, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2.5 hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-800">{param.name}</span>
                    <div className="text-[11px] text-slate-500">
                      Reference: {param.reference_range} {param.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-slate-900 font-extrabold text-xs sm:text-sm">
                      {param.value} {param.unit}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        param.status === "HIGH"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : param.status === "LOW"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {param.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Clinical Correlation Findings */}
            {ocrData.clinical_flags && ocrData.clinical_flags.length > 0 && (
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>AI Clinical Correlation:</span>
                </div>
                {ocrData.clinical_flags.map((flag, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">&bull;</span>
                    <span className="leading-relaxed">{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* eSanjeevani Teleconsultation Dynamic Follow-up Inquiries */}
          {ocrData.missing_information && ocrData.missing_information.length > 0 && (
            <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    eSanjeevani / MoHFW Protocol
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    &bull; Dynamic Tele-Triage Inquiries
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                  Questions About Your Medical Report
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Please answer these simple questions about your test report and symptoms:
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {ocrData.missing_information.map((inq, inqIdx) => {
                  const currentAns = (reportInquiryAnswers[inq.id] || "").trim();
                  const isOtherSelected =
                    currentAns === "Other" ||
                    currentAns === "Other (Please specify)" ||
                    currentAns.startsWith("Other:");
                  const otherCustomText = isOtherSelected ? currentAns.replace(/^Other:\s*/, "") : "";
                  const answered = isInquiryAnswered(inq.id);

                  return (
                    <div
                      key={inq.id}
                      className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-teal-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {inqIdx + 1}
                        </span>
                        <label className="text-slate-900 font-bold block leading-relaxed text-xs sm:text-sm">
                          {inq.question}
                        </label>
                      </div>

                      <div className="space-y-2 pl-7">
                        {inq.options.map((opt) => {
                          const isChecked = reportInquiryAnswers[inq.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setReportInquiryAnswers({
                                  ...reportInquiryAnswers,
                                  [inq.id]: opt
                                })
                              }
                              className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                                  : "bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/70"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? "border-teal-700 bg-teal-700 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-xs">{opt}</span>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                  Selected
                                </span>
                              )}
                            </button>
                          );
                        })}

                        {/* Other Option with Custom Text Input */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (!isOtherSelected) {
                                setReportInquiryAnswers({
                                  ...reportInquiryAnswers,
                                  [inq.id]: "Other: "
                                });
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isOtherSelected
                                ? "bg-teal-50/80 border-teal-600 text-teal-950 font-bold shadow-2xs ring-1 ring-teal-500"
                                : "bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-100/70"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isOtherSelected
                                    ? "border-teal-700 bg-teal-700 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isOtherSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className="text-xs font-semibold">
                                Other (Type your own answer)
                              </span>
                            </div>
                            {isOtherSelected && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                                Selected
                              </span>
                            )}
                          </button>

                          {isOtherSelected && (
                            <div className="mt-2 p-3 bg-slate-100/80 rounded-xl border border-teal-300/80 space-y-1.5 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-teal-900 block">
                                Type your answer here in simple words:
                              </label>
                              <input
                                type="text"
                                autoFocus
                                value={otherCustomText}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReportInquiryAnswers({
                                    ...reportInquiryAnswers,
                                    [inq.id]: val.trim() ? `Other: ${val}` : "Other: "
                                  });
                                }}
                                placeholder="Type your answer here..."
                                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
                              />
                              {!otherCustomText.trim() && (
                                <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1 pt-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Please type your answer in the box above to continue.</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {!answered && (
                        <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] font-semibold mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Please pick or type an answer for question #{inqIdx + 1}.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning banner if report inquiries are not answered */}
      {!allInquiriesAnswered && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Please answer all the report questions above before going to the next step.
          </span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
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
            onClick={() => {
              if (allInquiriesAnswered) {
                onContinue();
              }
            }}
            disabled={!allInquiriesAnswered}
            className={`px-6 py-2.5 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all ${
              allInquiriesAnswered
                ? "bg-teal-800 hover:bg-teal-900 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60"
            }`}
          >
            <span>Continue to Address</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
