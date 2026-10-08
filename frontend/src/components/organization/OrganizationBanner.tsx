"use client";

import React from "react";
import { Plus, Download } from "lucide-react";
import { RegisteredOrganization } from "@/lib/organization-data";

interface OrganizationBannerProps {
  selectedOrg: RegisteredOrganization;
  onOpenAddModal: () => void;
  onExportDossier: () => void;
}

export const OrganizationBanner: React.FC<OrganizationBannerProps> = ({
  selectedOrg,
  onOpenAddModal,
  onExportDossier,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
              ORG CODE: {selectedOrg.code}
            </span>
            <span className="text-xs text-slate-500">
              Location: <strong className="text-slate-700">{selectedOrg.location}, {selectedOrg.district}</strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{selectedOrg.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Single unified dashboard displaying all registered patients, employee health dossiers, blood groups, vital telemetry, and triage status for members affiliated with {selectedOrg.name}.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 text-teal-200" />
            <span>+ Add Employee / Student to Roster</span>
          </button>

          <button
            type="button"
            onClick={onExportDossier}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-teal-700" />
            <span>Export Dossier (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
