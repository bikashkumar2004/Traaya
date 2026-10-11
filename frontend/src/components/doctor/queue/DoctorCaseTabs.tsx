"use client";

import React from "react";
import {
  User,
  Activity,
  FileText,
  Sparkles,
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface DoctorCaseTabsProps {
  activeTab: string;
  selectedCase: CaseDetails;
  onViewReport: () => void;
}

export function DoctorCaseTabs({
  activeTab,
  selectedCase,
  onViewReport,
}: DoctorCaseTabsProps) {
  return (
    <div className="space-y-5">
      {activeTab === "Overview" && (
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Name</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Age / Gender</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.age} / {selectedCase.gender}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.phone}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Location</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.location}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Language</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.language}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Consultation Mode</span>
                  <span className="font-semibold text-indigo-700 capitalize">
                    {selectedCase.consultationMode === "online"
                      ? "Online Teleconsult"
                      : selectedCase.consultationMode || "In-Person Walk-in"}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Consent</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedCase.consent}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Assigned Facility</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCase.facility}
                  </span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 block mb-1">Nurse Quick Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                    {selectedCase.quickNotes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chief Complaint & Reported Symptoms Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  Chief Complaint &amp; Clinical Summary
                </h2>
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Symptoms Data
              </span>
            </div>

            {/* 1. Reported Symptoms Chips (Top of card) */}
            {(selectedCase.symptomsData?.symptoms?.length || selectedCase.aiInfo?.symptoms?.length) ? (
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Reported Symptoms
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(selectedCase.symptomsData?.symptoms || selectedCase.aiInfo.symptoms).map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 2. Summary paragraph */}
            <div className="text-xs text-slate-800 bg-teal-50/50 p-3.5 rounded-xl border border-teal-100 leading-relaxed font-medium whitespace-pre-wrap">
              <span className="font-bold text-teal-950 block mb-1">Clinical Summary:</span>
              {(() => {
                const raw =
                  selectedCase.symptomsData?.summary ||
                  (selectedCase as any).symptoms_data?.summary ||
                  (selectedCase as any).symptoms_data?.clinical_summary ||
                  "";
                if (raw && (raw.includes("?:") || raw.includes("Do you have") || (raw.includes("?") && raw.length > 120))) {
                  const syms =
                    selectedCase.symptomsData?.symptoms?.join(", ") ||
                    (selectedCase as any).symptoms_data?.symptoms?.join(", ") ||
                    selectedCase.aiInfo?.symptoms?.join(", ");
                  const comp =
                    (selectedCase as any).symptoms_data?.raw_complaint ||
                    selectedCase.symptomsData?.raw_complaint ||
                    selectedCase.chiefComplaint;
                  if (syms && comp && comp.toLowerCase() !== syms.toLowerCase() && !comp.startsWith("Patient reports")) {
                    return `Patient presents with ${syms}. Primary complaint: "${comp}".`;
                  }
                  if (syms) {
                    return `Patient presents with ${syms} for clinical triage evaluation.`;
                  }
                }
                return raw || selectedCase.chiefComplaint || "Clinical evaluation recorded.";
              })()}
            </div>

            {/* 3. Questions & Answers key-value pairs */}
            {selectedCase.symptomsData?.questions_answers && Object.keys(selectedCase.symptomsData.questions_answers).length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Patient Intake Responses
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {Object.entries(selectedCase.symptomsData.questions_answers).map(([key, val], idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 block capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-slate-800 block mt-0.5 truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Diagnostic Documents & Lab Slip Parser */}
          {selectedCase.reports && selectedCase.reports.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Attached Medical Documents ({selectedCase.reports.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onViewReport}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                >
                  View Full Document
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{selectedCase.reports[0]}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Verified via OCR
                  </span>
                </div>
                {selectedCase.aiReportAnalysis && (
                  <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                    {selectedCase.aiReportAnalysis.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Intelligence Summary Card */}
          {selectedCase.aiSuggestion && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  AI Clinical Suggestion
                </h2>
              </div>
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 text-xs space-y-1">
                <div className="font-bold text-teal-950 flex items-center gap-1.5">
                  <span>Recommended Priority:</span>
                  <span className="text-teal-800 underline">
                    {selectedCase.aiSuggestion.priority}
                  </span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  {selectedCase.aiSuggestion.reason}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "Symptoms & Timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Symptom Progression &amp; Timeline
          </h2>
          <div className="relative border-l-2 border-teal-200 ml-3 space-y-5 text-xs">
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
              <div className="font-bold text-slate-900">Symptom Onset (3 Days Ago)</div>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Patient experienced sudden onset fever with body ache and generalized fatigue.
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
              <div className="font-bold text-slate-900">Night Cough &amp; Anorexia (1 Day Ago)</div>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Dry cough worsened at night; reduced oral intake reported by family.
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-rose-500 ring-4 ring-white" />
              <div className="font-bold text-slate-900">Nurse Triage Verification (Today)</div>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Intake verified at CHC triage desk; temperature recorded 100.8°F. Forwarded for doctor order.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Q&A History" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Clinical Intake Questionnaire Responses
          </h2>
          <div className="space-y-3 text-xs">
            {selectedCase.symptomsData?.raw_qa && selectedCase.symptomsData.raw_qa.length > 0 ? (
              selectedCase.symptomsData.raw_qa.map((qa, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">Q: {qa.question}</div>
                  <div className="text-slate-800 font-medium mt-1">A: {qa.answer}</div>
                </div>
              ))
            ) : selectedCase.symptomsData?.questions_answers && Object.keys(selectedCase.symptomsData.questions_answers).length > 0 ? (
              Object.entries(selectedCase.symptomsData.questions_answers).map(([key, val], i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 capitalize">Q: {key.replace(/_/g, " ")}</div>
                  <div className="text-slate-800 font-medium mt-1">A: {String(val)}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No adaptive questions recorded for this case.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Medical Reports" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Diagnostic Documents &amp; Automated Lab Parser
          </h2>
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">
                Complete Blood Count (CBC) Panel &bull; blood_test_report.jpeg
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Extracted via OCR
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-medium">Hemoglobin</span>
                <div className="text-sm font-bold text-slate-800 mt-0.5">13.8 g/dL</div>
                <span className="text-[9px] text-emerald-600 font-semibold">Normal</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-300 text-center bg-amber-50/40">
                <span className="text-[10px] text-amber-800 font-medium">WBC Count</span>
                <div className="text-sm font-bold text-amber-900 mt-0.5">11,500 /µL</div>
                <span className="text-[9px] text-amber-700 font-semibold">Mildly Elevated</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-medium">Platelets</span>
                <div className="text-sm font-bold text-slate-800 mt-0.5">2.2 Lakh/µL</div>
                <span className="text-[9px] text-emerald-600 font-semibold">Normal</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-medium">ESR</span>
                <div className="text-sm font-bold text-slate-800 mt-0.5">24 mm/hr</div>
                <span className="text-[9px] text-slate-500 font-semibold">Borderline</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "AI Summary" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            TRAAYA Clinical Intelligence Summary
          </h2>
          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            {selectedCase.symptomsData?.summary ? (
              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200/80 text-slate-800">
                <span className="font-bold text-teal-950 block mb-1">Synthesized Clinical Summary:</span>
                <p className="leading-relaxed">{selectedCase.symptomsData.summary}</p>
              </div>
            ) : null}
            <p>
              <strong>Clinical Rationale:</strong> {selectedCase.aiSuggestion?.reason || "Patient presents with acute symptoms requiring evaluation."}
            </p>
          </div>
        </div>
      )}

      {activeTab === "Activity Log" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Audit &amp; Action Trail</h2>
          <div className="text-xs space-y-2">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <span>Reported via Odia Mobile App by Patient</span>
              <span className="text-slate-400">10:24 AM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <span>AI Automated Triage assigned: Yellow (Priority 2)</span>
              <span className="text-slate-400">10:25 AM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <span>Intake verified and forwarded by Nurse Priya S.</span>
              <span className="text-slate-400">10:35 AM</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
              <span>Opened for medical officer examination by Dr. Kavita Verma</span>
              <span className="text-teal-700 font-medium">Just now</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
