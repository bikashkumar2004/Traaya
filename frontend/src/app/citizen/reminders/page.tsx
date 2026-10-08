"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  CareReminder,
  WeekDayItem,
  RemindersHeader,
  RemindersWeekStrip,
  RemindersStatsCards,
  RemindersFilterBar,
  RemindersList,
  RemindersVitalsCard,
  RemindersAddModal,
} from "@/components/patient/reminders";

export type { CareReminder };

export default function PatientRemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Hydrate cached reminders from sessionStorage on mount (client-only)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("triage_cached_reminders");
      if (cached) {
        setReminders(JSON.parse(cached));
        setLoading(false);
      }
    } catch {}
  }, []);

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
      const res = await fetch(`/api/patient/reminders?patient_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const incoming = data.reminders || [];
        setReminders(incoming);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("triage_cached_reminders", JSON.stringify(incoming));
        }
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

  const weekDays = useMemo<WeekDayItem[]>(() => {
    const today = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result: WeekDayItem[] = [];
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
      <RemindersHeader
        syncing={syncing}
        onSync={() => {
          setSyncing(true);
          setTimeout(() => {
            fetchReminders();
            setSyncing(false);
          }, 800);
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Week Calendar Day Strip */}
      <RemindersWeekStrip stats={stats} weekDays={weekDays} />

      {/* Summary Stat Cards */}
      <RemindersStatsCards stats={stats} facilityName={user?.facilityName} />

      {/* Filter Tabs */}
      <RemindersFilterBar
        reminders={reminders}
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
      />

      {/* Reminders List */}
      <RemindersList
        loading={loading}
        filteredReminders={filteredReminders}
        activeFilter={activeFilter}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {/* Quick Vitals Logger */}
      <RemindersVitalsCard
        systolic={systolic}
        setSystolic={setSystolic}
        diastolic={diastolic}
        setDiastolic={setDiastolic}
        pulse={pulse}
        setPulse={setPulse}
        temperature={temperature}
        setTemperature={setTemperature}
        vitalsSaved={vitalsSaved}
        onSaveVitals={handleSaveVitals}
      />

      {/* Add New Reminder Modal */}
      <RemindersAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newType={newType}
        setNewType={setNewType}
        newDosage={newDosage}
        setNewDosage={setNewDosage}
        newFrequency={newFrequency}
        setNewFrequency={setNewFrequency}
        newTime={newTime}
        setNewTime={setNewTime}
        newDescription={newDescription}
        setNewDescription={setNewDescription}
        submitting={submitting}
        onCreateReminder={handleCreateReminder}
      />
    </div>
  );
}
