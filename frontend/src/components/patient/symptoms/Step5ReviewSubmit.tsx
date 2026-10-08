"use client";

import React from "react";
import {
  ArrowLeft,
  FileText,
  Send,
} from "lucide-react";
import { FamilyDependent } from "@/lib/auth-context";
import { FollowUpQuestion } from "./Step2ClinicalDetails";
import { OcrData, UploadedReportInfo } from "./Step3ReportsOcr";

export interface Step5ReviewSubmitProps {
  effectivePatientName: string;
  selectedDependent: FamilyDependent | null;
  effectiveRelation: string;
  effectivePatientAge: number | string;
  effectivePatientGender: string;
  selectedLanguage: string;
  presentState: string;
  presentDistrict: string;
  presentBlock: string;
  selectedFacilityName: string;
  isOnlineTeleconsult: boolean;
  extractedSymptoms: string[];
  followUpAnswers: Record<string, string>;
  followUpQuestions: FollowUpQuestion[];
  uploadedReport: UploadedReportInfo | null;
  ocrData: OcrData | null;
  consentChecked: boolean;
  setConsentChecked: (checked: boolean) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSubmitCase: () => void;
  isSavingDraft: boolean;
  isSubmitting: boolean;
}

export function Step5ReviewSubmit({
  effectivePatientName,
  selectedDependent,
  effectiveRelation,
  effectivePatientAge,
  effectivePatientGender,
  selectedLanguage,
  presentState,
  presentDistrict,
  presentBlock,
  selectedFacilityName,
  isOnlineTeleconsult,
  extractedSymptoms,
  followUpAnswers,
  followUpQuestions,
  uploadedReport,
  ocrData,
  consentChecked,
  setConsentChecked,
  onBack,
  onSaveDraft,
  onSubmitCase,
  isSavingDraft,
  isSubmitting,
}: Step5ReviewSubmitProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Review Before Submission
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirm all patient information, symptoms, report findings, and routing details before dispatching.
          </p>
        </div>
        <span className="text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full self-start sm:self-auto">
          Final Clinical Review
        </span>
      </div>

      {/* Review Card Breakdown */}
      <div className="space-y-4">
        {/* 1. Patient & Location */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
            Patient &amp; Routing Details
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-800">
            <div>
              Patient Name: <strong className="text-slate-900">{effectivePatientName}</strong>{" "}
              {selectedDependent ? (
                <span className="text-teal-800 font-bold bg-teal-100/70 border border-teal-200 px-1.5 py-0.5 rounded text-[10px]">
                  {effectiveRelation}
                </span>
              ) : (
                <span className="text-slate-500 font-semibold text-[11px]">(Self)</span>
              )}
            </div>
            <div>
              Age / Gender:{" "}
              <span className="text-slate-900 font-semibold">
                {effectivePatientAge} yrs &bull; {effectivePatientGender}
              </span>
            </div>
            <div>
              Language: <span className="text-slate-900 font-semibold">{selectedLanguage}</span>
            </div>
            <div>
              Location:{" "}
              <strong className="text-slate-900">
                {[presentBlock, presentDistrict, presentState].filter(Boolean).join(", ") || "Not Specified"}
              </strong>
            </div>
            <div>
              Assigned Facility:{" "}
              <strong className="text-teal-800">
                {selectedFacilityName || "Not Selected"}
              </strong>
            </div>
            <div>
              Online Teleconsult:{" "}
              <strong className={isOnlineTeleconsult ? "text-teal-800" : "text-slate-900"}>
                {isOnlineTeleconsult ? "Yes (Audio/Video Call)" : "No (In-Person OPD Visit)"}
              </strong>
            </div>
          </div>
        </div>

        {/* 2. Extracted Symptoms & Follow-up Responses */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
            Reported Symptoms &amp; Answers
          </span>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {extractedSymptoms.map((s, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 shadow-2xs"
              >
                &bull; {s}
              </span>
            ))}
          </div>

          <div className="pt-2 space-y-1.5 border-t border-slate-200/80">
            {Object.entries(followUpAnswers).map(([k, v]) => (
              <div key={k} className="text-slate-700">
                <span className="font-semibold text-slate-900">
                  {followUpQuestions.find((q) => q.id === k)?.question || k}:
                </span>{" "}
                <strong className="text-teal-900">{v}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Medical Reports & Findings */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider block">
            Attached Laboratory Reports
          </span>
          {uploadedReport && ocrData ? (
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900">
                ✓ {uploadedReport.fileName} ({ocrData.test_name})
              </div>
              <div className="text-slate-600 flex flex-wrap gap-2 pt-0.5">
                {ocrData.parameters.map((p, idx) => (
                  <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                    {p.name}: <strong>{p.value} {p.unit}</strong> ({p.status})
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-slate-500">No medical documents attached.</div>
          )}
        </div>

        {/* Consent Checkbox */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 hover:text-slate-900 leading-relaxed">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 text-teal-700 focus:ring-0 rounded border-slate-300 cursor-pointer"
            />
            <span>
              I agree to share my health details and symptoms with the clinic doctors and medical staff so they can help me.
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Address</span>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-5 py-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>
              {isSavingDraft ? "Saving Draft..." : "Save to Draft"}
            </span>
          </button>

          <button
            type="button"
            onClick={onSubmitCase}
            disabled={!consentChecked || isSubmitting || isSavingDraft}
            className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <span>
              {isSubmitting
                ? "Saving to Supabase Database..."
                : "Submit Case"}
            </span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
