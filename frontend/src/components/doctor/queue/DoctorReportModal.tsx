"use client";

import React from "react";
import { FileText, X } from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCase: CaseDetails;
}

export function DoctorReportModal({ isOpen, onClose, selectedCase }: DoctorReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>{selectedCase.reports[0] || "Diagnostic Report"}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-3">
          <FileText className="w-10 h-10 text-teal-700 mx-auto opacity-80" />
          <div className="text-center">
            <div className="font-bold text-slate-800 text-sm">
              {selectedCase.reports[0] || "Diagnostic Report"}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Attached to case {selectedCase.id} &bull; {selectedCase.submittedTime ? `Submitted ${selectedCase.submittedTime}` : "Uploaded by patient"}
            </div>
          </div>
          {selectedCase.aiReportAnalysis && selectedCase.aiReportAnalysis.length > 0 && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 text-left space-y-1">
              <div className="font-bold text-slate-700 text-[11px]">Analysis &amp; Findings:</div>
              {selectedCase.aiReportAnalysis.map((item, idx) => (
                <div key={idx} className="text-[11px] text-slate-600">&bull; {item}</div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          {selectedCase.uploadedReportUrl ? (
            <a
              href={selectedCase.uploadedReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl"
            >
              Download / View File
            </a>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
