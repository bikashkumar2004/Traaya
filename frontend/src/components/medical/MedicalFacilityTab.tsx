"use client";

import React from "react";
import {
  Bed,
  AlertTriangle,
  HeartPulse,
  Activity,
  Users,
  Stethoscope,
  Ambulance,
  Building2,
  Package,
  CheckCircle2,
} from "lucide-react";
import {
  FacilityBeds,
  FacilityDoctorStaff,
  getDoctorStatusBadge,
} from "./types";

export interface MedicalFacilityTabProps {
  facilityBeds: FacilityBeds;
  staffDoctors: FacilityDoctorStaff[];
  filteredDoctors: FacilityDoctorStaff[];
  selectedSpecialtyFilter: string;
  setSelectedSpecialtyFilter: (val: string) => void;
  onToggleDoctorStatus: (doctorId: string) => void;
}

export function MedicalFacilityTab({
  facilityBeds,
  staffDoctors,
  filteredDoctors,
  selectedSpecialtyFilter,
  setSelectedSpecialtyFilter,
  onToggleDoctorStatus,
}: MedicalFacilityTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Medical Facility &amp; Staff Availability
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Live bed occupancy telemetry, emergency resuscitation capacity, on-duty clinical specialist rosters, and critical hospital infrastructure readiness.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Station Fully Operational</span>
          </div>
        </div>
      </div>

      {/* Bed Occupancy Telemetry Cards (5 Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Total Bed Capacity</span>
            <Bed className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {facilityBeds.occupiedBeds} <span className="text-sm font-bold text-slate-400">/ {facilityBeds.totalBeds}</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">
            {facilityBeds.totalBeds - facilityBeds.occupiedBeds} Beds Vacant ({Math.round(((facilityBeds.totalBeds - facilityBeds.occupiedBeds)/facilityBeds.totalBeds)*100)}%)
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-700 h-1.5 rounded-full" style={{ width: `${(facilityBeds.occupiedBeds/facilityBeds.totalBeds)*100}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-rose-800">
            <span>Resuscitation Bays</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700">
            {facilityBeds.emergencyBays.occupied} <span className="text-sm font-bold text-rose-400">/ {facilityBeds.emergencyBays.total}</span>
          </div>
          <div className="text-[11px] text-rose-800 font-bold">
            {facilityBeds.emergencyBays.total - facilityBeds.emergencyBays.occupied} ER Bays Ready
          </div>
          <div className="w-full bg-rose-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-rose-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.emergencyBays.occupied/facilityBeds.emergencyBays.total)*100}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800">
            <span>ICU / HDU Beds</span>
            <HeartPulse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {facilityBeds.icuBeds.occupied} <span className="text-sm font-bold text-amber-400">/ {facilityBeds.icuBeds.total}</span>
          </div>
          <div className="text-[11px] text-amber-800 font-bold">
            {facilityBeds.icuBeds.total - facilityBeds.icuBeds.occupied} Critical Beds Vacant
          </div>
          <div className="w-full bg-amber-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.icuBeds.occupied/facilityBeds.icuBeds.total)*100}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-sky-800">
            <span>Oxygen Beds</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-sky-700">
            {facilityBeds.oxygenBeds.occupied} <span className="text-sm font-bold text-sky-400">/ {facilityBeds.oxygenBeds.total}</span>
          </div>
          <div className="text-[11px] text-sky-800 font-bold">
            {facilityBeds.oxygenBeds.total - facilityBeds.oxygenBeds.occupied} High-Flow O2 Ready
          </div>
          <div className="w-full bg-sky-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${(facilityBeds.oxygenBeds.occupied/facilityBeds.oxygenBeds.total)*100}%` }} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Duty Specialists</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {staffDoctors.filter((d) => d.status === "Available" || d.status === "On OPD Duty").length} <span className="text-sm font-bold text-slate-400">/ {staffDoctors.length}</span>
          </div>
          <div className="text-[11px] text-teal-800 font-bold">Active in Clinic / ER</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-teal-700 h-1.5 rounded-full" style={{ width: `${(staffDoctors.filter((d) => d.status !== "Off Duty").length/staffDoctors.length)*100}%` }} />
          </div>
        </div>
      </div>

      {/* On-Duty Doctors & Specialists Roster */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <span>On-Duty Clinical Specialists &amp; Doctors Roster</span>
            </h2>
            <p className="text-xs text-slate-500">
              Live duty status, consultation rooms, and assigned active patient caseload. Click &quot;Toggle Status&quot; to change doctor availability.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["All", "Medicine", "Pediatrics", "Orthopedics", "Surgery", "Pulmonology"].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setSelectedSpecialtyFilter(sp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  selectedSpecialtyFilter === sp
                    ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-extrabold flex items-center justify-center text-xs shadow-xs">
                    {doc.name.replace(/^Dr\.\s*/i, "").split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 leading-tight">{doc.name}</div>
                    <div className="text-[11px] text-teal-800 font-semibold">{doc.specialty}</div>
                  </div>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getDoctorStatusBadge(doc.status)}`}>
                  {doc.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-800">{doc.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Room:</span>
                  <span className="font-mono font-bold text-teal-900 bg-teal-50 px-1.5 rounded">{doc.room}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shift Roster:</span>
                  <span className="text-slate-700">{doc.shift}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Active Cases:</span>
                  <span className="font-bold text-slate-900">{doc.activeCases} assigned</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">{doc.phone}</span>
                <button
                  type="button"
                  onClick={() => onToggleDoctorStatus(doc.id)}
                  className="px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:text-white bg-teal-50 hover:bg-teal-700 border border-teal-200 rounded-lg transition-colors cursor-pointer"
                >
                  Toggle Status ↻
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Hospital Infrastructure Readiness */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
            <Ambulance className="w-4 h-4" />
            <span>108 ALS Ambulance</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">Stationed at Ramp</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Advanced life support defibrillator, ventilator, and trained paramedic on call. Fuel: 95%.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ready for Emergency Transfer
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
            <Activity className="w-4 h-4" />
            <span>Central Medical Oxygen</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">4.2 Bar • 98.4% Purity</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Liquid medical oxygen tank online + 18 back-up jumbo cylinders tested and staged at manifold.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Manifold Normal
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-xs">
            <Building2 className="w-4 h-4" />
            <span>Operation Theatres (OT)</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">Major OT 1 Active</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Major OT 2 in standby readiness for emergency lap/cesarean. Minor OT available for trauma dressing.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            Surgical Team Active
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs">
            <Package className="w-4 h-4" />
            <span>Jan Aushadhi Dispensary</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">24/7 Emergency Counter</div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Emergency resuscitative antibiotics, IV fluids, analgesics, and anti-diabetics fully stocked.
          </p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Adequate Formulary Stock
          </span>
        </div>
      </div>
    </div>
  );
}
