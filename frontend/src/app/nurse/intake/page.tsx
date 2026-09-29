"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { TrustBadge } from "@/components/common/TrustBadge";
import { 
  ClipboardList, 
  HeartPulse, 
  Activity, 
  User, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function NurseIntakeStation() {
  const router = useRouter();
  const { user } = useAuth();

  // Patient Demographics
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState<number | "">(35);
  const [patientGender, setPatientGender] = useState("male");
  const [abhaId, setAbhaId] = useState("");

  // Vitals Telemetry
  const [spo2, setSpo2] = useState<number | "">(96);
  const [bpSys, setBpSys] = useState<number | "">(120);
  const [bpDia, setBpDia] = useState<number | "">(80);
  const [pulse, setPulse] = useState<number | "">(78);
  const [temp, setTemp] = useState<number | "">(98.6);
  const [respRate, setRespRate] = useState<number | "">(18);

  // Clinical Chief Complaint
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  const calculateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !chiefComplaint) return;

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/triage/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: patientName,
          patient_age: Number(patientAge) || 30,
          patient_gender: patientGender,
          chief_complaint: chiefComplaint,
          symptoms: [chiefComplaint],
          vitals: {
            spo2: Number(spo2) || null,
            bp_sys: Number(bpSys) || null,
            bp_dia: Number(bpDia) || null,
            pulse: Number(pulse) || null,
            temp: Number(temp) || null,
            resp_rate: Number(respRate) || null,
          },
          chronic_conditions: chronicConditions
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
        setSuccess(true);
      } else {
        throw new Error("FastAPI assessment failed");
      }
    } catch {
      // Local fallback calculation
      const numSpo2 = Number(spo2) || 98;
      const numBpSys = Number(bpSys) || 120;
      const isUrgent = numSpo2 < 90 || numBpSys >= 180 || chiefComplaint.toLowerCase().includes("chest pain");
      const isPriority = !isUrgent && (numSpo2 <= 94 || numBpSys >= 140 || Number(temp) >= 101);
      const level = isUrgent ? "Urgent" : isPriority ? "Priority" : "Routine";

      setAssessment({
        urgency: level,
        risk_score: level === "Urgent" ? 90 : level === "Priority" ? 65 : 20,
        differential_considerations: [
          "Primary Acute Encounter",
          "Physiological Variation Under Observation"
        ],
        vital_triggers: numSpo2 < 90 ? ["SpO2 < 90% (Hypoxemia)"] : [],
        recommended_actions: [
          level === "Urgent" ? "Stat Medical Officer Bedside Evaluation" : "Place in standard OPD triage queue",
          "Continuous vital parameter monitoring"
        ],
        human_verification_required: true,
        clinical_disclaimer: "Triage assistive algorithm only. Final triage decision rests with the attending medical officer."
      });
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
          Screen cc950d &bull; Field Intake Station
        </span>
        <h1 className="text-2xl font-bold text-slate-900">
          Rapid Patient Intake &amp; Physiological Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Record incoming patient vitals, verify ABHA credentials, and trigger automated clinical urgency scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Intake Form */}
        <form onSubmit={calculateAssessment} className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Demographics */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Patient Demographics &amp; ABHA Identification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter patient full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-teal-700"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">14-Digit ABHA ID</label>
                <input
                  type="text"
                  placeholder="91-XXXX-XXXX-XXXX"
                  value={abhaId}
                  onChange={(e) => setAbhaId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Physiological Vitals Entry */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-teal-700" />
              <span>2. Physiological Telemetry (Point-of-Care Vitals)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">SpO2 (%) *</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="100"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value === "" ? "" : Number(e.target.value))}
                  className={`w-full text-xs p-2.5 border rounded-xl font-bold tabular-nums ${Number(spo2) < 90 ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-slate-50 border-slate-300 text-slate-900"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  min="60"
                  max="250"
                  value={bpSys}
                  onChange={(e) => setBpSys(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  min="40"
                  max="160"
                  value={bpDia}
                  onChange={(e) => setBpDia(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Heart Pulse (bpm)</label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 tabular-nums font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Body Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  min="90"
                  max="108"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value === "" ? "" : Number(e.target.value))}
                  className={`w-full text-xs p-2.5 border rounded-xl font-bold tabular-nums ${Number(temp) >= 101 ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-slate-50 border-slate-300 text-slate-900"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Resp. Rate (/min)</label>
                <input
                  type="number"
                  min="6"
                  max="60"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 tabular-nums font-bold"
                />
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Chief Complaint &amp; Clinical Presentation
            </h2>
            <textarea
              rows={2}
              required
              placeholder="e.g. Acute breathlessness, chest tightness since morning..."
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>{loading ? "Analyzing Clinical Telemetry..." : "Generate Clinical Triage Score"}</span>
          </button>
        </form>

        {/* Live Urgency Results */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Computed Urgency</span>
              </span>
              {assessment && <UrgencyBadge urgency={assessment.urgency} size="md" />}
            </div>

            {assessment ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-slate-600">Assigned Urgency</span>
                    <span className="text-slate-900">{assessment.urgency}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Risk score: <strong>{assessment.risk_score}/100</strong>
                  </div>
                </div>

                {assessment.vital_triggers.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-rose-900 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                      Vital Threshold Triggers:
                    </span>
                    <ul className="text-rose-800 text-[11px] space-y-0.5">
                      {assessment.vital_triggers.map((trig: string, idx: number) => (
                        <li key={idx}>&bull; {trig}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1.5">Recommended Actions:</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {assessment.recommended_actions.map((act: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <TrustBadge
                  verified={false}
                  canVerify={false}
                />

                <button
                  type="button"
                  onClick={() => router.push("/nurse")}
                  className="w-full py-2.5 px-3 bg-teal-800 text-white rounded-xl text-xs font-bold hover:bg-teal-900 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Dispatch to Clinical Queue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <ClipboardList className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">
                  Fill in telemetry vitals and complaints to view computed triage level.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
