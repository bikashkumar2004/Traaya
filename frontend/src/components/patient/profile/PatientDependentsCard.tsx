"use client";

import React from "react";
import { Users, Plus, X, Trash2 } from "lucide-react";
import { FamilyDependent } from "@/lib/auth-context";

export interface PatientDependentsCardProps {
  dependents: FamilyDependent[];
  userInitials: string;
  fullName: string;
  age: number | string;
  gender: string;
  patientId: string;
  showAddDependent: boolean;
  setShowAddDependent: (val: boolean) => void;
  newDepName: string;
  setNewDepName: (val: string) => void;
  newDepRelation: string;
  setNewDepRelation: (val: string) => void;
  newDepAge: string;
  setNewDepAge: (val: string) => void;
  newDepGender: string;
  setNewDepGender: (val: string) => void;
  newDepPhone: string;
  setNewDepPhone: (val: string) => void;
  onAddDependent: (e: React.FormEvent) => void;
  onDeleteDependent: (id: string) => void;
}

export function PatientDependentsCard({
  dependents,
  userInitials,
  fullName,
  age,
  gender,
  patientId,
  showAddDependent,
  setShowAddDependent,
  newDepName,
  setNewDepName,
  newDepRelation,
  setNewDepRelation,
  newDepAge,
  setNewDepAge,
  newDepGender,
  setNewDepGender,
  newDepPhone,
  setNewDepPhone,
  onAddDependent,
  onDeleteDependent,
}: PatientDependentsCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-teal-700" />
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
              Family &amp; Dependents
            </h3>
            <span className="text-xs text-slate-500">
              Link family members to manage appointments, triage histories, and clinical records under your unified account.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono">
            {dependents.length + 1} Total Members
          </span>
          {!showAddDependent && (
            <button
              type="button"
              onClick={() => setShowAddDependent(true)}
              className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link Family Dependent</span>
            </button>
          )}
        </div>
      </div>

      {/* Inline Form to Add Family Dependent */}
      {showAddDependent && (
        <form
          onSubmit={onAddDependent}
          className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Link Family Member
            </span>
            <button
              type="button"
              onClick={() => setShowAddDependent(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="lg:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kamla Devi, Rohit Choudhury"
                value={newDepName}
                onChange={(e) => setNewDepName(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Relation *
              </label>
              <select
                value={newDepRelation}
                onChange={(e) => setNewDepRelation(e.target.value)}
                className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other Dependent</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 45"
                value={newDepAge}
                onChange={(e) => setNewDepAge(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Gender
              </label>
              <select
                value={newDepGender}
                onChange={(e) => setNewDepGender(e.target.value)}
                className="w-full h-10 px-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700 cursor-pointer"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-5">
              <label className="font-bold text-slate-700 block mb-1">
                Mobile Number (Optional)
              </label>
              <input
                type="tel"
                placeholder="10-digit number"
                value={newDepPhone}
                onChange={(e) => setNewDepPhone(e.target.value)}
                className="w-full sm:w-80 h-10 px-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-teal-700"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddDependent(false)}
              className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Link Dependent to Database
            </button>
          </div>
        </form>
      )}

      {/* Grid of Family Members (Primary Self + Linked Dependents) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
        {/* Primary Account (Self) */}
        <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {userInitials}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                {fullName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {age}Y &bull; {gender} &bull; {patientId}
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
            Primary Self
          </span>
        </div>

        {/* Linked Dependents */}
        {dependents.map((dep) => (
          <div
            key={dep.id}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                {dep.fullName
                  .trim()
                  .split(/\s+/)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>{dep.fullName}</span>
                  <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                    {dep.relation}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {dep.age && `${dep.age}Y`}
                  {dep.age && dep.gender && " • "}
                  {dep.gender}
                  {dep.patientUhid && ` • ${dep.patientUhid}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteDependent(dep.id)}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
              title="Unlink dependent from database"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Empty state notice if no dependents */}
      {dependents.length === 0 && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
          No family dependents linked yet. Click &quot;Link Family Dependent&quot; above to add family members to your health registry.
        </div>
      )}
    </div>
  );
}
