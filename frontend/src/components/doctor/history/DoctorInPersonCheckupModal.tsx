"use client";

import React from "react";
import {
  X,
  Stethoscope,
  Pill,
  Building2,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import { RegisteredFacilityOption } from "@/lib/nurse-api";
import { ReviewedCaseRecord } from "../DoctorReviewHistoryView";

export type HistoryDisposition = "Issue e-Prescription & Discharge" | "Admit to Ward" | "Refer to Hospital";

interface DoctorInPersonCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCaseToReview: ReviewedCaseRecord | null;
  examNotes: string;
  setExamNotes: (val: string) => void;
  disposition: HistoryDisposition;
  setDisposition: (val: HistoryDisposition) => void;
  checkupMedName: string;
  setCheckupMedName: (val: string) => void;
  checkupMedDose: string;
  setCheckupMedDose: (val: string) => void;
  checkupMedFrequency: string;
  setCheckupMedFrequency: (val: string) => void;
  checkupAdditionalMed: string;
  setCheckupAdditionalMed: (val: string) => void;
  availableFacilities: RegisteredFacilityOption[];
  loadingFacilities: boolean;
  checkupReferralFacilityId: string;
  setCheckupReferralFacilityId: (val: string) => void;
  checkupReferralHospital: string;
  setCheckupReferralHospital: (val: string) => void;
  checkupReferralReason: string;
  setCheckupReferralReason: (val: string) => void;
  checkupWardUnit: string;
  setCheckupWardUnit: (val: string) => void;
  checkupWardCareNotes: string;
  setCheckupWardCareNotes: (val: string) => void;
  onCompleteCheckup: () => void;
}

export function DoctorInPersonCheckupModal({
  isOpen,
  onClose,
  selectedCaseToReview,
  examNotes,
  setExamNotes,
  disposition,
  setDisposition,
  checkupMedName,
  setCheckupMedName,
  checkupMedDose,
  setCheckupMedDose,
  checkupMedFrequency,
  setCheckupMedFrequency,
  checkupAdditionalMed,
  setCheckupAdditionalMed,
  availableFacilities,
  loadingFacilities,
  checkupReferralFacilityId,
  setCheckupReferralFacilityId,
  checkupReferralHospital,
  setCheckupReferralHospital,
  checkupReferralReason,
  setCheckupReferralReason,
  checkupWardUnit,
  setCheckupWardUnit,
  checkupWardCareNotes,
  setCheckupWardCareNotes,
  onCompleteCheckup,
}: DoctorInPersonCheckupModalProps) {
  if (!isOpen || !selectedCaseToReview) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>Patient In-Person Arrival Check-in</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Conduct In-Person Checkup &amp; Prescribe
            </h3>
            <p className="text-xs text-slate-500">
              {selectedCaseToReview.name} ({selectedCaseToReview.age}y &bull; {selectedCaseToReview.gender}) &bull; UHID: {selectedCaseToReview.patientId} &bull; Case {selectedCaseToReview.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-600 uppercase text-[10px]">Triage Chief Complaint:</span>
          <p className="text-slate-800 font-semibold mt-0.5">{selectedCaseToReview.chiefComplaint}</p>
        </div>

        {/* 1. Physical Examination Findings */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
            <span>Physical Examination Findings &amp; Clinical Assessment</span>
          </label>
          <textarea
            rows={3}
            value={examNotes}
            onChange={(e) => setExamNotes(e.target.value)}
            placeholder="Record vitals, wound condition, examination findings, and clinical diagnosis..."
            className="w-full p-3 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-teal-600 focus:border-teal-600 resize-none font-medium leading-relaxed bg-white"
          />
        </div>

        {/* 2. Clinical Disposition & Outcome */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Clinical Disposition &amp; Outcome</span>
            <span className="text-[10px] text-teal-700 font-semibold">Select clinical action</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: "Issue e-Prescription & Discharge" as const,
                label: "e-Prescription & Discharge",
                desc: "Prescribe medicines & outpatient discharge",
                icon: Pill,
                activeColor: "bg-teal-50 border-teal-600 text-teal-950 ring-1 ring-teal-600",
              },
              {
                id: "Admit to Ward" as const,
                label: "Admit to Ward",
                desc: "Inpatient bed (Status: Under Review)",
                icon: Building2,
                activeColor: "bg-sky-50 border-sky-600 text-sky-950 ring-1 ring-sky-600",
              },
              {
                id: "Refer to Hospital" as const,
                label: "Refer to Hospital",
                desc: "Transfer to higher trauma center",
                icon: ArrowRightLeft,
                activeColor: "bg-indigo-50 border-indigo-600 text-indigo-950 ring-1 ring-indigo-600",
              },
            ].map((opt) => {
              const IconComponent = opt.icon;
              const isSelected = disposition === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDisposition(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? opt.activeColor
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-slate-900" : "text-slate-500"}`} />
                    <span className="font-bold text-xs">{opt.label}</span>
                  </div>
                  <span className="text-[10px] opacity-75 mt-1 leading-tight">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. DYNAMIC INPUTS BASED ON CLINICAL DISPOSITION */}

        {/* Option 1: e-Prescription & Discharge inputs */}
        {disposition === "Issue e-Prescription & Discharge" && (
          <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-700" />
                <span>e-Prescription &amp; Medication Formulation</span>
              </label>
              <span className="text-[10px] text-teal-800 font-semibold">Formulation for dispensary</span>
            </div>

            {/* Quick suggestions */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {[
                { name: "Tab Amoxicillin-Clav 625mg", dose: "625mg (1 Tablet)", freq: "BD (Twice daily) x 5 days" },
                { name: "Inj. Tetanus Toxoid", dose: "0.5ml IM Stat", freq: "STAT (Immediate)" },
                { name: "Tab Paracetamol 500mg", dose: "500mg (1 Tablet)", freq: "SOS (As needed) x 3 days" },
                { name: "Tab Pantoprazole 40mg", dose: "40mg (1 Tablet)", freq: "OD (Once daily AC) x 5 days" },
                { name: "Antiseptic Betadine Dressing", dose: "Local application", freq: "Once daily x 3 days" },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCheckupMedName(item.name);
                    setCheckupMedDose(item.dose);
                    setCheckupMedFrequency(item.freq);
                  }}
                  className="px-2 py-1 bg-white hover:bg-teal-100 hover:text-teal-950 border border-teal-200 rounded-md text-[10px] font-semibold text-teal-900 transition-colors cursor-pointer"
                >
                  + {item.name.replace("Tab ", "").replace("Inj. ", "")}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={checkupMedName}
                  onChange={(e) => setCheckupMedName(e.target.value)}
                  placeholder="e.g. Tab Amoxicillin-Clav 625mg"
                  className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Dose &amp; Strength
                </label>
                <input
                  type="text"
                  value={checkupMedDose}
                  onChange={(e) => setCheckupMedDose(e.target.value)}
                  placeholder="e.g. 625mg (1 Tablet)"
                  className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={checkupMedFrequency}
                  onChange={(e) => setCheckupMedFrequency(e.target.value)}
                  placeholder="e.g. BD x 5 days"
                  className="w-full px-3 py-2 bg-white border border-teal-300 focus:border-teal-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden"
                />
              </div>
            </div>

            {/* Frequency Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-teal-800 font-bold">Frequency Presets:</span>
              {["OD (Once daily)", "BD (Twice daily)", "TDS (3x daily)", "SOS (As needed)"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCheckupMedFrequency(`${f} x 3 days`)}
                  className="px-2 py-0.5 text-[10px] bg-white border border-teal-200 hover:bg-teal-100 text-teal-900 rounded-md font-semibold cursor-pointer"
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Additional Prescriptions */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-slate-800 mb-1">
                Additional Prescriptions / Specific Instructions
              </label>
              <textarea
                rows={2}
                value={checkupAdditionalMed}
                onChange={(e) => setCheckupAdditionalMed(e.target.value)}
                placeholder="e.g. Inj. Tetanus Toxoid 0.5ml IM Stat&#10;Tab Paracetamol 500mg SOS x 3 days"
                className="w-full p-2.5 font-mono border border-teal-300 rounded-xl text-xs text-slate-800 focus:outline-teal-600 resize-none leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

        {/* Option 2: Refer to Hospital inputs */}
        {disposition === "Refer to Hospital" && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
              <ArrowRightLeft className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Choose Medical Center to Refer</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Select the target medical institution for secondary or tertiary patient transfer.
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
                value={checkupReferralFacilityId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setCheckupReferralFacilityId(val);
                  const match = availableFacilities.find((f) => f.id === val);
                  if (match) setCheckupReferralHospital(match.name);
                }}
                disabled={loadingFacilities}
                className="w-full px-3 py-2 bg-white border border-amber-300 focus:border-amber-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-800">
                Reason for Referral / Transfer Urgency
              </label>
              <textarea
                rows={2}
                value={checkupReferralReason}
                onChange={(e) => setCheckupReferralReason(e.target.value)}
                placeholder="Specify clinical reasons for referral and transport instructions..."
                className="w-full p-2.5 border border-amber-300 rounded-xl text-xs text-slate-800 focus:outline-amber-600 resize-none leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

        {/* Option 3: Admit to Ward inputs */}
        {disposition === "Admit to Ward" && (
          <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-xs">
                <Building2 className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Inpatient Ward &amp; Bed Assignment</span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                Status: Under Review
              </span>
            </div>
            <p className="text-[11px] text-sky-900 leading-relaxed">
              Assign patient to inpatient bed for observation and continuous round care. Status will remain <strong>Under Review</strong> and Action Taken will be updated to <strong>Admit to Ward</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-800">
                Select Inpatient Ward / Unit
              </label>
              <select
                value={checkupWardUnit}
                onChange={(e) => setCheckupWardUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-sky-300 focus:border-sky-600 rounded-xl text-xs text-slate-800 font-medium outline-hidden cursor-pointer"
              >
                <option value="Emergency Observation Unit (Bed 04)">Emergency Observation Unit (Bed 04)</option>
                <option value="General Medicine Male Ward (Bed 12)">General Medicine Male Ward (Bed 12)</option>
                <option value="General Medicine Female Ward (Bed 07)">General Medicine Female Ward (Bed 07)</option>
                <option value="Trauma & Orthopedic Ward (Bed 08)">Trauma &amp; Orthopedic Ward (Bed 08)</option>
                <option value="Surgical Inpatient Ward (Bed 02)">Surgical Inpatient Ward (Bed 02)</option>
                <option value="Pediatric Observation Ward (Bed 06)">Pediatric Observation Ward (Bed 06)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-800">
                Admission Care &amp; Monitoring Orders
              </label>
              <textarea
                rows={2}
                value={checkupWardCareNotes}
                onChange={(e) => setCheckupWardCareNotes(e.target.value)}
                placeholder="Record nursing round instructions, vitals frequency, and inpatient care notes..."
                className="w-full p-2.5 border border-sky-300 rounded-xl text-xs text-slate-800 focus:outline-sky-600 resize-none leading-relaxed bg-white"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCompleteCheckup}
            className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer ${
              disposition === "Issue e-Prescription & Discharge"
                ? "bg-teal-800 hover:bg-teal-900"
                : disposition === "Admit to Ward"
                ? "bg-sky-800 hover:bg-sky-900"
                : "bg-indigo-800 hover:bg-indigo-900"
            }`}
          >
            {disposition === "Issue e-Prescription & Discharge" ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Authorize e-Prescription &amp; Discharge</span>
              </>
            ) : disposition === "Admit to Ward" ? (
              <>
                <Building2 className="w-4 h-4 text-sky-300" />
                <span>Admit to Ward (Under Review)</span>
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 text-indigo-300" />
                <span>Authorize Referral &amp; Transfer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
