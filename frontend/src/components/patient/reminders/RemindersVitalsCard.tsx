"use client";

import React from "react";
import { HeartPulse, CheckCircle2 } from "lucide-react";

interface RemindersVitalsCardProps {
  systolic: string;
  setSystolic: (v: string) => void;
  diastolic: string;
  setDiastolic: (v: string) => void;
  pulse: string;
  setPulse: (v: string) => void;
  temperature: string;
  setTemperature: (v: string) => void;
  spo2: string;
  setSpo2: (v: string) => void;
  vitalsSaved: boolean;
  onSaveVitals: (e: React.FormEvent) => void;
}

export function RemindersVitalsCard({
  systolic,
  setSystolic,
  diastolic,
  setDiastolic,
  pulse,
  setPulse,
  temperature,
  setTemperature,
  spo2,
  setSpo2,
  vitalsSaved,
  onSaveVitals,
}: RemindersVitalsCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-teal-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daily Vitals Self-Log
            </h3>
            <p className="text-xs text-slate-500">
              Regularly record your daily resting measurements for doctor review.
            </p>
          </div>
        </div>
        {vitalsSaved && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Vitals saved to health record</span>
          </span>
        )}
      </div>

      <form onSubmit={onSaveVitals} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Systolic BP (mmHg)
          </label>
          <input
            type="number"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            placeholder="120"
            className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Diastolic BP (mmHg)
          </label>
          <input
            type="number"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            placeholder="80"
            className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Pulse (BPM)
          </label>
          <input
            type="number"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            placeholder="72"
            className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            Body Temp (°F)
          </label>
          <input
            type="text"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
            placeholder="98.4"
            className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
            SpO2 (%)
          </label>
          <input
            type="number"
            value={spo2}
            onChange={(e) => setSpo2(e.target.value)}
            placeholder="98"
            className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <button
            type="submit"
            className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Record Today
          </button>
        </div>
      </form>
    </div>
  );
}
