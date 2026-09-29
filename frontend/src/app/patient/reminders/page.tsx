"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Pill,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  ShieldCheck,
  RefreshCw,
  Plus,
  ExternalLink,
  Check,
  Eye,
  Building2,
  Activity,
  HeartPulse,
  User,
  MessageSquare,
  FileText,
  Trash2,
  X,
  Stethoscope,
  Sparkles,
  Thermometer
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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

export default function PatientRemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Quick vitals logger state
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [pulse, setPulse] = useState("72");
  const [temperature, setTemperature] = useState("98.4");
  const [vitalsSaved, setVitalsSaved] = useState(false);

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"medication" | "consultation" | "asha_visit" | "vitals_log">("medication");
  const [newDosage, setNewDosage] = useState("");
  const [newFrequency, setNewFrequency] = useState("Daily");
  const [newTime, setNewTime] = useState("08:00 AM");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch reminders on mount
  const fetchReminders = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/patient/reminders?patient_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error("Error fetching reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [user?.id]);

  // Toggle reminder completion
  const handleToggle = async (id: string) => {
    const item = reminders.find((r) => r.id === id);
    const nextCompleted = !item?.is_completed;

    // Optimistic UI update
    setReminders((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_completed: nextCompleted } : r
      )
    );

    try {
      await fetch("/api/patient/reminders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_completed: nextCompleted }),
      });
    } catch (err) {
      console.error("Error toggling reminder:", err);
      // Revert if error
      fetchReminders();
    }
  };

  // Delete reminder
  const handleDelete = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/patient/reminders?id=${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting reminder:", err);
    }
  };

  // Submit new reminder
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user?.id) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/patient/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: user.id,
          type: newType,
          title: newTitle.trim(),
          dosage: newDosage.trim() || undefined,
          frequency: newFrequency,
          scheduled_time: newTime,
          description: newDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reminder) {
          setReminders((prev) => [data.reminder, ...prev]);
        }
        setIsAddModalOpen(false);
        setNewTitle("");
        setNewDosage("");
        setNewDescription("");
      }
    } catch (err) {
      console.error("Error creating reminder:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Save vitals log
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      await fetch("/api/patient/reminders/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: user.id,
          systolic,
          diastolic,
          pulse,
          temperature,
        }),
      });
      setVitalsSaved(true);
      fetchReminders();
      setTimeout(() => setVitalsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving vitals:", err);
    }
  };

  // Computed summary metrics
  const stats = useMemo(() => {
    const total = reminders.length;
    const completed = reminders.filter((r) => r.is_completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const nextMed = reminders.find(
      (r) => r.type === "medication" && !r.is_completed
    );
    const nextConsult = reminders.find(
      (r) => r.type === "consultation" && !r.is_completed
    );
    const ashaVisit = reminders.find((r) => r.type === "asha_visit");

    return { total, completed, rate, nextMed, nextConsult, ashaVisit };
  }, [reminders]);

  // Filtered list
  const filteredReminders = useMemo(() => {
    if (activeFilter === "all") return reminders;
    return reminders.filter((r) => r.type === activeFilter);
  }, [reminders, activeFilter]);

  const weekDays = useMemo(() => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    for (let offset = -3; offset <= 3; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const isToday = offset === 0;
      result.push({
        day: isToday ? "TODAY" : days[d.getDay()],
        date: d.getDate().toString(),
        active: isToday,
      });
    }
    return result;
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>ABDM Connected Care Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reminders &amp; Care Follow-ups
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Your personalized schedule for daily medicines, clinical consultations, ASHA community visits, and health monitoring logs.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>SMS &amp; WhatsApp Alerts Active</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSyncing(true);
              setTimeout(() => {
                fetchReminders();
                setSyncing(false);
              }, 800);
            }}
            disabled={syncing}
            className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-700 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync Schedule"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Reminder</span>
          </button>
        </div>
      </div>

      {/* Week Calendar Day Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Weekly Schedule{" "}
              <span className="text-xs text-slate-400 font-normal">
                &bull; {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
              </span>
            </h3>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {stats.completed} of {stats.total} care goals completed
          </div>
        </div>

        {/* 7 Days Row */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center">
          {weekDays.map((d, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all ${
                d.active
                  ? "bg-teal-800 text-white border-teal-800 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <div
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  d.active ? "text-teal-200" : "text-slate-400"
                }`}
              >
                {d.day}
              </div>
              <div className="text-xl sm:text-2xl font-black mt-1 tabular-nums">
                {d.date}
              </div>
              <div
                className={`text-[10px] font-semibold mt-1 flex items-center justify-center gap-1 ${
                  d.active ? "text-teal-100" : "text-slate-500"
                }`}
              >
                {d.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />}
                <span>{d.active ? `${stats.completed}/${stats.total} Done` : "Care Active"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stat Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Adherence */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              TODAY&apos;S ADHERENCE
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {stats.completed} / {stats.total}{" "}
              <span className="text-xs font-normal text-slate-500">Completed</span>
            </div>
            <span className="text-[10px] text-teal-800 font-semibold block mt-0.5">
              {stats.rate}% target adherence today
            </span>
          </div>

          <div className="w-12 h-12 rounded-full border-4 border-teal-600 border-t-teal-200 flex items-center justify-center font-bold text-xs text-teal-800">
            {stats.rate}%
          </div>
        </div>

        {/* Next Medication */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              UPCOMING MEDICATION
            </span>
            <Pill className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {stats.nextMed?.title || "No pending medications"}
          </div>
          <div className="text-[11px] text-slate-600">
            {stats.nextMed ? `${stats.nextMed.scheduled_time || "Scheduled"} • ${stats.nextMed.dosage || "Routine"}` : "All doses up to date"}
          </div>
          <div className="text-[10px] text-teal-800 font-medium pt-0.5 truncate">
            {stats.nextMed?.description || "All prescribed care protocols are up to date."}
          </div>
        </div>

        {/* Clinical Consult Follow-up */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
              CLINICAL FOLLOW-UP
            </span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {stats.nextConsult?.title || "No scheduled consultations"}
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            {stats.nextConsult
              ? `${stats.nextConsult.metadata?.facility || user?.facilityName || "Community Health Centre"} • ${stats.nextConsult.metadata?.department || "General OPD"}`
              : "None upcoming"}
          </div>
          {stats.nextConsult?.ticket_id ? (
            <Link
              href={`/patient/timeline/${stats.nextConsult.ticket_id}`}
              className="text-[10px] text-teal-800 font-bold hover:underline inline-flex items-center gap-1 pt-0.5"
            >
              <span>View Linked Encounter</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          ) : (
            <div className="text-[10px] text-slate-500 pt-0.5">
              {stats.nextConsult ? "Scheduled clinical evaluation" : "No clinical reviews scheduled."}
            </div>
          )}
        </div>

        {/* Frontline Home Visit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              ASHA COMMUNITY VISIT
            </span>
            <PhoneCall className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate">
            {stats.ashaVisit?.title || "No ASHA visits scheduled"}
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            {stats.ashaVisit
              ? (stats.ashaVisit.metadata?.asha_name || "Community Health Worker (ASHA)")
              : "None upcoming"}
          </div>
          <div className="text-[10px] text-slate-500 pt-0.5">
            {stats.ashaVisit
              ? (stats.ashaVisit.metadata?.area ? `Sector: ${stats.ashaVisit.metadata.area}` : (stats.ashaVisit.metadata?.phone || "Frontline Support Active"))
              : "Community outreach will appear when scheduled."}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: "all", label: `All (${reminders.length})` },
            {
              id: "medication",
              label: `Medications (${reminders.filter((r) => r.type === "medication").length})`,
            },
            {
              id: "consultation",
              label: `Doctor Consults (${reminders.filter((r) => r.type === "consultation").length})`,
            },
            {
              id: "asha_visit",
              label: `ASHA Visits (${reminders.filter((r) => r.type === "asha_visit").length})`,
            },
            {
              id: "vitals_log",
              label: `Vitals Checks (${reminders.filter((r) => r.type === "vitals_log").length})`,
            },
          ].map((tab) => {
            const isSel = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  isSel
                    ? "bg-teal-800 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
          <Eye className="w-3.5 h-3.5 text-slate-400" />
          <span>Showing: {activeFilter.replace(/_/g, " ").toUpperCase()}</span>
        </div>
      </div>

      {/* REMINDERS LIST CONTAINER */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 p-5" />
            ))}
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              {activeFilter === "all" ? "No Reminders Scheduled" : "No Reminders in this Category"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {activeFilter === "all"
                ? "You do not have any reminders or follow-ups scheduled yet. You can add your personalized medications, vitals logs, or doctor review reminders using the button below."
                : "No care reminders found in this category. You can add one anytime."}
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Reminder</span>
            </button>
          </div>
        ) : (
          filteredReminders.map((reminder) => {
            const isDone = reminder.is_completed;
            const isMed = reminder.type === "medication";
            const isConsult = reminder.type === "consultation";
            const isAsha = reminder.type === "asha_visit";
            const isVitals = reminder.type === "vitals_log";

            return (
              <div
                key={reminder.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isDone
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700"
                        : isMed
                        ? "bg-teal-50 text-teal-800 border border-teal-200"
                        : isConsult
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : isAsha
                        ? "bg-purple-50 text-purple-800 border border-purple-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5" />
                    ) : isMed ? (
                      <Pill className="w-5 h-5" />
                    ) : isConsult ? (
                      <Building2 className="w-5 h-5" />
                    ) : isAsha ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : isMed
                            ? "bg-teal-50 text-teal-800 border-teal-200"
                            : isConsult
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {isDone ? "Completed" : reminder.type.replace(/_/g, " ")}
                      </span>

                      {reminder.scheduled_time && (
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{reminder.scheduled_time}</span>
                        </span>
                      )}

                      {reminder.frequency && (
                        <span className="text-[11px] text-slate-400">
                          &bull; {reminder.frequency}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-base font-bold transition-colors ${
                        isDone ? "line-through text-slate-500" : "text-slate-900"
                      }`}
                    >
                      {reminder.title}
                      {reminder.dosage && (
                        <span className="text-xs font-semibold text-slate-500 ml-2">
                          ({reminder.dosage})
                        </span>
                      )}
                    </h4>

                    {reminder.description && (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                        {reminder.description}
                      </p>
                    )}

                    {/* Linked Triage Encounter Link */}
                    {reminder.ticket_id && (
                      <Link
                        href={`/patient/timeline/${reminder.ticket_id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 hover:underline pt-1"
                      >
                        <span>Related to Clinical Case #{reminder.ticket_id.slice(0, 8).toUpperCase()}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggle(reminder.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isDone
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        : "bg-teal-800 hover:bg-teal-900 text-white"
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isDone ? "text-slate-500" : "text-white"}`} />
                    <span>{isDone ? "Mark Pending" : "Mark as Done"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(reminder.id)}
                    title="Delete reminder"
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* QUICK VITALS LOGGER BOX */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-teal-700" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daily Vitals Self-Log
              </h3>
              <p className="text-xs text-slate-500">
                Regularly record your daily resting measurements for doctor review.
              </p>
            </div>
          </div>
          {vitalsSaved && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Vitals saved to health record</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveVitals} className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Systolic BP (mmHg)
            </label>
            <input
              type="number"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Diastolic BP (mmHg)
            </label>
            <input
              type="number"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Pulse (BPM)
            </label>
            <input
              type="number"
              value={pulse}
              onChange={(e) => setPulse(e.target.value)}
              className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Body Temp (°F)
            </label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full text-sm font-bold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Record Today
            </button>
          </div>
        </form>
      </div>

      {/* ADD NEW REMINDER MODAL DIALOG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-800 rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Add New Care Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Reminder Title / Medicine Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol, Cardiology Consult, Blood Sugar Check"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="medication">Medication</option>
                    <option value="consultation">Doctor Follow-up</option>
                    <option value="asha_visit">ASHA Home Visit</option>
                    <option value="vitals_log">Vitals Check</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Dosage / Specification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 1 Tablet"
                    value={newDosage}
                    onChange={(e) => setNewDosage(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM, Night"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Thrice Daily">Thrice Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Single Consultation">Single Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with warm water after lunch; bring previous lab reports."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : "Add to Schedule"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
