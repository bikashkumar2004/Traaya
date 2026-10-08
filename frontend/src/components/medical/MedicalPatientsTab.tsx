"use client";

import React from "react";
import { Plus, Download, Eye } from "lucide-react";
import {
  BasicMedicalPatient,
  MedicalPatientStatus,
  getPriorityBadgeClass,
} from "./types";

export interface MedicalPatientsTabProps {
  patients: BasicMedicalPatient[];
  filteredPatients: BasicMedicalPatient[];
  patientPriorityFilter: string;
  setPatientPriorityFilter: (val: string) => void;
  patientStatusFilter: string;
  setPatientStatusFilter: (val: string) => void;
  onRegisterPatient: () => void;
  onExportCensus: () => void;
  onSelectPatient: (p: BasicMedicalPatient) => void;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function MedicalPatientsTab({
  patients,
  filteredPatients,
  patientPriorityFilter,
  setPatientPriorityFilter,
  patientStatusFilter,
  setPatientStatusFilter,
  onRegisterPatient,
  onExportCensus,
  onSelectPatient,
  getStatusBadge,
}: MedicalPatientsTabProps) {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Facility Patients Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Clean roster showing basic patient identifiers, demographics, status, and triage priority.
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
            onClick={onExportCensus}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              All Facility Patients ({patients.length})
            </h2>
            <p className="text-xs text-slate-500">
              Demographic identifiers and triage care status.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={patientPriorityFilter}
            onChange={(e) => setPatientPriorityFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:bg-white focus:outline-teal-700"
          >
            <option value="All">All Priorities</option>
            <option value="Immediate">Immediate Priority</option>
            <option value="Urgent">Urgent Priority</option>
            <option value="Less Urgent">Less Urgent</option>
            <option value="Routine">Routine / Fit</option>
          </select>

          <select
            value={patientStatusFilter}
            onChange={(e) => setPatientStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:bg-white focus:outline-teal-700"
          >
            <option value="All">All Statuses</option>
            {(["Under Review", "Reverted", "Referred", "Scheduled", "Completed"] as MedicalPatientStatus[]).map((st) => (
              <option key={st} value={st}>
                Status: {st}
              </option>
            ))}
          </select>
        </div>

        {/* Basic Details Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">Sl no.</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">UHID</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Triage Priority</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No matching patient records found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sl no */}
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {String(idx + 1).padStart(2, "0")}
                      </td>

                      {/* Patient Name */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900 text-sm">{p.name}</span>
                      </td>

                      {/* UHID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {p.patientUhid}
                        </span>
                      </td>

                      {/* Age / Gender */}
                      <td className="py-3 px-4 text-slate-700">
                        {p.age} yrs • {p.gender}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600">
                        {p.phone}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(p.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(p.triagePriority)}`}>
                          {p.triagePriority}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectPatient(p)}
                          className="px-3 py-1 rounded-xl bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-700 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
            </span>
            <span className="text-[11px] text-slate-400">Basic details mode active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
