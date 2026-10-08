"use client";

import React from "react";
import { Award, Lock, ShieldCheck, Clock, FileCheck } from "lucide-react";

interface CompetencyItem {
  name: string;
  level: string;
  desc: string;
}

interface DoctorProfileCompetenciesProps {
  competencies: CompetencyItem[];
  facility: string;
  councilReg: string;
}

export function DoctorProfileCompetencies({
  competencies,
  facility,
  councilReg,
}: DoctorProfileCompetenciesProps) {
  return (
    <div className="space-y-6">
      {/* Clinical Competencies Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-4 h-4 text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            Clinical Certifications &amp; Sub-Specialties
          </h2>
        </div>

        <div className="space-y-3">
          {competencies.map((c, i) => (
            <div
              key={i}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{c.name}</span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {c.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Station Security & Audit Trail */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Security &amp; Digital Locker
          </h2>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Aadhaar e-KYC linked for digital prescription handoff &amp; e-sign</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Active authenticated session linked to {facility}</span>
          </div>
          <div className="p-2.5 bg-teal-50/70 rounded-xl border border-teal-200/70 flex items-center gap-2 text-teal-900">
            <FileCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>Medical Council Registry: Verified &amp; Licensed ({councilReg})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
