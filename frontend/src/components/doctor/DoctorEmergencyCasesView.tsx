"use client";

import React, { useState } from "react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  X,
} from "lucide-react";
import { DoctorEmergencyCard, DoctorEmergencyActionModal } from "./emergency";

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

export type EmergencyDispositionType = "transfer" | "admit_bay" | "stat_protocol";

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

  // Form states for Red Bay Admission
  const [assignedBay, setAssignedBay] = useState<string>(
    "Red Resuscitation Bay 01 (Multipara Monitor + Defibrillator)"
  );
  const [bayOrders, setBayOrders] = useState<string>(
    "Continuous multipara monitoring, IV Ringer Lactate @ 100ml/hr, crash cart bedside, nurse assigned 1:1."
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

    onAcceptCase(selectedCase, decision, finalNotes);

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
            className="p-1 text-rose-700 hover:text-rose-900 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emergency Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
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
          {redCases.map((c) => (
            <DoctorEmergencyCard
              key={c.id}
              c={c}
              onOpenDispositionModal={handleOpenDispositionModal}
              extractCaseVitals={extractCaseVitals}
            />
          ))}
        </div>
      )}

      {/* INTERACTIVE EMERGENCY ORDER & DISPOSITION MODAL */}
      <DoctorEmergencyActionModal
        selectedCase={selectedCase}
        onClose={() => setSelectedCase(null)}
        extractCaseVitals={extractCaseVitals}
        dispositionType={dispositionType}
        setDispositionType={setDispositionType}
        targetHospital={targetHospital}
        setTargetHospital={setTargetHospital}
        ambulancePreAlert={ambulancePreAlert}
        setAmbulancePreAlert={setAmbulancePreAlert}
        enRouteOrders={enRouteOrders}
        setEnRouteOrders={setEnRouteOrders}
        assignedBay={assignedBay}
        setAssignedBay={setAssignedBay}
        bayOrders={bayOrders}
        setBayOrders={setBayOrders}
        selectedProtocolPreset={selectedProtocolPreset}
        handleApplyPreset={handleApplyPreset}
        statOrdersText={statOrdersText}
        setStatOrdersText={setStatOrdersText}
        nurseDirectives={nurseDirectives}
        setNurseDirectives={setNurseDirectives}
        handleCommitEmergencyDisposition={handleCommitEmergencyDisposition}
      />
    </div>
  );
}
