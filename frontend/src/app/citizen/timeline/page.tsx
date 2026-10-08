"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  CheckCircle2,
  FileEdit,
  RotateCcw,
  Share2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  TriageTicket,
  TriageEncounterStatus,
  normalizeStatus,
  TimelineHeader,
  TimelineStatsCards,
  TimelineFilterBar,
  TimelineTable,
} from "@/components/patient/timeline";

export { normalizeStatus, type TriageEncounterStatus, type TriageTicket };

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
      <TimelineHeader />

      {/* Summary Stat Cards */}
      <TimelineStatsCards
        stats={stats}
        activeStatusFilter={activeStatusFilter}
        setActiveStatusFilter={setActiveStatusFilter}
        loading={loading}
      />

      {/* Filter & Search Bar */}
      <TimelineFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeStatusFilter={activeStatusFilter}
        setActiveStatusFilter={setActiveStatusFilter}
        stats={stats}
        loading={loading}
      />

      {/* Table Container */}
      <TimelineTable
        loading={loading}
        error={error}
        filteredTickets={filteredTickets}
        totalTicketsCount={tickets.length}
        copiedId={copiedId}
        onCopyId={handleCopyId}
        getStatusBadge={getStatusBadge}
        getDisplaySymptoms={getDisplaySymptoms}
        formatDate={formatDate}
      />
    </div>
  );
}
