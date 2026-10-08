"use client";

import React from "react";
import { Droplet } from "lucide-react";

interface OrganizationBloodBankProps {
  bloodGroupsList: string[];
  bloodGroupCounts: Record<string, number>;
  filterBloodGroup: string;
  setFilterBloodGroup: (bg: string) => void;
}

export const OrganizationBloodBank: React.FC<OrganizationBloodBankProps> = ({
  bloodGroupsList,
  bloodGroupCounts,
  filterBloodGroup,
  setFilterBloodGroup,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
            <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              Organisation Blood Group Directory &bull; Emergency Donor Bank
            </h3>
            <p className="text-[11px] text-slate-500">
              Real-time blood group inventory of enrolled patients for acute emergency matching &amp; trauma readiness.
            </p>
          </div>
        </div>

        {filterBloodGroup !== "All" && (
          <button
            type="button"
            onClick={() => setFilterBloodGroup("All")}
            className="text-xs text-rose-700 font-bold hover:underline cursor-pointer"
          >
            Clear Blood Group Filter ({filterBloodGroup})
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {bloodGroupsList.map((bg) => {
          const count = bloodGroupCounts[bg] || 0;
          const isSelected = filterBloodGroup === bg;
          return (
            <button
              key={bg}
              type="button"
              onClick={() => setFilterBloodGroup(isSelected ? "All" : bg)}
              className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/30"
                  : "bg-slate-50 hover:bg-rose-50/60 border-slate-200 text-slate-800"
              }`}
            >
              <div className="text-xs font-black">{bg}</div>
              <div className={`text-[10px] font-bold ${isSelected ? "text-white/90" : "text-slate-500"}`}>
                {count} {count === 1 ? "member" : "members"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
