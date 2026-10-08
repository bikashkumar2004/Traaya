"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import { BasicMedicalPatient, MedicalPatientStatus } from "./types";

export interface MedicalRegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newName: string;
  setNewName: (val: string) => void;
  newUhid: string;
  setNewUhid: (val: string) => void;
  newPhone: string;
  setNewPhone: (val: string) => void;
  newAge: number | string;
  setNewAge: (val: number | string) => void;
  newGender: string;
  setNewGender: (val: string) => void;
  newStatus: MedicalPatientStatus;
  setNewStatus: (val: MedicalPatientStatus) => void;
  newPriority: BasicMedicalPatient["triagePriority"];
  setNewPriority: (val: BasicMedicalPatient["triagePriority"]) => void;
}

export function MedicalRegisterPatientModal({
  isOpen,
  onClose,
  onSubmit,
  newName,
  setNewName,
  newUhid,
  setNewUhid,
  newPhone,
  setNewPhone,
  newAge,
  setNewAge,
  newGender,
  setNewGender,
  newStatus,
  setNewStatus,
  newPriority,
  setNewPriority,
}: MedicalRegisterPatientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Register Patient to Facility</h3>
              <p className="text-xs text-slate-500">Record basic demographic details.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Patient Full Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter patient name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                UHID <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={newUhid}
                onChange={(e) => setNewUhid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:bg-white focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                placeholder="30"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Gender</label>
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as MedicalPatientStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
              >
                {(["Under Review", "Reverted", "Referred", "Scheduled", "Completed"] as MedicalPatientStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Triage Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
            >
              <option value="Immediate">Immediate Priority</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="Less Urgent">Less Urgent</option>
              <option value="Routine / Fit">Routine / Fit</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold cursor-pointer"
            >
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
