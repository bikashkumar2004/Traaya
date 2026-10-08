"use client";

import React from "react";
import {
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Eye,
  Download,
  ArrowRightLeft,
  Video,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { RegisteredFacilityOption } from "@/lib/nurse-api";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";
import { generateDischargePdf } from "@/lib/generateDischargePdf";

export interface DoctorActionOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  targetStatus: string;
}

interface DoctorDecisionDeckProps {
  selectedCase: CaseDetails;
  actionOptions: DoctorActionOption[];
  selectedAction: string;
  setSelectedAction: (val: string) => void;
  dischargeReportData: DischargeReportPayload | null;
  isGeneratingDischarge: boolean;
  handleGenerateDischargeReport: () => void;
  setDischargeModalOpen: (val: boolean) => void;
  referralHospital: string;
  setReferralHospital: (val: string) => void;
  referralFacilityId: string | null;
  setReferralFacilityId: (val: string) => void;
  availableFacilities: RegisteredFacilityOption[];
  loadingFacilities: boolean;
  transferReason: string;
  setTransferReason: (val: string) => void;
  setVideoCallModalOpen: (val: boolean) => void;
  setCallDuration: (val: number) => void;
  reviewNote: string;
  setReviewNote: (val: string) => void;
  handleSubmitReview: (e: React.FormEvent) => void;
}

export function DoctorDecisionDeck({
  selectedCase,
  actionOptions,
  selectedAction,
  setSelectedAction,
  dischargeReportData,
  isGeneratingDischarge,
  handleGenerateDischargeReport,
  setDischargeModalOpen,
  referralHospital,
  setReferralHospital,
  referralFacilityId,
  setReferralFacilityId,
  availableFacilities,
  loadingFacilities,
  transferReason,
  setTransferReason,
  setVideoCallModalOpen,
  setCallDuration,
  reviewNote,
  setReviewNote,
  handleSubmitReview,
}: DoctorDecisionDeckProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-800">
          Clinical Decision &amp; Disposition
        </h3>
        <span className="text-[11px] text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
          Doctor Authorization
        </span>
      </div>

      <div className="space-y-4">
        {/* Action Selection Radio-like list */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Select Clinical Action
          </label>

          <div className="space-y-2">
            {actionOptions.map((act) => {
              const Icon = act.icon;
              const isSelected = selectedAction === act.id;

              let activeColors = "bg-teal-700 text-white border-teal-800 shadow-sm";
              if (act.id === "Generate Report & Discharge") {
                activeColors = isSelected
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                  : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Issue e-Prescription & Discharge") {
                activeColors = isSelected
                  ? "bg-teal-700 text-white border-teal-800 shadow-sm"
                  : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Refer" || act.id === "Refer to DH Nayagarh") {
                activeColors = isSelected
                  ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                  : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Teleconsultation Video Call") {
                activeColors = isSelected
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                  : "border-slate-200 hover:border-slate-300";
              }

              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setSelectedAction(act.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? activeColors
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {act.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? "text-white/80" : "text-slate-500"
                        }`}
                      >
                        {act.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold shrink-0">&rarr;</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1. When Generate Report & Discharge: Clean Groq AI Generator Card */}
        {selectedAction === "Generate Report & Discharge" && (
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Official Clinical Discharge Summary &amp; Rx</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Generate NABH-standard discharge report and clinical prescription matching the official state hospital format.
            </p>

            {/* Clean Generate Button */}
            <div className="pt-1">
              {!dischargeReportData ? (
                <button
                  type="button"
                  disabled={isGeneratingDischarge}
                  onClick={handleGenerateDischargeReport}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  {isGeneratingDischarge ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Synthesizing Discharge Report...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
                      <span>⚡ Generate AI Clinical Discharge Report</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-800 truncate">
                          Discharge Report Ready
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {dischargeReportData.prescribedMedications?.length || 0} Medications &bull; Ready for doctor verification
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDischargeModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Verify &amp; Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isGeneratingDischarge}
                      onClick={handleGenerateDischargeReport}
                      className="flex-1 py-1.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer text-center"
                    >
                      {isGeneratingDischarge ? "Regenerating..." : "🔄 Regenerate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (dischargeReportData) {
                          const doc = generateDischargePdf(dischargeReportData);
                          doc.save(`${selectedCase.patientId || selectedCase.id}_Discharge_Summary.pdf`);
                        }
                      }}
                      className="py-1.5 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. When Refer Action: Show Input to Choose Medical to Refer */}
        {(selectedAction === "Refer" || selectedAction.startsWith("Refer")) && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
              <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Choose Medical Center to Refer</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Select the hospital or medical institution for patient referral and higher-level care.
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-800">
                  Destination Medical / Hospital
                </label>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Database Verified Facilities
                </span>
              </div>
              <select
                value={referralFacilityId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setReferralFacilityId(val);
                  const match = availableFacilities.find((f) => f.id === val);
                  if (match) setReferralHospital(match.name);
                }}
                disabled={loadingFacilities}
                className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                {loadingFacilities ? (
                  <option value="">Loading facilities from database...</option>
                ) : availableFacilities.length > 0 ? (
                  availableFacilities.map((fac) => {
                    const locParts = [fac.block, fac.district, fac.state].filter(Boolean);
                    const locText = locParts.length ? ` — ${locParts.join(", ")}` : "";
                    return (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}{locText}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>No registered facilities found in database</option>
                )}
              </select>
            </div>

            {/* Transfer Reason Field */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-bold text-slate-800">
                Transfer Reason &amp; Clinical Justification
              </label>
              <textarea
                rows={3}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                placeholder="e.g. Higher-level secondary care required, ICU bed needed, specialized cardiology/trauma evaluation..."
                className="w-full p-2.5 bg-white border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 rounded-xl text-xs text-slate-800 font-medium outline-hidden transition-all"
              />
            </div>
          </div>
        )}

        {/* 4. When Teleconsultation Action: Video Call Option */}
        {selectedAction === "Teleconsultation Video Call" && (
          <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
              <Video className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>Teleconsultation (Video Call)</span>
            </div>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Initiate live audio-video consultation with patient {selectedCase.name} ({selectedCase.phone}).
            </p>

            <div className="p-3 bg-white rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
              <div className="text-xs min-w-0">
                <div className="font-bold text-slate-900 truncate">
                  {selectedCase.name} ({selectedCase.patientId})
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Language: {selectedCase.language} &bull; {selectedCase.phone}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVideoCallModalOpen(true);
                  setCallDuration(0);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 animate-pulse"
              >
                <Video className="w-4 h-4" />
                <span>Start Video Call</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-amber-950">Next Action Required:</span>
                <p className="text-[11px] leading-relaxed">
                  After concluding the live video call, an alert prompt will ask you to choose a definitive clinical disposition: <strong>Generate Report &amp; Discharge</strong> (Complete), <strong>Issue e-Prescription &amp; Discharge</strong> (Complete), or <strong>Refer</strong> (Referred).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Review Note Form */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Doctor Review Note &amp; Differential Diagnosis
          </label>

          <textarea
            rows={3}
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value.slice(0, 1000))}
            placeholder="Write clinical assessment, differential diagnosis, and doctor orders here..."
            className="w-full p-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 outline-hidden transition-all"
          />
        </div>

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmitReview}
          className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Submit Clinical Decision</span>
        </button>

        {/* Audit Disclaimer Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Actions are logged for ABDM clinical audit. Please ensure all prescriptions and diagnoses are verified.
          </span>
        </div>
      </div>
    </div>
  );
}
