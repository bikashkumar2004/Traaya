"use client";

import React, { useState } from "react";
import { CaseDetails } from "./CaseReviewWorkspace";
import {
  ListChecks,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  UserPlus,
  Building2,
  Sparkles,
  Flame,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface TriageQueueViewProps {
  cases: CaseDetails[];
  onSelectCase: (caseItem: CaseDetails) => void;
  onOpenIntake: () => void;
}

export function TriageQueueView({
  cases,
  onSelectCase,
  onOpenIntake,
}: TriageQueueViewProps) {
  const [filterPriority, setFilterPriority] = useState<string>("All");
  const [queueSearch, setQueueSearch] = useState<string>("");

  // Include both Under Review and Reverted cases in the triage queue
  const activeQueueCases = cases.filter((c) => {
    const st = (c.status || "").toLowerCase().trim();
    return (
      st === "under review" ||
      st === "awaiting nurse review" ||
      st === "reverted" ||
      st.includes("revert") ||
      st.includes("awaiting patient") ||
      st.includes("request more info")
    );
  });

  // Calculate live counts for each priority category
  const totalCount = activeQueueCases.length;
  const redCount = activeQueueCases.filter((c) => {
    const p = (c.urgency || "").toLowerCase();
    return p.includes("red") || p.includes("immediate") || p.includes("high");
  }).length;
  const yellowCount = activeQueueCases.filter((c) => {
    const p = (c.urgency || "").toLowerCase();
    return p.includes("yellow") || p.includes("urgent") || p.includes("priority 2");
  }).length;
  const greenCount = activeQueueCases.filter((c) => {
    const p = (c.urgency || "").toLowerCase();
    return p.includes("green") || p.includes("routine") || p.includes("normal") || p.includes("priority 3");
  }).length;

  const filteredCases = activeQueueCases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.patientId.toLowerCase().includes(queueSearch.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(queueSearch.toLowerCase());

    const pLow = (c.urgency || "").toLowerCase();
    const sLow = (c.status || "").toLowerCase();
    let matchesPriority = true;
    if (filterPriority === "Red" || filterPriority === "High") {
      matchesPriority = pLow.includes("red") || pLow.includes("immediate") || pLow.includes("high");
    } else if (filterPriority === "Yellow" || filterPriority === "Urgent") {
      matchesPriority = pLow.includes("yellow") || pLow.includes("urgent") || pLow.includes("priority 2");
    } else if (filterPriority === "Green" || filterPriority === "Routine") {
      matchesPriority = pLow.includes("green") || pLow.includes("routine") || pLow.includes("normal") || pLow.includes("priority 3");
    } else if (filterPriority === "Reverted") {
      matchesPriority = sLow.includes("revert") || sLow.includes("awaiting patient");
    }

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Queue Header like Patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            <span>Active Triage Queue &bull; CHC Khandapada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incoming Patient Queue ({filteredCases.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Review reported symptoms, verify diagnostic lab slips, and route cases to assigned medical officers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenIntake}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Patient Intake</span>
          </button>
        </div>
      </div>

      {/* Priority Metric Cards Grid (Matching requested design) */}
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
          <span className="text-xs text-slate-500 font-medium">Cases Triaged</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tabular-nums">
            {totalCount}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Under review &amp; reverted
          </div>
        </div>

        {/* Red Priority Card */}
        <div
          onClick={() => setFilterPriority(filterPriority === "Red" ? "All" : "Red")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Red"
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
          onClick={() => setFilterPriority(filterPriority === "Yellow" ? "All" : "Yellow")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Yellow"
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
          onClick={() => setFilterPriority(filterPriority === "Green" ? "All" : "Green")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            filterPriority === "Green"
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
            { id: "All", label: "All Cases" },
            { id: "Red", label: "Red Priority" },
            { id: "Yellow", label: "Yellow Priority" },
            { id: "Green", label: "Green Priority" },
            { id: "Reverted", label: "Reverted Cases" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setFilterPriority(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterPriority === p.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Items List (Clean header: Case ID + Priority Badge, No Status Badge) */}
      <div className="space-y-3">
        {filteredCases.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left Info: Case ID, Priority badge only (no status badge), Patient ID, Submitted, Location, Chief Complaint */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  Case {item.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${item.urgencyClass}`}
                >
                  {item.urgency}
                </span>
              </div>

              <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800">
                  Patient ID: {item.patientId}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  Submitted: {item.submittedTime}
                </span>
                <span>&bull;</span>
                <span className="text-slate-500">
                  {item.location}
                </span>
              </div>

              <p className="text-xs text-slate-600 line-clamp-1 italic max-w-2xl pt-0.5">
                &ldquo;{item.chiefComplaint}&rdquo;
              </p>
            </div>

            {/* Right Action: Review Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onSelectCase(item)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
              >
                <span>Review</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}

        {filteredCases.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
            <ListChecks className="w-10 h-10 mx-auto text-slate-400" />
            <div className="font-bold text-slate-700 text-sm">
              No patients found matching current filter
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try switching your search query or priority filter, or start a new intake.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
