"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  TriageTicket,
  CareReminder,
  DashboardHeader,
  DashboardReferralAlert,
  DashboardActiveTicketBanner,
  DashboardQuickActions,
  DashboardScheduleWidget,
  DashboardRecentTickets,
  DashboardVitalsWidget,
} from "@/components/patient/dashboard";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Hydrate cached data from sessionStorage on mount (client-only, after hydration)
  useEffect(() => {
    try {
      const cachedTickets = sessionStorage.getItem("triage_cached_tickets");
      if (cachedTickets) {
        setTickets(JSON.parse(cachedTickets));
        setLoading(false);
      }
      const cachedReminders = sessionStorage.getItem("triage_cached_reminders");
      if (cachedReminders) setReminders(JSON.parse(cachedReminders));
    } catch {}
  }, []);

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
        const incomingTickets = tData.tickets || [];
        setTickets(incomingTickets);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_cached_tickets", JSON.stringify(incomingTickets));
        }
      }

      // 2. Fetch live reminders schedule from Supabase
      const remindersRes = await fetch(
        `/api/patient/reminders?patient_id=${user.id}`
      );
      if (remindersRes.ok) {
        const rData = await remindersRes.json();
        const incomingReminders = rData.reminders || [];
        setReminders(incomingReminders);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_cached_reminders", JSON.stringify(incomingReminders));
        }
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

    // 1. Live Supabase Realtime subscription on triage_tickets
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("patient-dashboard-live-sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "triage_tickets" },
          () => {
            loadDashboardData();
          }
        )
        .subscribe();
    }

    // 2. Auto-refresh polling every 6 seconds as fallback
    const interval = setInterval(() => {
      loadDashboardData();
    }, 6000);

    return () => {
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
      clearInterval(interval);
    };
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Welcome & Citizen Header */}
      <DashboardHeader
        fullName={user?.fullName}
        facilityName={user?.facilityName}
        syncing={syncing}
        onSync={() => {
          setSyncing(true);
          loadDashboardData();
        }}
      />

      {/* Referral Consent Prompt (If Active Ticket is Referred) */}
      <DashboardReferralAlert activeTicket={activeTicket} />

      {/* Active Clinical Encounter Banner */}
      <DashboardActiveTicketBanner
        loading={loading}
        ticketsCount={tickets.length}
        activeTicket={activeTicket}
      />

      {/* Fast-Action Workspace (4 Core Launchpad Cards) */}
      <DashboardQuickActions
        reminderStats={reminderStats}
        ticketsCount={tickets.length}
      />

      {/* Main Two Column Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <DashboardScheduleWidget
            reminders={reminders}
            reminderStats={reminderStats}
            onToggleReminder={handleToggleReminder}
          />
          <DashboardRecentTickets tickets={tickets} />
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <DashboardVitalsWidget activeTicket={activeTicket} />
        </div>
      </div>
    </div>
  );
}
