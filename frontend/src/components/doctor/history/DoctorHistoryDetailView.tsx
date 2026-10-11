"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  Clock,
  Building2,
  ArrowRightLeft,
  Video,
  Pill,
  Stethoscope,
} from "lucide-react";
import { ReviewedCaseRecord } from "../DoctorReviewHistoryView";
import { DoctorCaseTabs } from "../queue/DoctorCaseTabs";
import { DoctorReportModal } from "../queue/DoctorReportModal";

interface DoctorHistoryDetailViewProps {
  selectedCaseToReview: ReviewedCaseRecord;
  activeModalTab?: string;
  setActiveModalTab?: (tab: string) => void;
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
  activeModalTab = "Overview",
  setActiveModalTab,
  onBack,
  onPrint,
  onOpenCheckup,
  isAwaitingCheckup,
  statusConfig,
  priorityConfig,
  actionDetails,
}: DoctorHistoryDetailViewProps) {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const StatusIcon = statusConfig.icon;
  const PriorityIcon = priorityConfig.icon;
  const { cleanNotes, timeline, referral, ward, teleconsult } = actionDetails;

  const realReviewedAt = (() => {
    const rawDate =
      (selectedCaseToReview as any).updated_at ||
      selectedCaseToReview.updatedAt ||
      (selectedCaseToReview as any).updatedAt;

    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } catch {}
    }

    if (
      selectedCaseToReview.reviewedAt &&
      !selectedCaseToReview.reviewedAt.includes("ago") &&
      selectedCaseToReview.reviewedAt !== "Recently"
    ) {
      return selectedCaseToReview.reviewedAt;
    }

    return "Recently";
  })();

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

        {/* Case ID, UHID, and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Case {selectedCaseToReview.id}
            </h1>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
              UHID: {selectedCaseToReview.patientId}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">
              Reviewed: <strong className="text-slate-800">{realReviewedAt}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Information Cards (7 cols) - matching Review Queue page */}
        <div className="lg:col-span-7 space-y-5">
          <DoctorCaseTabs
            activeTab="Overview"
            selectedCase={selectedCaseToReview}
            onViewReport={() => setReportModalOpen(true)}
          />
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
            ) : null}

            {/* Attending Doctor */}
            <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Attending Doctor:</span>
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
                title="Open Hospital Discharge Report in a new tab"
                className="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-700 transition-colors" />
                <span>Print Discharge Report</span>
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

      <DoctorReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        selectedCase={selectedCaseToReview}
      />
    </div>
  );
}
