"use client";

import React from "react";
import {
  Info,
  Lock,
  Stethoscope,
  Calendar,
  HelpCircle,
  X,
  CheckCircle2,
  ChevronDown,
  Building2,
} from "lucide-react";
import { CaseDetails } from "../CaseReviewWorkspace";
import { RegisteredFacilityOption, FacilityDoctorOption } from "@/lib/nurse";

interface CaseActionDeckProps {
  actionOptions: {
    id: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  selectedAction: string;
  setSelectedAction: (id: string) => void;
  caseData: CaseDetails;
  loadingDoctors: boolean;
  facilityDoctors: FacilityDoctorOption[];
  assignedDoctor: string;
  setAssignedDoctor: (val: string) => void;
  setAssignedDoctorId: (val?: string) => void;
  customDoctor: string;
  setCustomDoctor: (val: string) => void;
  scheduleTime: string;
  setScheduleTime: (val: string) => void;
  revertedQuestionsList: string[];
  setRevertedQuestionsList: React.Dispatch<React.SetStateAction<string[]>>;
  newQuestionInput: string;
  setNewQuestionInput: (val: string) => void;
  resolveNote: string;
  setResolveNote: (val: string) => void;
  templateDropdownOpen: boolean;
  setTemplateDropdownOpen: (open: boolean) => void;
  resolveNoteTemplates: string[];
  handleSelectTemplate: (tmpl: string) => void;
  referralFacility: string;
  setReferralFacility: (val: string) => void;
  referralFacilityId?: string;
  setReferralFacilityId: (val: any) => void;
  loadingFacilities: boolean;
  availableFacilities: RegisteredFacilityOption[];
  referralReason: string;
  setReferralReason: (val: string) => void;
  handleSubmit: (e?: any) => void;
}

export function CaseActionDeck({
  actionOptions,
  selectedAction,
  setSelectedAction,
  caseData,
  loadingDoctors,
  facilityDoctors,
  assignedDoctor,
  setAssignedDoctor,
  setAssignedDoctorId,
  customDoctor,
  setCustomDoctor,
  scheduleTime,
  setScheduleTime,
  revertedQuestionsList,
  setRevertedQuestionsList,
  newQuestionInput,
  setNewQuestionInput,
  resolveNote,
  setResolveNote,
  templateDropdownOpen,
  setTemplateDropdownOpen,
  resolveNoteTemplates,
  handleSelectTemplate,
  referralFacility,
  setReferralFacility,
  referralFacilityId,
  setReferralFacilityId,
  loadingFacilities,
  availableFacilities,
  referralReason,
  setReferralReason,
  handleSubmit,
}: CaseActionDeckProps) {
  return (
    <div className="lg:col-span-5 space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Nurse Review &amp; Actions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Take appropriate action after reviewing the case.
          </p>
        </div>

        {/* Role Disclaimer Box */}
        <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-sky-950">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sky-900">
              Your Role: Nurse
            </strong>
            <span className="leading-relaxed text-[11px] text-sky-900/90">
              You can review, request more information, add notes, and forward to authorized professionals. You cannot finalize diagnosis.
            </span>
          </div>
        </div>

        {/* Select Action List */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            Select Action
          </label>

          <div className="space-y-2">
            {actionOptions.map((act) => {
              const Icon = act.icon;
              const isSelected = selectedAction === act.id;

              let activeColors = "border-teal-600 bg-teal-50/60 ring-2 ring-teal-200";
              if (act.id === "Schedule & Forward to Doctor") {
                activeColors = isSelected ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Request More Information") {
                activeColors = isSelected ? "bg-sky-600 text-white border-sky-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Refer / Escalate") {
                activeColors = isSelected ? "bg-amber-600 text-white border-amber-700 shadow-sm" : "border-slate-200 hover:border-slate-300";
              } else if (act.id === "Resolve") {
                activeColors = isSelected ? "bg-teal-700 text-white border-teal-800 shadow-sm" : "border-slate-200 hover:border-slate-300";
              }

              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setSelectedAction(act.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? activeColors
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-white text-slate-700 border border-slate-200"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {act.label}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isSelected ? "text-white/80" : "text-slate-500"
                        }`}
                      >
                        {act.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold shrink-0">&rarr;</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule & Forward to Doctor Section */}
        {selectedAction === "Schedule & Forward to Doctor" && (
          <div className="space-y-3 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Choose Doctor</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {loadingDoctors
                    ? "Checking Facility Roster..."
                    : `${caseData.facility ? caseData.facility.split(" ")[0] : "Facility"} Roster (${facilityDoctors.length})`}
                </span>
              </div>

              <select
                value={assignedDoctor}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssignedDoctor(val);
                  if (val === "Other") {
                    setAssignedDoctorId(undefined);
                  } else {
                    const matched = facilityDoctors.find((d) => d.name === val || d.id === val || d.profileId === val);
                    setAssignedDoctorId(matched?.profileId || matched?.id);
                  }
                }}
                disabled={loadingDoctors}
                className="w-full p-2.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                {facilityDoctors.length > 0 ? (
                  facilityDoctors.map((doc) => (
                    <option key={doc.id} value={doc.name}>
                      {doc.name} — {doc.role} ({doc.room || doc.department})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No doctors currently registered at {caseData.facility || "this facility"}
                  </option>
                )}
                <option value="Other">Other Doctor (Enter Custom Name)...</option>
              </select>

              {assignedDoctor === "Other" && (
                <input
                  type="text"
                  value={customDoctor}
                  onChange={(e) => setCustomDoctor(e.target.value)}
                  placeholder="Enter doctor's full name & specialty..."
                  className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              )}
            </div>

            {/* Consultation Schedule Date & Time */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Consultation Schedule Date & Time</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Doctor Queue
                </span>
              </div>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
              />
            </div>

            <p className="text-[10px] text-emerald-800">
              Ticket will be forwarded to {assignedDoctor === "Other" ? (customDoctor || "selected doctor") : assignedDoctor} and scheduled into physician OPD queue.
            </p>
          </div>
        )}

        {/* Reverted Questions Builder when Request More Information is selected */}
        {selectedAction === "Request More Information" && (
          <div className="space-y-3 p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-sky-950 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-700" />
                <span>Questions for Patient (JSON Format)</span>
              </label>
              <span className="text-[10px] font-semibold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                {revertedQuestionsList.length} Questions
              </span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {revertedQuestionsList.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-sky-200 text-xs shadow-2xs"
                >
                  <span className="text-slate-800 font-medium break-words">
                    <strong className="text-sky-900 mr-1">Q{qIdx + 1}:</strong> {q}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRevertedQuestionsList((prev) => prev.filter((_, i) => i !== qIdx))
                    }
                    className="text-slate-400 hover:text-rose-600 p-1 shrink-0 cursor-pointer"
                    title="Remove question"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new question row */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newQuestionInput}
                onChange={(e) => setNewQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newQuestionInput.trim()) {
                      setRevertedQuestionsList((prev) => [...prev, newQuestionInput.trim()]);
                      setNewQuestionInput("");
                    }
                  }
                }}
                placeholder="Type follow-up question for patient..."
                className="flex-1 p-2 bg-white border border-sky-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (newQuestionInput.trim()) {
                    setRevertedQuestionsList((prev) => [...prev, newQuestionInput.trim()]);
                    setNewQuestionInput("");
                  }
                }}
                className="px-3 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Write Resolve Note Form */}
        {selectedAction === "Resolve" && (
          <div className="space-y-2 p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>Write Resolve Note</span>
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setTemplateDropdownOpen(!templateDropdownOpen)}
                  className="text-xs font-semibold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-teal-200 shadow-2xs"
                >
                  <span>Templates</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {templateDropdownOpen && (
                  <div
                    className="absolute right-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs space-y-1"
                    onMouseLeave={() => setTemplateDropdownOpen(false)}
                  >
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Resolve Template
                    </div>
                    {resolveNoteTemplates.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTemplate(tmpl)}
                        className="w-full text-left p-2 rounded-lg hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs transition-colors cursor-pointer"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value.slice(0, 1000))}
              placeholder="Write clinical resolution note to complete case and save to database resolve_notes..."
              className="w-full p-3 bg-white border border-teal-300 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-100 rounded-xl text-xs text-slate-800 outline-hidden transition-all font-medium"
            />
            <div className="flex items-center justify-between text-[10px] text-teal-800">
              <span>Saved to database resolve_notes &amp; status set to Completed</span>
              <span>{resolveNote.length}/1000</span>
            </div>
          </div>
        )}

        {/* Choose Facility when Refer / Escalate is selected */}
        {selectedAction === "Refer / Escalate" && (
          <div className="space-y-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-amber-950 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Choose Referral Facility</span>
                </label>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Database Verified Facilities
                </span>
              </div>

              <select
                value={referralFacilityId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setReferralFacilityId(val);
                  const f = availableFacilities.find((fac) => fac.id === val);
                  if (f) setReferralFacility(f.name);
                }}
                disabled={loadingFacilities}
                className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                {loadingFacilities ? (
                  <option value="">Loading facilities from database...</option>
                ) : availableFacilities.length > 0 ? (
                  availableFacilities.map((fac) => {
                    const locParts = [fac.block, fac.district, fac.state].filter(Boolean);
                    const locText = locParts.length ? ` — ${locParts.join(", ")}` : "";
                    return (
                      <option key={fac.id} value={fac.id}>
                        {fac.name}{locText}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>No registered facilities found in database</option>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-amber-900">
                Referral / Transfer Reason
              </label>
              <input
                type="text"
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                placeholder="e.g. Higher diagnostic imaging required, surgical evaluation..."
                className="w-full p-2 bg-white border border-amber-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-2xs"
              />
            </div>

            <p className="text-[10px] text-amber-800">
              Case will be transferred and escalated to {referralFacility || "selected facility"} with patient telemetry.
            </p>
          </div>
        )}

        {/* Submit Action Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Submit Action</span>
        </button>

        {/* Audit Disclaimer Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2 text-[11px] text-slate-600">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
          <span>
            Actions are logged for audit. Please ensure all information is verified.
          </span>
        </div>
      </div>
    </div>
  );
}
