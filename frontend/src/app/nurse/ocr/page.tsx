"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { TrustBadge } from "@/components/common/TrustBadge";
import { 
  FileText, 
  Scan, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

interface LabParameter {
  name: string;
  value: number | string;
  unit: string;
  reference_range: string;
  status: "NORMAL" | "LOW" | "HIGH" | "BORDERLINE";
  alert_level: "Routine" | "Priority" | "Urgent";
  clinical_significance: string;
}

interface ExtractedReport {
  test_name: string;
  lab_name: string;
  report_date: string;
  parameters: LabParameter[];
  ai_summary: string;
  overall_urgency: "Routine" | "Priority" | "Urgent";
}

export default function NurseOCRExtractionPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState("Complete Blood Count (CBC)");
  const [loading, setLoading] = useState(false);
  const [extractedReport, setExtractedReport] = useState<ExtractedReport | null>({
    test_name: "Complete Blood Count (CBC)",
    lab_name: "District Hospital Diagnostics & Pathology",
    report_date: "2026-09-14",
    overall_urgency: "Urgent",
    ai_summary: "Findings reveal Moderate Anemia (8.4 g/dL), Leukocytosis (14,200), and Thrombocytopenia (95,000). Highly suggestive of acute vector-borne infection. Doctor review recommended.",
    parameters: [
      {
        name: "Hemoglobin (Hb)",
        value: 8.4,
        unit: "g/dL",
        reference_range: "12.0 - 15.5",
        status: "LOW",
        alert_level: "Priority",
        clinical_significance: "Moderate Microcytic Anemia. Recommend PHC Iron-Folic Acid protocol."
      },
      {
        name: "Total Leukocyte Count (WBC)",
        value: 14200,
        unit: "cells/cu.mm",
        reference_range: "4000 - 11000",
        status: "HIGH",
        alert_level: "Priority",
        clinical_significance: "Leukocytosis indicative of acute bacterial or severe inflammatory process."
      },
      {
        name: "Platelet Count",
        value: 95000,
        unit: "/cu.mm",
        reference_range: "150000 - 450000",
        status: "LOW",
        alert_level: "Urgent",
        clinical_significance: "Thrombocytopenia. Correlate with Dengue NS1/IgM antigen and monitor petechiae."
      },
      {
        name: "Erythrocyte Sedimentation Rate (ESR)",
        value: 38,
        unit: "mm/1st hr",
        reference_range: "0 - 20",
        status: "HIGH",
        alert_level: "Routine",
        clinical_significance: "Elevated inflammatory marker."
      }
    ]
  });

  const handleScanReport = async (selectedType: string) => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/ocr/extract-sample`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: selectedType,
          patient_name: "Aarav Sharma"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setExtractedReport(data.report);
      } else {
        throw new Error("OCR extraction endpoint failed");
      }
    } catch {
      // Fallback data
      if (selectedType.includes("Glucose")) {
        setExtractedReport({
          test_name: "Random Blood Glucose & HbA1c",
          lab_name: "Point-of-Care Clinic",
          report_date: "2026-09-14",
          overall_urgency: "Urgent",
          ai_summary: "Marked hyperglycemia with RBS 268 mg/dL. Requires urgent physician insulin adjustment.",
          parameters: [
            {
              name: "Random Blood Sugar (RBS)",
              value: 268,
              unit: "mg/dL",
              reference_range: "70 - 140",
              status: "HIGH",
              alert_level: "Urgent",
              clinical_significance: "Uncontrolled hyperglycemia."
            }
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
          Screen e4e934 &bull; Optical Character Recognition &amp; Diagnostic Parser
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          OCR Report Scanner &amp; Laboratory Extractions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Digitize printed diagnostic reports into structured physiological parameters with automated abnormal range flags.
        </p>
      </div>

      {/* Control Bar: Select or Upload */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Select Diagnostic Report Sample</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {["Complete Blood Count (CBC)", "Random Blood Glucose", "Renal Function"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setReportType(type);
                    handleScanReport(type);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    reportType === type
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => handleScanReport(reportType)}
          disabled={loading}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors self-end sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Parsing Optical Layout..." : "Re-Scan Report"}</span>
        </button>
      </div>

      {/* Extracted Lab Findings */}
      {extractedReport && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
          {/* Summary Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{extractedReport.test_name}</h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {extractedReport.report_date}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Facility: {extractedReport.lab_name} &bull; Processed by TRAAYA Vision Parser
              </p>
            </div>

            <UrgencyBadge urgency={extractedReport.overall_urgency} size="lg" />
          </div>

          {/* AI Clinical Summary */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block mb-1">
                Automated Clinical Pathology Synthesis
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {extractedReport.ai_summary}
              </p>
            </div>
          </div>

          {/* Parameters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Analyte / Parameter</th>
                  <th className="py-3 px-4">Observed Value</th>
                  <th className="py-3 px-4">Biological Reference Range</th>
                  <th className="py-3 px-4">Status Flag</th>
                  <th className="py-3 px-4">Clinical Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {extractedReport.parameters.map((param, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {param.name}
                    </td>

                    <td className="py-3.5 px-4 tabular-nums font-extrabold text-slate-900">
                      {param.value} <span className="text-[11px] font-normal text-slate-500">{param.unit}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {param.reference_range} {param.unit}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          param.status === "LOW"
                            ? "bg-rose-100 text-rose-800"
                            : param.status === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {param.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {param.clinical_significance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TrustBadge
            verified={false}
            canVerify={false}
          />
        </div>
      )}
    </div>
  );
}
