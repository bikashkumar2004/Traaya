"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock,
  PhoneCall,
  Bed,
  ShieldCheck,
  Search,
  Activity,
  AlertCircle,
  Stethoscope,
  Sparkles,
  RefreshCw
} from "lucide-react";
import {
  fetchLiveStaffRoster,
  updateLiveStaffStatus,
  fetchLiveFacilityStatus,
} from "@/lib/nurse-api";
import { useAuth } from "@/lib/auth-context";

export type WorkerStatus = "Available" | "Busy" | "Offline" | "On Standby";

interface PHCWorker {
  id: string;
  db_id?: string;
  name: string;
  role: string;
  department: string;
  status: WorkerStatus;
  statusBadgeClass: string;
  currentTask: string;
  contactExt: string;
  phone: string;
  shift: string;
}

const DEFAULT_WORKERS: PHCWorker[] = [
  {
    id: "W-01",
    name: "Doctor / Staff A",
    role: "Authorized clinical reviewer",
    department: "General Medicine & Acute Care",
    status: "Available",
    statusBadgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold",
    currentTask: "Ready for incoming triage prescriptions & clinical review",
    contactExt: "Ext 101",
    phone: "+91 94370 12345",
    shift: "08:00 AM - 04:00 PM",
  },
  {
    id: "W-02",
    name: "Nurse / Staff B",
    role: "Nurse",
    department: "Intake Station & Vitals Desk",
    status: "Busy",
    statusBadgeClass: "bg-amber-500/15 text-amber-700 border-amber-400 font-bold",
    currentTask: "Administering oral rehydration & recording vitals for Case #LS1024",
    contactExt: "Ext 104",
    phone: "+91 94370 56789",
    shift: "07:30 AM - 03:30 PM",
  },
  {
    id: "W-03",
    name: "Doctor / Staff C",
    role: "Clinical reviewer",
    department: "Pediatrics & Tele-Consultation",
    status: "Offline",
    statusBadgeClass: "bg-slate-200 text-slate-700 border-slate-300 font-semibold",
    currentTask: "Off-duty • Expected shift resumption at 02:00 PM",
    contactExt: "Ext 102",
    phone: "+91 94370 98765",
    shift: "02:00 PM - 10:00 PM",
  },
  {
    id: "W-04",
    name: "Staff D (Lab Technician)",
    role: "Pathology & Diagnostics Lead",
    department: "Diagnostic Laboratory & OCR Verification",
    status: "Available",
    statusBadgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold",
    currentTask: "Running CBC tests & rapid antigen malaria cartridges",
    contactExt: "Ext 107",
    phone: "+91 94370 44321",
    shift: "08:00 AM - 04:00 PM",
  },
  {
    id: "W-05",
    name: "Staff E (Pharmacist)",
    role: "Dispensing Pharmacist",
    department: "Jan Aushadhi & PHC Dispensary",
    status: "Available",
    statusBadgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold",
    currentTask: "Dispensing antibiotics, oral rehydration salts & antipyretics",
    contactExt: "Ext 109",
    phone: "+91 94370 77890",
    shift: "08:30 AM - 04:30 PM",
  },
];

export function FacilityAvailabilityView() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [searchWorker, setSearchWorker] = useState<string>("");
  const [workers, setWorkers] = useState<PHCWorker[]>(DEFAULT_WORKERS);
  const [facilityData, setFacilityData] = useState<{
    totalBeds: number;
    availableBeds: number;
    occupiedBeds: number;
    oxygenCylinders: number;
    ambulanceReady: boolean;
  }>({
    totalBeds: 20,
    availableBeds: 6,
    occupiedBeds: 14,
    oxygenCylinders: 8,
    ambulanceReady: true,
  });
  const [loading, setLoading] = useState(false);

  const loadLiveFacilityData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load Staff Roster
      const roster = await fetchLiveStaffRoster();
      if (roster && roster.length > 0) {
        const mapped: PHCWorker[] = roster.map((r: any, idx: number) => {
          const st = (r.status || "Available") as WorkerStatus;
          const badgeClass =
            st === "Available"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold"
              : st === "Busy"
              ? "bg-amber-500/15 text-amber-700 border-amber-400 font-bold"
              : "bg-slate-200 text-slate-700 border-slate-300 font-semibold";
          return {
            id: `W-0${idx + 1}`,
            db_id: r.id,
            name: r.staff_name,
            role: r.staff_role,
            department: r.department,
            status: st,
            statusBadgeClass: badgeClass,
            currentTask: r.current_task || "On Duty",
            contactExt: r.contact_ext || "Ext 101",
            phone: r.phone || "+91 94370 12345",
            shift: r.shift_timings || "08:00 AM - 04:00 PM",
          };
        });
        setWorkers(mapped);
      }

      // 2. Load Facility Bed stats
      const fac = await fetchLiveFacilityStatus();
      if (fac) {
        setFacilityData({
          totalBeds: fac.total_beds ?? 20,
          availableBeds: fac.available_beds ?? 6,
          occupiedBeds: fac.occupied_beds ?? 14,
          oxygenCylinders: fac.oxygen_cylinders_available ?? 8,
          ambulanceReady: fac.ambulance_ready ?? true,
        });
      }
    } catch (err) {
      console.warn("Failed loading live facility data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveFacilityData();
  }, [loadLiveFacilityData]);

  const toggleStatus = async (id: string) => {
    const target = workers.find((w) => w.id === id);
    if (!target) return;

    let nextStatus: WorkerStatus = "Available";
    let nextBadge = "bg-emerald-500/10 text-emerald-600 border-emerald-300 font-bold";

    if (target.status === "Available") {
      nextStatus = "Busy";
      nextBadge = "bg-amber-500/15 text-amber-700 border-amber-400 font-bold";
    } else if (target.status === "Busy") {
      nextStatus = "Offline";
      nextBadge = "bg-slate-200 text-slate-700 border-slate-300 font-semibold";
    }

    // Optimistic local update
    setWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              status: nextStatus,
              statusBadgeClass: nextBadge,
            }
          : w
      )
    );

    // Persist to live PostgreSQL / Supabase if db_id exists
    if (target.db_id) {
      await updateLiveStaffStatus(target.db_id, nextStatus);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesStatus =
      filterStatus === "All" || w.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      w.name.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.role.toLowerCase().includes(searchWorker.toLowerCase()) ||
      w.department.toLowerCase().includes(searchWorker.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Facility Header like Patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {user?.facilityName ? `${user.facilityName} Staff Availability` : "Health Facility Staff Availability"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Real-time duty status of doctors, clinical reviewers, nurses, and laboratory personnel at this PHC.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Station Fully Operational</span>
          </div>
        </div>
      </div>

      {/* Facility Resource Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Duty Personnel</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {workers.filter((w) => w.status === "Available" || w.status === "Busy").length} / {workers.length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Clinical reviews active
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Observation Beds</span>
          <div className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
            {facilityData.availableBeds} <span className="text-sm font-normal text-slate-400">/ {facilityData.totalBeds} Free</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {facilityData.occupiedBeds} Currently occupied
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Oxygen Supply</span>
          <div className="text-2xl font-bold text-teal-800 tabular-nums mt-1">
            {facilityData.oxygenCylinders} Cylinders
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Manifold pressure normal
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Emergency Transport</span>
          <div className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
            108 Ready
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Nayagarh SDH route clear
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search worker by name or role..."
            value={searchWorker}
            onChange={(e) => setSearchWorker(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["All", "Available", "Busy", "Offline"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === s
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Workers Roster List matching Image 5 reference style:
          - Doctor / Staff A | Authorized clinical reviewer | [Available]
          - Nurse / Staff B | Nurse | [Busy]
          - Doctor / Staff C | Clinical reviewer | [Offline]
      */}
      <div className="space-y-3">
        {filteredWorkers.map((worker) => (
          <div
            key={worker.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            {/* Left: Name, Role, and Department */}
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {worker.name}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {worker.contactExt}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                {worker.role} &bull; <span className="text-slate-500 font-normal">{worker.department}</span>
              </div>

              <p className="text-xs text-slate-500 pt-0.5">
                {worker.currentTask}
              </p>
            </div>

            {/* Right: Real-time Status Badge matching Image 5 */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => toggleStatus(worker.id)}
                title="Click to toggle worker status"
                className={`px-3.5 py-1.5 rounded-full text-xs border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${worker.statusBadgeClass}`}
              >
                {worker.status}
              </button>

              <a
                href={`tel:${worker.phone}`}
                className="p-2 text-slate-600 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title={`Call ${worker.name}`}
              >
                <PhoneCall className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
