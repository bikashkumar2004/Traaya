"use client";

import React from "react";
import { Droplet } from "lucide-react";
import { OrganizationPatient } from "@/lib/organization-data";

interface OrganizationDossierModalProps {
  patient: OrganizationPatient | null;
  onClose: () => void;
  onFastTrackReferral: (patient: OrganizationPatient) => void;
  cleanPriorityText: (priority: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
}

export const OrganizationDossierModal: React.FC<OrganizationDossierModalProps> = ({
  patient,
  onClose,
  onFastTrackReferral,
  cleanPriorityText,
  getPriorityBadgeClass,
}) => {
  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900">{patient.name}</h3>
            <span className="text-xs text-teal-800 font-bold">
              {patient.memberId} &bull; {patient.organizationName}
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getPriorityBadgeClass(patient.triagePriority)}`}>
            {cleanPriorityText(patient.triagePriority)}
          </span>
        </div>

        {/* Vital Signs & Clinical Vitals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Group</span>
            <span className="font-black text-rose-700 text-sm flex items-center gap-1">
              <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
              <span>{patient.bloodGroup}</span>
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Blood Pressure</span>
            <span className="font-bold text-slate-900 text-sm">{patient.latestVitals.bp} mmHg</span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Oxygen Saturation</span>
            <span className={`font-bold text-sm ${patient.latestVitals.spo2 < 92 ? "text-rose-600 font-black" : "text-emerald-700"}`}>
              {patient.latestVitals.spo2}% SpO2
            </span>
          </div>

          <div className="p-2 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Pulse Rate</span>
            <span className="font-bold text-slate-900 text-sm">{patient.latestVitals.pulse} bpm</span>
          </div>
        </div>

        {/* Demographic Summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">National Health UHID:</span>
            <span className="font-mono font-bold text-teal-800">{patient.patientUhid}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Department / Division:</span>
            <span className="font-bold text-slate-800">{patient.department}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Age &amp; Gender:</span>
            <span className="font-bold text-slate-800">{patient.age} Y, {patient.gender}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Contact Phone:</span>
            <span className="font-bold text-slate-800">{patient.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Residential Address:</span>
            <span className="font-medium text-slate-700 text-right max-w-xs">{patient.address}</span>
          </div>
        </div>

        {/* Latest Symptoms in Dossier */}
        <div className="text-xs space-y-1">
          <span className="text-slate-500 font-bold block">Latest Reported Symptoms</span>
          <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            {patient.latestSymptoms && patient.latestSymptoms.length > 0 ? (
              patient.latestSymptoms.map((sym, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-teal-200 text-teal-900 rounded-lg text-xs font-bold shadow-2xs">
                  {sym}
                </span>
              ))
            ) : (
              <span className="text-slate-500">None reported (Routine Checkup)</span>
            )}
          </div>
        </div>

        {/* Occupational Health Observation Note */}
        <div className="text-xs space-y-1">
          <span className="text-slate-500 font-bold block">Occupational Health &amp; Triage Assessment</span>
          <p className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-teal-950 leading-relaxed font-medium">
            {patient.healthNotes}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Close Dossier
          </button>

          <button
            type="button"
            onClick={() => onFastTrackReferral(patient)}
            className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer"
          >
            Fast-Track CHC Doctor Referral
          </button>
        </div>
      </div>
    </div>
  );
};
