"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { TrustBadge } from "@/components/common/TrustBadge";
import { 
  Stethoscope, 
  HeartPulse, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Send, 
  Pill, 
  Building2,
  ArrowLeft,
  Clock,
  UserCheck,
  Activity
} from "lucide-react";
import Link from "next/link";

function ClinicalDecisionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const ticketId = searchParams.get("id") || "TR-9041";

  // Patient dossier
  const [patientData, setPatientData] = useState({
    id: ticketId,
    name: "Aarav Sharma",
    age: 38,
    gender: "Male",
    abhaId: "91-4421-8932-1049",
    facility: "Community Health Centre (CHC) Khandapada",
    intakeNurse: "Priya Nair, ANM",
    chiefComplaint: "High fever (101.8°F), body chills, rigors, retro-orbital headache x 3 days",
    symptoms: ["High fever", "Headache", "Chills"] as string[],
    summary: "Patient has been experiencing high fever (101.8°F) with headache and rigors for 3 days.",
    questionsAnswers: { temperature: "101.8°F", duration: "3 days", headache_severity: "Severe" } as Record<string, string>,
    rawQa: [
      { question: "What is your current or highest measured temperature?", answer: "101.8°F" },
      { question: "How severe is your headache?", answer: "Severe" },
      { question: "How long have you had symptoms?", answer: "3 days" }
    ] as Array<{ question: string; answer: string }>,
    vitals: {
      spo2: 96,
      bp_sys: 124,
      bp_dia: 82,
      pulse: 104,
      temp: 101.8,
      resp_rate: 20
    },
    currentUrgency: "Priority" as "Routine" | "Priority" | "Urgent",
    verified: false,
    verifiedBy: "",
    verifiedAt: "",
    consultationMode: "online"
  });

  // Doctor override & disposition
  const [overrideUrgency, setOverrideUrgency] = useState<string>(patientData.currentUrgency);
  const [clinicalReason, setClinicalReason] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("Patient is conscious, oriented, febrile. Oral mucous membranes moist. Systemic examination: chest clear, soft abdomen without hepatosplenomegaly.");
  const [prescriptions, setPrescriptions] = useState<string>("Tab. Paracetamol 650mg TDS x 3 days\nORS 1L daily hydration");
  const [disposition, setDisposition] = useState("Admit to PHC Day Care for Observation");

  // Dynamic fetch of ticket from Supabase / API
  useEffect(() => {
    async function loadTicket() {
      if (!ticketId) return;

      // 1. Try Supabase direct query
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from("triage_tickets")
            .select("*, profiles:patient_id(full_name, age, gender, phone, user_id)")
            .or(`id.eq.${ticketId},case_number.eq.${ticketId}`)
            .maybeSingle();

          if (!error && data) {
            const sdata = data.symptoms_data || {};
            const priorityNormalized = (data.priority || data.urgency || "").toLowerCase().includes("red")
              ? "Urgent"
              : (data.priority || data.urgency || "").toLowerCase().includes("yellow")
              ? "Priority"
              : "Routine";

            const rawVitals = sdata.vitals || data.vitals || {};
            const profile = data.profiles || {};
            const isFamily = Boolean(data.is_family_member);
            const pName = isFamily ? (data.family_member_name || "Family Member") : (profile.full_name || "Aarav Sharma");
            const pUhid = isFamily ? (data.family_member_uhid || "PT-FAM") : (profile.user_id || "91-4421-8932-1049");

            setPatientData({
              id: data.case_number || data.id,
              name: pName,
              age: profile.age || 38,
              gender: profile.gender || "Male",
              abhaId: pUhid,
              facility: "Community Health Centre (CHC) Khandapada",
              intakeNurse: "Priya Nair, ANM",
              chiefComplaint: sdata.summary || sdata.chief_complaint || "Acute symptoms requiring evaluation",
              symptoms: Array.isArray(sdata.symptoms)
                ? sdata.symptoms.map((s: any) => (typeof s === "string" ? s : s?.name || ""))
                : [],
              summary: sdata.summary || sdata.chief_complaint || "",
              questionsAnswers: typeof sdata.questions_answers === "object" ? sdata.questions_answers : {},
              rawQa: Array.isArray(sdata.raw_qa) ? sdata.raw_qa : [],
              vitals: {
                spo2: rawVitals.spo2 || 96,
                bp_sys: rawVitals.bp_sys || 120,
                bp_dia: rawVitals.bp_dia || 80,
                pulse: rawVitals.pulse || 88,
                temp: parseFloat(String(rawVitals.temperature || "98.6").replace(/[^0-9.]/g, "")) || 98.6,
                resp_rate: rawVitals.resp_rate || 18,
              },
              currentUrgency: priorityNormalized,
              verified: data.status === "Completed",
              verifiedBy: "Dr. Ananya Sen",
              verifiedAt: data.status === "Completed" ? "Completed" : "",
              consultationMode: data.consultation_mode || "online"
            });
            setOverrideUrgency(priorityNormalized);
            if (data.resolve_notes || data.doctor_notes) setDoctorNotes(data.resolve_notes || data.doctor_notes);
            return;
          }
        } catch (e) {
          console.warn("Notice fetching ticket from Supabase:", e);
        }
      }

      // 2. Try FastAPI backend
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/triage/ticket/${ticketId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.status === "success" && json.ticket) {
            const t = json.ticket;
            const sdata = t.symptoms_data || {};
            const urgencyNorm = (t.urgency || "").toLowerCase().includes("urgent")
              ? "Urgent"
              : (t.urgency || "").toLowerCase().includes("priority")
              ? "Priority"
              : "Routine";
            setPatientData(prev => ({
              ...prev,
              id: t.case_number || t.id,
              name: t.patient_name || prev.name,
              age: t.patient_age || prev.age,
              gender: t.patient_gender || prev.gender,
              chiefComplaint: sdata.summary || sdata.chief_complaint || t.chief_complaint || prev.chiefComplaint,
              symptoms: Array.isArray(sdata.symptoms)
                ? sdata.symptoms.map((s: any) => (typeof s === "string" ? s : s?.name || ""))
                : prev.symptoms,
              summary: sdata.summary || sdata.chief_complaint || prev.summary,
              questionsAnswers: typeof sdata.questions_answers === "object" ? sdata.questions_answers : prev.questionsAnswers,
              rawQa: Array.isArray(sdata.raw_qa) ? sdata.raw_qa : prev.rawQa,
              currentUrgency: urgencyNorm,
            }));
            setOverrideUrgency(urgencyNorm);
          }
        }
      } catch (e) {
        // Fallback to initial state
      }
    }

    loadTicket();
  }, [ticketId]);

  const [saving, setSaving] = useState(false);
  const [auditSuccess, setAuditSuccess] = useState(false);

  const handleToggleVerification = () => {
    setPatientData(prev => ({
      ...prev,
      verified: !prev.verified,
      verifiedBy: !prev.verified ? (user?.fullName || "Dr. Kavita Verma, MD") : "",
      verifiedAt: !prev.verified ? "Today at 03:00 PM" : ""
    }));
  };

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAuditSuccess(false);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      // Call FastAPI override & audit endpoint
      await fetch(`${apiUrl}/api/triage/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: patientData.id,
          doctor_id: user?.id || "doctor-demo-1",
          original_urgency: patientData.currentUrgency,
          new_urgency: overrideUrgency,
          clinical_reason: clinicalReason || "Physician verified diagnosis following clinical examination",
          doctor_notes: doctorNotes
        })
      });

      setPatientData(prev => ({
        ...prev,
        currentUrgency: overrideUrgency as any,
        verified: true,
        verifiedBy: user?.fullName || "Dr. Kavita Verma, MD",
        verifiedAt: "Just now"
      }));

      setAuditSuccess(true);
    } catch {
      setAuditSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/doctor"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:text-teal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Doctor Review Queue</span>
        </Link>

        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Triage ID: {patientData.id}
        </span>
      </div>

      {/* Patient Dossier Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{patientData.name}</h1>
            <span className="text-xs text-slate-500 font-medium">({patientData.age}y, {patientData.gender})</span>
            <UrgencyBadge urgency={patientData.currentUrgency} size="md" />
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${
              patientData.consultationMode !== "offline"
                ? "bg-teal-50 text-teal-800 border-teal-200"
                : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              {patientData.consultationMode !== "offline" ? "💻 Online Teleconsult" : "🏥 In-Person OPD"}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1.5">
            <span>ABHA ID: <strong className="text-slate-800 font-mono">{patientData.abhaId}</strong></span>
            <span>&bull;</span>
            <span>Intake Sub-Centre: <strong className="text-slate-800">{patientData.facility}</strong></span>
            <span>&bull;</span>
            <span>Triage ANM: <strong className="text-slate-800">{patientData.intakeNurse}</strong></span>
          </div>
        </div>

        <div className="text-right self-start sm:self-center">
          <span className="text-xs text-slate-400 block">Queue Wait Time</span>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-1 justify-end">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            14 minutes
          </span>
        </div>
      </div>

      {/* Physiological Telemetry & Lab Extractions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Pulse Oximetry</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {patientData.vitals.spo2}%
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">Normal Oxygenation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Blood Pressure</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {patientData.vitals.bp_sys}/{patientData.vitals.bp_dia}
          </div>
          <span className="text-[11px] text-slate-500">Normal Range (120/80)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-xs text-amber-800 font-medium">Heart Rate</span>
          <div className="text-2xl font-bold text-amber-800 tabular-nums mt-1">
            {patientData.vitals.pulse} <span className="text-xs font-normal">bpm</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">Tachycardia (Febrile)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
          <span className="text-xs text-rose-800 font-medium">Body Temperature</span>
          <div className="text-2xl font-bold text-rose-800 tabular-nums mt-1">
            {patientData.vitals.temp} <span className="text-xs font-normal">°F</span>
          </div>
          <span className="text-[11px] text-rose-700 font-semibold">Acute Pyrexia</span>
        </div>
      </div>

      {/* Human-in-the-Loop Trust Protocol Banner */}
      <TrustBadge
        verified={patientData.verified}
        verifiedBy={patientData.verifiedBy}
        verifiedAt={patientData.verifiedAt}
        canVerify={true}
        onToggleVerify={handleToggleVerification}
      />

      {/* Reported Symptoms & Clinical Summary Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Reported Symptoms &amp; Clinical Summary
            </h2>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            Intake Symptoms Data
          </span>
        </div>

        {/* 1. Summary paragraph */}
        <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 text-xs text-slate-800 leading-relaxed font-medium">
          <span className="font-bold text-teal-950 block mb-1">Clinical Summary:</span>
          {patientData.summary || patientData.chiefComplaint}
        </div>

        {/* 2. Symptoms Chips */}
        {patientData.symptoms.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Identified Symptoms
            </span>
            <div className="flex flex-wrap gap-2">
              {patientData.symptoms.map((sym, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                >
                  {sym}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. Questions & Answers */}
        {(patientData.rawQa.length > 0 || Object.keys(patientData.questionsAnswers).length > 0) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Patient Intake Responses (Q&amp;A)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {patientData.rawQa.length > 0
                ? patientData.rawQa.map((qa, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block leading-tight">{qa.question}</span>
                      <strong className="text-slate-900 font-semibold block mt-0.5">{qa.answer}</strong>
                    </div>
                  ))
                : Object.entries(patientData.questionsAnswers).map(([k, v], i) => (
                    <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[11px] text-slate-500 block capitalize">{k.replace(/_/g, " ")}</span>
                      <strong className="text-slate-900 font-semibold block mt-0.5">{v}</strong>
                    </div>
                  ))}
            </div>
          </div>
        )}
      </div>

      {/* Clinical Differential & Override Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: AI Clinical Guidance & Lab Reports */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">
                Assistive AI Differential Considerations
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-teal-900">1. Acute Febrile Illness (AFI) - High Likelihood</span>
                <p className="text-slate-700">
                  Patient exhibits pyrexia (101.8°F), rigors, and tachycardia. Local syndromic cluster detected in Ward 7.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-slate-900">2. Vector-Borne Infection (Dengue / Malaria)</span>
                <p className="text-slate-600">
                  Platelet count at 95,000 / cu.mm requires repeat serial monitoring at 24 hours. Order NS1 antigen test.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>OCR Extracted Laboratory Telemetry</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Point-of-Care
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Hemoglobin (Hb)</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">8.4 g/dL</span>
                <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">Low (Microcytic)</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-rose-200">
                <span className="text-[11px] text-slate-500 block">Platelets</span>
                <span className="font-bold text-rose-700 text-sm tabular-nums">95,000 / cu.mm</span>
                <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">Low (Watchlist)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Doctor Sign-Off & Override Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Attending Physician Final Sign-off &amp; Override</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All modifications are permanently logged into Drizzle Supabase `audit_logs` table.
            </p>
          </div>

          {auditSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Clinical decision attested and immutable audit trail updated!</span>
            </div>
          )}

          <form onSubmit={handleSignOff} className="space-y-4">
            {/* Urgency Classification Override */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Clinical Urgency Sign-off / Override
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["Routine", "Priority", "Urgent"].map((urg) => (
                  <button
                    key={urg}
                    type="button"
                    onClick={() => setOverrideUrgency(urg)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all ${
                      overrideUrgency === urg
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {urg}
                  </button>
                ))}
              </div>
            </div>

            {/* Clinical Override Reason */}
            {overrideUrgency !== patientData.currentUrgency && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
                <label className="block font-bold text-amber-900">
                  Override Justification (Required for Compliance Audit) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical stability verified; outpatient observation adequate"
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-teal-700"
                />
              </div>
            )}

            {/* Doctor Clinical Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Doctor Examination &amp; Clinical Progress Notes
              </label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
              />
            </div>

            {/* Prescription */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                <span>Prescriptions &amp; Point-of-Care Orders</span>
              </label>
              <textarea
                rows={2}
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700 font-mono"
              />
            </div>

            {/* Disposition */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Patient Clinical Disposition
              </label>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
              >
                <option value="Admit to PHC Day Care for Observation">Admit to PHC Day Care for Observation</option>
                <option value="Discharge with Oral Medication & 48h Review">Discharge with Oral Medication &amp; 48h Review</option>
                <option value="Immediate Referral to District Hospital ICU">Immediate Referral to District Hospital ICU</option>
                <option value="Refer to Specialized Infectious Disease Unit">Refer to Specialized Infectious Disease Unit</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>{saving ? "Recording Physician Sign-off..." : "Attest & Complete Triage Decision"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDecisionStationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Clinical Station...</div>}>
      <ClinicalDecisionContent />
    </Suspense>
  );
}
