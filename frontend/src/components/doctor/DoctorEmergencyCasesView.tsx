"use client";

import React, { useState } from "react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Activity,
  ArrowRight,
  ShieldAlert,
  Building2,
  PhoneCall,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  X,
  FileText,
  Ambulance,
  Bed,
  Zap,
  Check,
  AlertCircle,
  ChevronRight,
  User,
} from "lucide-react";

interface DoctorEmergencyCasesViewProps {
  cases: CaseDetails[];
  onAcceptCase: (
    caseItem: CaseDetails,
    decision: string,
    notes: string,
    prescription?: string
  ) => void;
  onOpenCaseModal?: (caseItem: CaseDetails | null) => void;
}

type EmergencyDispositionType = "transfer" | "admit_bay" | "stat_protocol";

function extractCaseVitals(caseItem: CaseDetails) {
  const notes = `${caseItem.quickNotes || ""} ${caseItem.chiefComplaint || ""}`;
  const spo2Match = notes.match(/SpO2\s*[:=]?\s*(\d+)%/i);
  const bpMatch = notes.match(/BP\s*[:=]?\s*(\d+\/\d+)\s*(?:mmHg)?/i);
  const pulseMatch = notes.match(/(?:Pulse|PR|HR)\s*[:=]?\s*(\d+)\s*(?:bpm)?/i);

  const spo2 = spo2Match
    ? parseInt(spo2Match[1], 10)
    : caseItem.id === "#LS1028"
    ? 89
    : 93;
  const bp = bpMatch
    ? bpMatch[1]
    : caseItem.id === "#LS1028"
    ? "184/108"
    : "90/60";
  const pulse = pulseMatch
    ? parseInt(pulseMatch[1], 10)
    : caseItem.id === "#LS1028"
    ? 112
    : 104;
  const temp = caseItem.id === "#LS1026" ? "99.1°F" : "98.4°F";

  return { spo2, bp, pulse, temp };
}

export function DoctorEmergencyCasesView({
  cases,
  onAcceptCase,
}: DoctorEmergencyCasesViewProps) {
  // Filter for RED level triage cases only (Immediate / Red)
  const redCases = cases.filter((c) => {
    const u = `${c.urgency} ${c.aiSuggestion?.priority || ""}`.toLowerCase();
    if (u.includes("yellow") || u.includes("less urgent") || u.includes("green") || u.includes("routine")) {
      return false;
    }
    return (
      u.includes("immediate") ||
      u.includes("immidiate") ||
      u.includes("red") ||
      u.includes("emergency") ||
      u.includes("critical") ||
      u.includes("high")
    );
  });

  // Modal and feedback states
  const [selectedCase, setSelectedCase] = useState<CaseDetails | null>(null);
  const [dispositionType, setDispositionType] =
    useState<EmergencyDispositionType>("stat_protocol");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Transfer
  const [targetHospital, setTargetHospital] = useState<string>(
    "District Hospital (DH) Nayagarh - Trauma & CCU"
  );
  const [ambulancePreAlert, setAmbulancePreAlert] = useState<boolean>(true);
  const [enRouteOrders, setEnRouteOrders] = useState<string>(
    "Continuous High-flow O2 via non-rebreather mask, bilateral IV access maintained, monitor ECG and vital telemetry every 5 mins en route."
  );

  // Form states for Resuscitation Bay Admission
  const [assignedBay, setAssignedBay] = useState<string>(
    "Red Resuscitation Bay 01 (Multipara Monitor + Defibrillator)"
  );
  const [bayOrders, setBayOrders] = useState<string>(
    "Immediate multipara telemetry monitoring, crash cart on standby, establish 2 large-bore peripheral IV lines, continuous SpO2 and cardiac monitoring."
  );

  // Form states for STAT Protocols
  const [selectedProtocolPreset, setSelectedProtocolPreset] =
    useState<string>("acs");
  const [statOrdersText, setStatOrdersText] = useState<string>("");
  const [nurseDirectives, setNurseDirectives] = useState<string>(
    "Perform immediate bedside 12-lead ECG, establish IV access, administer stat loading medications, and record repeat vitals in 15 mins."
  );

  // Open modal with specific disposition mode pre-selected
  const handleOpenDispositionModal = (
    caseItem: CaseDetails,
    initialType: EmergencyDispositionType
  ) => {
    setSelectedCase(caseItem);
    setDispositionType(initialType);

    // Auto-populate intelligent clinical defaults based on case profile
    if (caseItem.id === "#LS1028" || caseItem.chiefComplaint.toLowerCase().includes("chest")) {
      setSelectedProtocolPreset("acs");
      setStatOrdersText(
        "1. STAT 12-lead ECG bedside within 5 minutes\n2. High-Flow O2 via face mask (target SpO2 > 94%)\n3. Tab Aspirin 325mg (chewable) STAT\n4. Tab Clopidogrel 300mg STAT\n5. Sublingual Sorbitrate (Isosorbide Dinitrate) 5mg STAT (BP 184/108 mmHg allows nitrates)\n6. 108 Emergency Ambulance transfer pre-alert to DH Nayagarh Cath Lab / CCU"
      );
      setNurseDirectives(
        "Attach multipara cardiac monitor immediately. Keep defibrillator in standby. Record ECG prior to transfer."
      );
      setTargetHospital("District Hospital (DH) Nayagarh - Trauma & CCU");
    } else if (
      caseItem.id === "#LS1026" ||
      caseItem.chiefComplaint.toLowerCase().includes("gastro") ||
      caseItem.chiefComplaint.toLowerCase().includes("dehydration")
    ) {
      setSelectedProtocolPreset("shock");
      setStatOrdersText(
        "1. Secure two large-bore (18G) IV lines STAT\n2. IV Ringer's Lactate 1000ml rapid IV infusion over 30 mins\n3. Inj. Ondansetron 4mg IV slow push STAT\n4. Draw blood STAT for Serum Electrolytes, Urea, Creatinine, and Blood Glucose\n5. Strict intake/output charting and hourly blood pressure reassessment"
      );
      setNurseDirectives(
        "Administer IV bolus immediately. Keep patient supine with legs elevated. Notify doctor if SBP remains < 90 mmHg after 500ml."
      );
      setTargetHospital("District Hospital (DH) Nayagarh - Inpatient Medical Care");
    } else {
      setSelectedProtocolPreset("hypoxia");
      setStatOrdersText(
        "1. High-flow O2 via non-rebreather mask (10-12 L/min)\n2. Nebulization with Salbutamol 2.5mg + Ipratropium 500mcg STAT\n3. Inj. Hydrocortisone 100mg IV STAT\n4. Portable Chest X-ray STAT"
      );
      setNurseDirectives(
        "Continuous SpO2 monitoring. Target oxygen saturation >= 94%. Keep suction unit prepared."
      );
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedProtocolPreset(presetKey);
    if (presetKey === "acs") {
      setStatOrdersText(
        "1. STAT 12-lead ECG bedside within 5 minutes\n2. High-Flow O2 via face mask (target SpO2 > 94%)\n3. Tab Aspirin 325mg (chewable) STAT\n4. Tab Clopidogrel 300mg STAT\n5. Sublingual Sorbitrate 5mg STAT\n6. 108 Emergency Ambulance transfer pre-alert to DH Nayagarh Cath Lab / CCU"
      );
      setNurseDirectives(
        "Attach cardiac monitor immediately. Keep crash cart on standby. Hand over ECG trace to attending physician."
      );
    } else if (presetKey === "shock") {
      setStatOrdersText(
        "1. Secure two large-bore (18G) IV lines STAT\n2. IV Ringer's Lactate 1000ml rapid IV infusion over 30 mins\n3. Inj. Ondansetron 4mg IV slow push STAT\n4. Draw blood STAT for Serum Electrolytes, Urea, Creatinine, and Blood Glucose\n5. Strict intake/output charting and hourly blood pressure reassessment"
      );
      setNurseDirectives(
        "Administer IV bolus immediately. Keep patient supine. Notify doctor if SBP remains < 90 mmHg."
      );
    } else if (presetKey === "hypoxia") {
      setStatOrdersText(
        "1. High-flow O2 via non-rebreather mask (10-12 L/min)\n2. Nebulization with Salbutamol 2.5mg + Ipratropium 500mcg STAT\n3. Inj. Hydrocortisone 100mg IV STAT\n4. Portable Chest X-ray bedside STAT\n5. Continuous pulse oximetry monitoring"
      );
      setNurseDirectives(
        "Continuous SpO2 monitoring. Target oxygen saturation >= 94%. Prepare nebulizer chamber immediately."
      );
    } else if (presetKey === "anaphylaxis") {
      setStatOrdersText(
        "1. Inj. Adrenaline (1:1000) 0.5mg IM STAT anterolateral thigh\n2. High-flow O2 (10-15 L/min)\n3. Rapid IV Normal Saline 1000ml bolus\n4. Inj. Hydrocortisone 200mg IV STAT\n5. Inj. Chlorpheniramine 10mg IV slow STAT"
      );
      setNurseDirectives(
        "Prepare repeat Adrenaline dose in 5 minutes if no clinical improvement. Monitor airway patency."
      );
    }
  };

  const handleCommitEmergencyDisposition = () => {
    if (!selectedCase) return;

    let decision = "Confirm Triage & Approve";
    let finalNotes = "";
    let toastSummary = "";

    if (dispositionType === "transfer") {
      decision = "Refer";
      finalNotes = `108 EMERGENCY AMBULANCE TRANSFER & REFERRAL AUTHORIZED\nTarget Facility: ${targetHospital}\n108 Ambulance Status: ${
        ambulancePreAlert ? "Dispatched & Pre-alerted (Critical Care Escort)" : "Standard Ambulance Transfer"
      }\nEn-Route Directives: ${enRouteOrders}\nAttending Sign-off: Dr. Kavita Verma, MD (Emergency CMO)`;
      toastSummary = `108 Emergency Ambulance dispatched & referral authorized for ${selectedCase.name} (${selectedCase.id}) to ${targetHospital}.`;
    } else if (dispositionType === "admit_bay") {
      decision = "Admit to Ward";
      finalNotes = `RED RESUSCITATION BAY ADMISSION AUTHORIZED\nAssigned Location: ${assignedBay}\nEmergency Orders: ${bayOrders}\nImmediate Bedside Nurse Directives: ${nurseDirectives}\nAttending Sign-off: Dr. Kavita Verma, MD (Emergency CMO)`;
      toastSummary = `${selectedCase.name} (${selectedCase.id}) admitted to ${assignedBay}. Crash cart & telemetry active.`;
    } else {
      decision = "Confirm Triage & Approve";
      finalNotes = `STAT CLINICAL RESUSCITATION PROTOCOL APPROVED\nProtocol Type: ${selectedProtocolPreset.toUpperCase()}\nPhysician Directives:\n${statOrdersText}\nBedside Nurse Instructions: ${nurseDirectives}\nAttending Sign-off: Dr. Kavita Verma, MD (Emergency CMO)`;
      toastSummary = `STAT Emergency Orders authorized and transmitted to bedside nursing team for ${selectedCase.name} (${selectedCase.id}).`;
    }

    // Call upstream case acceptance handler (removes case from active queue and saves to Review History)
    onAcceptCase(selectedCase, decision, finalNotes);

    // Close modal & display toast
    setSelectedCase(null);
    setToastMessage(toastSummary);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-rose-700 hover:text-rose-900 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emergency Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/90 text-rose-900 border border-rose-300/80 mb-2 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
            <span>CRITICAL RED-LEVEL ESCALATIONS &bull; Zero Wait Time Protocol</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
            <span>Emergency Cases &bull; Critical Triage Command</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            High-priority patients with acute physiological compromise, severe hypoxia, or unstable hemodynamics requiring immediate emergency physician orders, resuscitation bay admission, or 108 trauma transfer.
          </p>
        </div>

        {/* Quick KPI Cards */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-2xl text-right shadow-2xs min-w-[130px]">
            <div className="flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <div className="text-2xl font-black text-rose-700">{redCases.length}</div>
            </div>
            <div className="text-[10px] text-rose-800 font-extrabold uppercase tracking-wider">Active Red Cases</div>
          </div>

          <div className="px-4 py-2.5 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-2xs">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span>108 Emergency Hotline</span>
            </div>
            <div className="text-sm font-black text-white mt-0.5 tracking-wide">108 &bull; 06753-252002</div>
          </div>
        </div>
      </div>

      {/* Emergency Cases List */}
      {redCases.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="text-lg font-extrabold text-slate-800">No Critical Red-Level Cases Pending</div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            All acute emergency patients have been stabilized, admitted to the resuscitation bay, or transferred via 108 ambulance.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {redCases.map((c) => {
            const vitals = extractCaseVitals(c);
            const isSevereHypoxia = vitals.spo2 < 90;
            const isHypotensive = vitals.bp.startsWith("90/") || vitals.bp.startsWith("8");

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border-2 border-rose-300 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col"
              >
                {/* Card Top Ribbon */}
                <div className="bg-rose-50/90 px-5 py-3 border-b border-rose-200/90 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-950">
                      CRITICAL PRIORITY &bull; {c.id}
                    </span>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                      UHID: {c.patientId}
                    </span>
                    {c.nurseName && (
                      <span className="text-xs font-medium text-slate-600 hidden sm:inline">
                        Triaged by {c.nurseName}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-rose-800 font-bold flex items-center gap-1.5 bg-rose-100/70 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Elapsed Wait: {c.submittedTime}</span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  {/* Row 1: Patient Details + Action Buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>{c.name}</span>
                        <span className="text-sm font-normal text-slate-500">
                          ({c.age} yrs &bull; {c.gender})
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Residence: <strong className="text-slate-800 font-semibold">{c.location}</strong> &bull; Language: {c.language} &bull; Consent: {c.consent}
                      </p>
                    </div>

                    {/* Quick Trigger Disposition Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDispositionModal(c, "transfer")}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                      >
                        <Ambulance className="w-4 h-4" />
                        <span>108 Ambulance Dispatch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDispositionModal(c, "admit_bay")}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                      >
                        <Bed className="w-4 h-4" />
                        <span>Reserve Red Bay</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenDispositionModal(c, "stat_protocol")}
                        className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>STAT Doctor Orders</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Vitals Telemetry Monitor Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div
                      className={`p-3 rounded-2xl border flex items-center gap-3 ${
                        isSevereHypoxia
                          ? "bg-rose-100/80 border-rose-300 text-rose-950"
                          : "bg-rose-50/60 border-rose-200 text-rose-900"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
                        <Activity className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800">
                          SpO2 Saturation
                        </div>
                        <div className="text-base sm:text-lg font-black leading-tight flex items-center gap-1.5">
                          <span>{vitals.spo2}%</span>
                          {isSevereHypoxia && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-rose-600 text-white rounded-full font-black uppercase">
                              Severe Hypoxia
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border flex items-center gap-3 ${
                        isHypotensive
                          ? "bg-amber-100/70 border-amber-300 text-amber-950"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
                        <HeartPulse className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                          Blood Pressure
                        </div>
                        <div className="text-base sm:text-lg font-black leading-tight flex items-center gap-1.5">
                          <span>{vitals.bp} mmHg</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
                        <HeartPulse className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                          Heart Rate
                        </div>
                        <div className="text-base sm:text-lg font-black leading-tight">
                          {vitals.pulse} <span className="text-xs font-normal text-slate-500">bpm</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl border bg-slate-50 border-slate-200 text-slate-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shrink-0 shadow-2xs">
                        <Thermometer className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                          Temperature
                        </div>
                        <div className="text-base sm:text-lg font-black leading-tight">
                          {vitals.temp}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Chief Complaint & AI Clinical Red Flag Alert Box */}
                  <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Chief Complaint &bull; Acute Clinical Assessment
                      </span>
                      <span className="text-xs font-bold text-rose-800 bg-white px-2 py-0.5 rounded-md border border-rose-200">
                        Severity: {c.aiInfo?.severity || "Critical"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {c.chiefComplaint}
                    </p>
                    <div className="text-xs text-rose-950 font-medium pt-1 border-t border-rose-200/80">
                      <strong className="text-rose-900">AI Red Flag Alert:</strong> {c.aiSuggestion.reason}
                    </div>
                  </div>

                  {/* Row 4: Nurse Intake Observations & Facility Route */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="font-bold text-slate-800 block mb-1">
                        Nurse Triage Intake Observation:
                      </span>
                      <p className="text-slate-600 leading-relaxed">
                        {c.quickNotes || "Patient triaged at desk. Vital telemetry alert transmitted to on-duty medical officer."}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-800 block mb-0.5">
                          Assigned CHC Facility:
                        </span>
                        <span className="text-teal-900 font-extrabold text-xs">
                          {c.facility || "CHC Khandapada Emergency"} &bull; {c.facilityLocation || "Nayagarh, Odisha"}
                        </span>
                      </div>
                      {c.reports && c.reports.length > 0 && (
                        <span className="text-xs text-teal-800 font-bold bg-teal-50 px-2.5 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 shrink-0">
                          <FileText className="w-3.5 h-3.5 text-teal-600" />
                          <span>{c.reports.length} report</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE EMERGENCY ORDER & DISPOSITION MODAL                          */}
      {/* ========================================================================= */}
      {selectedCase && (
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
                onClick={() => setSelectedCase(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              {/* Patient Live Vitals Banner */}
              {(() => {
                const modalVitals = extractCaseVitals(selectedCase);
                return (
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
                );
              })()}

              {/* Disposition Action Mode Selector (3 Main Emergency Routes) */}
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
                      <div className="text-xs font-extrabold leading-tight">108 Referral & Transfer</div>
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
                    <span>108 Emergency Ambulance Protocol & Target Hospital</span>
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
                        District Hospital (DH) Nayagarh - Trauma & CCU (18 km)
                      </option>
                      <option value="AIIMS Bhubaneswar - Tertiary Cardiac & ICU">
                        AIIMS Bhubaneswar - Tertiary Cardiac & ICU (82 km)
                      </option>
                      <option value="SCB Medical College & Hospital, Cuttack">
                        SCB Medical College & Hospital, Cuttack - Comprehensive Emergency Care
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
                      Pre-alert 108 Command Center & District Hospital Trauma Desk (Zero Handover Delay)
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      En-Route Clinical Support & Paramedic Handover Directives:
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
                        Trauma Care Bay (Surgical Debridement & Hemostasis)
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      Resuscitation Directives & Bedside Equipment Checklist:
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
                onClick={() => setSelectedCase(null)}
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
      )}
    </div>
  );
}
