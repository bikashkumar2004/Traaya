"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { 
  Clock, 
  HeartPulse, 
  Activity, 
  FileText, 
  ShieldCheck, 
  Pill, 
  AlertCircle, 
  Calendar,
  Building2
} from "lucide-react";

export default function DoctorPatientHistoryPage() {
  const { user } = useAuth();
  const [patient] = useState({
    name: "Aarav Sharma",
    age: 38,
    gender: "Male",
    bloodGroup: "B+",
    abhaId: "91-4421-8932-1049",
    primaryPHC: "Dharavi PHC Sector 3",
    knownAllergies: ["Penicillin (Mild urticaria)"],
    chronicConditions: ["Essential Hypertension (Grade 1)", "Mild Bronchial Hyperreactivity"]
  });

  const vitalTrends = [
    { date: "14 Sep 2026 (Today)", bp: "124/82", spo2: 96, pulse: 104, temp: 101.8, flag: "Fever / Tachycardia" },
    { date: "28 Aug 2026", bp: "126/80", spo2: 98, pulse: 74, temp: 98.4, flag: "Stable" },
    { date: "12 Jul 2026", bp: "138/88", spo2: 97, pulse: 82, temp: 98.6, flag: "Pre-hypertensive" },
    { date: "04 May 2026", bp: "130/84", spo2: 98, pulse: 76, temp: 98.2, flag: "Stable" }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
          Screen 829e5b &bull; Longitudinal Electronic Health Record
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Longitudinal EHR &amp; Clinical History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          ABDM consolidated medical history, physiological telemetry trends, and chronic medication registry.
        </p>
      </div>

      {/* Patient Dossier Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            AS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{patient.name}</h2>
              <span className="text-xs text-slate-500 font-medium">({patient.age}y, {patient.gender})</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                ABHA Linked
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
              <span>ABHA ID: <strong className="text-slate-800 font-mono">{patient.abhaId}</strong></span>
              <span>&bull;</span>
              <span>Blood Group: <strong className="text-slate-800">{patient.bloodGroup}</strong></span>
              <span>&bull;</span>
              <span>Centre: <strong className="text-slate-800">{patient.primaryPHC}</strong></span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Longitudinal Records</span>
          <span className="text-xs font-bold text-teal-800">4 Clinical Encounters Logged</span>
        </div>
      </div>

      {/* Clinical Flags Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs space-y-1">
          <span className="font-bold text-rose-900 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Documented Drug Allergies
          </span>
          <p className="text-rose-800 font-semibold">{patient.knownAllergies.join(", ")}</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs space-y-1">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-teal-600" />
            Chronic Conditions Registry
          </span>
          <p className="text-slate-600">{patient.chronicConditions.join(" • ")}</p>
        </div>
      </div>

      {/* Physiological Telemetry Trends Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span>Telemetry Trends Over Time (BP, Pulse, SpO2, Temp)</span>
          </h3>
          <span className="text-xs text-slate-500">Cross-centre verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date &amp; Clinical Visit</th>
                <th className="py-3 px-4">Blood Pressure</th>
                <th className="py-3 px-4">Oxygen Saturation</th>
                <th className="py-3 px-4">Heart Pulse</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Trajectory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vitalTrends.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{v.date}</td>
                  <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-800">{v.bp} mmHg</td>
                  <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-800">{v.spo2}%</td>
                  <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-800">{v.pulse} bpm</td>
                  <td className="py-3.5 px-4 tabular-nums font-semibold text-slate-800">{v.temp}°F</td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      v.flag.includes("Fever") ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {v.flag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
