"use client";

import React from "react";
import { UploadCloud, FileText, Sparkles, Loader2 } from "lucide-react";

interface Step4DocumentsClinicalProps {
  reports: { name: string; size: string; time: string }[];
  setReports: React.Dispatch<React.SetStateAction<{ name: string; size: string; time: string }[]>>;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step4DocumentsClinical({
  reports,
  setReports,
  isSubmitting,
  onBack,
  onSubmit,
}: Step4DocumentsClinicalProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          4. Upload medical reports (optional)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Add relevant documents with the patient&apos;s permission (CBC reports, prescriptions, past discharge summaries).
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer">
        <UploadCloud className="w-10 h-10 text-teal-600 mx-auto" />
        <div className="mt-2 text-xs font-bold text-slate-800">
          Drag & drop report files, or browse local disk
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Supports JPEG, PNG, PDF (up to 15MB)
        </p>
        <button
          type="button"
          onClick={() => {
            setReports((prev) => [
              ...prev,
              { name: `lab_scan_${Date.now().toString().slice(-4)}.pdf`, size: "1.8 MB", time: "Just now" },
            ]);
          }}
          className="mt-3 px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-600 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs transition-colors"
        >
          + Add Sample Test Report
        </button>
      </div>

      {/* Uploaded Reports List */}
      {reports.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700">
            Attached Documents ({reports.length})
          </span>
          {reports.map((r, idx) => (
            <div
              key={idx}
              className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {r.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {r.size} &bull; Uploaded {r.time}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                OCR Ready
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
              <span>Registering Patient & Generating Case...</span>
            </>
          ) : (
            <>
              <span>Generate Health Case</span>
              <Sparkles className="w-4 h-4 text-teal-200" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
