"use client";

import React from "react";
import {
  Search,
  ArrowRight,
  ListChecks,
  UserCheck,
  Clock,
  Video,
  Building2,
  Languages,
  Activity,
  FileText
} from "lucide-react";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface DoctorQueueListViewProps {
  filteredCases: CaseDetails[];
  totalCount: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  filterPriority: string;
  setFilterPriority: (val: string) => void;
  queueSearch: string;
  setQueueSearch: (val: string) => void;
  onSelectCase: (caseItem: CaseDetails | null) => void;
  formatUrgencyLabel: (urgency: string, priority?: string) => { label: string; badgeClass: string };
  formatReviewStatus: (status: string, nurseName?: string, scheduleTime?: string) => string;
}

export function DoctorQueueListView({
  filteredCases,
  totalCount,
  redCount,
  yellowCount,
  greenCount,
  filterPriority,
  setFilterPriority,
  queueSearch,
  setQueueSearch,
  onSelectCase,
  formatUrgencyLabel,
  formatReviewStatus,
}: DoctorQueueListViewProps) {
  return (
    <div className="space-y-6">
      {/* Queue Header like Patient & Nurse page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incoming Review Queue ({filteredCases.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Review patient cases forwarded by nursing staff or attending doctors for clinical authorization.
          </p>
        </div>
      </div>

      {/* Priority Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total In Queue Card */}
        <div
          onClick={() => setFilterPriority("All")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "All"
              ? "border-slate-900 ring-2 ring-slate-200"
              : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Scheduled Queue</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tabular-nums">
            {totalCount}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Scheduled for consultation
          </div>
        </div>

        {/* Red Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Immediate" ? "All" : "Immediate")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Immediate"
              ? "border-rose-500 ring-2 ring-rose-100"
              : "border-slate-200 hover:border-rose-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Red Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1.5 tabular-nums">
            {redCount}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            Immediate attention needed
          </div>
        </div>

        {/* Yellow Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Urgent" ? "All" : "Urgent")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Urgent"
              ? "border-amber-500 ring-2 ring-amber-100"
              : "border-slate-200 hover:border-amber-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Yellow Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 mt-1.5 tabular-nums">
            {yellowCount}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Urgent clinical review
          </div>
        </div>

        {/* Green Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Less Urgent" ? "All" : "Less Urgent")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Less Urgent"
              ? "border-emerald-500 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Green Priority</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5 tabular-nums">
            {greenCount}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Routine &bull; Stable condition
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Case # or Patient ID..."
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-teal-600"
          />
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "All", label: "All Priorities" },
            { id: "Immediate", label: "Immediate" },
            { id: "Urgent", label: "Urgent" },
            { id: "Less Urgent", label: "Less Urgent" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPriority(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterPriority === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items List */}
      <div className="space-y-3">
        {filteredCases.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info: Case ID, Priority badge, Forwarded, Slot, Submitted Time, Patient ID, Name, Highlighted Symptoms */}
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  Case {item.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    formatUrgencyLabel(item.urgency, item.aiSuggestion?.priority).badgeClass
                  }`}
                >
                  {formatUrgencyLabel(item.urgency, item.aiSuggestion?.priority).label}
                </span>

                {/* Forwarded by Nurse Staff */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  <UserCheck className="w-3 h-3 text-purple-600" />
                  <span>{formatReviewStatus(item.status, item.nurseName, item.scheduleTime)}</span>
                </span>

                {/* Scheduled Slot */}
                {item.scheduleTime && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                    <Clock className="w-3 h-3 text-teal-600" />
                    <span>
                      {(() => {
                        try {
                          const d = new Date(item.scheduleTime);
                          return `Slot: ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                        } catch {
                          return "Scheduled";
                        }
                      })()}
                    </span>
                  </span>
                )}

                {/* Submission Time */}
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Submitted {item.submittedTime}</span>
                </span>
              </div>

              {/* Patient Identity row: Patient ID and Name */}
              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">
                  Patient ID: <span className="font-mono text-slate-900 font-bold">{item.patientId}</span>
                </span>
                {item.name && (
                  <>
                    <span className="text-slate-300">&bull;</span>
                    <span className="font-medium text-slate-700">
                      Name: <span className="font-semibold text-slate-900">{item.name}</span>
                    </span>
                  </>
                )}
              </div>

              {/* HIGHLIGHTED SYMPTOMS & CLINICAL PRESENTATION */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                {(() => {
                  const rawList =
                    (item.symptomsData?.symptoms && item.symptomsData.symptoms.length > 0)
                      ? item.symptomsData.symptoms
                      : (item.aiInfo?.symptoms && item.aiInfo.symptoms.length > 0)
                      ? item.aiInfo.symptoms
                      : [];

                  const symptomsList = rawList.length > 0 ? rawList : [item.chiefComplaint || "General Symptoms"];

                  return (
                    <>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50/80 border border-teal-200/90 text-teal-900 shadow-2xs">
                        <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                          SYMPTOMS:
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          {symptomsList[0]}
                        </span>
                      </div>

                      {symptomsList.slice(1, 4).map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                        >
                          +{s}
                        </span>
                      ))}
                    </>
                  );
                })()}

                {/* Medical Report Attached Badge */}
                {((item.reports && item.reports.length > 0) || item.uploadedReportUrl) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                    <FileText className="w-3 h-3 text-blue-600" />
                    <span>Report Attached</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Action: Review Case Button with ArrowRight */}
            <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => onSelectCase(item)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md flex items-center gap-2 transition-all cursor-pointer group"
              >
                <span>Review Case</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
            <ListChecks className="w-10 h-10 mx-auto text-slate-400" />
            <div className="font-bold text-slate-700 text-sm">
              No forwarded cases found
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Only cases forwarded by a nurse or doctor appear in this review queue. Try switching your search query or priority filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
