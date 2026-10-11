"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  Tent,
  Activity,
  Users,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Plus,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Calendar,
  Clock,
  Sparkles,
  Download,
  Stethoscope,
  LogOut,
  MapPin,
  Ambulance,
  FileText
} from "lucide-react";

interface CampAttendee {
  id: string;
  tokenNumber: string;
  patientName: string;
  age: number;
  gender: string;
  bp: string;
  pulse: number;
  spo2: number;
  temp: string;
  complaint: string;
  urgency: "Immediate" | "Urgent" | "Routine";
  status: "Screened" | "Referred to CHC" | "Medicine Issued";
  registeredTime: string;
}

const INITIAL_CAMP_ATTENDEES: CampAttendee[] = [];

export default function HealthCampPortalPage() {
  const { user, signOut } = useAuth();
  const [attendees, setAttendees] = useState<CampAttendee[]>([]);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Rapid Intake Form State
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Female");
  const [bp, setBp] = useState("120/80");
  const [pulse, setPulse] = useState("78");
  const [spo2, setSpo2] = useState("98");
  const [temp, setTemp] = useState("98.6");
  const [complaint, setComplaint] = useState("");
  const [urgency, setUrgency] = useState<"Immediate" | "Urgent" | "Routine">("Routine");
  const [intakeSuccess, setIntakeSuccess] = useState(false);



  const handleRapidIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !complaint) return;

    const newAttendee: CampAttendee = {
      id: `CP-${Date.now().toString().slice(-4)}`,
      tokenNumber: `#CMP-0${attendees.length + 1}`,
      patientName,
      age: parseInt(age) || 30,
      gender,
      bp: bp || "120/80",
      pulse: parseInt(pulse) || 78,
      spo2: parseInt(spo2) || 98,
      temp: `${temp}°F`,
      complaint,
      urgency,
      status: urgency === "Immediate" ? "Referred to CHC" : "Screened",
      registeredTime: "Just now",
    };

    setAttendees((prev) => [newAttendee, ...prev]);
    setIntakeSuccess(true);
    setNotificationToast(`Token ${newAttendee.tokenNumber} issued to ${patientName}`);

    // Reset form
    setPatientName("");
    setAge("");
    setComplaint("");
    setTimeout(() => {
      setIntakeSuccess(false);
      setNotificationToast(null);
    }, 3500);
  };

  const getUrgencyBadge = (u: CampAttendee["urgency"]) => {
    switch (u) {
      case "Immediate":
        return "bg-rose-50 text-rose-800 border-rose-300 font-extrabold animate-pulse";
      case "Urgent":
        return "bg-amber-50 text-amber-800 border-amber-300 font-bold";
      case "Routine":
        return "bg-blue-50 text-blue-800 border-blue-200 font-medium";
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F9F7] text-slate-800 antialiased font-sans pb-16">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/traaya-logo.png"
                alt="TRAAYA Logo"
                className="h-9 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <div>
                <span className="font-black text-base tracking-tight text-slate-900">
                  TRAAYA
                </span>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 ml-2">
                  Temporary Health Camp Station
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900">
                {user?.fullName || "Nayagarh Rural Outreach Health Camp #4"}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Mobile Medical Unit &bull; Khandapada Gram Panchayat Hall
              </div>
            </div>

            <button
              type="button"
              onClick={signOut}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Toast */}
        {notificationToast && (
          <div className="fixed top-20 right-6 z-50 bg-teal-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{notificationToast}</span>
          </div>
        )}

        {/* Camp Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Rural Health Screening &amp; Rapid Field Triage Desk
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                On-site registration, instant vital checks, symptom classification, and direct emergency referral to CHC Khandapada with real-time 108 ambulance coordination.
              </p>
            </div>

            {/* Camp Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNotificationToast("108 ALS Ambulance notified. ETA: 12 minutes to Gram Panchayat Hall.");
                  setTimeout(() => setNotificationToast(null), 4000);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 108 Ambulance Dispatch</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNotificationToast("Camp attendees registry exported.");
                  setTimeout(() => setNotificationToast(null), 3500);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>Export Camp Tally</span>
              </button>
            </div>
          </div>
        </div>

        {/* Camp KPI Telemetry */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Patients Screened Today</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{attendees.length + 80}</div>
            <div className="text-[11px] text-teal-700 font-bold mt-0.5">Target: 250 Citizens</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Medicine Kits Distributed</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">78 Kits</div>
            <div className="text-[11px] text-slate-500 mt-0.5">ORS, Antipyretics, Iron</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">Referred to CHC</span>
            <div className="text-2xl font-black text-rose-700 mt-1">6 Cases</div>
            <div className="text-[11px] text-rose-600 font-bold mt-0.5">Assigned to Dr. Sen</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-medium">108 Ambulance Status</span>
            <div className="text-2xl font-black text-teal-800 mt-1">Standby Bay 1</div>
            <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Driver &amp; Paramedic Ready</div>
          </div>
        </div>

        {/* Split Grid: Rapid Intake Form vs Live Camp Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Rapid Intake Form (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                Field Intake
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">1-Click Rapid Camp Intake</h2>
              <p className="text-xs text-slate-500">Record arriving villagers and assign instant priority tokens.</p>
            </div>

            <form onSubmit={handleRapidIntake} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citizen / Patient Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Pradhan"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full h-9.5 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 focus:bg-white focus:outline-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full h-9 text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 focus:outline-teal-700"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Vitals row */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">BP</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full h-8 text-[11px] text-center bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pulse</label>
                  <input
                    type="number"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full h-8 text-[11px] text-center bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SpO2</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full h-8 text-[11px] text-center bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Temp (°F)</label>
                  <input
                    type="text"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full h-8 text-[11px] text-center bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Symptoms &amp; Chief Complaint <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Fever for 3 days with joint pain and loss of appetite..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:bg-white focus:outline-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Camp Acuity Classification
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency("Routine")}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      urgency === "Routine" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Routine
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("Urgent")}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      urgency === "Urgent" ? "bg-amber-600 text-white border-amber-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Urgent
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrgency("Immediate")}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      urgency === "Immediate" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Immediate
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Camp Token &amp; Register Patient</span>
              </button>
            </form>
          </div>

          {/* Live Camp Queue (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Today&apos;s Camp Triage Queue</h2>
                <p className="text-xs text-slate-500">Live roster of screened attendees and ongoing referrals.</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                {attendees.length} In Register
              </span>
            </div>

            <div className="space-y-3">
              {attendees.map((at) => (
                <div
                  key={at.id}
                  className="p-3.5 bg-slate-50/90 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-teal-300 transition-all shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                        {at.tokenNumber}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{at.patientName}</span>
                      <span className="text-xs text-slate-500">({at.age} Y, {at.gender})</span>
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-1">{at.complaint}</p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>BP: <strong>{at.bp}</strong></span>
                      <span>Pulse: <strong>{at.pulse}</strong></span>
                      <span>SpO2: <strong>{at.spo2}%</strong></span>
                      <span>Temp: <strong>{at.temp}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${getUrgencyBadge(at.urgency)}`}>
                      {at.urgency}
                    </span>

                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {at.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
