"use client";

import React from "react";
import { Pill, X, Plus } from "lucide-react";

interface RemindersAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTitle: string;
  setNewTitle: (v: string) => void;
  newType: "medication" | "consultation" | "asha_visit" | "vitals_log";
  setNewType: (v: "medication" | "consultation" | "asha_visit" | "vitals_log") => void;
  newDosage: string;
  setNewDosage: (v: string) => void;
  newFrequency: string;
  setNewFrequency: (v: string) => void;
  newTime: string;
  setNewTime: (v: string) => void;
  newDescription: string;
  setNewDescription: (v: string) => void;
  submitting: boolean;
  onCreateReminder: (e: React.FormEvent) => void;
}

export function RemindersAddModal({
  isOpen,
  onClose,
  newTitle,
  setNewTitle,
  newType,
  setNewType,
  newDosage,
  setNewDosage,
  newFrequency,
  setNewFrequency,
  newTime,
  setNewTime,
  newDescription,
  setNewDescription,
  submitting,
  onCreateReminder,
}: RemindersAddModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-800 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Add New Care Reminder</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onCreateReminder} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Reminder Title / Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paracetamol, Cardiology Consult, Blood Sugar Check"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Category
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="medication">Medication</option>
                <option value="consultation">Doctor Follow-up</option>
                <option value="asha_visit">ASHA Home Visit</option>
                <option value="vitals_log">Vitals Check</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Dosage / Specification
              </label>
              <input
                type="text"
                placeholder="e.g. 500mg, 1 Tablet"
                value={newDosage}
                onChange={(e) => setNewDosage(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Scheduled Time
              </label>
              <input
                type="text"
                placeholder="e.g. 08:00 AM, Night"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Frequency
              </label>
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Thrice Daily">Thrice Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Single Consultation">Single Visit</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Instructions / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Take with warm water after lunch; bring previous lab reports."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{submitting ? "Saving..." : "Add to Schedule"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
