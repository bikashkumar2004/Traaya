"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Search,
  CheckCircle2,
  Mic,
  MicOff,
  UploadCloud,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Clock,
  Sparkles,
  Building2,
  UserCheck,
  Loader2,
  RefreshCw,
  Database,
  XCircle,
  User,
  Phone,
  MapPin
} from "lucide-react";
import { searchPatientsLive, PatientSearchResult } from "@/lib/nurse-api";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

interface PatientIntakeProps {
  onCaseCreated: (newCase: any) => Promise<void> | void;
  onCancel?: () => void;
}

export function PatientIntakeWorkflow({ onCaseCreated, onCancel }: PatientIntakeProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Patient type & live search
  const [patientType, setPatientType] = useState<"new" | "existing">("new");
  const [generatedUhid] = useState<string>(() => `OD-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [existingSearch, setExistingSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [foundExisting, setFoundExisting] = useState<PatientSearchResult | null>(null);

  // Step 2: Demographics
  const [age, setAge] = useState<string>("35");
  const [gender, setGender] = useState<string>("Male");
  const [language, setLanguage] = useState<string>("Odia");
  const [consent, setConsent] = useState<boolean>(true);
  const [phone, setPhone] = useState<string>("");
  const [location, setLocation] = useState<string>("Khandapada, Nayagarh, Odisha");
  const [patientName, setPatientName] = useState<string>("");

  // Step 3: Symptoms & Voice input
  const [chiefComplaint, setChiefComplaint] = useState<string>(
    "Fever since 3 days with body pain and weakness. Also cough at night."
  );
  const [duration, setDuration] = useState<string>("3 days");
  const [severity, setSeverity] = useState<string>("Moderate");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  // Step 4: Medical reports
  const [reports, setReports] = useState<Array<{ name: string; size: string; time: string }>>([
    { name: "blood_test_report.jpeg", size: "2.4 MB", time: "Just now" },
  ]);

  // Step 5: Created Case state & submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdCaseData, setCreatedCaseData] = useState<any>(null);

  const steps = [
    { step: 1, title: "Intake Mode", desc: "New or existing patient" },
    { step: 2, title: "Patient Info", desc: "Age, language, consent" },
    { step: 3, title: "Record Symptoms", desc: "Voice or text input" },
    { step: 4, title: "Upload Reports", desc: "Optional documents" },
    { step: 5, title: "Create Case", desc: "Generate triage case" },
  ];

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate live regional speech-to-text
      setTimeout(() => {
        setVoiceTranscript("Patient states fever began Tuesday with shivering, chills, and nighttime dry cough.");
        setChiefComplaint((prev) =>
          prev
            ? `${prev} Shivering and chills reported.`
            : "High fever with shivering and dry nighttime cough."
        );
        setIsRecording(false);
      }, 2500);
    }
  };

  // Auto-search debounce as user types mobile number, name, or UHID
  React.useEffect(() => {
    const term = existingSearch.trim();
    if (term.length < 3) {
      if (term.length === 0) {
        setSearchResults([]);
        setHasSearched(false);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const results = await searchPatientsLive(term);
        setSearchResults(results);
      } catch (err) {
        console.error("Auto-search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [existingSearch]);

  const handleSearchExisting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!existingSearch.trim() || existingSearch.trim().length < 2) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchPatientsLive(existingSearch.trim());
      setSearchResults(results);
    } catch (err) {
      console.error("Patient search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };


  const handleSelectPatient = (p: PatientSearchResult) => {
    setFoundExisting(p);
    setPatientName(p.name);
    setAge(p.age ? String(p.age) : "30");
    setGender(p.gender || "Male");
    setPhone(p.phone || "");
    setLocation(p.location || "Nayagarh, Odisha");
    setLanguage(p.language || "Odia");
    setConsent(p.consent !== "Withheld");
  };

  const handleClearSelectedPatient = () => {
    setFoundExisting(null);
    setPatientName("");
    setPhone("");
    setAge("35");
  };

  const handleCreateCase = async () => {
    setIsSubmitting(true);
    const caseId = `#LS${Math.floor(1000 + Math.random() * 9000)}`;
    const patientUhid = foundExisting?.uhid || generatedUhid;
    const resolvedName = patientName.trim() || (patientType === "new" ? "New Patient" : "Existing Patient");

    const newCase: CaseDetails = {
      id: caseId,
      patientId: patientUhid,
      name: resolvedName,
      age: parseInt(age) || 30,
      gender: gender,
      phone: phone || "",
      location: location,
      language: `${language} (Translated to English)`,
      consent: consent ? "Given" : "Withheld",
      quickNotes: `Patient intake at CHC Khandapada nurse station. ${patientType === "new" ? "Stored in new_patient registry." : `Linked to ${foundExisting?.source || "existing"} record.`}`,
      submittedTime: "Just now",
      urgency: severity === "Severe" || severity === "High" ? "High Priority" : "Yellow (Priority 2)",
      urgencyClass: severity === "Severe" || severity === "High" ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-amber-100 text-amber-800 border-amber-300",
      status: "Under Review",
      chiefComplaint: chiefComplaint,
      intakeMode: patientType,
      existingPatientId: foundExisting?.id,
      existingPatientSource: foundExisting?.source,
      aiInfo: {
        symptoms: chiefComplaint.split(/[,.\n]+/).map(s => s.trim()).filter(Boolean).slice(0, 5),
        duration: duration,
        severity: `${severity} (self-reported)`,
        associated: "None",
        redFlags: severity === "Severe" ? "Acute distress noted" : "None detected yet",
      },
      missingDetails: [
        "temperature value",
        "travel history",
        "chronic conditions",
      ],
      reports: reports.map((r) => r.name),
      aiReportAnalysis: reports.length > 0 ? [
        "Diagnostic documents attached to triage record",
        "Clinical symptoms logged for attending physician",
      ] : [
        "Standard intake documentation prepared for clinical reviewer"
      ],
      aiSuggestion: {
        priority: severity === "Severe" ? "Red (Priority 1)" : "Yellow (Priority 2)",
        reason: `${severity} symptom onset reported. Triage review scheduled.`,
      },
      facility: "CHC Khandapada",
      facilityLocation: "Nayagarh, Odisha",
      consultationMode: "offline",
    };

    try {
      await onCaseCreated(newCase);
      setCreatedCaseData(newCase);
      setCurrentStep(5);
    } catch (err) {
      console.error("Error creating intake case:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="space-y-6 w-full">
      {/* Top Patient Intake Header like patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Patient Intake Station
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Follow the 5-step triage intake protocol to register, document, and route incoming community cases.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
            Step {currentStep} of 5
          </span>
        </div>
      </div>

      {/* 5-Step Stepper Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {steps.map((s) => {
          const isDone = s.step < currentStep;
          const isCurrent = s.step === currentStep;
          return (
            <div
              key={s.step}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isCurrent
                  ? "bg-white border-teal-500 ring-2 ring-teal-100 shadow-xs"
                  : isDone
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                  : "bg-white/70 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-teal-700 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
                </span>
                <span
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? "text-teal-950"
                      : isDone
                      ? "text-emerald-900"
                      : "text-slate-500"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1 hidden sm:block truncate">
                {s.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {/* STEP 1: Nurse opens Patient Intake */}
        {currentStep === 1 && (
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

            {patientType === "new" && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-2">
                    <span>New Walk-in Intake Mode</span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-300 font-bold">
                      UHID: {generatedUhid}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                      Destination: new_patient table
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    First-time community visitor. The patient will be recorded in the dedicated <strong>new_patient</strong> table. Profiles and auth accounts are not modified.
                  </p>
                </div>
              </div>
            )}

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
                    {searchResults.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="p-3 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-xs flex flex-wrap items-center gap-2">
                            <span>{p.name}</span>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {p.uhid}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              p.source === "new_patient"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}>
                              {p.source === "new_patient" ? "new_patient" : "profiles"}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{p.age}y / {p.gender}</span>
                            <span>&bull;</span>
                            <span>{p.phone || "No phone"}</span>
                            <span>&bull;</span>
                            <span className="truncate max-w-[200px]">{p.location}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPatient(p);
                          }}
                          className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs"
                        >
                          Select & Link
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!foundExisting && hasSearched && !isSearching && searchResults.length === 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      No existing patient record found matching &ldquo;{existingSearch}&rdquo;.
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientType("new");
                        setPatientName(existingSearch);
                      }}
                      className="text-xs font-bold text-teal-800 hover:underline cursor-pointer"
                    >
                      Register as New Walk-In &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Patient Info</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        {/* STEP 2: Enter patient information */}
        {currentStep === 2 && (
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
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Record Symptoms</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Record symptoms */}
        {currentStep === 3 && (
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
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>Continue to Medical Reports</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Upload medical reports (optional) */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                4. Upload medical reports (optional)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Add relevant documents with the patient&apos;s permission (CBC reports, prescriptions, past discharge summaries).
              </p>
            </div>

            {/* Drag and Drop Zone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-teal-50/30 transition-all cursor-pointer">
              <UploadCloud className="w-10 h-10 text-teal-600 mx-auto" />
              <div className="mt-2 text-xs font-bold text-slate-800">
                Drag & drop report files, or browse local disk
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports JPEG, PNG, PDF (up to 15MB)
              </p>
              <button
                type="button"
                onClick={() => {
                  setReports((prev) => [
                    ...prev,
                    { name: `lab_scan_${Date.now().toString().slice(-4)}.pdf`, size: "1.8 MB", time: "Just now" },
                  ]);
                }}
                className="mt-3 px-3 py-1.5 bg-white border border-slate-300 hover:border-teal-600 text-slate-700 font-bold text-[11px] rounded-lg shadow-2xs transition-colors"
              >
                + Add Sample Test Report
              </button>
            </div>

            {/* Uploaded Reports List */}
            {reports.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">
                  Attached Documents ({reports.length})
                </span>
                {reports.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {r.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.size} &bull; Uploaded {r.time}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      OCR Ready
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleCreateCase}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-200" />
                    <span>Registering Patient & Generating Case...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Health Case</span>
                    <Sparkles className="w-4 h-4 text-teal-200" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Create a health case (Success View) */}
        {currentStep === 5 && createdCaseData && (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                5. Health Case Generated &bull; Live Database Synchronized
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Case {createdCaseData.id} Created Successfully
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                The intake case is officially logged and forwarded to the clinical triage queue for review.
              </p>
            </div>

            {/* Case Snapshot Card */}
            <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-bold text-slate-900">{createdCaseData.name}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Patient ID (UHID):</span>
                <span className="font-mono font-bold text-slate-900">{createdCaseData.patientId}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Registry Table:</span>
                {createdCaseData.intakeMode === "new" ? (
                  <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded border border-emerald-300">
                    new_patient Table (Profiles untouched)
                  </span>
                ) : (
                  <span className="font-bold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded border border-blue-300">
                    Linked to {createdCaseData.existingPatientSource === "new_patient" ? "new_patient" : "profiles"}
                  </span>
                )}
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Initial Triage:</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {createdCaseData.urgency}
                </span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Chief Complaint:</span>
                <span className="font-medium text-slate-800 truncate max-w-[200px]">
                  {createdCaseData.chiefComplaint}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Assigned Facility:</span>
                <span className="font-bold text-slate-900">CHC Khandapada</span>
              </div>
            </div>


            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setCreatedCaseData(null);
                }}
                className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                + Start Another Intake
              </button>

              <button
                type="button"
                onClick={() => onCancel?.()}
                className="w-full sm:w-auto px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Open in Triage Queue &bull;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
