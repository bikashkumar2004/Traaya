"use client";

import React from "react";
import {
  User,
  Edit2,
  Calendar,
  Check,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { CaseDetails } from "../CaseReviewWorkspace";

interface CaseOverviewTabProps {
  caseData: CaseDetails;
  setActiveTab: (tab: string) => void;
  setReportModalOpen: (open: boolean) => void;
  setMissingModalOpen: (open: boolean) => void;
}

export function CaseOverviewTab({
  caseData,
  setActiveTab,
  setReportModalOpen,
  setMissingModalOpen,
}: CaseOverviewTabProps) {
  return (
    <>
      {/* Patient Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-slate-900">
              Patient Overview
            </h2>
          </div>
          <button
            type="button"
            onClick={() => alert("Nurse edit mode for patient record")}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Left Specs */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Name</span>
              <span className="font-semibold text-slate-800">
                {caseData.name}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Age / Gender</span>
              <span className="font-semibold text-slate-800">
                {caseData.age} / {caseData.gender}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Phone</span>
              <span className="font-semibold text-slate-800">
                {caseData.phone}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Location</span>
              <span className="font-semibold text-slate-800">
                {caseData.location}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Language</span>
              <span className="font-semibold text-slate-800">
                {caseData.language}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Consent</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {caseData.consent}
              </span>
            </div>
            {caseData.scheduleTime && (
              <div className="flex justify-between py-1 border-t border-slate-100 pt-1.5">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled:
                </span>
                <span className="font-bold text-emerald-900">
                  {new Date(caseData.scheduleTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            )}
          </div>

          {/* Right Quick Notes Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Quick Notes
              </span>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                {caseData.quickNotes}
              </p>
              {caseData.revertedQuestions && caseData.revertedQuestions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-amber-900 bg-amber-50/80 p-2.5 rounded-lg text-[11px] space-y-1.5">
                  <strong className="block text-[10px] uppercase font-bold text-amber-800">
                    Reverted Questions ({caseData.revertedQuestions.length}):
                  </strong>
                  <div className="space-y-1">
                    {caseData.revertedQuestions.map((q, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-md border border-amber-200/80 text-xs">
                        <div className="font-semibold text-slate-800">Q{idx + 1}: {q.question}</div>
                        {q.answer ? (
                          <div className="text-emerald-700 font-bold mt-1 text-[11px] flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Answer: {q.answer}</span>
                          </div>
                        ) : (
                          <div className="text-amber-700 italic mt-0.5 text-[10px]">
                            Awaiting patient reply...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-[10px] text-teal-700 font-medium pt-2">
              Verified by triage reception
            </div>
          </div>
        </div>
      </div>

      {/* Chief Complaint Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
          <FileText className="w-4 h-4 text-teal-700" />
          <span>Chief Complaint</span>
        </div>
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs font-medium text-slate-800 italic leading-relaxed">
          &ldquo;{caseData.chiefComplaint}&rdquo;
        </div>
      </div>

      {/* AI Extracted Key Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI Extracted Key Information</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("AI Summary")}
            className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View details</span>
            <span>&rarr;</span>
          </button>
        </div>

        <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Symptoms:</strong>{" "}
              {caseData.aiInfo.symptoms.join(", ")}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Duration:</strong>{" "}
              {caseData.aiInfo.duration}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Severity:</strong>{" "}
              {caseData.aiInfo.severity}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Associated:</strong>{" "}
              {caseData.aiInfo.associated}
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <div>
              <strong className="text-slate-900 font-semibold">Red flags:</strong>{" "}
              <span className="text-emerald-700 font-medium">
                {caseData.aiInfo.redFlags}
              </span>
            </div>
          </li>
        </ul>
      </div>

      {/* Missing Details Warning Banner (Only show if missing details exist) */}
      {caseData.missingDetails && caseData.missingDetails.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Some important details are missing:</span>{" "}
              {caseData.missingDetails.join(", ")}.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMissingModalOpen(true)}
            className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs rounded-xl shadow-2xs shrink-0 transition-colors cursor-pointer"
          >
            View missing details
          </button>
        </div>
      )}

      {/* Medical Reports & AI Analysis Side-by-Side Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Reports Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Medical Reports ({caseData.reports.length})</span>
          </div>

          {caseData.reports.length === 0 ? (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center gap-2.5 text-slate-500">
              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-600">No medical reports attached</div>
                <div className="text-[10px] text-slate-400">Patient did not upload any external lab/diagnostic documents</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {caseData.reports.map((repName, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate" title={repName}>
                        {repName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {caseData.submittedTime ? `Submitted ${caseData.submittedTime}` : "Uploaded with intake"}
                      </div>
                    </div>
                  </div>
                  {caseData.uploadedReportUrl ? (
                    <a
                      href={caseData.uploadedReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors shrink-0"
                    >
                      View
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(true)}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      View
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Report Analysis Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-900 text-sm font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>AI Report Analysis</span>
            </div>
          </div>

          {caseData.aiReportAnalysis && caseData.aiReportAnalysis.length > 0 ? (
            <>
              <ul className="space-y-1 text-xs text-slate-700">
                {caseData.aiReportAnalysis.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span className="text-[11px] leading-tight">{item}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setActiveTab("Medical Reports")}
                className="text-[11px] font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer pt-1"
              >
                <span>View full analysis</span>
                <span>&rarr;</span>
              </button>
            </>
          ) : (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              <div className="font-medium text-slate-600">No lab reports attached</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Automated OCR and lab panel parsing will activate when documents are uploaded.</div>
            </div>
          )}
        </div>
      </div>

      {/* Current Triage Status & Assigned Facility Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Triage Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
            <HeartPulse className="w-4 h-4 text-rose-600" />
            <span>Current Triage Status (AI Suggestion)</span>
          </div>
          <div>
            {(() => {
              const p = (caseData.aiSuggestion?.priority || caseData.urgency || "Yellow").toLowerCase();
              const isRed = p.includes("red") || p.includes("immediate");
              const isGreen = p.includes("green") || p.includes("less urgent") || p.includes("routine");
              const badgeClass = isRed
                ? "bg-rose-100 text-rose-900 border-rose-300"
                : isGreen
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : "bg-amber-100 text-amber-900 border-amber-300";
              const Icon = isRed ? ShieldAlert : isGreen ? CheckCircle2 : AlertTriangle;
              const iconColor = isRed ? "text-rose-700" : isGreen ? "text-emerald-700" : "text-amber-700";

              return (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold border ${badgeClass}`}>
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                  <span>{caseData.aiSuggestion?.priority || caseData.urgency || "Yellow"}</span>
                </span>
              );
            })()}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {caseData.aiSuggestion?.reason || "Clinical triage assessment recommended."}
          </p>
        </div>

        {/* Assigned Facility */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-teal-700" />
              <span>Assigned Facility</span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-bold text-slate-900">
                {caseData.facility}
              </div>
              <div className="text-xs text-slate-500">
                {caseData.facilityLocation}
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => alert(`Assigned Facility: ${caseData.facility} (${caseData.facilityLocation})`)}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
