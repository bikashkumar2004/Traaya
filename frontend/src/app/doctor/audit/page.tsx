"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { UrgencyBadge } from "@/components/common/UrgencyBadge";
import { 
  FileText, 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  UserCheck,
  Building2,
  Download
} from "lucide-react";

interface AuditEntry {
  id: string;
  ticketId: string;
  patientName: string;
  action: "doctor_verified" | "triage_overridden" | "ai_triage_generated" | "emergency_escalated";
  performedBy: string;
  role: string;
  previousUrgency?: string;
  finalUrgency: string;
  reason: string;
  timestamp: string;
}

export default function DoctorAuditLogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const [logs] = useState<AuditEntry[]>([
    {
      id: "LOG-8801",
      ticketId: "TR-9041",
      patientName: "Aarav Sharma",
      action: "doctor_verified",
      performedBy: "Dr. Kavita Verma, MD",
      role: "Medical Officer",
      previousUrgency: "Priority",
      finalUrgency: "Priority",
      reason: "Clinical physical examination confirms Acute Febrile Illness with rigors; verified Dengue protocol.",
      timestamp: "14 Sep 2026, 11:30 AM"
    },
    {
      id: "LOG-8802",
      ticketId: "TR-9042",
      patientName: "Meera Patel",
      action: "emergency_escalated",
      performedBy: "Priya Nair, ANM",
      role: "Field Nurse",
      previousUrgency: "Priority",
      finalUrgency: "Urgent",
      reason: "SpO2 dropped below 88% with chest tightness and marked diaphoresis. 108 Ambulance triggered.",
      timestamp: "14 Sep 2026, 10:45 AM"
    },
    {
      id: "LOG-8803",
      ticketId: "TR-9038",
      patientName: "Devendra Joshi",
      action: "triage_overridden",
      performedBy: "Dr. Kavita Verma, MD",
      role: "Medical Officer",
      previousUrgency: "Urgent",
      finalUrgency: "Priority",
      reason: "Spurious pulse oximeter artifact during cold extremities. Re-measured SpO2 96% after warming fingers.",
      timestamp: "14 Sep 2026, 09:15 AM"
    },
    {
      id: "LOG-8804",
      ticketId: "TR-9043",
      patientName: "Sunil Kumar",
      action: "doctor_verified",
      performedBy: "Dr. R. K. Singhal",
      role: "Medical Officer",
      previousUrgency: "Routine",
      finalUrgency: "Routine",
      reason: "Spondylosis flare without red flags. Ambulatory outpatient management confirmed.",
      timestamp: "13 Sep 2026, 04:20 PM"
    }
  ]);

  const filtered = logs.filter((item) => {
    const matchesSearch = item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.performedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || item.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "doctor_verified":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">Physician Verified</span>;
      case "triage_overridden":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Clinical Override</span>;
      case "emergency_escalated":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Stat Escalation</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">AI Generated</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-200">
            Screen 02f393 &bull; Drizzle Supabase Audit Trail
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Doctor Audit Log &amp; Regulatory Compliance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Immutable audit record of algorithmic suggestions, doctor attestations, and clinical overrides.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Audit log export generated in ABDM compliant JSON/CSV format.")}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 self-start sm:self-center transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-teal-700" />
          <span>Export ABDM Compliance Log</span>
        </button>
      </div>

      {/* Compliance Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100 text-teal-800 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              National Digital Health Blueprint (NDHB) Triage Compliance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              100% of algorithmic triage classifications require human physician attestation before closing case records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Override Frequency</span>
            <span className="text-sm font-bold text-teal-800 tabular-nums">4.2%</span>
          </div>
          <span className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Sign-off Rate</span>
            <span className="text-sm font-bold text-emerald-700 tabular-nums">99.1%</span>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient, ticket, or physician..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-teal-700"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { key: "all", label: "All Events" },
              { key: "doctor_verified", label: "Physician Attested" },
              { key: "triage_overridden", label: "Overrides" },
              { key: "emergency_escalated", label: "Escalations" },
            ].map((btn) => (
              <button
                key={btn.key}
                onClick={() => setActionFilter(btn.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  actionFilter === btn.key
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Event &amp; Ticket</th>
                <th className="py-3 px-4">Attending Signer</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Urgency Shift</th>
                <th className="py-3 px-4">Clinical Justification</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{log.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {log.ticketId} &bull; {log.id}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{log.performedBy}</div>
                    <div className="text-[10px] text-slate-500">{log.role}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      {log.previousUrgency && (
                        <>
                          <span className="text-slate-400 line-through text-[11px]">{log.previousUrgency}</span>
                          <span className="text-slate-400">&rarr;</span>
                        </>
                      )}
                      <UrgencyBadge urgency={log.finalUrgency} size="sm" />
                    </div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs text-slate-600">
                    {log.reason}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                    {log.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
