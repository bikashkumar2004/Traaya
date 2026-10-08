"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { ChronicCondition } from "@/lib/auth-context";

export interface PatientChronicConditionsSectionProps {
  chronicConditions: ChronicCondition[];
  showAddCondition: boolean;
  setShowAddCondition: (val: boolean) => void;
  newConditionName: string;
  setNewConditionName: (val: string) => void;
  newConditionYear: string;
  setNewConditionYear: (val: string) => void;
  newConditionNotes: string;
  setNewConditionNotes: (val: string) => void;
  onAddCondition: (e: React.FormEvent) => void;
  onDeleteCondition: (id: string) => void;
}

export function PatientChronicConditionsSection({
  chronicConditions,
  showAddCondition,
  setShowAddCondition,
  newConditionName,
  setNewConditionName,
  newConditionYear,
  setNewConditionYear,
  newConditionNotes,
  setNewConditionNotes,
  onAddCondition,
  onDeleteCondition,
}: PatientChronicConditionsSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-900 block">
            Diagnosed Chronic Conditions
          </span>
          <span className="text-[11px] text-slate-500">
            {chronicConditions.length} active chronic condition(s) recorded in Supabase
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddCondition(!showAddCondition)}
          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Condition</span>
        </button>
      </div>

      {/* Inline Form to Add Chronic Condition */}
      {showAddCondition && (
        <form
          onSubmit={onAddCondition}
          className="p-4 sm:p-5 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider">
              Add New Chronic Condition
            </span>
            <button
              type="button"
              onClick={() => setShowAddCondition(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Condition Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Type-2 Diabetes, Hypertension, Asthma"
                value={newConditionName}
                onChange={(e) => setNewConditionName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Diagnosed Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2019"
                value={newConditionYear}
                onChange={(e) => setNewConditionYear(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              Management Notes / Clinical Status (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Stage-1, Daily medication at PHC"
              value={newConditionNotes}
              onChange={(e) => setNewConditionNotes(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-teal-700"
            />
          </div>

          {/* Quick suggestion pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold">Quick add:</span>
            {["Diabetes Mellitus", "Hypertension", "Asthma", "Thyroid Disorder", "Arthritis"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setNewConditionName(name)}
                className="px-2 py-0.5 bg-white hover:bg-teal-100 border border-teal-200 text-teal-800 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCondition(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Save Condition to Database
            </button>
          </div>
        </form>
      )}

      {/* Dynamic Conditions List */}
      {chronicConditions.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
          No chronic conditions recorded. Click &quot;Add Condition&quot; if you have ongoing health conditions.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {chronicConditions.map((cond) => (
            <div
              key={cond.id}
              className="p-3.5 bg-teal-50/80 border border-teal-200 text-teal-950 rounded-2xl flex items-start justify-between gap-2.5 shadow-2xs group hover:border-teal-300 transition-colors"
            >
              <div>
                <span className="font-extrabold block text-slate-900">{cond.condition}</span>
                {(cond.diagnosedYear || cond.notes) && (
                  <span className="text-[11px] text-teal-800/80 block mt-0.5">
                    {cond.diagnosedYear && `Diagnosed ${cond.diagnosedYear}`}
                    {cond.diagnosedYear && cond.notes && " • "}
                    {cond.notes}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDeleteCondition(cond.id)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white/80 transition-colors cursor-pointer shrink-0"
                title="Delete condition from database"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
