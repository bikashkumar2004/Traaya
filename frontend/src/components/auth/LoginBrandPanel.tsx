"use client";

import React from "react";
import { Users, Building2, Tent, Activity, Stethoscope, Pill } from "lucide-react";
import { AuthSetupCategory } from "./types";

interface LoginBrandPanelProps {
  setupMode: AuthSetupCategory;
}

export const LoginBrandPanel: React.FC<LoginBrandPanelProps> = ({ setupMode }) => {
  return (
    <div className="hidden lg:flex w-full lg:w-[40%] xl:w-[40%] bg-gradient-to-b from-[#064e43] via-[#05433a] to-[#032e27] text-white p-8 xl:p-12 relative overflow-hidden flex-col justify-center shrink-0 h-full">
      {/* Subtle Ambient Decorative Circles */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-7 max-w-[540px]">
        <div>
          <div className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-teal-300">
            {setupMode === "individual" ? "Citizen & Enterprise Gateway" : "Clinical Healthcare Gateway"}
          </div>
          <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight mt-2">
            {setupMode === "individual"
              ? "Individual & Organization Health Portal"
              : "Clinical Health Workers Portal"}
          </h1>
          <p className="text-sm sm:text-base text-teal-100/90 font-normal leading-relaxed mt-3">
            {setupMode === "individual"
              ? "Dedicated workspace for citizens, families, educational campuses, PSU industries, and rural screening camps."
              : "Dedicated workspace for triage nurses, medical officers, dispensary pharmacists, and pathology labs."}
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3.5 pt-2">
          {setupMode === "individual" ? (
            <>
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Patient &amp; Family Care</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Digital health timeline, symptom logging, AI triage, and offline sync.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Institutes &amp; PSU Industries</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Track student and employee vitals telemetry, occupational health, and CHC referrals.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Tent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Temporary Health Camps</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Rapid screening intake tokens, field vitals logging, and emergency 108 ambulance dispatch.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Triage Nurses &amp; ASHA</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Bedside rapid assessment, priority queue escalation, and live vitals telemetry.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Doctors &amp; Chief Medical Officers</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Clinical audits, protocol overrides, differential diagnosis, and e-prescriptions.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-teal-300 shrink-0 mt-0.5">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-white">Medical, Pharmacy &amp; Lab</div>
                  <div className="text-xs sm:text-sm text-teal-100/80 leading-relaxed mt-0.5">
                    Jan Aushadhi e-prescription dispensing queue, essential inventory, and AI OCR report desk.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
