"use client";

import React from "react";
import {
  Plus,
  Users,
  ArrowRightLeft,
  Bed,
  AlertTriangle,
  Package,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  BasicMedicalPatient,
  FacilityBeds,
  InventoryItem,
  getPriorityBadgeClass,
} from "./types";

export interface MedicalDashboardTabProps {
  staffName: string;
  patients: BasicMedicalPatient[];
  pendingReferralsCount: number;
  facilityBeds: FacilityBeds;
  immediateCount: number;
  inventory: InventoryItem[];
  onRegisterPatient: () => void;
  onViewPatients: () => void;
  onViewReferrals: () => void;
  onViewInventory: () => void;
  onRestock: (id: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function MedicalDashboardTab({
  staffName,
  patients,
  pendingReferralsCount,
  facilityBeds,
  immediateCount,
  inventory,
  onRegisterPatient,
  onViewPatients,
  onViewReferrals,
  onViewInventory,
  onRestock,
  getStatusBadge,
}: MedicalDashboardTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Medical Facility Command Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Facility Staff: <strong className="text-slate-900">{staffName}</strong> &bull; Monitor patient intake, review facility referrals, track bed occupancy, and manage essential medicine stocks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={onRegisterPatient}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-200" />
            <span>+ Register Patient</span>
          </button>

          <button
            type="button"
            onClick={onViewPatients}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-teal-700" />
            <span>View Directory</span>
          </button>
        </div>
      </div>

      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Enrolled Patients</span>
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{patients.length}</div>
          <div className="text-[11px] text-teal-800 font-semibold mt-1">Under this facility</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200 bg-purple-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
            <span>Inbound Referrals</span>
            <ArrowRightLeft className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-2">{pendingReferralsCount}</div>
          <div className="text-[11px] text-purple-700 font-semibold mt-1">Awaiting Assignment</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Available Beds</span>
            <Bed className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-2">
            {facilityBeds.totalBeds - facilityBeds.occupiedBeds}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            of {facilityBeds.totalBeds} total beds
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Immediate / Critical</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-2">{immediateCount}</div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">ER Resuscitation</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-teal-200 bg-teal-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
            <span>Drug Inventory</span>
            <Package className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700 mt-2">{inventory.length}</div>
          <div className="text-[11px] text-teal-700 font-semibold mt-1">Essential Stock Items</div>
        </div>
      </div>

      {/* Inbound Referrals Direct Action Banner */}
      {pendingReferralsCount > 0 && (
        <div className="bg-linear-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-purple-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-700/80 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-purple-500/50">
              <ArrowRightLeft className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white tracking-wide">
                  {pendingReferralsCount} Inbound Patient Referrals Awaiting Doctor Assignment
                </span>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30">
                  Inter-Hospital Network
                </span>
              </div>
              <p className="text-xs text-purple-200/90 mt-1 max-w-2xl leading-relaxed">
                Patients transferred by doctors from CHC Khandapada, SDH Nayagarh, and PHC Fategarh. Assign to an on-duty specialist to allocate OPD room and schedule care.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewReferrals}
            className="px-4 py-2.5 bg-white text-purple-950 hover:bg-purple-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Manage Referrals ({pendingReferralsCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Two Column Grid: Recent Patients & Low Inventory Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Patients with Basic Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Facility Patients (Basic Details)</h3>
              <p className="text-xs text-slate-500">Quick demographic registry of arriving and admitted patients.</p>
            </div>
            <button
              type="button"
              onClick={onViewPatients}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({patients.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="pb-2.5">Patient Name</th>
                  <th className="pb-2.5">UHID</th>
                  <th className="pb-2.5">Age / Gender</th>
                  <th className="pb-2.5">Phone</th>
                  <th className="pb-2.5 text-center">Status</th>
                  <th className="pb-2.5 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {patients.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 font-bold text-slate-900">{p.name}</td>
                    <td className="py-2.5 font-mono text-[11px] text-teal-800 font-bold">{p.patientUhid}</td>
                    <td className="py-2.5 text-slate-600">{p.age} yrs • {p.gender}</td>
                    <td className="py-2.5 text-slate-500">{p.phone}</td>
                    <td className="py-2.5 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${getPriorityBadgeClass(p.triagePriority)}`}>
                        {p.triagePriority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Stock Alerts</h3>
              <p className="text-xs text-slate-500">Jan Aushadhi depot items near threshold.</p>
            </div>
            <button
              type="button"
              onClick={onViewInventory}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Store</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {inventory
              .filter((i) => i.status === "Low Stock" || i.status === "Critical")
              .map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/20 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.genericName}</div>
                    <div className="text-[10px] text-slate-500">
                      Stock: <strong className="text-rose-700">{item.currentStock}</strong> / {item.threshold} {item.unit}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestock(item.id)}
                    className="px-2.5 py-1 bg-white border border-teal-300 text-teal-800 hover:bg-teal-800 hover:text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    + Restock
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
