import { supabase } from "@/lib/supabase";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";
import { mapDbTicketToCase, filterCasesByFacility } from "./nurse-case-mapper";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Fetch all triage tickets live from FastAPI backend or Supabase,
 * strictly filtered to the nurse's designated facility.
 */
export async function fetchLiveNurseQueue(options?: {
  facilityId?: string | null;
  facilityName?: string | null;
  nurseId?: string | null;
  doctorId?: string | null;
}): Promise<{ cases: CaseDetails[]; source: "api" | "supabase" | "fallback" }> {
  let targetFacilityId = options?.facilityId || null;
  let targetFacilityName = options?.facilityName || null;

  // If not provided in options, try resolving from local user session / localStorage
  if (!targetFacilityId && !targetFacilityName && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("triageassist_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        targetFacilityId = parsed?.facilityId || null;
        targetFacilityName = parsed?.facilityName || null;
      }
    } catch {}
  }

  // If still not found and nurseId is present, fetch facility_id from nurse_profiles table
  const effectiveNurseId = options?.nurseId;
  if (!targetFacilityId && effectiveNurseId && supabase) {
    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(effectiveNurseId);
      let nq = supabase.from("nurse_profiles").select("facility_id, facility_name");
      if (isUuid) {
        nq = nq.eq("profile_id", effectiveNurseId);
      } else {
        const { data: p } = await supabase.from("profiles").select("id").eq("user_id", effectiveNurseId).maybeSingle();
        if (p?.id) {
          nq = nq.eq("profile_id", p.id);
        }
      }
      const { data: npData } = await nq.maybeSingle();
      if (npData?.facility_id) {
        targetFacilityId = npData.facility_id;
      }
      if (npData?.facility_name) {
        targetFacilityName = npData.facility_name;
      }
    } catch (err) {
      console.warn("[NurseAPI] Notice resolving nurse facility:", err);
    }
  }

  // If still not found and doctorId is present, fetch facility_id from doctor_profiles table
  const effectiveDoctorId = options?.doctorId;
  if (!targetFacilityId && effectiveDoctorId && supabase) {
    try {
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(effectiveDoctorId);
      let dq = supabase.from("doctor_profiles").select("facility_id, facility_name");
      if (isUuid) {
        dq = dq.eq("profile_id", effectiveDoctorId);
      } else {
        const { data: p } = await supabase.from("profiles").select("id").eq("user_id", effectiveDoctorId).maybeSingle();
        if (p?.id) {
          dq = dq.eq("profile_id", p.id);
        }
      }
      const { data: dpData } = await dq.maybeSingle();
      if (dpData?.facility_id) {
        targetFacilityId = dpData.facility_id;
      }
      if (dpData?.facility_name) {
        targetFacilityName = dpData.facility_name;
      }
    } catch (err) {
      console.warn("[NurseAPI] Notice resolving doctor facility:", err);
    }
  }

  // 1. Try FastAPI backend endpoint
  try {
    const params = new URLSearchParams();
    if (targetFacilityId) params.set("facility_id", targetFacilityId);
    if (targetFacilityName) params.set("facility_name", targetFacilityName);
    const queryString = params.toString() ? `?${params.toString()}` : "";

    const res = await fetch(`${API_BASE}/api/triage/nurse-queue${queryString}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.cases)) {
        let mappedCases = data.cases.map((c: any) => {
          const sdata =
            typeof c.symptoms_data === "object" && c.symptoms_data !== null
              ? c.symptoms_data
              : typeof c.symptomsData === "object" && c.symptomsData !== null
              ? c.symptomsData
              : {};
          const syms = sdata.symptoms || c.symptomsData?.symptoms || c.aiInfo?.symptoms || [];
          const summ =
            sdata.summary ||
            c.symptomsData?.summary ||
            sdata.clinical_summary ||
            sdata.symptoms_summary ||
            sdata.patient_summary ||
            sdata.raw_complaint ||
            c.chiefComplaint ||
            (syms.length ? syms.join(", ") : "");
          return {
            ...c,
            symptomsData: {
              symptoms: syms,
              raw_complaint: sdata.raw_complaint || c.symptomsData?.raw_complaint || c.chiefComplaint,
              summary: summ,
              questions_answers: sdata.questions_answers || c.symptomsData?.questions_answers || {},
              raw_qa: sdata.raw_qa || c.symptomsData?.raw_qa || [],
            },
            symptoms_data: sdata,
          };
        });
        if (targetFacilityId || targetFacilityName || effectiveDoctorId) {
          mappedCases = filterCasesByFacility(mappedCases, targetFacilityId, targetFacilityName, effectiveDoctorId);
        }
        return { cases: mappedCases, source: "api" };
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] FastAPI backend unreachable, querying Supabase directly...", err);
  }

  // 2. Fallback to direct Supabase client
  if (supabase) {
    try {
      let q = supabase
        .from("triage_tickets")
        .select("*, profiles:patient_id(full_name, age, gender, phone, user_id), nurse_profile:nurse_id(id, full_name, user_id), doctor_profile:doctor_id(id, full_name, user_id), new_patient:new_patient_id(*), facility_profile:facility_id(id, full_name, role, district, state)")
        .order("created_at", { ascending: false });

      if (targetFacilityId && effectiveDoctorId) {
        q = q.or(`facility_id.eq.${targetFacilityId},present_address->>facility_id.eq.${targetFacilityId},doctor_id.eq.${effectiveDoctorId}`);
      } else if (targetFacilityId) {
        q = q.or(`facility_id.eq.${targetFacilityId},present_address->>facility_id.eq.${targetFacilityId}`);
      } else if (effectiveDoctorId) {
        q = q.eq("doctor_id", effectiveDoctorId);
      }

      const { data: tickets, error: tErr } = await q;

      if (!tErr && tickets && tickets.length > 0) {
        const { data: reports } = await supabase.from("uploaded_reports").select("*");

        const reportsMap: Record<string, any[]> = {};
        (reports || []).forEach((r) => {
          if (r.case_number) {
            reportsMap[r.case_number] = reportsMap[r.case_number] || [];
            reportsMap[r.case_number].push(r);
          }
        });

        const mappedCases = tickets.map((t) => mapDbTicketToCase(t, reportsMap[t.case_number] || []));
        const seen = new Set<string>();
        let uniqueCases = mappedCases.filter((c) => {
          if (!c.id || seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });

        // Strictly scope to nurse's facility or assigned doctor
        if (targetFacilityId || targetFacilityName || effectiveDoctorId) {
          uniqueCases = filterCasesByFacility(uniqueCases, targetFacilityId, targetFacilityName, effectiveDoctorId);
        }

        return { cases: uniqueCases, source: "supabase" };
      }
    } catch (err) {
      console.warn("[NurseAPI] Direct Supabase query error:", err);
    }
  }

  return { cases: [], source: "fallback" };
}

/**
 * Submits patient answers to reverted questions
 */
export async function submitPatientAnswers(
  ticketId: string,
  answers: { id: string; answer: string }[]
): Promise<boolean> {
  // 1. Try FastAPI endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/answer-reverted-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId, answers }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn("[NurseAPI] Backend answer-reverted-questions failed, attempting direct Supabase...", err);
  }

  // 2. Direct Supabase fallback
  if (supabase) {
    try {
      const { data: ticket } = await supabase
        .from("triage_tickets")
        .select("id, reverted_questions")
        .or(`id.eq.${ticketId},case_number.eq.${ticketId}`)
        .single();

      if (ticket) {
        let existing: any = ticket.reverted_questions || [];
        if (typeof existing === "string") {
          try {
            existing = JSON.parse(existing);
          } catch {
            existing = existing.split("\n").filter(Boolean).map((line: string, idx: number) => ({ id: `q_${idx + 1}`, question: line.trim(), answer: "" }));
          }
        }
        if (!Array.isArray(existing)) {
          existing = typeof existing === "object" && existing !== null ? [existing] : [];
        }

        const ansMap = new Map(answers.map((a) => [String(a.id), a.answer]));
        const updated = existing.map((q: any, idx: number) => {
          const qid = String(q.id || `q_${idx + 1}`);
          if (ansMap.has(qid)) {
            return {
              ...q,
              id: qid,
              answer: ansMap.get(qid),
              answered_at: new Date().toISOString()
            };
          }
          return { ...q, id: qid };
        });

        await supabase
          .from("triage_tickets")
          .update({
            reverted_questions: updated,
            status: "Under Review",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ticket.id);

        return true;
      }
    } catch (err) {
      console.error("[NurseAPI] Supabase direct answer submit error:", err);
    }
  }

  return false;
}

/**
 * Fetches nurse activity audit log records
 */
export async function fetchLiveNurseActivityLog(nurseId?: string | null): Promise<any[]> {
  const cleanNurseId = nurseId?.trim() || null;

  // 1. Try FastAPI backend endpoint
  try {
    const url = cleanNurseId
      ? `${API_BASE}/api/triage/nurse-activity?nurse_id=${encodeURIComponent(cleanNurseId)}`
      : `${API_BASE}/api/triage/nurse-activity`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.records)) {
        return data.records;
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] FastAPI nurse-activity unreachable, trying direct Supabase...", err);
  }

  // 2. Fallback to direct Supabase
  if (!supabase) return [];

  try {
    let q = supabase
      .from("triage_tickets")
      .select("*, profiles:patient_id(*), nurse_profile:nurse_id(id, full_name, user_id), doctor_profile:doctor_id(id, full_name, user_id)")
      .order("updated_at", { ascending: false });

    if (cleanNurseId) {
      q = q.eq("nurse_id", cleanNurseId);
    } else {
      q = q.not("nurse_id", "is", null);
    }

    const { data: tickets, error } = await q;

    if (!error && tickets && tickets.length > 0) {
      return tickets.map((t: any) => {
        const profile = t.profiles || {};
        const isFam = t.is_family_member;
        const sdata =
          typeof t.symptoms_data === "object" && t.symptoms_data !== null
            ? t.symptoms_data
            : typeof t.symptoms_data === "string"
            ? (() => { try { return JSON.parse(t.symptoms_data); } catch { return {}; } })()
            : {};
        const snapshot = sdata?.patient_intake_snapshot || {};

        const pName = isFam
          ? (t.family_member_name || "Family Dependent")
          : (profile.full_name || snapshot.name || "Patient");
        const pUhid = isFam
          ? (t.family_member_uhid || "PT-FAM")
          : (profile.user_id || snapshot.uhid || "PT-0000");

        const st = (t.status || "").toLowerCase();
        // Do not show reverted, draft, or pending triage cases in activity audit log
        if (
          st.includes("revert") ||
          st.includes("awaiting patient") ||
          st === "draft" ||
          st === "under review" ||
          st === "awaiting nurse review"
        ) {
          return null;
        }

        let category: string;
        if (st.includes("schedule") || st.includes("forward")) {
          category = "Forwarded to Doctor";
        } else if (st.includes("refer") || st.includes("escalat")) {
          category = "Referrals & Escalations";
        } else if (st.includes("complet") || st.includes("verif") || st.includes("resolv")) {
          category = "Completed History";
        } else {
          return null;
        }

        const priority = t.priority || "Yellow";
        const urgencyClass =
          priority === "Red" || priority.toLowerCase().includes("immediate")
            ? "bg-rose-100 text-rose-900 border-rose-300"
            : priority === "Yellow" || priority.toLowerCase().includes("urgent")
            ? "bg-amber-100 text-amber-900 border-amber-300"
            : "bg-emerald-100 text-emerald-900 border-emerald-300";

        let reviewedAt = "Recently";
        if (t.updated_at || t.created_at) {
          try {
            const diffMs = Date.now() - new Date(t.updated_at || t.created_at).getTime();
            const mins = Math.floor(diffMs / 60000);
            if (mins < 1) reviewedAt = "Just now";
            else if (mins < 60) reviewedAt = `${mins}m ago`;
            else if (mins < 1440) reviewedAt = `${Math.floor(mins / 60)}h ago`;
            else reviewedAt = `${Math.floor(mins / 1440)}d ago`;
          } catch {
            reviewedAt = "Recently";
          }
        }

        const nurseName = t.nurse_profile?.full_name || t.nurse_name || "Nurse Staff";
        const docName = t.doctor_profile?.full_name || t.assigned_doctor_name || "Attending Medical Officer";

        return {
          id: t.case_number || `#LS${String(t.id || "").slice(0, 6)}`,
          patientId: pUhid,
          patientName: pName,
          age: isFam ? (t.family_member_age || 30) : (profile.age || snapshot.age || 30),
          gender: isFam ? (t.family_member_gender || "Other") : (profile.gender || snapshot.gender || "Other"),
          status: category,
          urgency: priority,
          urgencyClass: urgencyClass,
          assignedTo: category === "Referrals & Escalations" ? (t.referal_facility || "Secondary Care Facility") : docName,
          reviewedBy: nurseName,
          reviewedAt: reviewedAt,
          nurse_id: t.nurse_id,
          nurseId: t.nurse_id,
          doctor_id: t.doctor_id,
          doctorId: t.doctor_id,
          notes: t.resolve_notes || t.doctor_notes || (category === "Completed History" ? "Clinical resolution completed at triage desk." : "Triage review completed."),
          scheduleTime: t.schedule_time || undefined,
          referalFacility: t.referal_facility || undefined,
          referalFacilityId: t.referal_facility_id || undefined,
          transferReason: t.transfer_reason || undefined,
        };
      }).filter(Boolean) as any[];
    }
  } catch (e) {
    console.warn("Failed fetching live nurse actions from Supabase triage_tickets:", e);
  }

  return [];
}
