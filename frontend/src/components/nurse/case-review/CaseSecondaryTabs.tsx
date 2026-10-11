"use client";

import React from "react";
import { FileText, HelpCircle, Check } from "lucide-react";
import { CaseDetails } from "../CaseReviewWorkspace";

interface CaseSecondaryTabsProps {
  activeTab: string;
  caseData: CaseDetails;
}

export function CaseSecondaryTabs({ activeTab, caseData }: CaseSecondaryTabsProps) {
  return (
    <>
      {activeTab === "Symptoms & Timeline" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Symptom Progression & Clinical Timeline
          </h2>
          <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            <div className="pl-8 relative">
              <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
              <div className="text-xs font-bold text-slate-800">
                3 Days Ago (Onset)
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Mild body aches, general malaise after manual agriculture labor. Low fever noticed in evening.
              </p>
            </div>
            <div className="pl-8 relative">
              <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white" />
              <div className="text-xs font-bold text-slate-800">
                Yesterday (Escalation)
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                High fever developed with nighttime dry cough and headache. Self-administered paracetamol with partial relief.
              </p>
            </div>
            <div className="pl-8 relative">
              <span className="absolute left-2 top-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-4 ring-white" />
              <div className="text-xs font-bold text-slate-800">
                Today &bull; 10:24 AM (Triage Submission)
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Persistent weakness, severe body pain, loss of appetite. Submitted triage via mobile app in Odia language.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Q&A History" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Patient Adaptive Questionnaire Responses
          </h2>
          <div className="space-y-3 text-xs">
            {caseData.symptomsData?.raw_qa && caseData.symptomsData.raw_qa.length > 0 ? (
              caseData.symptomsData.raw_qa.map((qa, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900">Q: {qa.question}</div>
                  <div className="text-slate-800 font-medium mt-1">A: {qa.answer}</div>
                </div>
              ))
            ) : caseData.symptomsData?.questions_answers && Object.keys(caseData.symptomsData.questions_answers).length > 0 ? (
              Object.entries(caseData.symptomsData.questions_answers).map(([key, val], i) => (
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

          {caseData.revertedQuestions && caseData.revertedQuestions.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Clinical Nurse Reverted Questions ({caseData.revertedQuestions.length})</span>
              </h3>
              <div className="space-y-2">
                {caseData.revertedQuestions.map((rq, idx) => (
                  <div key={rq.id || idx} className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                    <div className="font-bold text-slate-900">
                      <span className="text-amber-800 mr-1.5">Q{idx + 1}:</span>
                      {rq.question}
                    </div>
                    {rq.answer ? (
                      <div className="text-emerald-800 font-semibold mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Patient Reply: {rq.answer}</span>
                      </div>
                    ) : (
                      <div className="text-amber-700 italic mt-1 text-[11px]">
                        Awaiting patient response...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Medical Reports" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            Diagnostic Documents &amp; Automated Lab Parser
          </h2>
          {caseData.reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Medical Reports Uploaded</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                The patient did not submit any diagnostic slips or lab test reports with this intake.
              </p>
            </div>
          ) : (
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {caseData.reports[0] || "Diagnostic Report"}
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Uploaded File
                </span>
              </div>
              {caseData.aiReportAnalysis && caseData.aiReportAnalysis.length > 0 ? (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-bold text-slate-600">Extracted Findings &amp; Summary:</div>
                  {caseData.aiReportAnalysis.map((item, i) => (
                    <div key={i} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No automated parameters extracted for this report.</p>
              )}
              {caseData.uploadedReportUrl && (
                <div className="pt-2">
                  <a
                    href={caseData.uploadedReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Open Original Document</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "AI Summary" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900">
            TRAAYA Clinical Intelligence Summary
          </h2>
          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            {(caseData.symptomsData?.summary || (caseData as any).symptoms_data?.summary) ? (
              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200/80 text-slate-800">
                <span className="font-bold text-teal-950 block mb-1">Synthesized Clinical Summary:</span>
                <p className="leading-relaxed whitespace-pre-wrap">{caseData.symptomsData?.summary || (caseData as any).symptoms_data?.summary}</p>
              </div>
            ) : null}
            <p>
              <strong>Clinical Rationale:</strong> {caseData.aiSuggestion?.reason || "Patient exhibits acute symptoms requiring standard primary care evaluation."}
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
              <span>Opened for clinical review by Nurse Priya S.</span>
              <span className="text-teal-700 font-medium">Just now</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
