"use client";

import React from "react";
import { Search, HelpCircle } from "lucide-react";
import { TimelineStats } from "./types";

interface TimelineFilterBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  activeStatusFilter: string;
  setActiveStatusFilter: (v: string) => void;
  stats: TimelineStats;
  loading: boolean;
}

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  activeStatusFilter,
  setActiveStatusFilter,
  stats,
  loading,
}) => {
  const tabs = [
    { id: "all", label: "All", count: stats.total },
    { id: "draft", label: "Draft", count: stats.draft },
    { id: "under_review", label: "Under Review", count: stats.underReview },
    { id: "reverted", label: "Reverted", count: stats.reverted },
    { id: "referred", label: "Referred", count: stats.referred },
    { id: "scheduled", label: "Scheduled", count: stats.scheduled },
    { id: "completed", label: "Completed", count: stats.completed },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar & Status Tabs in a Single Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by ID, symptoms, complaint, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
          />
        </div>

        {/* Status Filter Tabs directly below search bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 sm:gap-3 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal-800 text-white font-bold shadow-xs"
                    : "text-slate-700 hover:text-slate-900 font-semibold hover:bg-slate-100/70"
                }`}
              >
                {tab.label} ({loading ? 0 : tab.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Banner for Reverted Visits */}
      {!loading && stats.reverted > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Action Required: {stats.reverted} Clinical Visit{stats.reverted > 1 ? "s" : ""} Awaiting Your Response
              </h4>
              <p className="text-[11px] text-amber-800">
                The nurse desk requested follow-up answers on your reported symptoms. Please answer to proceed with clinical consultation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("reverted")}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Show Reverted Visits ({stats.reverted})
          </button>
        </div>
      )}
    </div>
  );
};
