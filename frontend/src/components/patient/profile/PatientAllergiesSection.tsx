"use client";

import React from "react";
import { Plus, X, AlertTriangle, Trash2 } from "lucide-react";
import { DrugAllergy } from "@/lib/auth-context";

export interface PatientAllergiesSectionProps {
  allergies: DrugAllergy[];
  showAddAllergy: boolean;
  setShowAddAllergy: (val: boolean) => void;
  newAllergenName: string;
  setNewAllergenName: (val: string) => void;
  newAllergySeverity: "Severe" | "Moderate" | "Mild";
  setNewAllergySeverity: (val: "Severe" | "Moderate" | "Mild") => void;
  newAllergyReaction: string;
  setNewAllergyReaction: (val: string) => void;
  onAddAllergy: (e: React.FormEvent) => void;
  onDeleteAllergy: (id: string) => void;
}

export function PatientAllergiesSection({
  allergies,
  showAddAllergy,
  setShowAddAllergy,
  newAllergenName,
  setNewAllergenName,
  newAllergySeverity,
  setNewAllergySeverity,
  newAllergyReaction,
  setNewAllergyReaction,
  onAddAllergy,
  onDeleteAllergy,
}: PatientAllergiesSectionProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-900 block">
            Known Drug Allergies &amp; Sensitivities
          </span>
          <span className="text-[11px] text-slate-500">
            {allergies.length} medication allergy flag(s) active
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddAllergy(!showAddAllergy)}
          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Allergy</span>
        </button>
      </div>

      {/* Inline Form to Add Drug Allergy */}
      {showAddAllergy && (
        <form
          onSubmit={onAddAllergy}
          className="p-4 sm:p-5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wider">
              Add Known Drug Allergy Alert
            </span>
            <button
              type="button"
              onClick={() => setShowAddAllergy(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Medication / Allergen Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Penicillin, Sulfa, Aspirin, Ibuprofen"
                value={newAllergenName}
                onChange={(e) => setNewAllergenName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-rose-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Severity Level
              </label>
              <select
                value={newAllergySeverity}
                onChange={(e) => setNewAllergySeverity(e.target.value as "Severe" | "Moderate" | "Mild")}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-rose-700 cursor-pointer"
              >
                <option value="Severe">Severe Alert</option>
                <option value="Moderate">Moderate</option>
                <option value="Mild">Mild</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 text-xs">
              Allergic Symptoms &amp; Reactions
            </label>
            <input
              type="text"
              placeholder="e.g. Facial swelling, breathing difficulty, severe rash, hives"
              value={newAllergyReaction}
              onChange={(e) => setNewAllergyReaction(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-rose-700"
            />
          </div>

          {/* Quick suggestion pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold">Common:</span>
            {["Penicillin", "Sulfa Antibiotics", "Aspirin", "Ibuprofen", "Paracetamol", "Codeine"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setNewAllergenName(name)}
                className="px-2 py-0.5 bg-white hover:bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {name}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddAllergy(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Save Allergy to Database
            </button>
          </div>
        </form>
      )}

      {/* Dynamic Allergies List */}
      {allergies.length === 0 ? (
        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
          No known drug allergies reported. Click &quot;Add Allergy&quot; if you have adverse reactions to specific medications.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {allergies.map((allergy) => (
            <div
              key={allergy.id}
              className={`p-3.5 rounded-2xl border space-y-1.5 relative group ${
                allergy.severity === "Severe"
                  ? "bg-rose-50/70 border-rose-200"
                  : allergy.severity === "Moderate"
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      allergy.severity === "Severe"
                        ? "text-rose-600"
                        : allergy.severity === "Moderate"
                        ? "text-amber-600"
                        : "text-slate-500"
                    }`}
                  />
                  <span>{allergy.allergen}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                      allergy.severity === "Severe"
                        ? "bg-rose-100 text-rose-800"
                        : allergy.severity === "Moderate"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {allergy.severity} Alert
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteAllergy(allergy.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Delete allergy from database"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {allergy.reaction && (
                <p className="text-[11px] text-slate-700 leading-snug">
                  {allergy.reaction}
                </p>
              )}

              <div className="text-[10px] text-slate-500 pt-0.5">
                {allergy.reportedYear ? `Recorded: ${allergy.reportedYear}` : "Doctor Verified"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
