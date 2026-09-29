"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { 
  AlertOctagon, 
  PhoneCall, 
  Siren, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Radio, 
  ArrowRight,
  UserCheck
} from "lucide-react";

export default function NurseEscalationsPage() {
  const { user } = useAuth();
  const [dispatched, setDispatched] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string>("TR-9042");

  const emergencies = [
    {
      id: "TR-9042",
      patient: "Meera Patel (62y, Female)",
      abhaId: "91-3312-7801-4433",
      urgency: "Urgent",
      redFlag: "Severe Hypoxemic Respiratory Failure (SpO2 88% on room air, BP 178/104 mmHg)",
      location: "Sector 4 Community Sub-Centre (Room 2)",
      recommendedAction: "108 Ambulance Transfer to District Hospital ICU + High-flow O2 (4L/min)",
      dispatched: false
    },
    {
      id: "TR-9039",
      patient: "Sunita Yadav (24y, Female)",
      abhaId: "91-7712-9901-3344",
      urgency: "Urgent",
      redFlag: "Postpartum Hemorrhage with Signs of Hemorrhagic Shock (BP 82/50 mmHg)",
      location: "Maternal Health Clinic Ward B",
      recommendedAction: "Immediate IV fluid resuscitation + Blood Bank Crossmatch Request",
      dispatched: true
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
          Screen 838118 &bull; Emergency Dispatch Protocol
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Red Flag Escalations &amp; Emergency Tele-Triage
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Rapid escalation corridor between rural sub-centres and district hospital critical care specialists.
        </p>
      </div>

      {/* Emergency Dispatch Banner */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
            <Siren className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-rose-950">Active Critical Cases: 1 Patient Awaiting Transport</h2>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                Stat Priority
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-0.5">
              Protocol: Immediate supplemental oxygen, line access, and tele-consultation with District Medical Officer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <a
            href="tel:108"
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call 108 Ambulance</span>
          </a>
        </div>
      </div>

      {/* Escalation Cases List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Critical Clinical Cases</h3>

        {emergencies.map((em) => (
          <div
            key={em.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-rose-300 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500 font-bold">{em.id}</span>
                  <h4 className="text-base font-bold text-slate-900">{em.patient}</h4>
                  <UrgencyBadge urgency={em.urgency} size="sm" />
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  ABHA ID: <strong className="text-slate-700">{em.abhaId}</strong> &bull; Location: {em.location}
                </div>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 self-start">
                {em.dispatched || (dispatched && selectedCase === em.id) ? "Ambulance Dispatched" : "Awaiting Transport"}
              </span>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Critical Clinical Flag:
              </span>
              <p className="text-rose-800 font-medium pl-5">{em.redFlag}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                <strong className="text-slate-800">Action:</strong> {em.recommendedAction}
              </div>

              {!(em.dispatched || (dispatched && selectedCase === em.id)) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCase(em.id);
                    setDispatched(true);
                  }}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Confirm Dispatch &amp; Tele-Alert</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ambulance Dispatched • ETA: 8 min</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
