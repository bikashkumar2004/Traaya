"use client";

import React from "react";
import { FileText } from "lucide-react";
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
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">
                Q: Are you experiencing any breathing difficulties or chest pain?
              </div>
              <div className="text-slate-700 mt-1">
                A: No chest pain, only cough at night when lying down.
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">
                Q: Have you had any chills or shivering episodes?
              </div>
              <div className="text-slate-700 mt-1">
                A: Yes, shivering yesterday night before taking paracetamol.
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">
                Q: Any chronic medical conditions (Diabetes, Hypertension, Asthma)?
              </div>
              <div className="text-amber-800 mt-1 font-medium">
                A: Unanswered (Marked for nurse verification)
              </div>
            </div>
          </div>
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
            TriageAssist Clinical Intelligence Summary
          </h2>
          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <p>
              <strong>Clinical Rationale:</strong> The patient presents with acute febrile illness of 3 days duration accompanied by systemic manifestations (myalgia, severe fatigue, headache). Mild leukocytosis (11,500 /µL) supports an active inflammatory or bacterial/viral etiology requiring differential diagnosis (Viral fever, Dengue, or early Typhoid prevalent in Nayagarh district).
            </p>
            <p>
              <strong>Recommended Interventions:</strong> Immediate oral temperature and BP check at PHC desk, hydration encouragement, and assignment to Dr. Ananya Sen for empirical prescription and malarial smear if fever exceeds 101.5°F.
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
