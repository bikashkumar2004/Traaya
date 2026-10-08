"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  User,
  Activity,
  FileText,
  Sparkles,
  Clock,
  Building2,
  ArrowRightLeft,
  Video,
  Pill,
  Stethoscope,
} from "lucide-react";
import { ReviewedCaseRecord } from "../DoctorReviewHistoryView";

interface DoctorHistoryDetailViewProps {
  selectedCaseToReview: ReviewedCaseRecord;
  activeModalTab: string;
  setActiveModalTab: (tab: string) => void;
  onBack: () => void;
  onPrint: (c: ReviewedCaseRecord) => void;
  onOpenCheckup: (c: ReviewedCaseRecord) => void;
  isAwaitingCheckup: (c?: ReviewedCaseRecord | null) => boolean;
  statusConfig: any;
  priorityConfig: any;
  actionDetails: {
    cleanNotes: string;
    timeline: string | null;
    referral: string | null;
    ward: string | null;
    teleconsult: boolean;
  };
}

export function DoctorHistoryDetailView({
  selectedCaseToReview,
  activeModalTab,
  setActiveModalTab,
  onBack,
  onPrint,
  onOpenCheckup,
  isAwaitingCheckup,
  statusConfig,
  priorityConfig,
  actionDetails,
}: DoctorHistoryDetailViewProps) {
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;
  const { cleanNotes, timeline, referral, ward, teleconsult } = actionDetails;

  return (
    <div className="space-y-5">
      {/* Top Header Row */}
      <div className="space-y-4">
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Review History</span>
        </button>

        {/* Case ID, Priority Badges, Status & Meta */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Case {selectedCaseToReview.id}
              </h1>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                UHID: {selectedCaseToReview.patientId}
              </span>

              {/* PRIORITY BADGE */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${priorityConfig.badgeClass}`}
              >
                <PriorityIcon className={`w-3.5 h-3.5 ${priorityConfig.iconClass}`} />
                <span>Priority: {priorityConfig.label}</span>
              </span>

              {/* STATUS BADGE */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusConfig.badgeClass}`}
              >
                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />
                <span>Status: {statusConfig.label}</span>
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap">
              <strong className="text-slate-900 font-bold">
                {selectedCaseToReview.name}
              </strong>
              <span>&bull;</span>
              <span>{selectedCaseToReview.age} yrs &bull; {selectedCaseToReview.gender}</span>
              <span>&bull;</span>
              <span>Phone: {selectedCaseToReview.phone}</span>
              <span>&bull;</span>
              <span>Location: {selectedCaseToReview.location}</span>
              <span>&bull;</span>
              <span>Language: {selectedCaseToReview.language}</span>
              <span>&bull;</span>
              <span>Consent: <strong className="text-emerald-700">{selectedCaseToReview.consent}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Reviewed: <strong>{selectedCaseToReview.reviewedAt || "Recently"}</strong>
            </span>
            <button
              type="button"
              onClick={() => onPrint(selectedCaseToReview)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Slip</span>
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-1 border-b border-slate-200 pt-1 overflow-x-auto scrollbar-none">
          {[
            "Overview",
            "Symptoms & Timeline",
            "Q&A History",
            "Medical Reports",
            "AI Summary",
            "Activity Log",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveModalTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeModalTab === tab
                  ? "border-teal-700 text-teal-900 font-extrabold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Information Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeModalTab === "Overview" && (
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
                        {selectedCaseToReview.name}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Age / Gender</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCaseToReview.age} yrs &bull; {selectedCaseToReview.gender}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCaseToReview.phone}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Location</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCaseToReview.location}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Language</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCaseToReview.language}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Consent</span>
                      <span className="font-semibold text-emerald-700">
                        {selectedCaseToReview.consent} (Biometric / OTP)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Assigned Facility</span>
                      <span className="font-semibold text-slate-800">
                        {selectedCaseToReview.facility}
                      </span>
                    </div>
                    <div className="py-1">
                      <span className="text-slate-400 block mb-1">Nurse Quick Notes</span>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] leading-relaxed">
                        {selectedCaseToReview.quickNotes || "No notes recorded during triage intake."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chief Complaint & Reported Symptoms Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Chief Complaint &amp; Reported Symptoms
                  </h2>
                </div>

                <p className="text-xs text-slate-700 italic bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                  &ldquo;{selectedCaseToReview.chiefComplaint}&rdquo;
                </p>

                {selectedCaseToReview.aiInfo && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Duration</span>
                      <span className="font-bold text-slate-800">
                        {selectedCaseToReview.aiInfo.duration}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Severity</span>
                      <span className="font-bold text-slate-800">
                        {selectedCaseToReview.aiInfo.severity}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Associated</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {selectedCaseToReview.aiInfo.associated}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Red Flags</span>
                      <span className="font-bold text-rose-700 truncate block">
                        {selectedCaseToReview.aiInfo.redFlags}
                      </span>
                    </div>
                  </div>
                )}

                {selectedCaseToReview.aiInfo?.symptoms && selectedCaseToReview.aiInfo.symptoms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">
                      Reported Symptoms:
                    </span>
                    {selectedCaseToReview.aiInfo.symptoms.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagnostic Documents & Lab Slip Parser */}
              {selectedCaseToReview.reports && selectedCaseToReview.reports.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Attached Diagnostic Documents ({selectedCaseToReview.reports.length})
                      </h2>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{selectedCaseToReview.reports[0]}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                        Verified Document
                      </span>
                    </div>
                    {selectedCaseToReview.aiReportAnalysis && (
                      <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                        {selectedCaseToReview.aiReportAnalysis.map((item, idx) => (
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

              {/* AI Clinical Suggestion Card */}
              {selectedCaseToReview.aiSuggestion && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900">
                      AI Clinical Assessment &amp; Triage Rationale
                    </h2>
                  </div>
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/70 text-xs space-y-1">
                    <div className="font-bold text-teal-950 flex items-center gap-1.5">
                      <span>Priority:</span>
                      <span className="text-teal-800 underline">
                        {selectedCaseToReview.aiSuggestion.priority}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      {selectedCaseToReview.aiSuggestion.reason}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {activeModalTab === "Symptoms & Timeline" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Symptom Progression &amp; Timeline
              </h2>
              <div className="relative border-l-2 border-teal-200 ml-3 space-y-5 text-xs">
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-900">Symptom Onset (Recorded Intake)</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Patient reported acute onset of symptoms prior to consultation.
                  </p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white" />
                  <div className="font-bold text-slate-900">Nurse Triage Verification</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Vitals and preliminary questionnaire recorded and forwarded to doctor.
                  </p>
                </div>
                <div className="relative pl-6">
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div className="font-bold text-slate-900">Doctor Review &amp; Order Complete</div>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Case examined and authorized. Clinical status: {statusConfig.label}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeModalTab === "Q&A History" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Clinical Intake Questionnaire Responses
              </h2>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800">
                    Chief Complaint Reported by Patient:
                  </div>
                  <div className="text-teal-800 font-bold mt-1">&ldquo;{selectedCaseToReview.chiefComplaint}&rdquo;</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800">
                    Pre-existing Medical History &amp; Chronic Illnesses:
                  </div>
                  <div className="text-slate-700 mt-1">Verified via CHC triage desk &bull; Standard profile reviewed</div>
                </div>
              </div>
            </div>
          )}

          {activeModalTab === "Medical Reports" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                Diagnostic Documents &amp; Lab Slips
              </h2>
              {selectedCaseToReview.reports && selectedCaseToReview.reports.length > 0 ? (
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{selectedCaseToReview.reports[0]}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Laboratory diagnostics reviewed by medical officer during clinical evaluation.
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  No diagnostic documents uploaded for this case.
                </div>
              )}
            </div>
          )}

          {activeModalTab === "AI Summary" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">
                TriageAssist Clinical Intelligence Summary
              </h2>
              <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>
                  <strong>Clinical Assessment:</strong> {selectedCaseToReview.aiSuggestion?.reason || "Patient symptoms evaluated according to clinical protocols."}
                </p>
                <p>
                  <strong>Doctor Review Note:</strong> {cleanNotes || "Triage verified and cleared for clinical follow-up."}
                </p>
              </div>
            </div>
          )}

          {activeModalTab === "Activity Log" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Audit &amp; Action Trail</h2>
              <div className="text-xs space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span>Intake Registered &amp; Vitals Recorded</span>
                  <span className="text-slate-400">{selectedCaseToReview.submittedTime || "Recently"}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span>Doctor Review Completed &amp; Orders Authorized</span>
                  <span className="text-teal-800 font-bold">{selectedCaseToReview.reviewedAt || "Recently"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Doctor Review & Actions Details (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Doctor Review &amp; Orders
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized clinical decision and active follow-up orders.
              </p>
            </div>

            {/* Status, Priority and Action banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-500">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusConfig.badgeClass}`}>
                  <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.iconClass}`} />
                  <span>{statusConfig.label}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-500">Triage Priority:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${priorityConfig.badgeClass}`}>
                  <PriorityIcon className={`w-3.5 h-3.5 ${priorityConfig.iconClass}`} />
                  <span>{priorityConfig.label}</span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-slate-500">Action Taken:</span>
                <strong className="text-slate-900">{selectedCaseToReview.doctorDecision || "Standard Follow-up"}</strong>
              </div>
            </div>

            {/* Timeline if present */}
            {timeline && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Hospital Checkup Timeline:</span>
                </span>
                <p className="text-emerald-900 font-bold text-sm pl-5.5">{timeline}</p>
              </div>
            )}

            {/* Inpatient Ward Bed Assignment if present */}
            {ward && (
              <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs space-y-1">
                <span className="text-sky-950 font-bold flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-700" />
                  <span>Inpatient Ward Bed Assignment:</span>
                </span>
                <p className="text-sky-900 font-bold text-sm pl-5.5">{ward}</p>
              </div>
            )}

            {/* Referral destination if present */}
            {referral && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="text-amber-950 font-bold flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                  <span>Referred Medical Center / Hospital:</span>
                </span>
                <p className="text-amber-900 font-bold text-sm pl-5.5">{referral}</p>
              </div>
            )}

            {/* Teleconsultation note if present */}
            {teleconsult && (
              <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200 text-xs flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-700 shrink-0" />
                <span className="text-indigo-950 font-bold">Clinical video consultation conducted with patient</span>
              </div>
            )}

            {/* Clinical Assessment Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Doctor Assessment &amp; Clinical Notes
              </label>
              <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-semibold">
                {cleanNotes || "Triage verified and cleared for clinical follow-up."}
              </div>
            </div>

            {/* e-Prescription if present */}
            {selectedCaseToReview.prescriptions && (!selectedCaseToReview.doctorDecision || !selectedCaseToReview.doctorDecision.toLowerCase().includes("refer")) ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-700" />
                  <span>e-Prescription Authorized</span>
                </label>
                <pre className="font-mono text-xs text-slate-900 whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedCaseToReview.prescriptions}
                </pre>
              </div>
            ) : (selectedCaseToReview.status === "Referred" || (selectedCaseToReview.doctorDecision && selectedCaseToReview.doctorDecision.toLowerCase().includes("refer"))) ? (
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-indigo-950">Patient Referred to Higher Facility</span>
                  <span className="text-[11px] text-indigo-800">
                    Emergency referral authorized. Outpatient e-prescription not issued; definitive medication and specialized treatment will be managed at the destination hospital.
                  </span>
                </div>
              </div>
            ) : selectedCaseToReview.doctorDecision && selectedCaseToReview.doctorDecision.toLowerCase().includes("admit") ? (
              <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                <Building2 className="w-4 h-4 text-sky-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-sky-950">Inpatient Care: Ward Bed Assigned</span>
                  <span className="text-[11px] text-sky-800">
                    Patient admitted to inpatient observation ward. Status remains Under Review with active round care.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold block text-amber-950">Prescription Status: Pending In-Person Examination</span>
                  <span className="text-[11px] text-amber-800">
                    Triage confirmed for facility visit. Medication will be prescribed by the attending physician following physical checkup.
                  </span>
                </div>
              </div>
            )}

            {/* Attending Doctor */}
            <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Attending MO:</span>
              <strong className="text-slate-900">{selectedCaseToReview.attendingDoctor || "Dr. Kavita Verma, MD"}</strong>
            </div>

            {/* Workspace Action Buttons */}
            <div className="space-y-2 pt-2">
              {isAwaitingCheckup(selectedCaseToReview) && (
                <button
                  type="button"
                  onClick={() => onOpenCheckup(selectedCaseToReview)}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <Stethoscope className="w-4 h-4 text-teal-200" />
                  <span>In-Person Checkup &amp; Prescribe</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              <button
                type="button"
                onClick={() => onPrint(selectedCaseToReview)}
                className="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Clinical Summary Slip</span>
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                Back to Review History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
