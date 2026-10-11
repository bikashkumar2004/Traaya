"use client";

import React from "react";
import {
  User,
  Calendar,
  FileText,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Check,
  Activity,
  StickyNote,
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
  // 1. Resolve Raw Complaint
  const rawComplaint = (() => {
    const summaryText = (
      selectedCase.symptomsData?.summary ||
      (selectedCase as any).symptoms_data?.summary ||
      ""
    ).trim();

    const directRaw = (
      (selectedCase as any).symptoms_data?.raw_complaint ||
      selectedCase.symptomsData?.raw_complaint ||
      ""
    ).trim();

    if (directRaw && directRaw !== summaryText && !directRaw.startsWith("Patient reports")) {
      return directRaw;
    }

    const sdata = (selectedCase as any).symptoms_data || selectedCase.symptomsData || {};
    if (sdata.raw_complaint && sdata.raw_complaint.trim() !== summaryText && !sdata.raw_complaint.startsWith("Patient reports")) {
      return sdata.raw_complaint.trim();
    }
    if (sdata.complaint && sdata.complaint.trim() !== summaryText && !sdata.complaint.startsWith("Patient reports")) {
      return sdata.complaint.trim();
    }
    if (selectedCase.chiefComplaint && selectedCase.chiefComplaint.trim() !== summaryText && !selectedCase.chiefComplaint.startsWith("Patient reports")) {
      return selectedCase.chiefComplaint.trim();
    }

    if (directRaw && directRaw !== summaryText) {
      return directRaw;
    }

    const syms = selectedCase.symptomsData?.symptoms || (selectedCase as any).symptoms_data?.symptoms || selectedCase.aiInfo?.symptoms || [];
    if (syms.length > 0) {
      return syms.join(", ");
    }

    return directRaw || "No initial raw complaint provided.";
  })();

  // 2. Resolve Clinical Summary
  const resolveSummary = () => {
    const raw = (
      selectedCase.symptomsData?.summary ||
      (selectedCase as any).symptoms_data?.summary ||
      (selectedCase as any).symptoms_data?.clinical_summary ||
      ""
    ).trim();

    if (raw && (raw.includes("?:") || raw.includes("Do you have") || (raw.includes("?") && raw.length > 120))) {
      const syms =
        selectedCase.symptomsData?.symptoms?.join(", ") ||
        (selectedCase as any).symptoms_data?.symptoms?.join(", ") ||
        selectedCase.aiInfo?.symptoms?.join(", ");

      const comp = rawComplaint && !rawComplaint.startsWith("Patient reports") && !rawComplaint.includes("?:") ? rawComplaint : "";
      if (syms && comp && comp.toLowerCase() !== syms.toLowerCase()) {
        return `Patient presents with ${syms}. Primary complaint: "${comp}".`;
      }
      if (syms) {
        return `Patient presents with ${syms} for clinical triage evaluation.`;
      }
    }

    return raw || (selectedCase.chiefComplaint ? `Patient presents with ${selectedCase.chiefComplaint}.` : "Patient intake recorded at triage desk.");
  };

  // 3. Resolve Questions and Answers List
  const rawQaList: Array<{ question: string; answer: string }> = (() => {
    const sdata =
      (selectedCase.symptomsData && typeof selectedCase.symptomsData === "object"
        ? selectedCase.symptomsData
        : {}) as any;
    const directSdata =
      ((selectedCase as any).symptoms_data && typeof (selectedCase as any).symptoms_data === "object"
        ? (selectedCase as any).symptoms_data
        : {}) as any;

    const questionLabels: Record<string, string> = {
      fever_duration: "How many days have you had these symptoms / fever?",
      duration: "How many days have you had these symptoms?",
      headache_severity: "How severe is the headache / pain?",
      pain_severity: "How severe is the pain / discomfort?",
      weakness_severity: "How severe is the weakness or fatigue?",
      severity: "How severe are your primary symptoms?",
      daily_persistence: "How long does the discomfort persist during the day?",
      associated_symptoms: "Are there any associated symptoms (nausea, cough, body ache)?",
      associated: "Are there any associated symptoms?",
      fever_and_chills: "Are high fever, shivering, or chills present?",
      red_flags: "Are any red flag emergency warning signs present?",
      recurrence_frequency: "How often does the symptom or episode recur?",
      onset: "When and how suddenly did your symptoms start?",
    };

    // 1. Try raw_qa array
    const rawQaCandidate = sdata.raw_qa || directSdata.raw_qa || (selectedCase as any).raw_qa;
    let list: any[] = [];
    if (Array.isArray(rawQaCandidate) && rawQaCandidate.length > 0) {
      list = rawQaCandidate;
    } else if (typeof rawQaCandidate === "string") {
      try {
        const parsed = JSON.parse(rawQaCandidate);
        if (Array.isArray(parsed)) list = parsed;
      } catch {}
    }

    if (list.length > 0) {
      const parsedList = list
        .map((item: any) => ({
          question: typeof item === "object" ? item.question || item.q || item.title || "" : String(item),
          answer: typeof item === "object" ? item.answer || item.a || item.val || "" : "",
        }))
        .filter((item: { question: string; answer: string }) => item.question && item.answer);

      if (parsedList.length > 0) return parsedList;
    }

    // 2. Try follow_up_questions paired with follow_up_answers
    const fQuestions = sdata.follow_up_questions || directSdata.follow_up_questions || (selectedCase as any).follow_up_questions;
    const fAnswers = sdata.follow_up_answers || directSdata.follow_up_answers || (selectedCase as any).follow_up_answers;
    if (Array.isArray(fQuestions) && fQuestions.length > 0 && typeof fAnswers === "object" && fAnswers !== null) {
      const paired: Array<{ question: string; answer: string }> = [];
      for (const fq of fQuestions) {
        const qText = fq.question || fq.title || fq.prompt || "";
        const qId = fq.id || "";
        const ans = fAnswers[qId] ?? fAnswers[qText];
        if (ans !== undefined && ans !== null && String(ans).trim() !== "") {
          const unit = fq.unit || "";
          paired.push({
            question: qText || qId,
            answer: String(ans).trim() + (unit && !String(ans).includes(unit) ? ` ${unit}` : ""),
          });
        }
      }
      if (paired.length > 0) return paired;
    }

    // 3. Try questions_answers map
    let qaMap = sdata.questions_answers || directSdata.questions_answers || (selectedCase as any).questions_answers;
    if (typeof qaMap === "string") {
      try {
        qaMap = JSON.parse(qaMap);
      } catch {}
    }

    if (typeof qaMap === "object" && qaMap !== null && Object.keys(qaMap).length > 0) {
      const entries = Object.entries(qaMap)
        .filter(([k, v]) => k !== "reverted_questions" && v !== undefined && v !== null && String(v).trim() !== "")
        .map(([k, v]) => {
          const cleanK = k.toLowerCase().trim();
          const naturalQ = questionLabels[cleanK] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + "?";
          return {
            question: naturalQ,
            answer: String(v),
          };
        });

      if (entries.length > 0) return entries;
    }

    // 4. Try parsing questions from summary
    const summaryCandidate = sdata.summary || directSdata.summary || (selectedCase as any).clinical_summary || "";
    if (summaryCandidate && (summaryCandidate.includes("?:") || summaryCandidate.includes("Q:") || summaryCandidate.includes("?"))) {
      const regex = /(?:Q:|\d+[\.\)]\s*|\b)([^\?\n]+\?)\s*(?:A:|:)?\s*([^\n\?]+)/gi;
      const parsedFromSummary: Array<{ question: string; answer: string }> = [];
      let match;
      while ((match = regex.exec(summaryCandidate)) !== null) {
        const q = match[1].trim();
        const a = match[2].trim();
        if (q.length > 5 && a.length > 0) {
          parsedFromSummary.push({ question: q, answer: a });
        }
      }
      if (parsedFromSummary.length > 0) return parsedFromSummary;
    }

    // 5. Fallback: Reconstruct from aiInfo / intake parameters if available
    const fallbackList: Array<{ question: string; answer: string }> = [];
    const durationVal = selectedCase.aiInfo?.duration || sdata.duration || directSdata.duration;
    const severityVal = selectedCase.aiInfo?.severity || sdata.severity || directSdata.severity;
    const associatedVal = selectedCase.aiInfo?.associated || sdata.associated || directSdata.associated;
    const redFlagsVal = selectedCase.aiInfo?.redFlags || sdata.red_flags || directSdata.red_flags;

    if (durationVal) {
      fallbackList.push({
        question: "How many days have you had these symptoms? (Duration)",
        answer: durationVal,
      });
    }
    if (severityVal) {
      fallbackList.push({
        question: "How severe is the pain or discomfort? (Severity)",
        answer: severityVal,
      });
    }
    if (associatedVal && associatedVal !== "None") {
      fallbackList.push({
        question: "Are there any associated symptoms?",
        answer: associatedVal,
      });
    }
    if (redFlagsVal && redFlagsVal !== "None detected yet") {
      fallbackList.push({
        question: "Are any red flag emergency warning signs present?",
        answer: redFlagsVal,
      });
    }

    return fallbackList;
  })();

  // 4. Resolve Uploaded Report Data
  const reportData =
    selectedCase.uploadedReportData ||
    (selectedCase as any).uploaded_report_data ||
    {};

  const reportUrl =
    selectedCase.uploadedReportUrl ||
    (selectedCase as any).report_url ||
    reportData.file_url ||
    reportData.url;

  const reportName =
    reportData.file_name ||
    reportData.fileName ||
    reportData.name ||
    (selectedCase.reports && selectedCase.reports.length > 0 ? selectedCase.reports[0] : null) ||
    "Uploaded_Medical_Report.pdf";

  const testName =
    reportData.test_name ||
    reportData.testName ||
    "Diagnostic Lab Panel";

  const parameters: any[] = Array.isArray(reportData.parameters)
    ? reportData.parameters
    : [];

  const clinicalFlags: string[] = Array.isArray(reportData.clinical_flags)
    ? reportData.clinical_flags
    : [];

  const reportSummary =
    reportData.summary ||
    reportData.overview ||
    (selectedCase.aiReportAnalysis && selectedCase.aiReportAnalysis.length > 0 ? selectedCase.aiReportAnalysis[0] : null);

  const findings: string[] = Array.isArray(reportData.findings)
    ? reportData.findings
    : selectedCase.aiReportAnalysis && selectedCase.aiReportAnalysis.length > 1
    ? selectedCase.aiReportAnalysis.slice(1)
    : [];

  const hasReport = Boolean(
    reportUrl ||
    (selectedCase.reports && selectedCase.reports.length > 0) ||
    (typeof reportData === "object" && Object.keys(reportData).length > 0 && (parameters.length > 0 || reportData.test_name || reportData.summary))
  );

  return (
    <div className="space-y-5">
      {/* 1. Patient Overview Card (Styled exactly like Nurse page) */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          {/* Column 1 */}
          <div className="space-y-2">
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
            {selectedCase.scheduleTime && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled:
                </span>
                <span className="font-bold text-emerald-900">
                  {new Date(selectedCase.scheduleTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            )}
          </div>

          {/* Column 2 */}
          <div className="space-y-2">
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
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Consent</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {selectedCase.consent}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Facility & Quick Notes if available */}
        {(selectedCase.facility || (selectedCase.quickNotes && !selectedCase.quickNotes.includes("stable hemodynamics") && !selectedCase.quickNotes.includes("Patient presented with complaints of"))) && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {selectedCase.facility && (
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Assigned Facility</span>
                <span className="font-semibold text-slate-800">
                  {selectedCase.facility}
                </span>
              </div>
            )}
            {selectedCase.quickNotes && !selectedCase.quickNotes.includes("stable hemodynamics") && !selectedCase.quickNotes.includes("Patient presented with complaints of") && (
              <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-slate-600 mb-1">
                  <StickyNote className="w-3.5 h-3.5 text-teal-600" />
                  <span>Nurse Quick Notes</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {selectedCase.quickNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Clinical Symptoms & Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Clinical Symptoms &amp; Summary</span>
          </div>
        </div>

        {/* Reported Symptoms Tags (Top of card) */}
        {(selectedCase.symptomsData?.symptoms?.length || (selectedCase as any).symptoms_data?.symptoms?.length || selectedCase.aiInfo?.symptoms?.length) ? (
          <div className="space-y-1.5 pt-0.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Reported Symptoms
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(selectedCase.symptomsData?.symptoms || (selectedCase as any).symptoms_data?.symptoms || selectedCase.aiInfo.symptoms).map((sym: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {/* Triage Priority Display */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Triage Priority:</span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                selectedCase.urgency === "Red"
                  ? "bg-rose-100 text-rose-800 border-rose-300"
                  : selectedCase.urgency === "Amber" || selectedCase.urgency === "Yellow"
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  selectedCase.urgency === "Red"
                    ? "bg-rose-500"
                    : selectedCase.urgency === "Amber" || selectedCase.urgency === "Yellow"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
              <span>{selectedCase.urgency || "Yellow"}</span>
              <span className="text-[10px] opacity-75 font-normal">
                ({selectedCase.urgency === "Red" ? "Immediate / High" : selectedCase.urgency === "Amber" || selectedCase.urgency === "Yellow" ? "Urgent / Medium" : "Routine / Low"})
              </span>
            </span>
          </div>
        </div>

        {/* Summary paragraph */}
        <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
          <span className="font-bold text-teal-950 block mb-1">Clinical Summary:</span>
          {resolveSummary()}
        </div>
      </div>

      {/* 3. Missing Details Warning Banner (Only show if missing details exist) */}
      {selectedCase.missingDetails && selectedCase.missingDetails.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Important details flagged during intake:</span>{" "}
              {selectedCase.missingDetails.join(", ")}.
            </div>
          </div>
        </div>
      )}

      {/* 4. Patient Raw Complaint & Adaptive Intake Q&A Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
            <MessageSquare className="w-4 h-4 text-teal-700" />
            <span>Raw Complaint &amp; Intake Questions</span>
          </div>
        </div>

        {/* 1. Patient Raw Complaint */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Patient Raw Complaint
          </span>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-800 leading-relaxed italic">
            &ldquo;{rawComplaint}&rdquo;
          </div>
        </div>

        {/* 2. Questions & Answers */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Patient Questions &amp; Answers
            </span>
            <span className="text-[10px] font-semibold text-slate-400">
              {rawQaList.length} response{rawQaList.length === 1 ? "" : "s"}
            </span>
          </div>

          {rawQaList.length > 0 ? (
            <div className="space-y-2">
              {rawQaList.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1 hover:border-teal-200 hover:bg-teal-50/20 transition-colors"
                >
                  <div className="text-xs font-bold text-slate-900 flex items-start gap-1.5">
                    <span className="text-teal-700 font-extrabold shrink-0">Q:</span>
                    <span>{item.question}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 pl-4 flex items-start gap-1.5">
                    <span className="text-slate-400 font-bold shrink-0">A:</span>
                    <span className="text-slate-800 font-semibold">{item.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 text-center">
              No adaptive intake questions recorded for this patient.
            </div>
          )}
        </div>
      </div>

      {/* 5. Patient Uploaded Medical Report & Report Data Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 text-slate-900 text-sm font-bold">
            <FileText className="w-4 h-4 text-teal-700" />
            <span>Uploaded Medical Report &amp; Lab Data</span>
          </div>
          {hasReport ? (
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Attached Document
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              No Document
            </span>
          )}
        </div>

        {hasReport ? (
          <div className="space-y-3.5">
            {/* Document Header & Open Link */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate" title={reportName}>
                    {reportName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-teal-900">{testName}</span>
                    {reportData.report_date && <span>• Date: {reportData.report_date}</span>}
                  </div>
                </div>
              </div>

              {reportUrl ? (
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-900 font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
                  <span>View Original Document</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onViewReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-900 font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-700" />
                  <span>View Report</span>
                </button>
              )}
            </div>

            {/* AI Synthesized Report Summary if available */}
            {reportSummary && (
              <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-1">
                <span className="text-[11px] font-bold text-teal-950 uppercase tracking-wider block">
                  Report Synthesis &amp; Overview
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {reportSummary}
                </p>
              </div>
            )}

            {/* Identified Clinical Flags / Alerts */}
            {clinicalFlags.length > 0 && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Identified Clinical Flags / Abnormalities:</span>
                </div>
                <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5 pl-1 font-medium">
                  {clinicalFlags.map((flag, fIdx) => (
                    <li key={fIdx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Parameters Table */}
            {parameters.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Extracted Lab Parameters ({parameters.length})
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Test Parameter</th>
                        <th className="py-2.5 px-3">Result</th>
                        <th className="py-2.5 px-3">Reference Range</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parameters.map((p: any, idx: number) => {
                        const statusUpper = String(p.status || "").toUpperCase();
                        const isHigh = statusUpper === "HIGH" || statusUpper === "CRITICAL";
                        const isLow = statusUpper === "LOW";
                        const badgeColor = isHigh
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : isLow
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {p.parameter || p.name || "-"}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {p.value || "-"} {p.unit || ""}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {p.reference_range || "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                                {statusUpper || "NORMAL"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Extracted Diagnostic Findings */}
            {findings.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Diagnostic Findings
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {findings.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                      <span className="font-medium text-slate-800">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1.5">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-xs font-bold text-slate-700">No medical reports uploaded</div>
            <div className="text-[11px] text-slate-400">
              The patient did not upload any external lab documents or diagnostic scans during intake.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
