"use client";

import React from "react";
import {
  UserPlus,
  UserCheck,
  Search,
  CheckCircle2,
  Loader2,
  Database,
  ArrowRight,
  User,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";
import { PatientSearchResult } from "@/lib/nurse";

interface Step1PatientTypeSearchProps {
  patientType: "new" | "existing";
  setPatientType: (val: "new" | "existing") => void;
  generatedUhid: string;
  existingSearch: string;
  setExistingSearch: (val: string) => void;
  isSearching: boolean;
  hasSearched: boolean;
  searchResults: PatientSearchResult[];
  foundExisting: PatientSearchResult | null;
  handleSearchExisting: (e: React.FormEvent) => void;
  handleSelectExisting: (patient: PatientSearchResult) => void;
  handleClearSelectedPatient: () => void;
  onContinue: () => void;
}

export function Step1PatientTypeSearch({
  patientType,
  setPatientType,
  generatedUhid,
  existingSearch,
  setExistingSearch,
  isSearching,
  hasSearched,
  searchResults,
  foundExisting,
  handleSearchExisting,
  handleSelectExisting,
  handleClearSelectedPatient,
  onContinue,
}: Step1PatientTypeSearchProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          1. Nurse opens Patient Intake
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Selects whether the patient is new or has an existing patient record, subject to your privacy and identification process.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPatientType("new")}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            patientType === "new"
              ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-200"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="font-bold text-slate-900 mt-3 text-sm">
            New Patient Intake
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            First-time visitor with no existing ABHA ID or PHC card. Generates a new triage record.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setPatientType("existing")}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            patientType === "existing"
              ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-200"
              : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-slate-900 mt-3 text-sm">
            Existing Patient Record
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Look up previous visits, longitudinal EHR, or link an active ABHA / UHID number.
          </p>
        </button>
      </div>



      {patientType === "existing" && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-slate-700">
              Search Live Database by UHID, Name, or Mobile Number
            </label>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Database className="w-3 h-3 text-teal-700" />
              <span>Searches <strong>new_patient</strong> & <strong>profiles</strong></span>
            </span>
          </div>

          <form onSubmit={handleSearchExisting} className="space-y-1.5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={existingSearch}
                  onChange={(e) => setExistingSearch(e.target.value)}
                  placeholder="Enter 10-digit mobile (e.g. 9437819472), UHID, or patient name..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-teal-600 rounded-xl text-xs outline-hidden shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !existingSearch.trim()}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{isSearching ? "Searching..." : "Search"}</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1">
              <span className="text-teal-700 font-semibold">&bull; Any format accepted:</span>
              <span>No need to type exact spaces or +91 prefix (e.g. <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800 font-mono text-[10px]">9437819472</code> or <code className="bg-slate-200/80 px-1 py-0.5 rounded text-slate-800 font-mono text-[10px]">+91 94378 19472</code>).</span>
            </div>
          </form>

          {foundExisting && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="font-bold text-emerald-950 flex flex-wrap items-center gap-2">
                    <span>{foundExisting.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-emerald-200">
                      {foundExisting.uhid}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {foundExisting.source === "new_patient" ? "Walk-in Registry (new_patient)" : "Patient Profile (profiles)"}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    {foundExisting.age}y &bull; {foundExisting.gender} &bull; {foundExisting.phone || "No phone"} &bull; {foundExisting.location}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedPatient}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-1 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          )}

          {!foundExisting && hasSearched && searchResults.length > 0 && (
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-slate-500">
                Found {searchResults.length} matching record{searchResults.length > 1 ? "s" : ""}:
              </div>
              {searchResults.map((res) => (
                <div
                  key={`${res.source}-${res.id}`}
                  className="p-3 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl transition-all flex items-center justify-between text-xs cursor-pointer shadow-2xs"
                  onClick={() => handleSelectExisting(res)}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.name}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                        {res.uhid}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        res.source === "new_patient" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {res.source === "new_patient" ? "new_patient" : "profile"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Age: {res.age}</span>
                      <span>Gender: {res.gender}</span>
                      {res.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {res.phone}
                        </span>
                      )}
                      {res.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {res.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectExisting(res);
                    }}
                    className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          )}

          {!foundExisting && hasSearched && searchResults.length === 0 && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">No patient found matching &ldquo;{existingSearch}&rdquo;</div>
                <p className="text-[11px] text-amber-800">
                  Searched both <strong>new_patient</strong> and <strong>profiles</strong> tables. You can switch to <strong>New Patient Intake</strong> to create a new record.
                </p>
                <button
                  type="button"
                  onClick={() => setPatientType("new")}
                  className="mt-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" />
                  Switch to New Patient Intake
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>Continue to Demographics</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
