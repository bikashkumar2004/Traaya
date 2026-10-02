"use client";

import React, { useState } from "react";
import { CaseDetails } from "./CaseReviewWorkspace";
import {
  History,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  UserCheck,
  Search,
  Filter,
  Eye,
  Building2,
  FileText,
  Calendar,
  Stethoscope,
} from "lucide-react";

export type CaseActivityStatus =
  | "All"
  | "Forwarded to Doctor"
  | "Referrals & Escalations"
  | "Completed History";

interface CaseActivityRecord {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  status: "Forwarded to Doctor" | "Referrals & Escalations" | "Completed History";
  urgency: string;
  urgencyClass: string;
  assignedTo: string;
  nurseId?: string;
  nurseName?: string;
  reviewedBy: string;
  reviewedAt: string;
  notes: string;
  chiefComplaint: string;
  outcome?: string;
  scheduleTime?: string;
  referalFacility?: string;
  referalFacilityId?: string;
  transferReason?: string;
  patientReferralStatus?: string;
  facilityReferralStatus?: string;
}

function formatScheduleTime(isoString?: string): string {
  if (!isoString || !isoString.trim()) return "Pending Schedule";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${dateStr} at ${timeStr}`;
  } catch {
    return isoString;
  }
}

interface CaseActivityViewProps {
  initialCases?: CaseDetails[];
  onViewCase?: (c: any) => void;
  currentNurseId?: string;
}

import { fetchLiveNurseActivityLog } from "@/lib/nurse-api";
import { useAuth } from "@/lib/auth-context";

export function CaseActivityView({ initialCases = [], onViewCase, currentNurseId }: CaseActivityViewProps) {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<CaseActivityStatus>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [records, setRecords] = useState<CaseActivityRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Resolve active nurse ID referencing profiles.id (UUID)
  let activeNurseId = currentNurseId || user?.id;
  if (!activeNurseId && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        activeNurseId = parsed?.id || parsed?.userId;
      }
    } catch {}
  }

  React.useEffect(() => {
    async function loadActivities() {
      setLoading(true);
      try {
        const liveLogs = await fetchLiveNurseActivityLog(activeNurseId);
        const mappedRecords: CaseActivityRecord[] = [];

        // 1. Map real audit actions from database
        if (liveLogs && liveLogs.length > 0) {
          liveLogs.forEach((log: any) => {
            // Strictly enforce: only show actions taken by this nurse (decided by nurse_id)
            const logNurseId = log.nurseId || log.nurse_id || log.triage_tickets?.nurse_id;
            if (activeNurseId && logNurseId && logNurseId !== activeNurseId) {
              return;
            }

            // Check if record is already formatted from FastAPI endpoint
            if (log.patientName && log.status && log.assignedTo) {
              const logStatus = (log.status || "").toLowerCase();
              const rawStatus = (log.rawStatus || log.resulting_status || log.action_type || "").toLowerCase();
              if (
                logStatus.includes("revert") ||
                rawStatus.includes("revert") ||
                rawStatus.includes("awaiting patient") ||
                logStatus.includes("under review") ||
                logStatus.includes("draft")
              ) {
                return;
              }

              mappedRecords.push({
                ...(log as CaseActivityRecord),
                nurseId: logNurseId,
                nurseName: log.nurseName || log.nurse_name || user?.fullName || "Nurse Staff",
                reviewedBy: log.reviewedBy || log.nurseName || log.nurse_name || user?.fullName || "Nurse Staff",
                scheduleTime: log.scheduleTime || log.schedule_time || undefined,
                referalFacility: log.referalFacility || log.referal_facility || undefined,
                referalFacilityId: log.referalFacilityId || log.referal_facility_id || undefined,
                transferReason: log.transferReason || log.transfer_reason || undefined,
                patientReferralStatus: log.patientReferralStatus || log.patient_referral_status || undefined,
                facilityReferralStatus: log.facilityReferralStatus || log.facility_referral_status || undefined,
              });
              return;
            }

            const ticket = log.triage_tickets || log || {};
            const profile = ticket.profiles || {};
            const isFam = ticket.is_family_member;
            const sdata = typeof ticket.symptoms_data === "object" && ticket.symptoms_data !== null ? ticket.symptoms_data : {};
            const snapshot = sdata?.patient_intake_snapshot || {};

            const resStatus = (log.resulting_status || log.action_type || ticket.status || "").toLowerCase();
            // Do not show reverted, draft, or pending triage cases in activity audit log
            if (
              resStatus.includes("revert") ||
              resStatus.includes("awaiting patient") ||
              resStatus === "draft" ||
              resStatus === "under review" ||
              resStatus === "awaiting nurse review"
            ) {
              return;
            }

            let statusCategory: CaseActivityRecord["status"];
            // In forward to doctor, show only schedule cases
            if (resStatus.includes("schedule") || resStatus.includes("forward")) {
              statusCategory = "Forwarded to Doctor";
            } else if (resStatus.includes("refer") || resStatus.includes("escalat")) {
              statusCategory = "Referrals & Escalations";
            } else if (resStatus.includes("complet") || resStatus.includes("verif") || resStatus.includes("resolv")) {
              statusCategory = "Completed History";
            } else {
              return;
            }

            const priority = ticket.priority || "Yellow";
            const urgencyClass =
              priority === "Red" || priority.toLowerCase().includes("immediate")
                ? "bg-rose-100 text-rose-900 border-rose-300"
                : priority === "Yellow" || priority.toLowerCase().includes("urgent")
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-emerald-100 text-emerald-900 border-emerald-300";

            // Relative date
            let reviewedAt = "Recently";
            if (log.created_at || ticket.updated_at) {
              const diffMs = Date.now() - new Date(log.created_at || ticket.updated_at).getTime();
              const mins = Math.floor(diffMs / 60000);
              if (mins < 1) reviewedAt = "Just now";
              else if (mins < 60) reviewedAt = `${mins}m ago`;
              else if (mins < 1440) reviewedAt = `${Math.floor(mins / 60)}h ago`;
              else reviewedAt = `${Math.floor(mins / 1440)}d ago`;
            }

            const chiefComp = sdata.chief_complaint || ticket.chief_complaint || "Clinical Review";
            const pName = isFam ? ticket.family_member_name : (profile.full_name || snapshot.name || "Patient");
            const pUhid = isFam ? ticket.family_member_uhid : (profile.user_id || snapshot.uhid || "PT-0000");
            const pAge = isFam ? ticket.family_member_age : (profile.age || snapshot.age || 35);
            const pGender = isFam ? ticket.family_member_gender : (profile.gender || snapshot.gender || "Other");
            const refDest = ticket.referal_facility || log.referral_destination;
            const docDest = log.doctorName || log.doctor_name || ticket.assigned_doctor_name || (log.doctor_profile?.full_name) || "Attending Medical Officer";
            const destination = statusCategory === "Referrals & Escalations"
              ? (refDest || "District Hospital (DHH) Nayagarh")
              : docDest;

            const nurseName = log.nurseName || log.nurse_name || (log.nurse_profile?.full_name) || user?.fullName || "Nurse Staff";

            mappedRecords.push({
              id: log.case_number || ticket.case_number || `#LS${String(log.ticket_id || ticket.id || "").slice(0, 4)}`,
              patientId: pUhid,
              patientName: pName,
              age: pAge,
              gender: pGender,
              status: statusCategory,
              urgency: priority,
              urgencyClass,
              assignedTo: destination,
              nurseId: logNurseId,
              nurseName: nurseName,
              reviewedBy: nurseName,
              reviewedAt,
              notes: log.review_note || ticket.resolve_notes || (statusCategory === "Completed History" ? "Clinical resolution completed at triage desk." : "Action logged."),
              chiefComplaint: chiefComp,
              outcome: log.action_type || statusCategory,
              scheduleTime: log.scheduleTime || ticket.schedule_time || log.schedule_time,
              referalFacility: refDest,
              referalFacilityId: ticket.referal_facility_id || undefined,
              transferReason: ticket.transfer_reason || log.review_note || undefined,
            });
          });
        }

        // 2. Also map any cases from initialCases that have completed, referred, or scheduled statuses
        // Strictly restricted to actions taken by this nurse (decided by nurseId)
        if (initialCases && initialCases.length > 0) {
          initialCases.forEach((c) => {
            // Decided strictly by nurseId matching the current logged-in nurse
            if (activeNurseId && (!c.nurseId || c.nurseId !== activeNurseId)) {
              return;
            }
            if (!c.nurseId) {
              return;
            }

            const isAlreadyMapped = mappedRecords.some((r) => r.id === c.id);
            const sLow = (c.status || "").toLowerCase();
            if (!isAlreadyMapped && (sLow === "scheduled" || sLow === "referred" || sLow === "completed")) {
              let cat: CaseActivityRecord["status"] = "Forwarded to Doctor";
              if (sLow.includes("refer")) cat = "Referrals & Escalations";
              else if (sLow.includes("complet") || sLow.includes("verif") || sLow.includes("resolv")) cat = "Completed History";

              const refFac = c.referalFacility || c.facility;
              const docDest = c.doctorName || "Attending Medical Officer";

              mappedRecords.push({
                id: c.id,
                patientId: c.patientId,
                patientName: c.name,
                age: c.age,
                gender: c.gender,
                status: cat,
                urgency: c.urgency,
                urgencyClass: c.urgencyClass,
                assignedTo: cat === "Referrals & Escalations" ? (refFac || "District Hospital (DHH) Nayagarh") : docDest,
                nurseId: c.nurseId,
                nurseName: c.nurseName || user?.fullName || "Nurse Staff",
                reviewedBy: c.nurseName || user?.fullName || "Nurse Staff",
                reviewedAt: c.submittedTime || "Recently",
                notes: c.quickNotes || (cat === "Completed History" ? "Clinical verification and treatment completed at triage desk." : "Action logged."),
                chiefComplaint: c.chiefComplaint,
                outcome: cat === "Forwarded to Doctor" ? "Schedule & Forward to Doctor" : cat === "Referrals & Escalations" ? "Refer / Escalate" : "Resolve",
                scheduleTime: c.scheduleTime,
                referalFacility: refFac,
                referalFacilityId: c.referalFacilityId,
                transferReason: c.transferReason || undefined,
                patientReferralStatus: c.patientReferralStatus,
                facilityReferralStatus: c.facilityReferralStatus,
              });
            }
          });
        }

        setRecords(mappedRecords);
      } catch (err) {
        console.warn("Failed to load live activities:", err);
      } finally {
        setLoading(false);
      }
    }

    loadActivities();
  }, [initialCases, activeNurseId, user?.fullName]);

  const filterTabs: CaseActivityStatus[] = [
    "All",
    "Forwarded to Doctor",
    "Referrals & Escalations",
    "Completed History",
  ];

  const filteredRecords = records.filter((r) => {
    const matchesFilter =
      activeFilter === "All" || r.status === activeFilter;

    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Case Activity Header like Patient page (no box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Case Activity &amp; Audit Trail ({filteredRecords.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Monitor and track disposition across all stages: forwarded clinical reviews, emergency referrals, and closed cases.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search activity records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-teal-600"
          />
        </div>
      </div>

      {/* Filter Tabs matching the 4 requested statuses:
          ├── All
          ├── Forwarded to Doctor
          ├── Referrals & Escalations
          └── Completed History
      */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {filterTabs.map((status) => {
          const isActive = activeFilter === status;
          const count =
            status === "All"
              ? records.length
              : records.filter((r) => r.status === status).length;

          return (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span>{status}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cases List */}
      <div className="space-y-3.5">
        {filteredRecords.map((rec) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all space-y-3"
          >
            {/* Top Bar: Case ID, Status, Reviewed At */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  {rec.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rec.urgencyClass}`}
                >
                  {rec.urgency}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    rec.status === "Forwarded to Doctor"
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : rec.status === "Referrals & Escalations"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {rec.status}
                </span>
                {rec.status === "Forwarded to Doctor" && (
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-700" />
                    <span>Schedule Time: {formatScheduleTime(rec.scheduleTime)}</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Reviewed {rec.reviewedAt}</span>
              </div>
            </div>

            {/* Middle: Patient & Clinical summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">
                  Patient Details
                </span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {rec.patientName} ({rec.patientId})
                </div>
                <div className="text-slate-500">
                  {rec.age}y &bull; {rec.gender}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">
                  {rec.status === "Forwarded to Doctor"
                    ? "Assigned Consulting Doctor"
                    : rec.status === "Referrals & Escalations"
                    ? "Referral Facility Destination"
                    : "Triage Resolution Desk"}
                </span>
                <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
                  {rec.status === "Forwarded to Doctor" ? (
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  ) : rec.status === "Referrals & Escalations" ? (
                    <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  )}
                  <span>{rec.assignedTo}</span>
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Action logged by: {rec.reviewedBy}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">
                  Chief Complaint
                </span>
                <p className="text-slate-700 mt-0.5 line-clamp-2 italic">
                  &ldquo;{rec.chiefComplaint}&rdquo;
                </p>
              </div>
            </div>

            {/* Action Details: Tailored per action type */}
            {rec.status === "Forwarded to Doctor" ? (
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs space-y-2">
                <div className="flex items-center justify-between text-emerald-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Doctor OPD Appointment &amp; Schedule</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                    Scheduled
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-700 pt-0.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900 bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Scheduled Consultation Time: <strong className="text-emerald-950 font-black text-xs">{formatScheduleTime(rec.scheduleTime)}</strong></span>
                  </div>
                  <div className="text-slate-600">
                    Assigned Physician: <strong className="text-slate-800">{rec.assignedTo}</strong>
                  </div>
                </div>
              </div>
            ) : rec.status === "Referrals & Escalations" ? (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-amber-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Referral Destination &amp; Facility Escalation</span>
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-semibold">
                    Referred
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-amber-900 font-semibold text-[11px]">
                  <span>Transferred To: <strong className="text-amber-950">{rec.referalFacility || rec.assignedTo}</strong></span>
                  {rec.patientReferralStatus === "Accepted" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Patient Accepted
                    </span>
                  ) : rec.patientReferralStatus === "Declined" ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      ✕ Patient Declined
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      ⏳ Awaiting Patient Consent
                    </span>
                  )}
                  {rec.facilityReferralStatus === "Accepted" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      ✓ Under Review at Facility
                    </span>
                  )}
                </div>
                {(rec.transferReason || (rec.notes && rec.notes.trim())) && (
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    <strong className="text-slate-900">Transfer Reason:</strong> {rec.transferReason || rec.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-teal-950 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Clinical Resolve Note</span>
                  </span>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-semibold">
                    Completed
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {rec.notes || "Case clinical verification completed at PHC triage desk. Symptoms evaluated and resolved."}
                </p>
              </div>
            )}
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-400" />
            <div className="font-bold text-slate-700 text-sm">
              No case activity found for &ldquo;{activeFilter}&rdquo;
            </div>
            <p className="text-xs text-slate-400">
              Try switching your filter or search criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
