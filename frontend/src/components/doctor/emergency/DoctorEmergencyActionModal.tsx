"use client";

import React from "react";
import {
  AlertTriangle,
  X,
  Zap,
  Ambulance,
  Bed,
  Check,
  ChevronRight,
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { EmergencyDispositionType } from "../DoctorEmergencyCasesView";

interface DoctorEmergencyActionModalProps {
  selectedCase: CaseDetails | null;
  onClose: () => void;
  extractCaseVitals: (caseItem: CaseDetails) => {
    spo2: number;
    bp: string;
    pulse: number;
    temp: string;
  };
  dispositionType: EmergencyDispositionType;
  setDispositionType: (type: EmergencyDispositionType) => void;
  targetHospital: string;
  setTargetHospital: (val: string) => void;
  ambulancePreAlert: boolean;
  setAmbulancePreAlert: (val: boolean) => void;
  enRouteOrders: string;
  setEnRouteOrders: (val: string) => void;
  assignedBay: string;
  setAssignedBay: (val: string) => void;
  bayOrders: string;
  setBayOrders: (val: string) => void;
  selectedProtocolPreset: string;
  handleApplyPreset: (presetKey: string) => void;
  statOrdersText: string;
  setStatOrdersText: (val: string) => void;
  nurseDirectives: string;
  setNurseDirectives: (val: string) => void;
  handleCommitEmergencyDisposition: () => void;
}

export function DoctorEmergencyActionModal({
  selectedCase,
  onClose,
  extractCaseVitals,
  dispositionType,
  setDispositionType,
  targetHospital,
  setTargetHospital,
  ambulancePreAlert,
  setAmbulancePreAlert,
  enRouteOrders,
  setEnRouteOrders,
  assignedBay,
  setAssignedBay,
  bayOrders,
  setBayOrders,
  selectedProtocolPreset,
  handleApplyPreset,
  statOrdersText,
  setStatOrdersText,
  nurseDirectives,
  setNurseDirectives,
  handleCommitEmergencyDisposition,
}: DoctorEmergencyActionModalProps) {
  if (!selectedCase) return null;

  const modalVitals = extractCaseVitals(selectedCase);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-rose-300 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-rose-50 px-5 sm:px-6 py-4 border-b border-rose-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                  Emergency Order Directives &bull; {selectedCase.id}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                  UHID: {selectedCase.patientId}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">
                {selectedCase.name} ({selectedCase.age} yrs &bull; {selectedCase.gender})
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Patient Live Vitals Banner */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black uppercase tracking-wide text-rose-400">
                Bedside Vitals:
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className={modalVitals.spo2 < 90 ? "text-rose-400 font-black" : "text-emerald-400"}>
                SpO2: {modalVitals.spo2}%
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-amber-300">BP: {modalVitals.bp} mmHg</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-teal-300">HR: {modalVitals.pulse} bpm</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-slate-200">Temp: {modalVitals.temp}</span>
            </div>
          </div>

          {/* Disposition Action Mode Selector */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Select Emergency Clinical Disposition:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDispositionType("stat_protocol")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  dispositionType === "stat_protocol"
                    ? "bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-500/30"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    dispositionType === "stat_protocol"
                      ? "bg-white/20 text-white"
                      : "bg-teal-100 text-teal-800"
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold leading-tight">STAT Resuscitation</div>
                  <div
                    className={`text-[10px] mt-0.5 leading-tight ${
                      dispositionType === "stat_protocol" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    Bedside Emergency Orders
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDispositionType("transfer")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  dispositionType === "transfer"
                    ? "bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-500/30"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    dispositionType === "transfer"
                      ? "bg-white/20 text-white"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  <Ambulance className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold leading-tight">108 Referral &amp; Transfer</div>
                  <div
                    className={`text-[10px] mt-0.5 leading-tight ${
                      dispositionType === "transfer" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    District Hospital / Tertiary
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDispositionType("admit_bay")}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                  dispositionType === "admit_bay"
                    ? "bg-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-600/30"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    dispositionType === "admit_bay"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  <Bed className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold leading-tight">Admit Red Bay</div>
                  <div
                    className={`text-[10px] mt-0.5 leading-tight ${
                      dispositionType === "admit_bay" ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    Resuscitation / HDU Bed
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Disposition Specific Content Area */}
          {dispositionType === "transfer" && (
            <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-4 animate-in fade-in">
              <div className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                <Ambulance className="w-4 h-4 text-rose-600" />
                <span>108 Emergency Ambulance Protocol &amp; Target Hospital</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Target Referral Medical Facility:
                </label>
                <select
                  value={targetHospital}
                  onChange={(e) => setTargetHospital(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="District Hospital (DH) Nayagarh - Trauma & CCU">
                    District Hospital (DH) Nayagarh - Trauma &amp; CCU (18 km)
                  </option>
                  <option value="AIIMS Bhubaneswar - Tertiary Cardiac & ICU">
                    AIIMS Bhubaneswar - Tertiary Cardiac &amp; ICU (82 km)
                  </option>
                  <option value="SCB Medical College & Hospital, Cuttack">
                    SCB Medical College &amp; Hospital, Cuttack - Comprehensive Emergency Care
                  </option>
                  <option value="Capital Hospital, Bhubaneswar">
                    Capital Hospital, Bhubaneswar - Emergency Medicine Department
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-rose-200">
                <input
                  type="checkbox"
                  id="ambulanceAlert"
                  checked={ambulancePreAlert}
                  onChange={(e) => setAmbulancePreAlert(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="ambulanceAlert" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Pre-alert 108 Command Center &amp; District Hospital Trauma Desk (Zero Handover Delay)
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  En-Route Clinical Support &amp; Paramedic Handover Directives:
                </label>
                <textarea
                  rows={3}
                  value={enRouteOrders}
                  onChange={(e) => setEnRouteOrders(e.target.value)}
                  placeholder="Specify required oxygen flow, IV medications, defibrillator standby, or monitoring frequency..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {dispositionType === "admit_bay" && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-slate-700" />
                <span>Red Resuscitation Bay / Emergency HDU Assignment</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Designated Bed / Resuscitation Bay:
                </label>
                <select
                  value={assignedBay}
                  onChange={(e) => setAssignedBay(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-600 focus:outline-none"
                >
                  <option value="Red Resuscitation Bay 01 (Multipara Monitor + Defibrillator)">
                    Red Resuscitation Bay 01 (Multipara Monitor + Defibrillator) - Immediate Available
                  </option>
                  <option value="Red Resuscitation Bay 02 (Crash Cart Ready)">
                    Red Resuscitation Bay 02 (Crash Cart Ready) - Available
                  </option>
                  <option value="Emergency HDU Bed 01 (Step-Down Monitoring)">
                    Emergency HDU Bed 01 (Step-Down Monitoring)
                  </option>
                  <option value="Trauma Care Bay (Surgical Debridement & Hemostasis)">
                    Trauma Care Bay (Surgical Debridement &amp; Hemostasis)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Resuscitation Directives &amp; Bedside Equipment Checklist:
                </label>
                <textarea
                  rows={3}
                  value={bayOrders}
                  onChange={(e) => setBayOrders(e.target.value)}
                  placeholder="Specify vital monitoring intervals, crash cart ready state, suction apparatus..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-600 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {dispositionType === "stat_protocol" && (
            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-teal-950 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-teal-700" />
                  <span>One-Click Emergency STAT Protocol Presets</span>
                </span>
                <span className="text-[11px] text-teal-800 font-bold">Autofills Clinical Directives</span>
              </div>

              {/* 1-Click Protocol Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("acs")}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer ${
                    selectedProtocolPreset === "acs"
                      ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  🫀 ACS / STEMI Loading
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("shock")}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer ${
                    selectedProtocolPreset === "shock"
                      ? "bg-teal-700 text-white border-teal-800 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  💧 Dehydration Shock
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("hypoxia")}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer ${
                    selectedProtocolPreset === "hypoxia"
                      ? "bg-sky-600 text-white border-sky-700 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  🫁 Hypoxia / Asthma
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset("anaphylaxis")}
                  className={`p-2.5 rounded-xl border text-xs font-extrabold text-left transition-all cursor-pointer ${
                    selectedProtocolPreset === "anaphylaxis"
                      ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  ⚠️ Anaphylaxis Protocol
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Authorizing Emergency Physician STAT Directives:
                </label>
                <textarea
                  rows={5}
                  value={statOrdersText}
                  onChange={(e) => setStatOrdersText(e.target.value)}
                  placeholder="Doctor's immediate resuscitation orders..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Bedside Nursing Communication Directive */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Bedside Nurse Tele-Directives ({selectedCase.nurseName || "On-Duty Nursing Station"}):
            </label>
            <input
              type="text"
              value={nurseDirectives}
              onChange={(e) => setNurseDirectives(e.target.value)}
              placeholder="Bedside nurse instructions..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          {/* Authorizing Medical Officer Stamp */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold">
                KV
              </div>
              <div>
                <span className="font-bold text-slate-900 block leading-tight">
                  Dr. Kavita Verma, MD (Emergency Medicine / CMO)
                </span>
                <span className="text-[11px] text-slate-500">
                  CHC Emergency Command &bull; Reg: MCI-2018-OD-94821
                </span>
              </div>
            </div>
            <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Authorized Disposition</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-200/60 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitEmergencyDisposition}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>
              {dispositionType === "transfer"
                ? "Authorize & Dispatch 108 Referral"
                : dispositionType === "admit_bay"
                ? "Commit Resuscitation Bay Admission"
                : "Authorize & Transmit STAT Orders"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
