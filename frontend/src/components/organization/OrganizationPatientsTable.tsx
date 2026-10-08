"use client";

import React from "react";
import { Search, Users, Droplet, FileBadge, Eye } from "lucide-react";
import { OrganizationPatient } from "@/lib/organization-data";

interface OrganizationPatientsTableProps {
  orgName: string;
  filteredPatients: OrganizationPatient[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  filterBloodGroup: string;
  setFilterBloodGroup: (v: string) => void;
  filterDepartment: string;
  setFilterDepartment: (v: string) => void;
  bloodGroupsList: string[];
  departmentOptions: string[];
  cleanPriorityText: (priority: string) => string;
  getPriorityBadgeClass: (priority: string) => string;
  onViewIdCard: (patient: OrganizationPatient) => void;
  onViewDossier: (patient: OrganizationPatient) => void;
}

export const OrganizationPatientsTable: React.FC<OrganizationPatientsTableProps> = ({
  orgName,
  filteredPatients,
  searchQuery,
  setSearchQuery,
  filterPriority,
  setFilterPriority,
  filterBloodGroup,
  setFilterBloodGroup,
  filterDepartment,
  setFilterDepartment,
  bloodGroupsList,
  departmentOptions,
  cleanPriorityText,
  getPriorityBadgeClass,
  onViewIdCard,
  onViewDossier,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>All Patient Details ({filteredPatients.length})</span>
            <span className="text-xs font-normal text-slate-500">
              &bull; Registered under {orgName}
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Detailed profile with blood group, uploaded ID card, vital signs telemetry, and triage classification.
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, UHID, ID, or dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-teal-700"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Immediate">Immediate</option>
            <option value="Urgent">Urgent</option>
            <option value="Less Urgent">Less Urgent / Fit</option>
          </select>

          {/* Blood Group Filter */}
          <select
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
          >
            <option value="All">All Blood Groups</option>
            {bloodGroupsList.map((bg) => (
              <option key={bg} value={bg}>
                Blood Group: {bg}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          {departmentOptions.length > 0 && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-teal-700 font-semibold cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Patient Details Table */}
      {filteredPatients.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <div className="text-sm font-bold text-slate-700">No Patients Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No patient records match the selected filter criteria for {orgName}.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Patient Name &amp; UHID</th>
                <th className="py-3 px-4">Org Member ID &amp; Dept</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Uploaded ID Card</th>
                <th className="py-3 px-4">Latest Symptoms</th>
                <th className="py-3 px-4">Latest Vitals</th>
                <th className="py-3 px-4">Triage Priority</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredPatients.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name & UHID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-slate-400 font-normal text-[11px]">
                          ({p.age}y &bull; {p.gender})
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-teal-800">
                        UHID: {p.patientUhid}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.phone}</div>
                    </td>

                    {/* Org Member ID & Department */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{p.memberId}</div>
                      <div className="text-[11px] text-slate-600">{p.department}</div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {p.category}
                      </span>
                    </td>

                    {/* Blood Group */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                        <Droplet className="w-3 h-3 fill-rose-600 text-rose-600" />
                        <span>{p.bloodGroup}</span>
                      </span>
                    </td>

                    {/* Uploaded ID Card with Thumbnail & Zoom */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onViewIdCard(p)}
                        className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/60 transition-all text-left cursor-pointer group"
                      >
                        <div className="w-10 h-7 rounded bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.idCardUrl ? (
                            <img
                              src={p.idCardUrl}
                              alt="ID"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileBadge className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 pr-1">
                          <span className="text-[11px] font-bold text-teal-900 group-hover:underline flex items-center gap-1">
                            <span>View ID</span>
                            <Eye className="w-3 h-3 text-teal-700" />
                          </span>
                          <span className="text-[9px] text-emerald-700 font-bold block leading-none">
                            Verified
                          </span>
                        </div>
                      </button>
                    </td>

                    {/* Latest Symptoms */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[210px]">
                        {p.latestSymptoms && p.latestSymptoms.length > 0 ? (
                          p.latestSymptoms.map((s, idx) => {
                            const isRoutine =
                              s.toLowerCase().includes("none") ||
                              s.toLowerCase().includes("routine") ||
                              s.toLowerCase().includes("clear") ||
                              s.toLowerCase().includes("asymptomatic") ||
                              s.toLowerCase().includes("drill");
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${
                                  isRoutine
                                    ? "bg-slate-50 text-slate-600 border-slate-200"
                                    : "bg-teal-50 text-teal-900 border-teal-200 font-bold"
                                }`}
                              >
                                {s}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">None reported</span>
                        )}
                      </div>
                    </td>

                    {/* Latest Vitals */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        BP: {p.latestVitals.bp} mmHg
                      </div>
                      <div className="text-[10px] text-slate-500">
                        SpO2: <strong className={p.latestVitals.spo2 < 92 ? "text-rose-600" : "text-emerald-700"}>{p.latestVitals.spo2}%</strong> &bull; HR: {p.latestVitals.pulse} bpm
                      </div>
                    </td>

                    {/* Triage Priority */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityBadgeClass(
                          p.triagePriority
                        )}`}
                      >
                        {cleanPriorityText(p.triagePriority)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onViewDossier(p)}
                        className="px-3 py-1 rounded-xl border border-slate-200 text-teal-800 hover:bg-teal-50 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
