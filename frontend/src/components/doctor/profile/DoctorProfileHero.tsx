"use client";

import React from "react";
import {
  ShieldCheck,
  Building2,
  RefreshCw,
  Edit3,
  Save,
} from "lucide-react";

interface DoctorProfileHeroProps {
  initials: string;
  fullName: string;
  designation: string;
  staffId: string;
  facility: string;
  roomNumber: string;
  loading: boolean;
  editMode: boolean;
  saving: boolean;
  setEditMode: (val: boolean) => void;
  onRefresh: () => void;
  onSave: () => void;
}

export function DoctorProfileHero({
  initials,
  fullName,
  designation,
  staffId,
  facility,
  roomNumber,
  loading,
  editMode,
  saving,
  setEditMode,
  onRefresh,
  onSave,
}: DoctorProfileHeroProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-teal-800 text-white font-black text-2xl flex items-center justify-center shadow-md ring-4 ring-teal-50">
              {initials || "DR"}
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-3 border-white rounded-full" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {fullName}
              </h1>
            </div>

            <div className="text-xs font-semibold text-teal-800">
              {designation}
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
              <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Doctor ID: {staffId}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{facility}</span>
              </span>
              <span>&bull;</span>
              <span>{roomNumber}</span>
            </div>
          </div>
        </div>

        {/* Edit / Save Action & Live Sync Status */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Refresh from Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-700" : ""}`} />
          </button>

          {editMode ? (
            <>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving to DB..." : "Save Changes"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
