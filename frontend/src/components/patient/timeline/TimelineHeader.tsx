"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export const TimelineHeader: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Timeline &amp; Clinical Visits
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Tabulated audit log of your submitted symptoms, assistive triage classifications, and clinical encounters.
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Link
          href="/citizen/symptoms"
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Symptoms</span>
        </Link>
      </div>
    </div>
  );
};
