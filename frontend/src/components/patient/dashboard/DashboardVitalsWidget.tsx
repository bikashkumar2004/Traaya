"use client";

import React from "react";
import Link from "next/link";
import { HeartPulse, Activity, Sparkles } from "lucide-react";
import { TriageTicket, PatientVitalLog } from "./types";

interface DashboardVitalsWidgetProps {
  activeTicket: TriageTicket | null;
  latestVitals?: PatientVitalLog | null;
  onOpenLogger?: () => void;
}

export function DashboardVitalsWidget({
  activeTicket,
  latestVitals,
  onOpenLogger,
}: DashboardVitalsWidgetProps) {
  // Resolve Temperature
  const ticketVitals = activeTicket?.symptoms_data?.vitals || (activeTicket?.vitals as any) || {};
  
  const rawTemp = latestVitals?.temperature ?? ticketVitals?.temperature ?? null;
  const tempVal = rawTemp ? (String(rawTemp).includes("°") ? String(rawTemp) : `${rawTemp}°F`) : null;
  const numTemp = rawTemp ? parseFloat(String(rawTemp).replace(/[^0-9.]/g, "")) : null;

  let tempStatus = "Not recorded";
  let tempStatusClass = "text-slate-400";
  if (numTemp) {
    if (numTemp >= 100.4) {
      tempStatus = "Fever Detected";
      tempStatusClass = "text-rose-700";
    } else if (numTemp >= 99.0) {
      tempStatus = "Mild Fever";
      tempStatusClass = "text-amber-700";
    } else if (numTemp < 96.0) {
      tempStatus = "Hypothermia Alert";
      tempStatusClass = "text-rose-700";
    } else {
      tempStatus = "Resting Normal";
      tempStatusClass = "text-emerald-700 font-medium";
    }
  }

  // Resolve Blood Pressure
  let systolic = latestVitals?.systolic ?? (ticketVitals?.systolic ? Number(ticketVitals.systolic) : null);
  let diastolic = latestVitals?.diastolic ?? (ticketVitals?.diastolic ? Number(ticketVitals.diastolic) : null);

  if ((!systolic || !diastolic) && ticketVitals?.bp) {
    const parts = String(ticketVitals.bp).split("/");
    if (parts.length === 2) {
      systolic = parseInt(parts[0], 10) || systolic;
      diastolic = parseInt(parts[1], 10) || diastolic;
    }
  }

  const bpVal = systolic && diastolic ? `${systolic}/${diastolic}` : null;
  let bpStatus = "Not recorded";
  let bpStatusClass = "text-slate-400";
  if (systolic && diastolic) {
    if (systolic >= 140 || diastolic >= 90) {
      bpStatus = "High BP (Stage 2)";
      bpStatusClass = "text-rose-700 font-semibold";
    } else if (systolic >= 130 || diastolic >= 80) {
      bpStatus = "High BP (Stage 1)";
      bpStatusClass = "text-amber-700 font-medium";
    } else if (systolic >= 120 && diastolic < 80) {
      bpStatus = "Elevated BP";
      bpStatusClass = "text-amber-700 font-medium";
    } else if (systolic < 90 || diastolic < 60) {
      bpStatus = "Low BP (Hypotension)";
      bpStatusClass = "text-amber-700 font-medium";
    } else {
      bpStatus = "Optimal Range";
      bpStatusClass = "text-emerald-700 font-medium";
    }
  }

  // Resolve Pulse
  const rawPulse = latestVitals?.pulse ?? (ticketVitals?.pulse ? Number(ticketVitals.pulse) : null) ?? (ticketVitals?.heart_rate ? Number(ticketVitals.heart_rate) : null);
  const pulseVal = rawPulse ? Number(rawPulse) : null;
  let pulseStatus = "Not recorded";
  let pulseStatusClass = "text-slate-400";
  if (pulseVal) {
    if (pulseVal > 100) {
      pulseStatus = "Elevated (Tachycardia)";
      pulseStatusClass = "text-amber-700 font-medium";
    } else if (pulseVal < 60) {
      pulseStatus = "Low (Bradycardia)";
      pulseStatusClass = "text-amber-700 font-medium";
    } else {
      pulseStatus = "Regular Rhythm";
      pulseStatusClass = "text-slate-500 font-medium";
    }
  }

  // Resolve SpO2
  const rawSpo2 = latestVitals?.spo2 ?? (ticketVitals?.spo2 ? Number(ticketVitals.spo2) : null) ?? (ticketVitals?.oxygen ? Number(ticketVitals.oxygen) : null);
  const spo2Val = rawSpo2 ? Number(rawSpo2) : null;
  let spo2Status = "Not recorded";
  let spo2StatusClass = "text-slate-400";
  if (spo2Val) {
    if (spo2Val < 92) {
      spo2Status = "Hypoxia (Urgent)";
      spo2StatusClass = "text-rose-700 font-bold";
    } else if (spo2Val < 95) {
      spo2Status = "Mild Hypoxemia";
      spo2StatusClass = "text-amber-700 font-medium";
    } else {
      spo2Status = "Good Oxygenation";
      spo2StatusClass = "text-emerald-700 font-medium";
    }
  }

  // Formatting date/time badge
  const formatBadgeDate = (isoStr?: string) => {
    if (!isoStr) return "Verified Baseline";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Verified Baseline";
    }
  };

  const badgeText = latestVitals?.logged_at
    ? formatBadgeDate(latestVitals.logged_at)
    : activeTicket
    ? "Verified Baseline"
    : "No Baseline";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Latest Vitals Telemetry
          </h3>
        </div>
        <span className="text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md font-mono border border-teal-200/60 font-semibold">
          {badgeText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        {/* Body Temperature */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Body Temperature</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            {tempVal || "—"}
          </div>
          <span className={`text-[10px] block mt-0.5 ${tempStatusClass}`}>
            {tempStatus}
          </span>
        </div>

        {/* Blood Pressure */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            {bpVal || "—/—"}
          </div>
          <span className={`text-[10px] block mt-0.5 ${bpStatusClass}`}>
            {bpStatus}
          </span>
        </div>

        {/* Pulse Rate */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            {pulseVal ? (
              <>
                {pulseVal} <span className="text-xs font-normal text-slate-500">bpm</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <span className={`text-[10px] block mt-0.5 ${pulseStatusClass}`}>
            {pulseStatus}
          </span>
        </div>

        {/* SpO2 Oxygen */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] text-slate-500 block">SpO2 Oxygen</span>
          <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
            {spo2Val ? (
              <>
                {spo2Val} <span className="text-xs font-normal text-slate-500">%</span>
              </>
            ) : (
              "—"
            )}
          </div>
          <span className={`text-[10px] block mt-0.5 ${spo2StatusClass}`}>
            {spo2Status}
          </span>
        </div>
      </div>

      {onOpenLogger ? (
        <button
          type="button"
          onClick={onOpenLogger}
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <HeartPulse className="w-3.5 h-3.5 text-teal-700" />
          <span>Log Daily Vitals in Health Locker</span>
        </button>
      ) : (
        <Link
          href="/citizen/reminders"
          className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
        >
          <HeartPulse className="w-3.5 h-3.5 text-teal-700" />
          <span>Log Daily Vitals in Health Locker</span>
        </Link>
      )}
    </div>
  );
}
