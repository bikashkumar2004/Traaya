"use client";

import React, { useState } from "react";
import {
  UserPlus,
  UserCheck,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { searchPatientsLive, PatientSearchResult } from "@/lib/nurse";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import {
  Step1PatientTypeSearch,
  Step2Demographics,
  Step3SymptomsVoice,
  Step4DocumentsClinical,
  Step5IntakeConfirmation,
} from "./intake";

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
  const [duration, setDuration] = useState<string>("2-3 days");
  const [severity, setSeverity] = useState<string>("Moderate");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>("");

  // Step 4: Medical Reports
  const [reports, setReports] = useState<{ name: string; size: string; time: string }[]>([
    { name: "CBC_Platelet_Report_Jan2026.pdf", size: "2.4 MB", time: "2 hrs ago" },
  ]);

  // Step 5 / Output
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdCaseData, setCreatedCaseData] = useState<any | null>(null);

  // Handle Search for Existing Patient
  const handleSearchExisting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!existingSearch.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchPatientsLive(existingSearch.trim());
      setSearchResults(results);
      if (results.length === 1) {
        handleSelectExisting(results[0]);
      }
    } catch (err) {
      console.error("Error searching patients:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectExisting = (patient: PatientSearchResult) => {
    setFoundExisting(patient);
    setPatientName(patient.name || "");
    if (patient.age) setAge(String(patient.age));
    if (patient.gender) setGender(patient.gender);
    if (patient.phone) setPhone(patient.phone);
    if (patient.location) setLocation(patient.location);
    if (patient.language) setLanguage(patient.language);
  };

  const handleClearSelectedPatient = () => {
    setFoundExisting(null);
    setPatientName("");
    setPhone("");
    setAge("35");
  };

  // Mock Voice Input toggle
  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceTranscript(
        "Patient complains of continuous body ache and mild fever for the last three days. Weakness worsening."
      );
      setChiefComplaint((prev) =>
        prev
          ? `${prev}\n[Voice Notes]: Continuous body ache and mild fever for 3 days. Weakness worsening.`
          : "Continuous body ache and mild fever for 3 days. Weakness worsening."
      );
    } else {
      setIsRecording(true);
      setVoiceTranscript("");
    }
  };

  // Create Health Case
  const handleCreateCase = async () => {
    setIsSubmitting(true);

    const generatedCaseId = `CASE-2026-${Math.floor(100 + Math.random() * 900)}`;
    const effectivePatientId = foundExisting ? foundExisting.uhid : generatedUhid;
    const effectiveName = patientName.trim() || (foundExisting ? foundExisting.name : "Walk-in Patient");

    const newCase: any = {
      id: generatedCaseId,
      patientId: effectivePatientId,
      name: effectiveName,
      age: parseInt(age, 10) || 35,
      gender: gender,
      phone: phone || "Not provided",
      urgency: severity === "Severe" ? "Emergency" : severity === "Moderate" ? "High" : "Medium",
      time: "Just now",
      intakeMode: patientType,
      existingPatientId: foundExisting?.id,
      existingPatientSource: foundExisting?.source,
      aiTriage: {
        score: severity === "Severe" ? 88 : 68,
        confidence: "94%",
        redFlagsCount: severity === "Severe" ? 1 : 0,
      },
      vitals: {
        hr: 88,
        spo2: 97,
        bp: "124/82",
        temp: 100.4,
        history: [
          { time: "Intake", hr: 88, spo2: 97, bp: "124/82", temp: 100.4 },
        ],
      },
      doctorNotes: "",
      nurseNotes: `Walk-in intake by nurse. Language: ${language}. Reported severity: ${severity}. Duration: ${duration}. Location: ${location}.`,
      status: "Waiting for Doctor",
      symptomsData: {
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

  const stepsList = [
    { num: 1, title: "Patient Intake", desc: "Select record type", icon: UserPlus },
    { num: 2, title: "Demographics", desc: "Age, language, consent", icon: UserCheck },
    { num: 3, title: "Symptoms", desc: "Voice input & description", icon: AlertCircle },
    { num: 4, title: "Medical Reports", desc: "Attach diagnostic docs", icon: FileText },
    { num: 5, title: "Case Generated", desc: "Live DB synchronized", icon: Sparkles },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* Top Patient Intake Header */}
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
        {stepsList.map((st) => {
          const Icon = st.icon;
          const isDone = currentStep > st.num;
          const isCurrent = currentStep === st.num;

          return (
            <div
              key={st.num}
              onClick={() => {
                if (isDone) setCurrentStep(st.num);
              }}
              className={`p-3 rounded-2xl border transition-all ${
                isDone ? "cursor-pointer" : ""
              } ${
                isCurrent
                  ? "bg-teal-800 text-white border-teal-800 shadow-md shadow-teal-900/10"
                  : isDone
                  ? "bg-teal-50 border-teal-200 text-teal-900 hover:bg-teal-100/60"
                  : "bg-white border-slate-200 text-slate-400 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? "bg-white text-teal-900"
                      : isDone
                      ? "bg-teal-200 text-teal-900"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : st.num}
                </span>
                <Icon className={`w-4 h-4 ${isCurrent ? "text-teal-200" : isDone ? "text-teal-700" : "text-slate-300"}`} />
              </div>
              <div className={`text-xs font-bold leading-tight ${isCurrent ? "text-white" : isDone ? "text-teal-950" : "text-slate-500"}`}>
                {st.title}
              </div>
              <div className={`text-[10px] mt-0.5 truncate ${isCurrent ? "text-teal-100" : isDone ? "text-teal-700" : "text-slate-400"}`}>
                {st.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {currentStep === 1 && (
          <Step1PatientTypeSearch
            patientType={patientType}
            setPatientType={setPatientType}
            generatedUhid={generatedUhid}
            existingSearch={existingSearch}
            setExistingSearch={setExistingSearch}
            isSearching={isSearching}
            hasSearched={hasSearched}
            searchResults={searchResults}
            foundExisting={foundExisting}
            handleSearchExisting={handleSearchExisting}
            handleSelectExisting={handleSelectExisting}
            handleClearSelectedPatient={handleClearSelectedPatient}
            onContinue={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Demographics
            foundExisting={foundExisting}
            generatedUhid={generatedUhid}
            patientName={patientName}
            setPatientName={setPatientName}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            language={language}
            setLanguage={setLanguage}
            phone={phone}
            setPhone={setPhone}
            location={location}
            setLocation={setLocation}
            consent={consent}
            setConsent={setConsent}
            onBack={() => setCurrentStep(1)}
            onContinue={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3SymptomsVoice
            language={language}
            isRecording={isRecording}
            handleVoiceToggle={handleVoiceToggle}
            voiceTranscript={voiceTranscript}
            chiefComplaint={chiefComplaint}
            setChiefComplaint={setChiefComplaint}
            duration={duration}
            setDuration={setDuration}
            severity={severity}
            setSeverity={setSeverity}
            onBack={() => setCurrentStep(2)}
            onContinue={() => setCurrentStep(4)}
          />
        )}

        {currentStep === 4 && (
          <Step4DocumentsClinical
            reports={reports}
            setReports={setReports}
            isSubmitting={isSubmitting}
            onBack={() => setCurrentStep(3)}
            onSubmit={handleCreateCase}
          />
        )}

        {currentStep === 5 && createdCaseData && (
          <Step5IntakeConfirmation
            createdCaseData={createdCaseData}
            onStartAnother={() => {
              setCurrentStep(1);
              setCreatedCaseData(null);
            }}
            onOpenQueue={() => onCancel?.()}
          />
        )}
      </div>
    </div>
  );
}
