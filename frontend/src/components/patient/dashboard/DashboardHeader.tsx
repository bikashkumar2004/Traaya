"use client";

import React from "react";

interface DashboardHeaderProps {
  fullName?: string;
  facilityName?: string;
  syncing?: boolean;
  onSync?: () => void;
}

export function DashboardHeader({
  fullName,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Namaste, {fullName || <span className="inline-block w-32 h-6 bg-slate-200 rounded-lg animate-pulse align-middle" />}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Welcome to your digital triage health locker. Monitor your active care tickets, check medication schedules, or consult frontline ASHA workers.
        </p>
      </div>
    </div>
  );
}
