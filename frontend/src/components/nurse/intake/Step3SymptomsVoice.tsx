"use client";

import React from "react";
import { Mic, MicOff, Sparkles, ArrowRight } from "lucide-react";

interface Step3SymptomsVoiceProps {
  language: string;
  isRecording: boolean;
  handleVoiceToggle: () => void;
  voiceTranscript: string;
  chiefComplaint: string;
  setChiefComplaint: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  severity: string;
  setSeverity: (val: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step3SymptomsVoice({
  language,
  isRecording,
  handleVoiceToggle,
  voiceTranscript,
  chiefComplaint,
  setChiefComplaint,
  duration,
  setDuration,
  severity,
  setSeverity,
  onBack,
  onContinue,
}: Step3SymptomsVoiceProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            3. Record symptoms
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The nurse enters the patient&apos;s own description of symptoms, duration, and relevant information. Voice input can be an optional feature.
          </p>
        </div>

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
            isRecording
              ? "bg-rose-600 text-white animate-pulse"
              : "bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200"
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4" />
              <span>Listening in {language}...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-teal-700" />
              <span>Optional Voice Input</span>
            </>
          )}
        </button>
      </div>

      {isRecording && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          Listening to regional voice input in {language}... Translating clinical terms in real time.
        </div>
      )}

      {voiceTranscript && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <strong>Voice Audio Transcribed:</strong> &ldquo;{voiceTranscript}&rdquo;
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Patient&apos;s Own Description of Symptoms (Chief Complaint) <span className="text-rose-600">*</span>
        </label>
        <textarea
          rows={3}
          value={chiefComplaint}
          onChange={(e) => setChiefComplaint(e.target.value)}
          placeholder="Enter patient's exact symptoms in their words..."
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs text-slate-800 outline-hidden"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Symptom Duration
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          >
            <option value="1 day or less">1 day or less</option>
            <option value="2-3 days">2-3 days (e.g. 3 days)</option>
            <option value="4-7 days">4-7 days (approx. 1 week)</option>
            <option value="More than 1 week">More than 1 week</option>
            <option value="Chronic (> 1 month)">Chronic (&gt; 1 month)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Reported Severity
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          >
            <option value="Mild">Mild (Tolerable daily routine)</option>
            <option value="Moderate">Moderate (Restricted mobility/weakness)</option>
            <option value="Severe">Severe (Acute distress/incapacitated)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>Continue to Medical Reports</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
