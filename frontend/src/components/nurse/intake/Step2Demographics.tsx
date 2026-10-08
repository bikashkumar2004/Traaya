"use client";

import React from "react";
import { CheckCircle2, UserPlus, ArrowRight } from "lucide-react";
import { PatientSearchResult } from "@/lib/nurse";

interface Step2DemographicsProps {
  foundExisting: PatientSearchResult | null;
  generatedUhid: string;
  patientName: string;
  setPatientName: (val: string) => void;
  age: string;
  setAge: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  consent: boolean;
  setConsent: (val: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2Demographics({
  foundExisting,
  generatedUhid,
  patientName,
  setPatientName,
  age,
  setAge,
  gender,
  setGender,
  language,
  setLanguage,
  phone,
  setPhone,
  location,
  setLocation,
  consent,
  setConsent,
  onBack,
  onContinue,
}: Step2DemographicsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          2. Enter patient information
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Age, preferred language, consent, and other minimum required details.
        </p>
      </div>

      {foundExisting ? (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Linked Record: <strong>{foundExisting.name}</strong> ({foundExisting.uhid}). Details pre-filled below.
            </span>
          </div>
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-blue-200">
            {foundExisting.source === "new_patient" ? "new_patient" : "profiles"}
          </span>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              New Patient Walk-in Intake: Record will be stored into <strong>new_patient</strong> table (UHID: <span className="font-mono">{generatedUhid}</span>).
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-emerald-300">
            new_patient table
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Patient Full Name (or leave anonymous)
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="e.g. Not disclosed"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Age (Years) <span className="text-rose-600">*</span>
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Gender <span className="text-rose-600">*</span>
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Preferred Language <span className="text-rose-600">*</span>
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          >
            <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="English">English</option>
            <option value="Bengali">Bengali (বাংলা)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Contact Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 9XXXXXXXX"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Location / Village (Distance)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Nayagarh, Odisha (12 km)"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-teal-600 rounded-xl text-xs outline-hidden"
          />
        </div>
      </div>

      {/* Consent Box */}
      <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 flex items-start gap-3">
        <input
          type="checkbox"
          id="consentCheck"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
        />
        <label htmlFor="consentCheck" className="text-xs text-slate-700 cursor-pointer">
          <span className="font-bold text-slate-900 block">
            Patient Informed Consent Acquired
          </span>
          The patient or accompanying guardian has provided consent to process health data, clinical symptoms, and lab reports under ABDM digital health guidelines.
        </label>
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
          <span>Continue to Record Symptoms</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
