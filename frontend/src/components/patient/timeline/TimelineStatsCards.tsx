"use client";

import React from "react";
import {
  FileText,
  FileEdit,
  Activity,
  RotateCcw,
  Share2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { TimelineStats } from "./types";

interface TimelineStatsCardsProps {
  stats: TimelineStats;
  activeStatusFilter: string;
  setActiveStatusFilter: (status: string) => void;
  loading: boolean;
}

export const TimelineStatsCards: React.FC<TimelineStatsCardsProps> = ({
  stats,
  activeStatusFilter,
  setActiveStatusFilter,
  loading,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {/* Total Encounters */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("all")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "all"
            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
            : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "all" ? "text-slate-300" : "text-slate-500"
            }`}
          >
            Total
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "all"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "all" ? "text-white" : "text-slate-900"
          }`}
        >
          {loading ? "—" : String(stats.total).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "all" ? "text-slate-300" : "text-slate-400"
          }`}
        >
          All Encounters
        </div>
      </button>

      {/* Draft */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("draft")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "draft"
            ? "bg-slate-800 text-white border-slate-800 shadow-sm"
            : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "draft" ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Draft
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "draft"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <FileEdit className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "draft" ? "text-white" : "text-slate-800"
          }`}
        >
          {loading ? "—" : String(stats.draft).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "draft" ? "text-slate-300" : "text-slate-400"
          }`}
        >
          Unsubmitted
        </div>
      </button>

      {/* Under Review */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("under_review")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "under_review"
            ? "bg-sky-600 text-white border-sky-600 shadow-sm"
            : "bg-white hover:bg-sky-50/50 border-sky-200/80 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "under_review" ? "text-sky-100" : "text-sky-700"
            }`}
          >
            Under Review
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "under_review"
                ? "bg-sky-700 text-white"
                : "bg-sky-50 text-sky-600"
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "under_review" ? "text-white" : "text-sky-700"
          }`}
        >
          {loading ? "—" : String(stats.underReview).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "under_review" ? "text-sky-100" : "text-sky-600"
          }`}
        >
          In Assessment
        </div>
      </button>

      {/* Reverted */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("reverted")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "reverted"
            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
            : "bg-white hover:bg-amber-50/50 border-amber-200/80 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "reverted" ? "text-amber-100" : "text-amber-800"
            }`}
          >
            Reverted
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "reverted"
                ? "bg-amber-700 text-white"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "reverted" ? "text-white" : "text-amber-700"
          }`}
        >
          {loading ? "—" : String(stats.reverted).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "reverted" ? "text-amber-100" : "text-amber-600"
          }`}
        >
          Needs Info
        </div>
      </button>

      {/* Referred */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("referred")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "referred"
            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
            : "bg-white hover:bg-purple-50/50 border-purple-200/80 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "referred" ? "text-purple-100" : "text-purple-700"
            }`}
          >
            Referred
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "referred"
                ? "bg-purple-700 text-white"
                : "bg-purple-50 text-purple-600"
            }`}
          >
            <Share2 className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "referred" ? "text-white" : "text-purple-700"
          }`}
        >
          {loading ? "—" : String(stats.referred).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "referred" ? "text-purple-100" : "text-purple-600"
          }`}
        >
          To Specialist
        </div>
      </button>

      {/* Scheduled */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("scheduled")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "scheduled"
            ? "bg-teal-700 text-white border-teal-700 shadow-sm"
            : "bg-white hover:bg-teal-50/50 border-teal-200/80 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "scheduled" ? "text-teal-100" : "text-teal-800"
            }`}
          >
            Scheduled
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "scheduled"
                ? "bg-teal-800 text-white"
                : "bg-teal-50 text-teal-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "scheduled" ? "text-white" : "text-teal-800"
          }`}
        >
          {loading ? "—" : String(stats.scheduled).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "scheduled" ? "text-teal-100" : "text-teal-600"
          }`}
        >
          Slot Booked
        </div>
      </button>

      {/* Completed */}
      <button
        type="button"
        onClick={() => setActiveStatusFilter("completed")}
        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
          activeStatusFilter === "completed"
            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
            : "bg-white hover:bg-emerald-50/50 border-emerald-200/80 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-bold ${
              activeStatusFilter === "completed" ? "text-emerald-100" : "text-emerald-800"
            }`}
          >
            Completed
          </span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              activeStatusFilter === "completed"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
            activeStatusFilter === "completed" ? "text-white" : "text-emerald-700"
          }`}
        >
          {loading ? "—" : String(stats.completed).padStart(2, "0")}
        </div>
        <div
          className={`text-[10px] mt-0.5 truncate ${
            activeStatusFilter === "completed" ? "text-emerald-100" : "text-emerald-600"
          }`}
        >
          Finalized
        </div>
      </button>
    </div>
  );
};
