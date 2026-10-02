"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Eye,
  Copy,
  CheckCheck,
  FileEdit,
  RotateCcw,
  Share2,
  Calendar,
  Send,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export type TriageEncounterStatus =
  | "Draft"
  | "Under Review"
  | "Reverted"
  | "Referred"
  | "Scheduled"
  | "Completed";

export function normalizeStatus(status?: string): TriageEncounterStatus {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("draft")) return "Draft";
  if (s.includes("revert") || s.includes("returned") || s.includes("awaiting patient")) return "Reverted";
  if (s.includes("refer") || s.includes("forwarded") || s.includes("escalat")) return "Referred";
  if (s.includes("schedule") || s.includes("booked") || s.includes("appoint")) return "Scheduled";
  if (s.includes("complet") || s === "resolved" || s === "closed" || s.includes("finish")) return "Completed";
  // default for active / pending / in_progress / under review
  return "Under Review";
}

interface TriageTicket {
  id: string;
  case_number?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  is_family_member?: boolean;
  family_member_name?: string;
  family_member_relationship?: string;
  family_member_uhid?: string;
  urgency?: string;
  priority?: string;
  chief_complaint?: string;
  reverted_questions?: Array<{
    id: string;
    question: string;
    answer?: string;
    answered_at?: string;
  }>;
  schedule_time?: string;
  symptoms?: Array<{ name: string; duration?: string }>;
  symptoms_data?: {
    chief_complaint?: string;
    symptoms?: Array<{ name: string; duration?: string; severity?: string }>;
    duration?: string;
    severity?: string;
    follow_up_qa?: Array<{ question: string; answer: string }>;
    vitals?: Record<string, any>;
    clinical_reasoning?: string;
  };
  uploaded_report_data?: Record<string, any>;
  uploaded_report_url?: string;
  discharge_report_text?: string;
  discharge_report_url?: string;
  report_text?: string;
  report_url?: string;
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
  patient_referral_status?: string;
  facility_referral_status?: string;
  referal_facility?: string;
}

export default function PatientTimelinePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hydrate cached tickets from sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("triage_cached_tickets");
      if (cached) {
        setTickets(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}
  }, []);

  // Fetch tickets on mount
  useEffect(() => {
    async function fetchTickets() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        // Try Next.js direct DB route first
        let fetchedTickets: TriageTicket[] | null = null;
        try {
          const res = await fetch(`/api/patient/triage?patient_id=${user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.tickets) {
              fetchedTickets = data.tickets;
            }
          }
        } catch {
          // fallback to FastAPI
        }

        // Fallback to FastAPI backend if Next.js route didn't return
        if (!fetchedTickets) {
          const pyRes = await fetch(
            `http://localhost:8000/api/triage/patient-tickets?patient_id=${user.id}`
          );
          if (pyRes.ok) {
            const pyData = await pyRes.json();
            fetchedTickets = pyData.tickets || [];
          }
        }

        if (fetchedTickets) {
          setTickets(fetchedTickets);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("triage_cached_tickets", JSON.stringify(fetchedTickets));
          }
        } else {
          setError("Failed to fetch timeline data");
        }
      } catch (e) {
        console.error("Timeline fetch error:", e);
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [user?.id]);

  // Copy ticket ID helper
  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Computed stats for the 6 standardized encounter statuses
  const stats = useMemo(() => {
    const total = tickets.length;
    let draft = 0;
    let underReview = 0;
    let reverted = 0;
    let referred = 0;
    let scheduled = 0;
    let completed = 0;

    for (const t of tickets) {
      const norm = normalizeStatus(t.status);
      if (norm === "Draft") draft++;
      else if (norm === "Under Review") underReview++;
      else if (norm === "Reverted") reverted++;
      else if (norm === "Referred") referred++;
      else if (norm === "Scheduled") scheduled++;
      else if (norm === "Completed") completed++;
    }

    return { total, draft, underReview, reverted, referred, scheduled, completed };
  }, [tickets]);

  // Filter & search
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (activeStatusFilter !== "all") {
      result = result.filter((t) => {
        const norm = normalizeStatus(t.status);
        if (activeStatusFilter === "draft") return norm === "Draft";
        if (activeStatusFilter === "under_review") return norm === "Under Review";
        if (activeStatusFilter === "reverted") return norm === "Reverted";
        if (activeStatusFilter === "referred") return norm === "Referred";
        if (activeStatusFilter === "scheduled") return norm === "Scheduled";
        if (activeStatusFilter === "completed") return norm === "Completed";
        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.case_number?.toLowerCase().includes(q) ||
          t.family_member_name?.toLowerCase().includes(q) ||
          t.family_member_relationship?.toLowerCase().includes(q) ||
          t.chief_complaint?.toLowerCase().includes(q) ||
          t.urgency?.toLowerCase().includes(q) ||
          t.priority?.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          normalizeStatus(t.status).toLowerCase().includes(q) ||
          t.symptoms?.some((s) => (typeof s === "string" ? s : s?.name || "").toLowerCase().includes(q))
      );
    }

    return result;
  }, [tickets, activeStatusFilter, searchTerm]);

  const getStatusBadge = (status: string, ticketItem?: TriageTicket) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <FileEdit className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
      case "Under Review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300">
            <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            Under Review
          </span>
        );
      case "Reverted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            Reverted
          </span>
        );
      case "Referred":
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300">
              <Share2 className="w-3.5 h-3.5 text-purple-600" />
              Referred
            </span>
            {ticketItem?.patient_referral_status === "Accepted" ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                ✓ Consent Given
              </span>
            ) : ticketItem?.patient_referral_status === "Declined" ? (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                ✕ Declined
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
                Consent Needed
              </span>
            )}
          </div>
        );
      case "Scheduled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            Scheduled
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed
          </span>
        );
    }
  };

  const getDisplaySymptoms = (ticket: TriageTicket) => {
    const list: string[] = [];
    const syms = ticket.symptoms_data?.symptoms || ticket.symptoms;
    if (syms && Array.isArray(syms)) {
      for (const s of syms) {
        const name = (typeof s === "string" ? s : s?.name || "").trim();
        if (name && !list.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
          list.push(name);
        }
      }
    }
    const cc = ticket.symptoms_data?.chief_complaint || ticket.chief_complaint;
    if (list.length === 0 && cc?.trim()) {
      list.push(cc.trim());
    }
    return list;
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: iso, time: "" };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Actions Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Timeline &amp; Clinical Visits
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Tabulated audit log of your submitted symptoms, assistive triage classifications, and clinical encounters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/patient/symptoms"
            className="px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Symptoms</span>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Total Encounters */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("all")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "all" ? "text-slate-300" : "text-slate-500"
              }`}
            >
              Total
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "all"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "all" ? "text-white" : "text-slate-900"
            }`}
          >
            {loading ? "—" : String(stats.total).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "all" ? "text-slate-300" : "text-slate-400"
            }`}
          >
            All Encounters
          </div>
        </button>

        {/* Draft */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("draft")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "draft"
              ? "bg-slate-800 text-white border-slate-800 shadow-sm"
              : "bg-white hover:bg-slate-50 border-slate-200 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "draft" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              Draft
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "draft"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "draft" ? "text-white" : "text-slate-800"
            }`}
          >
            {loading ? "—" : String(stats.draft).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "draft" ? "text-slate-300" : "text-slate-400"
            }`}
          >
            Unsubmitted
          </div>
        </button>

        {/* Under Review */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("under_review")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "under_review"
              ? "bg-sky-600 text-white border-sky-600 shadow-sm"
              : "bg-white hover:bg-sky-50/50 border-sky-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "under_review" ? "text-sky-100" : "text-sky-700"
              }`}
            >
              Under Review
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "under_review"
                  ? "bg-sky-700 text-white"
                  : "bg-sky-50 text-sky-600"
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "under_review" ? "text-white" : "text-sky-700"
            }`}
          >
            {loading ? "—" : String(stats.underReview).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "under_review" ? "text-sky-100" : "text-sky-600"
            }`}
          >
            In Assessment
          </div>
        </button>

        {/* Reverted */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("reverted")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "reverted"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-white hover:bg-amber-50/50 border-amber-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "reverted" ? "text-amber-100" : "text-amber-800"
              }`}
            >
              Reverted
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "reverted"
                  ? "bg-amber-700 text-white"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "reverted" ? "text-white" : "text-amber-700"
            }`}
          >
            {loading ? "—" : String(stats.reverted).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "reverted" ? "text-amber-100" : "text-amber-600"
            }`}
          >
            Needs Info
          </div>
        </button>

        {/* Referred */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("referred")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "referred"
              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
              : "bg-white hover:bg-purple-50/50 border-purple-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "referred" ? "text-purple-100" : "text-purple-700"
              }`}
            >
              Referred
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "referred"
                  ? "bg-purple-700 text-white"
                  : "bg-purple-50 text-purple-600"
              }`}
            >
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "referred" ? "text-white" : "text-purple-700"
            }`}
          >
            {loading ? "—" : String(stats.referred).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "referred" ? "text-purple-100" : "text-purple-600"
            }`}
          >
            To Specialist
          </div>
        </button>

        {/* Scheduled */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("scheduled")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "scheduled"
              ? "bg-teal-700 text-white border-teal-700 shadow-sm"
              : "bg-white hover:bg-teal-50/50 border-teal-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "scheduled" ? "text-teal-100" : "text-teal-800"
              }`}
            >
              Scheduled
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "scheduled"
                  ? "bg-teal-800 text-white"
                  : "bg-teal-50 text-teal-700"
              }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "scheduled" ? "text-white" : "text-teal-800"
            }`}
          >
            {loading ? "—" : String(stats.scheduled).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "scheduled" ? "text-teal-100" : "text-teal-600"
            }`}
          >
            Slot Booked
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setActiveStatusFilter("completed")}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeStatusFilter === "completed"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white hover:bg-emerald-50/50 border-emerald-200/80 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold ${
                activeStatusFilter === "completed" ? "text-emerald-100" : "text-emerald-800"
              }`}
            >
              Completed
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                activeStatusFilter === "completed"
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 tabular-nums ${
              activeStatusFilter === "completed" ? "text-white" : "text-emerald-700"
            }`}
          >
            {loading ? "—" : String(stats.completed).padStart(2, "0")}
          </div>
          <div
            className={`text-[10px] mt-0.5 truncate ${
              activeStatusFilter === "completed" ? "text-emerald-100" : "text-emerald-600"
            }`}
          >
            Finalized
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, symptoms, complaint, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 text-xs">
          {[
            { id: "all", label: `All (${stats.total})` },
            { id: "draft", label: `Draft (${stats.draft})` },
            { id: "under_review", label: `Under Review (${stats.underReview})` },
            { id: "reverted", label: `Reverted (${stats.reverted})` },
            { id: "referred", label: `Referred (${stats.referred})` },
            { id: "scheduled", label: `Scheduled (${stats.scheduled})` },
            { id: "completed", label: `Completed (${stats.completed})` },
          ].map((tab) => {
            const isSel = activeStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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
      </div>

      {/* Alert Banner for Reverted Visits */}
      {!loading && stats.reverted > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-950">
                Action Required: {stats.reverted} Clinical Visit{stats.reverted > 1 ? "s" : ""} Awaiting Your Response
              </h4>
              <p className="text-[11px] text-amber-800">
                The nurse desk requested follow-up answers on your reported symptoms. Please answer to proceed with clinical consultation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("reverted")}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Show Reverted Visits ({stats.reverted})
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          /* Loading State */
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-xl w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-50 rounded-xl w-full" />
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Could not load clinical cases</h3>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7 text-teal-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {tickets.length === 0 ? "No submissions found" : "No matching records"}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {tickets.length === 0
                  ? "Report your symptoms to generate your first AI triage case and build your clinical timeline."
                  : "No cases match your active filters. Try clearing your search or switching filter tabs."}
              </p>
            </div>
            {tickets.length === 0 && (
              <Link
                href="/patient/symptoms"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Report Symptoms Now</span>
              </Link>
            )}
          </div>
        ) : (
          /* Responsive Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">Sl no.</th>
                  <th className="py-3.5 px-4 w-36">ID</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Symptoms</th>
                  <th className="py-3.5 px-4 w-44">Date &amp; Time</th>
                  <th className="py-3.5 px-4 w-36">Status</th>
                  <th className="py-3.5 px-4 w-28 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTickets.map((ticket, index) => {
                  const dateInfo = formatDate(ticket.created_at);
                  const displaySymptoms = getDisplaySymptoms(ticket);
                  const displayId = ticket.case_number
                    ? (ticket.case_number.startsWith("#") ? ticket.case_number : `#${ticket.case_number}`)
                    : `#${ticket.id.slice(0, 8).toUpperCase()}`;
                  const isCopied = copiedId === (ticket.case_number || ticket.id);

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-teal-50/30 transition-colors group"
                    >
                      {/* Sl no. */}
                      <td className="py-4 px-4 text-center font-bold text-slate-500 tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* ID */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200 group-hover:border-teal-300 transition-colors">
                              {displayId}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyId(e, ticket.case_number || ticket.id)}
                              title="Copy Case ID"
                              className="text-slate-400 hover:text-teal-700 p-1 rounded transition-colors"
                            >
                              {isCopied ? (
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {ticket.is_family_member && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              <span>Family: {ticket.family_member_name || "Dependent"}</span>
                              {ticket.family_member_relationship && (
                                <span className="text-teal-600 font-normal">({ticket.family_member_relationship})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Symptoms */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {displaySymptoms.length > 0 ? (
                            displaySymptoms.map((sName, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-medium"
                              >
                                {sName}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No symptoms recorded</span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-slate-800 font-semibold">
                          {dateInfo.date}
                        </div>
                        {dateInfo.time && (
                          <div className="text-[11px] text-slate-400 font-normal">
                            {dateInfo.time}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(ticket.status, ticket)}
                      </td>

                      {/* View & Answer Action */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {normalizeStatus(ticket.status) === "Reverted" ||
                          (ticket.reverted_questions &&
                            ticket.reverted_questions.some((q) => !q.answer)) ? (
                            <Link
                              href={`/patient/timeline/${ticket.id}#nurse-questions`}
                              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs"
                              title="Answer follow-up questions from nurse"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Answer Questions</span>
                            </Link>
                          ) : null}
                          <Link
                            href={`/patient/timeline/${ticket.id}`}
                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-teal-50 hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-200 hover:border-teal-700 transition-all shadow-2xs group/btn"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600 group-hover/btn:text-white transition-colors" />
                            <span>View</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info bar */}
        {!loading && filteredTickets.length > 0 && (
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Showing <strong className="text-slate-800">{filteredTickets.length}</strong> of{" "}
              <strong className="text-slate-800">{tickets.length}</strong> total clinical cases
            </span>
            <span className="text-[11px] text-slate-400">
              Click &ldquo;View&rdquo; to inspect full AI clinical reasoning, vitals &amp; encounter audit.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
