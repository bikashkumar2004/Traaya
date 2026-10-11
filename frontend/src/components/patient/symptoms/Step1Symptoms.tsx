"use client";

import React from "react";
import {
  Globe,
  ChevronDown,
  Users,
  Plus,
  X,
  Check,
  Radio,
  Mic,
  Square,
  Video,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import { FamilyDependent, INDIAN_LANGUAGES } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic Symptom Suggestion Chips in Simple English
export const SYMPTOM_CHIPS = [
  { label: "High fever & chills", text: "I have high fever and shaking with cold since 3 days" },
  { label: "Chest pain & tightness", text: "I have chest pain and tight feeling going to my left arm since 2 hours" },
  { label: "Bad headache", text: "Bad headache for 2 days and bright light hurts my eyes" },
  { label: "Cough & sore throat", text: "Dry cough and painful throat since 4 days" },
  { label: "Stomach pain & vomiting", text: "Bad stomach pain and vomiting 3 times today" },
  { label: "Trouble breathing", text: "Hard to breathe and whistling sound since yesterday" },
  { label: "Loose motions & weakness", text: "Watery loose motions and feeling very weak since yesterday" },
  { label: "Fall & leg injury", text: "Fell down, leg is swollen and cannot walk" }
];

export interface Step1SymptomsProps {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  familyMembers: FamilyDependent[];
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  showAddFamilyModal: boolean;
  setShowAddFamilyModal: React.Dispatch<React.SetStateAction<boolean>>;
  newFamilyName: string;
  setNewFamilyName: (name: string) => void;
  newFamilyRelation: string;
  setNewFamilyRelation: (rel: string) => void;
  newFamilyAge: string;
  setNewFamilyAge: (age: string) => void;
  newFamilyGender: string;
  setNewFamilyGender: (gen: string) => void;
  onAddFamilyMemberSubmit: (e: React.FormEvent) => void;
  user: any;
  effectivePatientName: string;
  selectedDependent: FamilyDependent | null;
  effectiveRelation: string;
  isRecording: boolean;
  recordingSeconds: number;
  isTranscribing?: boolean;
  toggleRecording: () => void;
  stopVoiceDictation: () => void;
  symptomText: string;
  setSymptomText: (text: string) => void;
  isOnlineTeleconsult: boolean;
  setIsOnlineTeleconsult: (val: boolean) => void;
  isExtracting: boolean;
  onProceedToStep2: () => void;
}

export function Step1Symptoms({
  selectedLanguage,
  setSelectedLanguage,
  familyMembers,
  selectedMemberId,
  setSelectedMemberId,
  showAddFamilyModal,
  setShowAddFamilyModal,
  newFamilyName,
  setNewFamilyName,
  newFamilyRelation,
  setNewFamilyRelation,
  newFamilyAge,
  setNewFamilyAge,
  newFamilyGender,
  setNewFamilyGender,
  onAddFamilyMemberSubmit,
  user,
  effectivePatientName,
  selectedDependent,
  effectiveRelation,
  isRecording,
  recordingSeconds,
  isTranscribing = false,
  toggleRecording,
  stopVoiceDictation,
  symptomText,
  setSymptomText,
  isOnlineTeleconsult,
  setIsOnlineTeleconsult,
  isExtracting,
  onProceedToStep2,
}: Step1SymptomsProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Tell us what&apos;s bothering you
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Speak using the microphone or type symptoms freely in any language.
          </p>
        </div>
      </div>

      {/* PREFERRED INTAKE LANGUAGE (TOP BAR) - 23 INDIAN LANGUAGES */}
      <div className="space-y-1.5">
        <label className="text-slate-800 font-bold text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-teal-700" />
            <span>Preferred Intake Language</span>
          </span>
        </label>
        <div className="w-full sm:w-80">
          <Select value={selectedLanguage} onValueChange={(val) => setSelectedLanguage(val)}>
            <SelectTrigger className="w-full h-11 bg-slate-50 hover:bg-white border-slate-300 rounded-xl text-slate-900 font-bold text-xs sm:text-sm shadow-2xs">
              <SelectValue placeholder="Select Intake Language" />
            </SelectTrigger>
            <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
              <SelectGroup>
                <SelectLabel className="text-[10px] font-bold text-teal-800 tracking-wider">
                  23 Indian Languages
                </SelectLabel>
                {INDIAN_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.name} className="py-2 text-xs font-semibold">
                    <span className="font-bold text-slate-900">{l.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal ml-1.5">({l.nativeName})</span>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* FAMILY MEMBER SELECTION DOCK */}
      <div className="bg-gradient-to-r from-teal-50/70 via-white to-slate-50 border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="family-member-select" className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight cursor-pointer">
                  Who is this symptom report for?
                </label>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Choose yourself or a family member to calibrate triage algorithms for their age and gender.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddFamilyModal((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddFamilyModal ? "Close Form" : "Add Family Member"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
          <div className="sm:col-span-8">
            <Select value={selectedMemberId} onValueChange={(val) => setSelectedMemberId(val)}>
              <SelectTrigger id="family-member-select" className="w-full h-11 bg-white border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
                <SelectValue placeholder="Select patient or family member" />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-2xl border-slate-200 shadow-xl">
                <SelectGroup>
                  <SelectLabel>Primary Patient</SelectLabel>
                  <SelectItem value="self" className="py-2 text-xs font-semibold">
                    Myself — {user?.fullName || "Primary Account Holder"} (Self • {user?.age ? `${user.age} yrs` : "Adult"}, {user?.gender || "N/A"})
                  </SelectItem>
                </SelectGroup>
                {familyMembers && familyMembers.length > 0 && (
                  <SelectGroup>
                    <SelectSeparator />
                    <SelectLabel>Family Dependents</SelectLabel>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="py-2 text-xs font-semibold">
                        {member.fullName} ({member.relation} • {member.age ? `${member.age} yrs` : "Age N/A"}, {member.gender || "N/A"})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Active Selection Badge */}
          <div className="sm:col-span-4 flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs h-11">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider leading-none">
                Active Patient Profile
              </span>
              <strong className="text-teal-900 font-black truncate block text-xs mt-0.5">
                {effectivePatientName} {selectedDependent ? `(${effectiveRelation})` : "(Self)"}
              </strong>
            </div>
          </div>
        </div>

        {/* Inline Collapsible Form to Add Family Member */}
        {showAddFamilyModal && (
          <form
            onSubmit={onAddFamilyMemberSubmit}
            className="p-4 sm:p-5 bg-white rounded-2xl border-2 border-teal-300 shadow-sm space-y-3.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                    Register &amp; Link Family Member
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add a family dependent to submit symptom reports under your unified account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddFamilyModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                title="Close Form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="lg:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Full Legal Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meena Devi"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Relationship <span className="text-rose-600">*</span>
                </label>
                <Select value={newFamilyRelation} onValueChange={(val) => setNewFamilyRelation(val)}>
                  <SelectTrigger className="w-full h-10 bg-slate-50 border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white">
                    <SelectValue placeholder="Relationship" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {["Mother", "Father", "Spouse", "Son", "Daughter", "Grandmother", "Grandfather", "Brother", "Sister", "Other"].map((rel) => (
                      <SelectItem key={rel} value={rel} className="cursor-pointer font-medium text-xs">
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Gender <span className="text-rose-600">*</span>
                </label>
                <Select value={newFamilyGender} onValueChange={(val) => setNewFamilyGender(val)}>
                  <SelectTrigger className="w-full h-10 bg-slate-50 border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    {["Female", "Male", "Other"].map((gen) => (
                      <SelectItem key={gen} value={gen} className="cursor-pointer font-medium text-xs">
                        {gen}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Age (Years) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  placeholder="e.g. 52"
                  value={newFamilyAge}
                  onChange={(e) => setNewFamilyAge(e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-teal-700"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-[11px] text-teal-800 font-medium">
                ✓ Saved to your patient registry and immediately selected for this symptom report.
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAddFamilyModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs text-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save &amp; Select Member</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Main Input Box Container */}
      <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-5">
        {/* UNIQUE VOICE INTAKE STUDIO */}
        <div
          className={`rounded-2xl border transition-all duration-300 p-4 sm:p-5 relative overflow-hidden ${
            isRecording
              ? "bg-gradient-to-br from-rose-50/90 via-white to-amber-50/40 border-rose-300 shadow-lg shadow-rose-500/10 ring-2 ring-rose-400/20"
              : "bg-gradient-to-br from-teal-50/70 via-white to-slate-50 border-teal-200/80 shadow-2xs hover:border-teal-300"
          }`}
        >
          {/* Subtle Background Glow when recording */}
          {isRecording && (
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-rose-400/20 rounded-full blur-2xl pointer-events-none" />
          )}

          {/* Header Row */}
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-2xs ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse"
                    : isTranscribing
                    ? "bg-teal-700 text-white animate-spin"
                    : "bg-teal-800 text-white"
                }`}
              >
                {isRecording ? (
                  <Radio className="w-5 h-5 animate-spin" />
                ) : isTranscribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                    Voice Intake Studio
                  </h3>
                  {isRecording && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                      Live Rec &bull; {Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                    </span>
                  )}
                  {isTranscribing && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-200 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Sarvam AI STT Transcribing...
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {isTranscribing
                    ? `Processing microphone audio via Sarvam AI in ${selectedLanguage}...`
                    : isRecording
                    ? `Recording voice in ${selectedLanguage}. Speak clearly and click "Stop Voice" to transcribe.`
                    : `Speak your health concerns naturally in ${selectedLanguage} or any of the 23 supported languages.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                Language: <strong className="text-teal-900">{selectedLanguage}</strong>
              </span>
            </div>
          </div>

          {/* Main Control & Equalizer Visualizer Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
            {/* Primary Button: Start Voice <-> Stop Voice */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={`group px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2.5 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  isRecording
                    ? "bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 text-white shadow-rose-600/30 hover:shadow-rose-600/50 hover:from-rose-700 hover:to-red-700 ring-4 ring-rose-500/20"
                    : isTranscribing
                    ? "bg-teal-700 text-white opacity-85 cursor-wait"
                    : "bg-gradient-to-r from-teal-800 via-teal-800 to-emerald-800 text-white shadow-teal-900/20 hover:shadow-teal-900/35 hover:from-teal-900 hover:to-emerald-900 hover:scale-[1.02]"
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Voice &amp; Transcribe</span>
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribing with Sarvam...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Start Voice</span>
                  </>
                )}
              </button>

              {/* Cancel / Clear button when recording */}
              {isRecording && (
                <button
                  type="button"
                  onClick={stopVoiceDictation}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-100/80 hover:bg-rose-200 rounded-xl transition-colors cursor-pointer border border-rose-200"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Equalizer Visualizer & Audio Wave Animation */}
            <div className="flex-1 flex items-center justify-start sm:justify-end gap-3 min-w-[200px]">
              {isRecording ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-white/90 border border-rose-200 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-bold text-rose-800 mr-1 shrink-0 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    Audio Signal:
                  </span>
                  {/* Animated Equalizer Frequency Bars */}
                  <div className="flex items-end gap-1 h-7 px-1">
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-1" />
                    <span className="w-1 bg-rose-600 rounded-full animate-wave-2" />
                    <span className="w-1 bg-amber-500 rounded-full animate-wave-3" />
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-4" />
                    <span className="w-1 bg-rose-600 rounded-full animate-wave-5" />
                    <span className="w-1 bg-amber-500 rounded-full animate-wave-6" />
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-2" />
                    <span className="w-1 bg-rose-600 rounded-full animate-wave-1" />
                    <span className="w-1 bg-amber-500 rounded-full animate-wave-4" />
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-3" />
                    <span className="w-1 bg-rose-600 rounded-full animate-wave-5" />
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-6" />
                    <span className="w-1 bg-amber-500 rounded-full animate-wave-1" />
                    <span className="w-1 bg-rose-500 rounded-full animate-wave-2" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                  {/* Idle Standby Equalizer */}
                  <div className="flex items-end gap-1 h-4 opacity-50">
                    <span className="w-1 h-2 bg-slate-300 rounded-full" />
                    <span className="w-1 h-3 bg-teal-400 rounded-full" />
                    <span className="w-1 h-1.5 bg-slate-300 rounded-full" />
                    <span className="w-1 h-3.5 bg-teal-500 rounded-full" />
                    <span className="w-1 h-2 bg-slate-300 rounded-full" />
                    <span className="w-1 h-4 bg-teal-600 rounded-full" />
                    <span className="w-1 h-2 bg-slate-300 rounded-full" />
                    <span className="w-1 h-3 bg-teal-400 rounded-full" />
                    <span className="w-1 h-1.5 bg-slate-300 rounded-full" />
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Microphone standby &bull; Click to start
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Streaming Speech Banner (When Recording) */}
          {isRecording && (
            <div className="mt-3.5 p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span className="font-semibold text-[11px] truncate">
                {symptomText ? (
                  <>
                    Live stream: &ldquo;<span className="font-bold">{symptomText}</span>&rdquo;
                  </>
                ) : (
                  "Listening for voice input... speak clearly into your microphone."
                )}
              </span>
            </div>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="relative py-1 flex items-center justify-center">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute px-3 bg-slate-50 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            OR TYPE COMPLAINTS
          </span>
        </div>

        {/* Textarea Description */}
        <div className="space-y-1.5">
          <label className="text-slate-700 font-bold text-xs block">
            Type or Dictate Details
          </label>
          <textarea
            rows={4}
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            placeholder="e.g., I have had a continuous fever for 3 days with headache, body chills, and mild coughing..."
            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 placeholder:text-slate-400 resize-none shadow-inner"
          />
        </div>

        {/* Dynamic Quick Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
            Quick Symptom Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSymptomText(chip.text);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3 text-teal-600" />
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Online Teleconsult Question */}
        <div className="p-4 bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                Are you want Online Teleconsult?
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                Choose Yes for phone/video doctor consultation, or No to visit the healthcare facility in person.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsOnlineTeleconsult(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isOnlineTeleconsult
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${isOnlineTeleconsult ? "opacity-100" : "opacity-0"}`} />
              <span>Yes (Online)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOnlineTeleconsult(false)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isOnlineTeleconsult
                  ? "bg-teal-800 text-white shadow-xs"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${!isOnlineTeleconsult ? "opacity-100" : "opacity-0"}`} />
              <span>No (In-Person OPD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onProceedToStep2}
          disabled={!symptomText.trim() || isExtracting}
          className="px-6 py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
        >
          {isExtracting ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Symptoms...</span>
            </>
          ) : (
            <>
              <span>Proceed to Details</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
