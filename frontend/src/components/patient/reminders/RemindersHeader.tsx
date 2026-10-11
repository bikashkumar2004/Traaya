"use client";

import React from "react";
import { Plus } from "lucide-react";

interface RemindersHeaderProps {
  syncing?: boolean;
  onSync?: () => void;
  onOpenAddModal: () => void;
}

export function RemindersHeader({
  onOpenAddModal,
}: RemindersHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Care
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Your personalized schedule for daily medicines, clinical consultations, ASHA community visits, and health monitoring logs.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">

        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Reminder</span>
        </button>
      </div>
    </div>
  );
}
