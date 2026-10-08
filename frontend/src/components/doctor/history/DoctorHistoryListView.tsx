"use client";

import React from "react";
import {
  History,
  Search,
  Printer,
  ArrowRight,
  ArrowRightLeft,
  Video,
  Building2,
  Languages,
} from "lucide-react";
import { ReviewedCaseRecord } from "../DoctorReviewHistoryView";

interface DoctorHistoryListViewProps {
  doctorCases: ReviewedCaseRecord[];
  filteredHistory: ReviewedCaseRecord[];
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  getCategoryCount: (cat: string) => number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSelectCaseToPrint: (c: ReviewedCaseRecord) => void;
  onSelectCaseToReview: (c: ReviewedCaseRecord) => void;
  getStatusConfig: (status?: string, decision?: string, category?: string) => any;
  getPriorityConfig: (urgency?: string, urgencyClass?: string, aiPriority?: string) => any;
  extractActionDetails: (notes?: string) => any;
}

export function DoctorHistoryListView({
  doctorCases,
  filteredHistory,
  categories,
  selectedCategory,
  setSelectedCategory,
  getCategoryCount,
  searchTerm,
  setSearchTerm,
  onSelectCaseToPrint,
  onSelectCaseToReview,
  getStatusConfig,
  getPriorityConfig,
  extractActionDetails,
}: DoctorHistoryListViewProps) {
  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Review History &bull; Completed Actions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Clinical audit log categorized by workflow: <strong>Complete</strong> (Discharge &amp; e-Prescription) and <strong>Referred</strong> (Hospital Transfer).
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            Total Completed: <strong className="text-teal-800">{doctorCases.length}</strong>
          </span>
        </div>
      </div>

      {/* 3 Metric Cards for All Categories, Complete, Referred */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* All Categories Card */}
        <div
          onClick={() => setSelectedCategory("All")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "All"
              ? "border-slate-800 ring-2 ring-slate-100"
              : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">All Categories</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tabular-nums">
            {doctorCases.length}
          </div>
          <div className="text-[11px] text-teal-700 font-medium mt-1">
            Total reviewed &amp; completed
          </div>
        </div>

        {/* Complete Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === "Complete" ? "All" : "Complete")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "Complete"
              ? "border-emerald-500 ring-2 ring-emerald-100"
              : "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Complete</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1.5 tabular-nums">
            {getCategoryCount("Complete")}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Discharge &amp; e-Prescription
          </div>
        </div>

        {/* Referred Card */}
        <div
          onClick={() => setSelectedCategory(selectedCategory === "Referred" ? "All" : "Referred")}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs ${
            selectedCategory === "Referred"
              ? "border-indigo-500 ring-2 ring-indigo-100"
              : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
          }`}
        >
          <span className="text-xs text-slate-500 font-medium">Referred</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1.5 tabular-nums">
            {getCategoryCount("Referred")}
          </div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            Transferred to medical center
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, UHID, status or category..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-teal-700 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => {
            const count = getCategoryCount(cat);
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{cat === "All" ? "All Categories" : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* History Cases List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <div className="text-base font-bold text-slate-800">No Review History Records Found</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {selectedCategory !== "All"
              ? `No records found in category "${selectedCategory}". Try selecting "All Categories".`
              : "Once you examine and authorize patient cases in the Review Queue, they will be archived here with full clinical audit details."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredHistory.map((c) => {
            const statusConfig = getStatusConfig(c.status, c.doctorDecision, c.category);
            const StatusIcon = statusConfig.icon;
            const priorityConfig = getPriorityConfig(c.urgency, c.urgencyClass, c.aiSuggestion?.priority);
            const { cleanNotes, referral } = extractActionDetails(c.doctorNotes);

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900 tracking-tight">
                      Case {c.id}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${priorityConfig.badgeClass}`}
                    >
                      {priorityConfig.label}
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfig.badgeClass}`}>
                      <StatusIcon className={`w-3 h-3 ${statusConfig.iconClass}`} />
                      <span>{c.doctorDecision || statusConfig.label}</span>
                    </span>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      c.consultationMode === "online"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-blue-50 text-blue-800 border-blue-200"
                    }`}>
                      {c.consultationMode === "online" ? (
                        <Video className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <Building2 className="w-3 h-3 text-blue-600" />
                      )}
                      <span>{c.consultationMode === "online" ? "Online Teleconsult" : "In-Person Walk-in"}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80">
                      <Languages className="w-3 h-3 text-teal-600" />
                      <span>{c.language || "Odia"}</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      Patient ID: {c.patientId}
                    </span>
                    {c.name && (
                      <>
                        <span>&bull;</span>
                        <span className="font-medium text-slate-700">Name: {c.name}</span>
                      </>
                    )}
                    {(c.age || c.gender) && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">
                          {c.age ? `${c.age} yrs` : ""} {c.age && c.gender ? "•" : ""} {c.gender || ""}
                        </span>
                      </>
                    )}
                    {c.location && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-500">{c.location}</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-1 italic max-w-2xl pt-0.5">
                    &ldquo;{c.chiefComplaint}&rdquo;
                  </p>

                  {(referral || c.referalFacility) && (
                    <div className="text-xs text-indigo-950 font-semibold flex items-center gap-2 flex-wrap">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                      <span>Referred to: <strong className="text-indigo-900">{referral || c.referalFacility}</strong></span>
                      {c.patientReferralStatus === "Accepted" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ Patient Accepted
                        </span>
                      ) : c.patientReferralStatus === "Declined" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          ✕ Patient Declined
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ Awaiting Patient Consent
                        </span>
                      )}
                      {c.facilityReferralStatus === "Accepted" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          ✓ Under Review at Facility
                        </span>
                      )}
                      {(c.transferReason || cleanNotes) && (
                        <span className="text-slate-500 font-normal">
                          &bull; Reason: {c.transferReason || cleanNotes}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span>Submitted: {c.submittedTime || "Recently"}</span>
                    <span>&bull;</span>
                    <span className="text-teal-800 font-semibold">Reviewed: {c.reviewedAt || "Recently"}</span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectCaseToPrint(c)}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Slip</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCaseToReview(c)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer group"
                  >
                    <span>Review</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
