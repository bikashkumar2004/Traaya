"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { CaseDetails } from "../CaseReviewWorkspace";

interface CaseMissingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: CaseDetails;
}

export function CaseMissingDetailsModal({
  isOpen,
  onClose,
  caseData,
}: CaseMissingDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Missing Patient Intake Information</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 text-xs text-slate-700">
          <p>The following clinical data points were not captured during intake:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-800">
            {caseData.missingDetails && caseData.missingDetails.length > 0 ? (
              caseData.missingDetails.map((item, idx) => (
                <li key={idx} className="font-medium">
                  {item}
                </li>
              ))
            ) : (
              <li className="italic text-slate-500">No missing details identified</li>
            )}
          </ul>
        </div>
        <div className="text-right pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}
