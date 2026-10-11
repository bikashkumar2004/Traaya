"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  TriageTicket,
  CareReminder,
  PatientVitalLog,
  DashboardHeader,
  DashboardReferralAlert,
  DashboardActiveTicketBanner,
  DashboardQuickActions,
  DashboardScheduleWidget,
  DashboardRecentTickets,
  DashboardVitalsWidget,
} from "@/components/patient/dashboard";
import { RemindersVitalsCard } from "@/components/patient/reminders";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TriageTicket[]>([]);
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [latestVitals, setLatestVitals] = useState<PatientVitalLog | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Quick vitals logger state (connected to database)
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [temperature, setTemperature] = useState("");
  const [spo2, setSpo2] = useState("");
  const [vitalsSaved, setVitalsSaved] = useState(false);

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

      // 3. Fetch latest vitals telemetry from database (public.patient_vitals_logs)
      const vitalsRes = await fetch(
        `/api/patient/reminders/vitals?patient_id=${user.id}`
      );
      if (vitalsRes.ok) {
        const vData = await vitalsRes.json();
        if (vData.latest) {
          setLatestVitals(vData.latest);
          if (vData.latest.systolic != null) setSystolic(String(vData.latest.systolic));
          if (vData.latest.diastolic != null) setDiastolic(String(vData.latest.diastolic));
          if (vData.latest.pulse != null) setPulse(String(vData.latest.pulse));
          if (vData.latest.temperature != null) setTemperature(String(vData.latest.temperature));
          if (vData.latest.spo2 != null) setSpo2(String(vData.latest.spo2));
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

  // Save vitals directly from dashboard to database
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      const res = await fetch("/api/patient/reminders/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: user.id,
          ticket_id: activeTicket?.id,
          systolic,
          diastolic,
          pulse,
          temperature,
          spo2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.vitals) {
          setLatestVitals(data.vitals);
        }
        setVitalsSaved(true);
        setTimeout(() => setVitalsSaved(false), 3000);
      }
    } catch (err) {
      console.error("[Save Vitals Error]", err);
    }
  };

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

        {/* Right Column (5 Cols) - Database Driven Vitals Telemetry & Daily Self-Log */}
        <div className="lg:col-span-5 space-y-6">
          <DashboardVitalsWidget
            activeTicket={activeTicket}
            latestVitals={latestVitals}
            onOpenLogger={() => {
              const el = document.getElementById("daily-vitals-logger");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                const firstInput = el.querySelector("input");
                firstInput?.focus();
              }
            }}
          />

          <div id="daily-vitals-logger">
            <RemindersVitalsCard
              systolic={systolic}
              setSystolic={setSystolic}
              diastolic={diastolic}
              setDiastolic={setDiastolic}
              pulse={pulse}
              setPulse={setPulse}
              temperature={temperature}
              setTemperature={setTemperature}
              spo2={spo2}
              setSpo2={setSpo2}
              vitalsSaved={vitalsSaved}
              onSaveVitals={handleSaveVitals}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
