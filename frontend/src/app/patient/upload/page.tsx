"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Activity,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  FolderOpen,
  ChevronRight,
  Lock,
  Search,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCheck,
  AlertTriangle,
  X,
  Stethoscope,
  HeartPulse,
  Database,
  ExternalLink,
  HelpCircle,
  Lightbulb,
  Droplet,
  Heart,
  Calendar,
  Download,
  Info
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface AnalyteParameter {
  name: string;
  value: string | number;
  unit: string;
  reference_range: string;
  status: "HIGH" | "LOW" | "NORMAL" | "BORDERLINE";
  alert_level?: string;
  clinical_significance?: string;
}

interface AbnormalFinding {
  parameter: string;
  value: string;
  status: string;
  meaning: string;
  action: string;
  reference_range?: string;
}

interface SummaryDetails {
  overview?: string;
  health_status?: "Normal" | "Needs Attention" | "Action Required";
  urgency?: string;
  abnormal_findings?: AbnormalFinding[];
  normal_findings?: string[];
  what_to_ask_doctor?: string[];
  lifestyle_tips?: string[];
  clinical_flags?: string[];
}

interface StoredReport {
  id: string;
  patient_id?: string;
  report_type: string;
  file_url: string;
  file_type?: string;
  report_summary?: any;
  created_at: string;
  // Optional convenience fields for display
  file_name?: string;
  file_size?: string;
  lab_name?: string;
  test_date?: string;
  patient_summary?: string;
  summary_details?: SummaryDetails;
  ocr_extracted_metrics?: any;
  uploaded_at?: string;
  status?: string;
}

// Helper to determine LOINC code and SNOMED concept
function getLoincSnomed(analyteName: string): { loinc: string; snomed: string } {
  const name = analyteName.toLowerCase();
  if (name.includes("hemoglobin") || name.includes("hb")) return { loinc: "718-7", snomed: "259595007" };
  if (name.includes("wbc") || name.includes("leukocyte") || name.includes("tlc")) return { loinc: "6690-2", snomed: "767002" };
  if (name.includes("platelet")) return { loinc: "777-3", snomed: "6690-2" };
  if (name.includes("cholesterol")) return { loinc: "2093-3", snomed: "259648008" };
  if (name.includes("triglyceride")) return { loinc: "2571-8", snomed: "14749-6" };
  if (name.includes("hdl")) return { loinc: "2085-9", snomed: "28036006" };
  if (name.includes("ldl")) return { loinc: "13457-7", snomed: "166832000" };
  if (name.includes("glucose") || name.includes("sugar") || name.includes("rbs")) return { loinc: "1558-6", snomed: "33747003" };
  if (name.includes("hba1c")) return { loinc: "4548-4", snomed: "43396009" };
  if (name.includes("bilirubin")) return { loinc: "1975-2", snomed: "302787001" };
  if (name.includes("creatinine")) return { loinc: "2160-0", snomed: "70901006" };
  if (name.includes("urea")) return { loinc: "3094-0", snomed: "271297003" };
  if (name.includes("sgpt") || name.includes("alt")) return { loinc: "1742-6", snomed: "274332005" };
  if (name.includes("sgot") || name.includes("ast")) return { loinc: "1920-8", snomed: "274333000" };
  return { loinc: "34565-2", snomed: "166312007" };
}

export default function PatientUploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Active processed report
  const [activeReport, setActiveReport] = useState<StoredReport | null>(null);

  // Patient's saved reports list
  const [reportsHistory, setReportsHistory] = useState<StoredReport[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);

  // Fetch reports on mount
  const fetchReports = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch("/api/patient/reports");
      if (res.ok) {
        const json = await res.json();
        if (json.reports) {
          setReportsHistory(json.reports);
        }
      }
    } catch (e) {
      console.error("Failed to load reports history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Upload handler via Next.js API (stores in Supabase storage & DB)
  const processUploadedFile = async (file: File) => {
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_name", file.name);
      formData.append("patient_id", user?.id || "");
      formData.append("report_type", file.name.replace(/\.[^/.]+$/, ""));

      const res = await fetch("/api/patient/reports", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const newReport: StoredReport = {
            id: json.data.id,
            patient_id: json.data.patient_id,
            report_type: json.data.report_type,
            file_url: json.data.file_url,
            file_type: json.data.file_type,
            report_summary: json.data.report_summary,
            created_at: json.data.created_at || new Date().toISOString(),
          };
          setActiveReport(newReport);
          setReportsHistory((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
        }
      }
    } catch (e) {
      console.error("Upload error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // Sample report loader for quick testing
  const handleLoadSample = async (testType: string, fileName: string) => {
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file_name", fileName);
      formData.append("report_type", testType);
      formData.append("patient_id", user?.id || "");

      const res = await fetch("/api/patient/reports", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const newReport: StoredReport = {
            id: json.data.id,
            patient_id: json.data.patient_id,
            report_type: json.data.report_type,
            file_url: json.data.file_url,
            file_type: json.data.file_type,
            report_summary: json.data.report_summary,
            created_at: json.data.created_at || new Date().toISOString(),
          };
          setActiveReport(newReport);
          setReportsHistory((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
        }
      }
    } catch (e) {
      console.error("Sample report error:", e);
    } finally {
      setIsScanning(false);
    }
  };

  // Extract parameters and summary from active report
  const summary: SummaryDetails = activeReport?.report_summary || activeReport?.summary_details || {};
  const patientSummaryText = summary?.overview || activeReport?.patient_summary || "";
  const reportFileName = summary?.abnormal_findings?.[0]?.parameter ? (summary as any)?.file_name || activeReport?.file_name || activeReport?.report_type : activeReport?.file_name || activeReport?.report_type || "Medical Report";
  const reportFileSize = (summary as any)?.file_size || activeReport?.file_size || "1.5 MB";
  const reportLabName = (summary as any)?.lab_name || activeReport?.lab_name || "District Hospital Pathology";
  const reportTestDate = (summary as any)?.test_date || activeReport?.test_date || (activeReport?.created_at ? new Date(activeReport.created_at).toLocaleDateString() : "Today");
  const parameters: AnalyteParameter[] = (summary as any)?.parameters || activeReport?.ocr_extracted_metrics?.parameters || [];
  const abnormalFindings: AbnormalFinding[] = summary?.abnormal_findings || [];
  const normalFindings: string[] = summary?.normal_findings || [];
  const healthStatus = summary?.health_status || "Needs Attention";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="locker">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processUploadedFile(file);
        }}
      />

      {/* Header Banner */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-700" />
          <span>Patient Medical Report Decoder &amp; Cloud Storage</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Upload Reports &amp; View Simplified Summary
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Upload your blood tests, pathology slips, or diagnostic reports. Our AI reads the medical jargon and explains your results in clear, everyday words so you understand your health.
        </p>
      </div>

      {/* 1. UPLOAD DROPZONE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) processUploadedFile(file);
          }}
          className="border-2 border-dashed border-teal-300 bg-teal-50/20 hover:bg-teal-50/40 rounded-2xl p-7 sm:p-9 text-center space-y-4 transition-colors"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className="w-7 h-7 text-teal-700" />
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Drag &amp; drop your medical report here, or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-teal-800 underline font-bold cursor-pointer hover:text-teal-900"
              >
                Browse Files
              </button>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Accepted: PDF, JPG, PNG photos from your phone or lab. Automatically stored in Supabase Storage.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo of Report</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-teal-700" />
              <span>Choose File from Device</span>
            </button>
          </div>

          {/* Quick Sample Loaders */}
          <div className="pt-2 border-t border-teal-100/80 flex items-center justify-center gap-2 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">Or try sample report:</span>
            <button
              type="button"
              onClick={() => handleLoadSample("Complete Blood Count (CBC)", "CBC_Blood_Test_Report.pdf")}
              className="px-2.5 py-1 bg-teal-100/70 hover:bg-teal-200/80 text-teal-900 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              CBC Blood Test
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("Lipid Profile & Heart Biomarkers", "Lipid_Profile_Report.pdf")}
              className="px-2.5 py-1 bg-teal-100/70 hover:bg-teal-200/80 text-teal-900 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              Lipid (Cholesterol)
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("Glycemic Assessment & Diabetes", "Diabetes_Panel_Report.pdf")}
              className="px-2.5 py-1 bg-teal-100/70 hover:bg-teal-200/80 text-teal-900 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
            >
              Blood Sugar / Diabetes
            </button>
          </div>

          <div className="pt-1 text-[11px] text-slate-400 flex items-center justify-center gap-2 flex-wrap">
            <Lock className="w-3 h-3 text-teal-700" />
            <span>256-bit AES Encryption</span>
            <span>&bull;</span>
            <span>Supabase Cloud Storage</span>
            <span>&bull;</span>
            <span>Private &amp; Confidential</span>
          </div>
        </div>
      </div>

      {/* 2. SCANNING ANIMATION STATE */}
      {isScanning && (
        <div className="bg-white rounded-3xl border border-teal-200/90 p-10 shadow-xs text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
            <RefreshCw className="w-7 h-7 text-teal-700 animate-spin" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              Saving to Cloud &amp; Analyzing Report...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Uploading file to Supabase storage, scanning test biomarkers, and writing a plain-language summary for you.
            </p>
          </div>
          <div className="w-64 mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-teal-700 rounded-full animate-pulse" style={{ width: "85%" }} />
          </div>
        </div>
      )}

      {/* 3. ACTIVE REPORT ANALYSIS & SUMMARY SECTION */}
      {!isScanning && activeReport && (
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
                onClick={() => setActiveReport(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
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
      )}

      {/* 4. PATIENT'S STORED REPORTS & LAB HISTORY */}
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
            onClick={fetchReports}
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
                    onClick={() => {
                      setActiveReport(report);
                      window.scrollTo({ top: 200, behavior: "smooth" });
                    }}
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
    </div>
  );
}
