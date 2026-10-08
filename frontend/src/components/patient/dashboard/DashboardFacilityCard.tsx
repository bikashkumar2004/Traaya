"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface DashboardFacilityCardProps {
  facilityName?: string;
  patientUhid?: string;
}

export function DashboardFacilityCard({
  facilityName,
  patientUhid,
}: DashboardFacilityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Local PHC Health Facility
          </h3>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          Open Now
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="font-bold text-slate-900">
          {facilityName || <span className="inline-block w-36 h-3.5 bg-slate-200 rounded animate-pulse" />}
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          OPD Hours: 08:30 AM &ndash; 02:00 PM &bull; Emergency Observation Bed Available
        </p>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-600">Citizen UHID:</span>
          <span className="font-mono font-bold text-teal-800">
            {patientUhid || <span className="inline-block w-20 h-3 bg-teal-100 rounded animate-pulse" />}
          </span>
        </div>
      </div>
    </div>
  );
}
