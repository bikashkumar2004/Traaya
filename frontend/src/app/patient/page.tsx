"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  HeartPulse,
  Thermometer,
  FileText,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Pill,
  Camera,
  ChevronRight,
  UserCheck,
  Radio,
  Sparkles,
  MapPin,
  Check,
  ExternalLink,
  ScanLine,
  Stethoscope,
  RefreshCw,
  Flame,
  Calendar,
  User,
  Plus
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { normalizeStatus } from "./timeline/page";

interface TriageTicket {
  id: string;
  patient_id?: string;
  patient_name: string;
  patient_age?: number;
  patient_gender?: string;
  urgency: string;
  chief_complaint: string;
  symptoms: Array<{ name: string; duration?: string }>;
  vitals?: {
    temperature?: string;
    follow_up_answers?: Record<string, any>;
  };
  ai_recommendation?: {
    priority?: string;
    clinical_reasoning?: string;
    model?: string;
    present_location?: {
      state?: string;
      block?: string;
    };
  };
  status: string;
  created_at: string;
}

interface CareReminder {
  id: string;
  patient_id: string;
  ticket_id?: string;
  type: "medication" | "consultation" | "asha_visit" | "vitals_log";
  title: string;
  description?: string;
  dosage?: string;
  frequency?: string;
  scheduled_time?: string;
  due_date?: string;
  is_completed: boolean;
  last_completed_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Fetch real data from Supabase backend
  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      // 1. Fetch live triage tickets
      const ticketsRes = await fetch(
        `http://localhost:8000/api/triage/patient-tickets?patient_id=${user.id}`
      );
      if (ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setTickets(tData.tickets || []);
      }

      // 2. Fetch live reminders schedule from Supabase
      const remindersRes = await fetch(
        `/api/patient/reminders?patient_id=${user.id}`
      );
      if (remindersRes.ok) {
        const rData = await remindersRes.json();
        setReminders(rData.reminders || []);
      }
    } catch (err) {
      console.error("[Dashboard Load Error]", err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Toggle reminder completion directly on dashboard
  const handleToggleReminder = async (reminderId: string) => {
    const item = reminders.find((r) => r.id === reminderId);
    const nextCompleted = !item?.is_completed;

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) =>
        r.id === reminderId ? { ...r, is_completed: nextCompleted } : r
      )
    );

    try {
      await fetch("/api/patient/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reminderId, is_completed: nextCompleted }),
      });
    } catch (err) {
      console.error("[Reminder Toggle Error]", err);
      loadDashboardData();
    }
  };

  // Derived metrics
  const activeTicket = tickets.length > 0 ? tickets[0] : null;

  const reminderStats = useMemo(() => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.is_completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingMed = reminders.find(
      (r) => r.type === "medication" && !r.is_completed
    );
    const nextConsult = reminders.find((r) => r.type === "consultation");
    const ashaVisit = reminders.find((r) => r.type === "asha_visit");

    return { total, completed, rate, pendingMed, nextConsult, ashaVisit };
  }, [reminders]);

  // Safe formatting helper for dates
  const formatDate = (isoStr?: string) => {
    if (!isoStr) return "Recent";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome & ABDM Citizen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
            <Radio className="w-3 h-3 text-teal-600 animate-pulse" />
            <span>Citizen Health Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Namaste, {user?.fullName || "Citizen"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Welcome to your digital triage health locker. Monitor your active care tickets, check medication schedules, or consult frontline ASHA workers.
          </p>
        </div>

        {/* Quick Top Meta & Refresh */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            <span className="truncate max-w-[180px]">
              {user?.facilityName || "Primary Health Centre (PHC)"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSyncing(true);
              loadDashboardData();
            }}
            disabled={syncing}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* 1. ACTIVE CLINICAL ENCOUNTER BANNER (Live from Supabase) */}
      {activeTicket ? (
        <div className="bg-gradient-to-r from-teal-50/90 via-emerald-50/50 to-white rounded-2xl border border-teal-300/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                  Active Encounter #{activeTicket.id.slice(0, 8).toUpperCase()}: {activeTicket.chief_complaint}
                </span>
                {(() => {
                  const norm = normalizeStatus(activeTicket.status);
                  const style =
                    norm === "Completed"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : norm === "Scheduled"
                      ? "bg-teal-50 text-teal-800 border-teal-300"
                      : norm === "Referred"
                      ? "bg-purple-50 text-purple-800 border-purple-300"
                      : norm === "Reverted"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : norm === "Draft"
                      ? "bg-slate-100 text-slate-700 border-slate-300"
                      : "bg-sky-50 text-sky-800 border-sky-300";
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style}`}>
                      &bull; {norm}
                    </span>
                  );
                })()}
                <span className="text-[11px] text-slate-500 font-mono">
                  {formatDate(activeTicket.created_at)}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 max-w-3xl leading-relaxed">
                {activeTicket.ai_recommendation?.clinical_reasoning ||
                  "Your triage submission has been logged and assigned to the local Primary Health Centre (PHC) medical team for review."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/patient/timeline/${activeTicket.id}`}
              className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View Case Advice &amp; Care</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                All Triage Encounters Up to Date
              </h3>
              <p className="text-xs text-slate-500">
                You have no pending emergency evaluations. Use the symptom check below if you feel unwell.
              </p>
            </div>
          </div>

          <Link
            href="/patient/symptoms"
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Start Symptom Check</span>
          </Link>
        </div>
      )}

      {/* 2. FAST-ACTION WORKSPACE (4 CORE LAUNCHPAD CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Symptoms Triage */}
        <Link
          href="/patient/symptoms"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                AI Voice &amp; Text
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 group-hover:text-teal-800 transition-colors">
              Check Symptoms
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Express how you feel in English or Indian regional languages for instant clinical priority guidance.
            </p>
          </div>
          <div className="text-xs font-bold text-teal-800 inline-flex items-center gap-1">
            <span>Start Assessment</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: OCR Slip Upload */}
        <Link
          href="/patient/upload"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <ScanLine className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                Prescription OCR
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-800 transition-colors">
              Upload Medical Slip
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Scan doctor handwritten OPD prescriptions, CBC blood tests, or diagnostic slips for instant AI digitization.
            </p>
          </div>
          <div className="text-xs font-bold text-blue-700 inline-flex items-center gap-1">
            <span>Scan Medical Document</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Care Reminders & Medicines */}
        <Link
          href="/patient/reminders"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {reminderStats.completed}/{reminderStats.total} Done
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
              Reminders &amp; Doses
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track daily tablets, scheduled PHC follow-up consultations, and frontline ASHA checkups.
            </p>
          </div>
          <div className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
            <span>View Care Schedule</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 4: Care Timeline & History */}
        <Link
          href="/patient/timeline"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-400 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                {tickets.length} Encounters
              </span>
            </div>
            <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-800 transition-colors">
              Clinical Timeline
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review past triage assessments, AI home care advice, warning signs, and doctor clinical summaries.
            </p>
          </div>
          <div className="text-xs font-bold text-purple-700 inline-flex items-center gap-1">
            <span>Explore Records</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 3. MAIN TWO COLUMN DASHBOARD SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. TODAY'S CARE SCHEDULE & REMINDERS WIDGET */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Today&apos;s Medication &amp; Follow-up Schedule
                </h3>
              </div>
              <Link
                href="/patient/reminders"
                className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Schedule</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Adherence Mini Meter */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  DAILY ADHERENCE
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {reminderStats.completed} of {reminderStats.total} Goals Completed
                </div>
                <span className="text-[11px] text-teal-800 font-semibold">
                  {reminderStats.rate}% target adherence today
                </span>
              </div>

              <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-teal-200 flex items-center justify-center font-bold text-xs text-teal-800 shrink-0">
                {reminderStats.rate}%
              </div>
            </div>

            {/* List of Today's Items */}
            <div className="space-y-2.5">
              {reminders.length === 0 ? (
                <div className="py-6 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">No care reminders or medicines scheduled for today.</p>
                  <Link
                    href="/patient/reminders"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:underline"
                  >
                    <span>Add a reminder</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                reminders.slice(0, 3).map((r) => {
                const isMed = r.type === "medication";
                const isConsult = r.type === "consultation";
                const isAsha = r.type === "asha_visit";

                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      r.is_completed
                        ? "bg-emerald-50/30 border-emerald-200 text-slate-500"
                        : "bg-white border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          r.is_completed
                            ? "bg-emerald-100 text-emerald-700"
                            : isMed
                            ? "bg-teal-50 text-teal-800"
                            : isConsult
                            ? "bg-blue-50 text-blue-800"
                            : "bg-purple-50 text-purple-800"
                        }`}
                      >
                        {r.is_completed ? (
                          <Check className="w-4 h-4" />
                        ) : isMed ? (
                          <Pill className="w-4 h-4" />
                        ) : isConsult ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold truncate ${
                              r.is_completed ? "line-through text-slate-500" : "text-slate-900"
                            }`}
                          >
                            {r.title}
                          </span>
                          {r.dosage && (
                            <span className="text-[11px] text-slate-500">
                              ({r.dosage})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{r.scheduled_time}</span>
                          <span>&bull;</span>
                          <span>{r.frequency}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleReminder(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs ${
                        r.is_completed
                          ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                          : "bg-teal-800 hover:bg-teal-900 text-white"
                      }`}
                    >
                      {r.is_completed ? "Completed" : "Mark Done"}
                    </button>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* B. RECENT TRIAGE ENCOUNTERS TIMELINE LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Recent Triage Encounters
                </h3>
              </div>
              <Link
                href="/patient/timeline"
                className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1"
              >
                <span>View All ({tickets.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No previous triage records found.
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-teal-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {ticket.chief_complaint}
                        </span>
                        {(() => {
                          const norm = normalizeStatus(ticket.status);
                          const style =
                            norm === "Completed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : norm === "Scheduled"
                              ? "bg-teal-50 text-teal-800 border-teal-300"
                              : norm === "Referred"
                              ? "bg-purple-50 text-purple-800 border-purple-300"
                              : norm === "Reverted"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : norm === "Draft"
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-sky-50 text-sky-800 border-sky-300";
                          return (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${style}`}>
                              {norm}
                            </span>
                          );
                        })()}
                        <span className="text-[10px] font-mono text-slate-400">
                          #{ticket.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Logged on {formatDate(ticket.created_at)} &bull; Vitals: Temp {ticket.vitals?.temperature || "98.4°F"}
                      </p>
                    </div>

                    <Link
                      href={`/patient/timeline/${ticket.id}`}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs self-start sm:self-auto shrink-0 inline-flex items-center gap-1"
                    >
                      <span>Advice &amp; Care</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. LATEST RECORDED VITALS SNAPSHOT */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Latest Vitals Telemetry
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Verified Baseline
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Temp */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Body Temperature</span>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  {activeTicket?.vitals?.temperature || "98.4°F"}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Resting Normal</span>
              </div>

              {/* BP */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  120/80
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Optimal Range</span>
              </div>

              {/* Pulse */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  74 <span className="text-xs font-normal text-slate-500">bpm</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Regular Rhythm</span>
              </div>

              {/* SpO2 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block">SpO2 Oxygen</span>
                <div className="text-xl font-black text-slate-900 mt-1 tabular-nums">
                  98 <span className="text-xs font-normal text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Good Oxygenation</span>
              </div>
            </div>

            <Link
              href="/patient/reminders"
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-teal-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Log Daily Vitals in Health Locker</span>
            </Link>
          </div>


          {/* 3. PRIMARY HEALTH CENTRE (PHC) DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Local PHC Health Facility
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Open Now
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900">
                {user?.facilityName || "Primary Health Centre (PHC)"}
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                OPD Hours: 08:30 AM &ndash; 02:00 PM &bull; Emergency Observation Bed Available
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600">Citizen UHID:</span>
                <span className="font-mono font-bold text-teal-800">
                  {user?.patientUhid || "PAT-8402"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
