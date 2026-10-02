import { supabase } from "@/lib/supabase";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Maps raw Supabase triage_tickets row to frontend CaseDetails interface
 */
export function mapDbTicketToCase(t: any, linkedReports: any[] = []): CaseDetails {
  const sdata = typeof t.symptoms_data === "object" && t.symptoms_data !== null
    ? t.symptoms_data
    : typeof t.symptoms_data === "string"
    ? (() => { try { return JSON.parse(t.symptoms_data); } catch { return {}; } })()
    : {};

  // Parse symptoms
  let symptoms: string[] = [];
  const rawSymptoms = sdata.symptoms || t.symptoms || [];
  if (Array.isArray(rawSymptoms)) {
    symptoms = rawSymptoms.map((s: any) => (typeof s === "string" ? s : s?.name || "Symptom"));
  } else if (typeof rawSymptoms === "string") {
    try {
      const parsed = JSON.parse(rawSymptoms);
      symptoms = Array.isArray(parsed) ? parsed.map((s: any) => (typeof s === "string" ? s : s?.name || "Symptom")) : [rawSymptoms];
    } catch {
      symptoms = [rawSymptoms];
    }
  }

  // Parse missing details
  let missingDetails: string[] = sdata.missing_details || t.missing_details || [];
  if (typeof missingDetails === "string") {
    try {
      missingDetails = JSON.parse(missingDetails);
    } catch {
      missingDetails = [];
    }
  }

  const priorityVal = t.priority || t.urgency || "Yellow";
  const priorityClass =
    priorityVal === "Red" || priorityVal.toLowerCase().includes("immediate") || priorityVal.toLowerCase().includes("red")
      ? "bg-rose-100 text-rose-800 border-rose-200"
      : priorityVal === "Yellow" || priorityVal.toLowerCase().includes("urgent") || priorityVal.toLowerCase().includes("yellow")
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";

  let aiSuggestion = {
    priority: priorityVal,
    reason: sdata.clinical_reasoning || "Clinical triage assessment recommended.",
  };

  // Relative submission time
  let submittedTime = "Recently";
  if (t.created_at) {
    try {
      const diffMs = Date.now() - new Date(t.created_at).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) submittedTime = "Just now";
      else if (diffMins < 60) submittedTime = `${diffMins} minutes ago`;
      else if (diffMins < 1440) submittedTime = `${Math.floor(diffMins / 60)} hours ago`;
      else submittedTime = `${Math.floor(diffMins / 1440)} days ago`;
    } catch {
      submittedTime = "Recently";
    }
  }

  // Reports
  const reportsList: string[] = (linkedReports || []).map((r: any) => r.file_name).filter(Boolean);
  if (t.uploaded_report_data && typeof t.uploaded_report_data === "object") {
    const fn = t.uploaded_report_data.file_name || t.uploaded_report_data.fileName || t.uploaded_report_data.name;
    if (fn && !reportsList.includes(fn)) {
      reportsList.push(fn);
    }
  }
  if (t.uploaded_report_url && !reportsList.length) {
    const urlParts = t.uploaded_report_url.split("/");
    const extractedName = decodeURIComponent(urlParts[urlParts.length - 1]?.split("?")[0] || "");
    if (extractedName && extractedName.includes(".")) {
      reportsList.push(extractedName);
    } else {
      reportsList.push("Uploaded_Report.pdf");
    }
  }

  // AI Report Analysis
  const aiReportAnalysisList: string[] = [];
  (linkedReports || []).forEach((r: any) => {
    if (Array.isArray(r.ai_report_analysis)) {
      aiReportAnalysisList.push(...r.ai_report_analysis);
    } else if (typeof r.ai_report_analysis === "string") {
      aiReportAnalysisList.push(r.ai_report_analysis);
    }
  });
  if (t.uploaded_report_data && typeof t.uploaded_report_data === "object") {
    if (t.uploaded_report_data.summary) {
      aiReportAnalysisList.push(t.uploaded_report_data.summary);
    }
    if (Array.isArray(t.uploaded_report_data.findings)) {
      aiReportAnalysisList.push(...t.uploaded_report_data.findings);
    }
  }

  const isFamily = Boolean(t.is_family_member);
  const profile = t.profiles || {};
  const newPat = t.new_patient || {};
  const snapshot = sdata.patient_intake_snapshot || {};
  const patientName = isFamily ? (t.family_member_name || "Family Dependent") : (newPat.full_name || profile.full_name || snapshot.name || t.patient_name || "Patient");
  const patientUhid = isFamily ? (t.family_member_uhid || "PT-FAM") : (newPat.uhid || profile.user_id || snapshot.uhid || profile.patient_uhid || t.patient_uhid || "PT-0000");
  const patientAge = isFamily ? (t.family_member_age || profile.age || 0) : (newPat.age || profile.age || snapshot.age || t.patient_age || 0);
  const patientGender = isFamily ? (t.family_member_gender || profile.gender || "Not specified") : (newPat.gender || profile.gender || snapshot.gender || t.patient_gender || "Not specified");
  const patientPhone = isFamily ? (t.family_member_phone || profile.phone || "") : (newPat.phone || profile.phone || snapshot.phone || t.phone || "");
  const addr = t.present_address || sdata.location || {};
  const patientLocation = newPat.location || (addr.block ? `${addr.block}, ${addr.district || "Nayagarh"}, ${addr.state || "Odisha"}` : (profile.district ? `${profile.block || "Khandapada"}, ${profile.district}, ${profile.state || "Odisha"}` : (t.location || "Nayagarh, Odisha")));

  // Facility resolution
  const facilityName =
    t.facility_profile?.full_name ||
    addr.facility_name ||
    t.facility_name ||
    t.assigned_facility ||
    t.facility ||
    "Designated Health Facility";

  const facilityLocation =
    (addr.block && addr.district && addr.state)
      ? `${addr.block}, ${addr.district}, ${addr.state}`
      : (t.facility_profile?.district && t.facility_profile?.state)
      ? `${t.facility_profile.district}, ${t.facility_profile.state}`
      : (addr.district ? `${addr.district}, ${addr.state || "Odisha"}` : (t.location || "Odisha"));

  return {
    id: t.case_number || `#LS${String(t.id || "").slice(0, 6)}`,
    patientId: patientUhid,
    name: patientName,
    age: patientAge,
    gender: patientGender,
    phone: patientPhone,
    location: patientLocation,
    language: t.preferred_language || "Odia",
    consent: t.consent_status || "Given",
    quickNotes: t.resolve_notes || t.doctor_notes || (typeof t.uploaded_report_data === "object" ? (t.uploaded_report_data?.summary || "") : "") || t.report_text || "",
    submittedTime,
    urgency: priorityVal,
    urgencyClass: priorityClass,
    status: t.status || "Under Review",
    nurseId: t.nurse_id || undefined,
    nurseName: t.nurse_name || t.nurse_profile?.full_name || undefined,
    doctorId: t.doctor_id || undefined,
    doctorName: t.assigned_doctor_name || t.doctor_name || t.doctor_profile?.full_name || undefined,
    chiefComplaint: sdata.chief_complaint || t.chief_complaint || (symptoms.length ? symptoms.join(", ") : "Clinical evaluation"),
    aiInfo: {
      symptoms,
      duration: sdata.duration || "3 days",
      severity: sdata.severity || "Moderate",
      associated: sdata.associated || "None",
      redFlags: sdata.red_flags || "None detected yet",
    },
    missingDetails,
    reports: reportsList,
    aiReportAnalysis: aiReportAnalysisList,
    aiSuggestion,
    facility: facilityName,
    facilityLocation: facilityLocation,
    facilityId: t.facility_id || (t.present_address?.facility_id) || undefined,
    uploadedReportUrl: t.uploaded_report_url || t.report_url || undefined,
    uploadedReportData: t.uploaded_report_data || undefined,
    consultationMode: t.consultation_mode || "online",
    scheduleTime: t.schedule_time || undefined,
    revertedQuestions: t.reverted_questions || [],
    referalFacility: t.referal_facility || undefined,
    referalFacilityId: t.referal_facility_id || undefined,
    transferReason: t.transfer_reason || undefined,
    referredFromTicketId: t.referred_from_ticket_id || undefined,
    referredFromFacility: t.referred_from_facility || undefined,
    patientReferralStatus: t.patient_referral_status || "Pending",
    patientReferralAcceptedAt: t.patient_referral_accepted_at || undefined,
    facilityReferralStatus: t.facility_referral_status || "Pending",
    facilityReferralAcceptedAt: t.facility_referral_accepted_at || undefined,
    referralNotes: t.referral_notes || undefined,
    newPatientId: t.new_patient_id || undefined,
  };
}

/**
 * Strict facility filtering:
 * 1. Shows tickets assigned to the nurse's designated facility.
 * 2. Does NOT show tickets assigned to other facilities.
 */
export function filterCasesByFacility(
  cases: CaseDetails[],
  targetFacilityId?: string | null,
  targetFacilityName?: string | null,
  targetDoctorId?: string | null
): CaseDetails[] {
  if (!targetFacilityId && !targetFacilityName && !targetDoctorId) {
    return cases;
  }

  const cleanTargetId = (targetFacilityId || "").trim().toLowerCase();
  const cleanTargetName = (targetFacilityName || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const cleanDocId = (targetDoctorId || "").trim().toLowerCase();

  return cases.filter((c) => {
    // If ticket is directly assigned to this doctor, always retain it
    if (cleanDocId && c.doctorId && c.doctorId.trim().toLowerCase() === cleanDocId) {
      return true;
    }

    const caseFacId = (c.facilityId || "").trim().toLowerCase();
    const caseFacName = (c.facility || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Both have facilityId: strict UUID match
    if (cleanTargetId && caseFacId) {
      return caseFacId === cleanTargetId;
    }

    // 2. Ticket belongs to a known DIFFERENT facility ID -> strictly exclude
    if (cleanTargetId && caseFacId && caseFacId !== cleanTargetId) {
      return false;
    }

    // 3. Fallback: match by normalized facility name
    if (cleanTargetName && caseFacName) {
      return caseFacName === cleanTargetName || caseFacName.includes(cleanTargetName) || cleanTargetName.includes(caseFacName);
    }

    return false;
  });
}

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
        let filteredCases = data.cases;
        if (targetFacilityId || targetFacilityName || effectiveDoctorId) {
          filteredCases = filterCasesByFacility(data.cases, targetFacilityId, targetFacilityName, effectiveDoctorId);
        }
        return { cases: filteredCases, source: "api" };
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

export interface RegisteredFacilityOption {
  id: string; // profiles.id (UUID)
  userId?: string;
  name: string;
  role?: string;
  district?: string;
  state?: string;
  block?: string;
  city?: string;
  address?: string;
  department?: string;
}

/**
 * Fetch registered healthcare facilities strictly from database (profiles where role IN ('facility', 'medical'))
 */
export async function fetchRegisteredFacilities(): Promise<RegisteredFacilityOption[]> {
  try {
    const res = await fetch("/api/facilities");
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.facilities) && data.facilities.length > 0) {
        return data.facilities.map((f: any) => ({
          id: f.id,
          userId: f.user_id,
          name: f.facility_name || f.full_name || "Healthcare Facility",
          role: f.role,
          district: f.district,
          state: f.state,
          block: f.block,
          city: f.city,
          address: f.address_line1,
          department: f.department,
        }));
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] Notice: /api/facilities endpoint failed, attempting direct Supabase query:", err);
  }

  // Supabase fallback: select directly from profiles
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, role, state, district, block, city, address_line1")
        .in("role", ["facility", "medical"])
        .order("full_name", { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((f: any) => ({
          id: f.id,
          userId: f.user_id,
          name: f.full_name || "Healthcare Facility",
          role: f.role,
          district: f.district,
          state: f.state,
          block: f.block,
          city: f.city,
          address: f.address_line1,
        }));
      }
    } catch (err) {
      console.warn("[NurseAPI] Direct Supabase query for registered facilities failed:", err);
    }
  }

  return [];
}

export interface FacilityDoctorOption {
  id: string;
  profileId: string;
  name: string;
  role: string;
  room: string;
  department: string;
  qualification?: string;
  facilityId?: string;
  facilityName?: string;
}

/**
 * Fetch verified doctors belonging to the same healthcare facility
 */
export async function fetchDoctorsForFacility(
  facilityId?: string,
  facilityName?: string
): Promise<FacilityDoctorOption[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from("doctor_profiles")
      .select("id, profile_id, facility_id, facility_name, qualification, designation, room_number, department, availability_status, profiles:profile_id(id, full_name, email, phone)");

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    let { data, error } = await query;

    // Fallback: If no doctors returned by facility_id and facilityName is present, search by facility_name
    if ((!data || data.length === 0) && facilityName) {
      const { data: byName, error: nameErr } = await supabase
        .from("doctor_profiles")
        .select("id, profile_id, facility_id, facility_name, qualification, designation, room_number, department, availability_status, profiles:profile_id(id, full_name, email, phone)")
        .ilike("facility_name", `%${facilityName.trim()}%`);
      if (!nameErr && byName && byName.length > 0) {
        data = byName;
      }
    }

    if (data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.profile_id || d.profiles?.id || d.id,
        profileId: d.profile_id || d.profiles?.id || d.id,
        name: d.profiles?.full_name || d.full_name || "Doctor",
        role: d.designation || d.qualification || "Attending Physician",
        room: d.room_number || "OPD Room",
        department: d.department || "General Medicine OPD",
        qualification: d.qualification,
        facilityId: d.facility_id,
        facilityName: d.facility_name,
      }));
    }
  } catch (err) {
    console.warn("[NurseAPI] fetchDoctorsForFacility error:", err);
  }
  return [];
}

/**
 * Submit nurse clinical action (Forward to Doctor, Verify, Refer, etc.)
 */
export async function submitLiveNurseAction(payload: {
  case_number: string;
  action_type: string;
  review_note: string;
  target_status: string;
  assigned_doctor_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  referral_destination?: string;
  referal_facility?: string;
  referal_facility_id?: string;
  transfer_reason?: string;
  nurse_id?: string;
  nurse_name?: string;
  schedule_time?: string;
  reverted_questions?: { id: string; question: string; answer?: string }[];
}): Promise<boolean> {
  const actLower = (payload.action_type || "").toLowerCase().trim();
  const targetLower = (payload.target_status || "").toLowerCase().trim();
  const isForwardToDoctor =
    actLower.includes("schedule & forward to doctor") ||
    actLower.includes("forward to doctor") ||
    targetLower === "schedule" ||
    targetLower === "scheduled";

  const statusMap: Record<string, string> = {
    "verified": "Completed",
    "mark as verified": "Completed",
    "resolve": "Completed",
    "resolved": "Completed",
    "completed": "Completed",
    "complete": "Completed",
    "generate report and discharge": "Completed",
    "generate report & discharge": "Completed",
    "schedule": "Scheduled",
    "scheduled": "Scheduled",
    "schedule & forward to doctor": "Scheduled",
    "forward to doctor": "Scheduled",
    "forwarded to doctor": "Scheduled",
    "request more information": "Reverted",
    "awaiting patient response": "Reverted",
    "reverted": "Reverted",
    "refer / escalate": "Referred",
    "referrals & escalations": "Referred",
    "referred": "Referred",
    "urgent escalation": "Under Review",
    "under review": "Under Review",
    "draft": "Draft"
  };
  const normalizedStatus = isForwardToDoctor ? "Scheduled" : (statusMap[targetLower] || "Under Review");

  const isDoctorAction = !isForwardToDoctor && Boolean(
    actLower.includes("discharge") ||
    actLower.includes("prescribe") ||
    actLower.includes("in-person") ||
    actLower.includes("stat protocol") ||
    actLower.includes("admit")
  );

  const isValidUuid = (val?: string | null): boolean =>
    Boolean(val && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val));

  // Resolve nurse_id & doctor_id referencing public.profiles(id)
  let effectiveNurseId = payload.nurse_id;
  let effectiveNurseName = payload.nurse_name || "Nurse Staff";

  let effectiveDoctorId = payload.doctor_id;
  let effectiveDoctorName = payload.doctor_name || payload.assigned_doctor_name;

  if (supabase) {
    try {
      // 1. Resolve effectiveDoctorId to profiles(id)
      if (effectiveDoctorId && isValidUuid(effectiveDoctorId)) {
        const { data: pDoc } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", effectiveDoctorId)
          .maybeSingle();

        if (pDoc?.id) {
          effectiveDoctorId = pDoc.id;
          if (!effectiveDoctorName) effectiveDoctorName = pDoc.full_name;
        } else {
          // Check if it's doctor_profiles(id)
          const { data: dpDoc } = await supabase
            .from("doctor_profiles")
            .select("profile_id, profiles:profile_id(id, full_name)")
            .eq("id", effectiveDoctorId)
            .maybeSingle();
          if (dpDoc?.profile_id) {
            effectiveDoctorId = dpDoc.profile_id;
            if (!effectiveDoctorName) effectiveDoctorName = (dpDoc.profiles as any)?.full_name || effectiveDoctorName;
          }
        }
      } else if (effectiveDoctorId && !isValidUuid(effectiveDoctorId)) {
        const { data: pDoc } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("user_id", effectiveDoctorId)
          .maybeSingle();
        if (pDoc?.id) {
          effectiveDoctorId = pDoc.id;
          if (!effectiveDoctorName) effectiveDoctorName = pDoc.full_name;
        }
      }

      // If doctor_id is still not resolved, lookup by name
      if (!isValidUuid(effectiveDoctorId) && effectiveDoctorName && effectiveDoctorName !== "Other") {
        const cleanDocName = effectiveDoctorName.replace(/^(Dr\.?|MD)\s*/gi, "").replace(/,?\s*MD\b/gi, "").trim();
        if (cleanDocName.length > 1) {
          const { data: namedDoc } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("role", "doctor")
            .ilike("full_name", `%${cleanDocName}%`)
            .limit(1)
            .maybeSingle();
          if (namedDoc?.id) {
            effectiveDoctorId = namedDoc.id;
            effectiveDoctorName = namedDoc.full_name;
          }
        }
      }

      // If action is forward to doctor and still no valid doctor_id, pick first doctor in profiles
      if (!isValidUuid(effectiveDoctorId) && isForwardToDoctor) {
        const { data: defaultDoc } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "doctor")
          .limit(1)
          .maybeSingle();
        if (defaultDoc?.id) {
          effectiveDoctorId = defaultDoc.id;
          if (!effectiveDoctorName) effectiveDoctorName = defaultDoc.full_name;
        }
      }

      // 2. Resolve effectiveNurseId to profiles(id)
      if (effectiveNurseId && isValidUuid(effectiveNurseId)) {
        const { data: pNurse } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("id", effectiveNurseId)
          .maybeSingle();

        if (pNurse?.id) {
          effectiveNurseId = pNurse.id;
          if (!payload.nurse_name) effectiveNurseName = pNurse.full_name;
        } else {
          const { data: npNurse } = await supabase
            .from("nurse_profiles")
            .select("profile_id, profiles:profile_id(id, full_name)")
            .eq("id", effectiveNurseId)
            .maybeSingle();
          if (npNurse?.profile_id) {
            effectiveNurseId = npNurse.profile_id;
            if (!payload.nurse_name) effectiveNurseName = (npNurse.profiles as any)?.full_name || effectiveNurseName;
          }
        }
      } else if (effectiveNurseId && !isValidUuid(effectiveNurseId)) {
        const { data: pNurse } = await supabase
          .from("profiles")
          .select("id, full_name")
          .or(`user_id.eq.${effectiveNurseId},id.eq.${effectiveNurseId}`)
          .maybeSingle();
        if (pNurse?.id) {
          effectiveNurseId = pNurse.id;
          if (!payload.nurse_name) effectiveNurseName = pNurse.full_name;
        }
      }

      // Check active auth user session for nurse
      if (!isValidUuid(effectiveNurseId)) {
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user?.id && isValidUuid(authUser.user.id)) {
          const { data: authProfile } = await supabase
            .from("profiles")
            .select("id, full_name, role")
            .eq("id", authUser.user.id)
            .maybeSingle();
          if (authProfile?.id) {
            effectiveNurseId = authProfile.id;
            if (!payload.nurse_name) effectiveNurseName = authProfile.full_name;
          }
        }
      }

      // Check localStorage cached user
      if (!isValidUuid(effectiveNurseId) && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("triageassist_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isValidUuid(parsed?.id)) {
              effectiveNurseId = parsed.id;
              if (!payload.nurse_name) effectiveNurseName = parsed.fullName || effectiveNurseName;
            } else if (parsed?.userId) {
              const { data: uMatch } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("user_id", parsed.userId)
                .maybeSingle();
              if (uMatch?.id) {
                effectiveNurseId = uMatch.id;
                if (!payload.nurse_name) effectiveNurseName = uMatch.full_name;
              }
            }
          }
        } catch {}
      }

      // Fallback: pick active nurse from profiles
      if (!isValidUuid(effectiveNurseId)) {
        const { data: defaultNurse } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "nurse")
          .limit(1)
          .maybeSingle();
        if (defaultNurse?.id) {
          effectiveNurseId = defaultNurse.id;
          if (!payload.nurse_name) effectiveNurseName = defaultNurse.full_name;
        }
      }
    } catch (err) {
      console.warn("[NurseAPI] Notice resolving profiles IDs:", err);
    }
  }

  // 1. Try FastAPI endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/nurse-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        nurse_id: effectiveNurseId,
        nurse_name: effectiveNurseName,
        doctor_id: effectiveDoctorId,
        doctor_name: effectiveDoctorName,
        target_status: normalizedStatus
      }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn("[NurseAPI] Backend submit action failed, attempting direct Supabase...", err);
  }

  // 2. Direct Supabase fallback
  if (supabase) {
    try {
      const { data: tData } = await supabase
        .from("triage_tickets")
        .select("id, status")
        .eq("case_number", payload.case_number)
        .single();

      if (tData) {
        const updatePayload: Record<string, any> = {
          status: normalizedStatus,
          updated_at: new Date().toISOString(),
        };

        if (isValidUuid(effectiveNurseId)) {
          updatePayload.nurse_id = effectiveNurseId;
        }
        if (isValidUuid(effectiveDoctorId)) {
          updatePayload.doctor_id = effectiveDoctorId;
        }

        if (normalizedStatus === "Completed" || payload.action_type === "Resolve") {
          updatePayload.resolve_notes = payload.review_note;
        }
        if (payload.schedule_time || normalizedStatus === "Scheduled") {
          updatePayload.schedule_time = payload.schedule_time || new Date(Date.now() + 2 * 3600 * 1000).toISOString();
        }
        if (payload.referal_facility || payload.referral_destination) {
          updatePayload.referal_facility = payload.referal_facility || payload.referral_destination;
        }
        if (isValidUuid(payload.referal_facility_id)) {
          updatePayload.referal_facility_id = payload.referal_facility_id;
        } else if (updatePayload.referal_facility) {
          try {
            const { data: matchedFac } = await supabase
              .from("profiles")
              .select("id")
              .in("role", ["facility", "medical"])
              .ilike("full_name", `%${updatePayload.referal_facility.trim()}%`)
              .limit(1)
              .maybeSingle();
            if (matchedFac?.id) {
              updatePayload.referal_facility_id = matchedFac.id;
            }
          } catch {}
        }
        let cleanReason = (payload.transfer_reason || (normalizedStatus === "Referred" ? payload.review_note : "") || "").trim();
        cleanReason = cleanReason.replace(/^(?:Referral|Referred)\s+to\s+[^:]+:\s*/i, "").trim();

        if (cleanReason) {
          updatePayload.transfer_reason = cleanReason;
        }

        if (payload.reverted_questions && payload.reverted_questions.length > 0) {
          updatePayload.reverted_questions = payload.reverted_questions;
        } else if (normalizedStatus === "Reverted") {
          const lines = (payload.review_note || "").split("\n").filter((l) => l.trim().length > 0);
          updatePayload.reverted_questions = lines.map((l, i) => ({
            id: `q_${i + 1}`,
            question: l,
            answer: "",
          }));
        }

        if (normalizedStatus === "Referred") {
          updatePayload.patient_referral_status = "Pending";
          updatePayload.facility_referral_status = "Pending";
          updatePayload.referral_notes = cleanReason;
        }

        const { error: upErr } = await supabase
          .from("triage_tickets")
          .update(updatePayload)
          .eq("id", tData.id);

        if (upErr) {
          console.error("[NurseAPI] Direct Supabase update error:", upErr);
          return false;
        }

        // Increment nurse stats in nurse_profiles if effectiveNurseId exists
        try {
          if (effectiveNurseId) {
            const { data: currentNp } = await supabase
              .from("nurse_profiles")
              .select("cases_triaged_count, doctor_handoffs_count, emergency_referrals_count, resolved_by_me_count")
              .eq("profile_id", effectiveNurseId)
              .maybeSingle();

            if (currentNp) {
              const npUpdates: Record<string, any> = {
                cases_triaged_count: (currentNp.cases_triaged_count || 0) + 1,
                updated_at: new Date().toISOString(),
              };
              if (normalizedStatus === "Scheduled") {
                npUpdates.doctor_handoffs_count = (currentNp.doctor_handoffs_count || 0) + 1;
              } else if (normalizedStatus === "Referred") {
                npUpdates.emergency_referrals_count = (currentNp.emergency_referrals_count || 0) + 1;
              } else if (normalizedStatus === "Completed") {
                npUpdates.resolved_by_me_count = (currentNp.resolved_by_me_count || 0) + 1;
              }
              await supabase
                .from("nurse_profiles")
                .update(npUpdates)
                .eq("profile_id", effectiveNurseId);
            }
          }
        } catch (npErr) {
          console.warn("[NurseAPI] Notice updating nurse_profiles stats:", npErr);
        }

        // Increment doctor stats in doctor_profiles if effectiveDoctorId exists
        try {
          if (effectiveDoctorId) {
            const { data: currentDp } = await supabase
              .from("doctor_profiles")
              .select("complete_cases_count, emergency_referrals_count")
              .eq("profile_id", effectiveDoctorId)
              .maybeSingle();

            if (currentDp) {
              const dpUpdates: Record<string, any> = {
                updated_at: new Date().toISOString(),
              };
              if (normalizedStatus === "Completed") {
                dpUpdates.complete_cases_count = (currentDp.complete_cases_count || 0) + 1;
              } else if (normalizedStatus === "Referred") {
                dpUpdates.emergency_referrals_count = (currentDp.emergency_referrals_count || 0) + 1;
              }
              await supabase
                .from("doctor_profiles")
                .update(dpUpdates)
                .eq("profile_id", effectiveDoctorId);
            }
          }
        } catch (dpErr) {
          console.warn("[NurseAPI] Notice updating doctor_profiles stats:", dpErr);
        }

        return true;
      }
    } catch (err) {
      console.error("[NurseAPI] Supabase direct action submit error:", err);
    }
  }

  return false;
}

/**
 * Submit patient answers to nurse follow-up questions (reverted_questions)
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
        const existing: any[] = ticket.reverted_questions || [];
        const ansMap = new Map(answers.map((a) => [a.id, a.answer]));
        const updated = existing.map((q) => {
          if (ansMap.has(q.id)) {
            return { ...q, answer: ansMap.get(q.id), answered_at: new Date().toISOString() };
          }
          return q;
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

export interface PatientSearchResult {
  id: string;
  source: "new_patient" | "profile";
  uhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  location: string;
  language: string;
  consent: string;
  registered_at?: string | null;
}

/**
 * Live search for existing patients across new_patient registry and profiles
 */
export async function searchPatientsLive(query: string): Promise<PatientSearchResult[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];

  // 1. Try FastAPI endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/search-patient?query=${encodeURIComponent(q)}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.patients)) {
        return data.patients;
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] Backend patient search failed, attempting Supabase direct...", err);
  }

  // 2. Direct Supabase fallback
  if (supabase) {
    try {
      const results: PatientSearchResult[] = [];
      const seen = new Set<string>();

      const digits = q.replace(/\D/g, "");
      const dClean = digits.length >= 10 ? digits.slice(-10) : digits;

      const phoneTerms: string[] = [`phone.ilike.%${q}%`];
      if (dClean) {
        phoneTerms.push(`phone.ilike.%${dClean}%`);
        if (dClean.length === 10) {
          phoneTerms.push(`phone.ilike.%${dClean.slice(0, 5)} ${dClean.slice(5)}%`);
          phoneTerms.push(`phone.ilike.%+91 ${dClean.slice(0, 5)} ${dClean.slice(5)}%`);
          phoneTerms.push(`phone.ilike.%+91 ${dClean}%`);
          phoneTerms.push(`phone.ilike.%+91${dClean}%`);
        }
      }
      const newPatientOr = [`uhid.ilike.%${q}%`, `full_name.ilike.%${q}%`, ...phoneTerms].join(",");
      const profileOr = [`user_id.ilike.%${q}%`, `full_name.ilike.%${q}%`, ...phoneTerms].join(",");

      // Search new_patient table
      const { data: newPatients } = await supabase
        .from("new_patient")
        .select("id, uhid, full_name, age, gender, phone, location, preferred_language, consent_status, created_at")
        .or(newPatientOr)
        .limit(10);

      (newPatients || []).forEach((np: any) => {
        const key = np.uhid || np.id;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            id: np.id,
            source: "new_patient",
            uhid: np.uhid,
            name: np.full_name,
            age: np.age || 0,
            gender: np.gender || "Other",
            phone: np.phone || "",
            location: np.location || "Nayagarh, Odisha",
            language: np.preferred_language || "Odia",
            consent: np.consent_status || "Given",
            registered_at: np.created_at,
          });
        }
      });

      // Search profiles table (role=patient)
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, age, gender, phone, block, district, state")
        .eq("role", "patient")
        .or(profileOr)
        .limit(10);


      (profs || []).forEach((p: any) => {
        const key = p.user_id || p.id;
        if (!seen.has(key)) {
          seen.add(key);
          const loc = [p.block, p.district, p.state].filter(Boolean).join(", ");
          results.push({
            id: p.id,
            source: "profile",
            uhid: p.user_id || `PAT-${p.id.slice(0, 6)}`,
            name: p.full_name,
            age: p.age || 0,
            gender: p.gender || "Other",
            phone: p.phone || "",
            location: loc || "Nayagarh, Odisha",
            language: "Odia",
            consent: "Given",
            registered_at: null,
          });
        }
      });

      return results;
    } catch (err) {
      console.error("[NurseAPI] Direct Supabase search error:", err);
    }
  }

  return [];
}

/**
 * Save newly created intake case to database
 * New patients are saved to `new_patient` table (NEVER to `profiles` table)
 */
export async function submitLiveNurseIntake(newCase: CaseDetails): Promise<boolean> {
  const priorityVal = newCase.urgency?.toLowerCase().includes("red") ? "Red" : newCase.urgency?.toLowerCase().includes("yellow") ? "Yellow" : "Green";

  const symptomsData = {
    chief_complaint: newCase.chiefComplaint,
    symptoms: newCase.aiInfo?.symptoms || [],
    duration: newCase.aiInfo?.duration || "Recent",
    severity: newCase.aiInfo?.severity || "Moderate",
    associated_symptoms: newCase.aiInfo?.associated || "None",
    red_flags: newCase.aiInfo?.redFlags || "None detected",
    vitals: {},
    missing_details: newCase.missingDetails || [],
    patient_intake_snapshot: {
      name: newCase.name,
      age: newCase.age,
      gender: newCase.gender,
      phone: newCase.phone,
      uhid: newCase.patientId,
    }
  };

  const cleanCase = newCase.id.replace('#', '');
  const reportText = `NURSE INTAKE CLINICAL ASSESSMENT\nCase: ${newCase.id}\nPatient: ${newCase.name} (${newCase.patientId})\nChief Complaint: ${newCase.chiefComplaint}\nPriority: ${priorityVal}`;
  const reportUrl = `https://ubghzwltjapmwtdrlayr.supabase.co/storage/v1/object/public/medical-reports/symptom-reports/${cleanCase}_Report.pdf`;

  const isExisting = newCase.intakeMode === "existing" || Boolean(newCase.existingPatientId);

  // 1. Try FastAPI endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/nurse-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_number: newCase.id,
        patient_uhid: newCase.patientId,
        patient_name: newCase.name,
        patient_age: newCase.age,
        patient_gender: newCase.gender,
        phone: newCase.phone,
        location: newCase.location,
        preferred_language: newCase.language,
        consent_status: newCase.consent,
        intake_mode: isExisting ? "existing" : "new",
        existing_patient_id: newCase.existingPatientId,
        existing_patient_source: newCase.existingPatientSource,
        chief_complaint: newCase.chiefComplaint,
        symptom_duration: newCase.aiInfo?.duration,
        severity: newCase.aiInfo?.severity,
        associated_symptoms: newCase.aiInfo?.associated,
        red_flags: newCase.aiInfo?.redFlags,
        symptoms: newCase.aiInfo?.symptoms,
        vitals: {},
        missing_details: newCase.missingDetails,
        quick_notes: newCase.quickNotes,
        urgency: priorityVal,
        facility_name: newCase.facility,
        facility_location: newCase.facilityLocation,
        submitted_via: "Nurse Intake Desk",
      }),
    });
    if (res.ok) return true;
  } catch (err) {
    console.warn("[NurseAPI] Backend intake create failed, attempting direct Supabase...", err);
  }

  // 2. Direct Supabase fallback
  if (supabase) {
    try {
      let linkedPatientId = null;
      let linkedNewPatientId = null;

      if (isExisting && newCase.existingPatientId) {
        if (newCase.existingPatientSource === "new_patient") {
          linkedNewPatientId = newCase.existingPatientId;
        } else {
          linkedPatientId = newCase.existingPatientId;
        }
      } else {
        // STRICT REQUIREMENT: Insert into new_patient table, NEVER in profiles table
        const { data: npData, error: npErr } = await supabase
          .from("new_patient")
          .insert({
            uhid: newCase.patientId,
            full_name: newCase.name || "New Patient",
            age: newCase.age || 30,
            gender: newCase.gender || "Other",
            phone: newCase.phone || "",
            location: newCase.location || "Nayagarh, Odisha",
            preferred_language: newCase.language || "Odia",
            consent_status: newCase.consent || "Given",
            intake_notes: newCase.quickNotes || "",
            metadata: {
              facility_name: newCase.facility,
              facility_location: newCase.facilityLocation,
            }
          })
          .select("id")
          .single();

        if (npErr) {
          console.warn("[NurseAPI] Could not insert into new_patient:", npErr);
        } else if (npData?.id) {
          linkedNewPatientId = npData.id;
        }
      }

      const { error } = await supabase.from("triage_tickets").insert({
        case_number: newCase.id,
        patient_id: linkedPatientId,
        new_patient_id: linkedNewPatientId,
        consultation_mode: newCase.consultationMode || "offline",
        preferred_language: newCase.language || "Odia",
        consent_status: newCase.consent || "Given",
        symptoms_data: symptomsData,
        discharge_report_text: reportText,
        discharge_report_url: reportUrl,
        priority: priorityVal,
        submitted_via: "Nurse Intake Desk",
        status: "Under Review",
      });
      if (!error) return true;
    } catch (err) {
      console.error("[NurseAPI] Direct Supabase intake insert error:", err);
    }
  }

  return false;
}


/**
 * Fetch staff roster live
 */
export async function fetchLiveStaffRoster(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/staff-roster`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.roster) && data.roster.length > 0) {
        return data.roster;
      }
    }
  } catch (e) {
    console.warn("[NurseAPI] Failed to fetch roster from API, checking Supabase...", e);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("phc_staff_roster")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && data.length > 0) return data;
    } catch (e) {
      console.warn("[NurseAPI] Failed Supabase roster fetch:", e);
    }
  }

  return [];
}

/**
 * Update staff roster availability status live
 */
export async function updateLiveStaffStatus(staffId: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/staff-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staff_id: staffId, status }),
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn("[NurseAPI] API staff update failed, trying Supabase...", e);
  }

  if (supabase) {
    try {
      const { error } = await supabase
        .from("phc_staff_roster")
        .update({ status, last_status_change: new Date().toISOString() })
        .eq("id", staffId);
      if (!error) return true;
    } catch (e) {
      console.error("[NurseAPI] Supabase staff status update error:", e);
    }
  }

  return false;
}

/**
 * Fetch PHC facility bed & oxygen stats live
 */
export async function fetchLiveFacilityStatus(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/triage/facility-status`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.facility) return data.facility;
    }
  } catch (e) {
    // fallback
  }

  if (supabase) {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("role", "facility").limit(1).maybeSingle();
      if (data) return { ...data, facility_name: data.full_name };
    } catch (e) {
      // fallback
    }
  }

  return null;
}

/**
 * Fetch live nurse profile and credentials from Supabase / PostgreSQL database
 */
export async function fetchLiveNurseProfile(profileId?: string): Promise<{
  profile: any;
  nurseProfile: any;
  stats: {
    casesTriaged: number;
    doctorHandoffs: number;
    emergencyReferrals: number;
    resolvedByMe: number;
  };
} | null> {
  if (!supabase) return null;

  try {
    let pQuery = supabase.from("profiles").select("*");
    if (profileId) {
      pQuery = pQuery.eq("id", profileId);
    } else {
      pQuery = pQuery.eq("role", "nurse").limit(1);
    }
    const { data: pData } = await pQuery.maybeSingle();

    const targetProfileId = profileId || pData?.id;
    let npData: any = null;
    if (targetProfileId) {
      const { data: nRes } = await supabase
        .from("nurse_profiles")
        .select("*")
        .eq("profile_id", targetProfileId)
        .maybeSingle();
      npData = nRes;
    }

    // Calculate real live stats from database
    let casesTriaged = 0;
    let doctorHandoffs = 0;
    let emergencyReferrals = 0;
    let resolvedByMe = 0;

    try {
      const { data: tickets } = await supabase
        .from("triage_tickets")
        .select("id, status, priority, urgency");

      if (tickets && tickets.length > 0) {
        casesTriaged = tickets.length;
        doctorHandoffs = tickets.filter(
          (t) => t.status === "Scheduled" || (t.status && t.status.toLowerCase().includes("doctor"))
        ).length;
        emergencyReferrals = tickets.filter(
          (t) =>
            t.status === "Referred" ||
            t.priority === "Red" ||
            (t.urgency && (t.urgency.toLowerCase().includes("red") || t.urgency.toLowerCase().includes("immediate")))
        ).length;
        resolvedByMe = tickets.filter(
          (t) =>
            t.status === "Completed" ||
            t.status === "Verified" ||
            (t.status && t.status.toLowerCase().includes("verified"))
        ).length;
      }

      if (npData) {
        if (npData.cases_triaged_count) casesTriaged = Math.max(casesTriaged, npData.cases_triaged_count);
        if (npData.doctor_handoffs_count) doctorHandoffs = Math.max(doctorHandoffs, npData.doctor_handoffs_count);
        if (npData.emergency_referrals_count) emergencyReferrals = Math.max(emergencyReferrals, npData.emergency_referrals_count);
        if (npData.resolved_by_me_count) resolvedByMe = Math.max(resolvedByMe, npData.resolved_by_me_count);
      }
    } catch (cntErr) {
      console.warn("Notice calculating live counts:", cntErr);
    }

    return {
      profile: pData || null,
      nurseProfile: npData || null,
      stats: {
        casesTriaged,
        doctorHandoffs,
        emergencyReferrals,
        resolvedByMe,
      },
    };
  } catch (err) {
    console.error("[NurseAPI] Error fetching live nurse profile:", err);
    return null;
  }
}

/**
 * Persist nurse profile and credentials directly to Supabase
 */
export async function updateLiveNurseProfile(
  profileId: string,
  profileUpdates: {
    fullName?: string;
    phone?: string;
    gender?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    age?: number | string;
    facilityName?: string;
    district?: string;
  },
  nurseUpdates: {
    designation?: string;
    stateCouncilReg?: string;
    hprId?: string;
    shiftSchedule?: string;
    facilityName?: string;
  }
): Promise<boolean> {
  if (!supabase || !profileId) return false;

  try {
    // 1. Update public.profiles table
    const pUpdatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (profileUpdates.fullName) pUpdatePayload.full_name = profileUpdates.fullName;
    if (profileUpdates.phone) pUpdatePayload.phone = profileUpdates.phone;
    if (profileUpdates.gender) pUpdatePayload.gender = profileUpdates.gender;
    if (profileUpdates.bloodGroup) pUpdatePayload.blood_group = profileUpdates.bloodGroup;
    if (profileUpdates.dateOfBirth) pUpdatePayload.date_of_birth = profileUpdates.dateOfBirth;
    if (profileUpdates.age) pUpdatePayload.age = Number(profileUpdates.age);
    if (profileUpdates.facilityName) pUpdatePayload.facility_name = profileUpdates.facilityName;
    if (profileUpdates.district) pUpdatePayload.district = profileUpdates.district;

    await supabase.from("profiles").update(pUpdatePayload).eq("id", profileId);

    // 2. Upsert into public.nurse_profiles table
    const npUpsertPayload: any = {
      profile_id: profileId,
      designation: nurseUpdates.designation || "Senior Staff Nurse & Triage Specialist",
      state_council_reg: nurseUpdates.stateCouncilReg || "ONRC-2018-9941",
      hpr_id: nurseUpdates.hprId || "",
      shift_schedule: nurseUpdates.shiftSchedule || "Morning Roster (08:00 AM - 04:00 PM)",
      facility_name: nurseUpdates.facilityName || profileUpdates.facilityName || "Community Health Centre (CHC) Khandapada",
      updated_at: new Date().toISOString(),
    };

    const { error: npErr } = await supabase
      .from("nurse_profiles")
      .upsert(npUpsertPayload, { onConflict: "profile_id" });

    if (npErr) {
      console.warn("[NurseAPI] Nurse profile upsert warning:", npErr.message);
    }

    return true;
  } catch (err) {
    console.error("[NurseAPI] Error saving nurse profile to database:", err);
    return false;
  }
}

/**
 * Fetch live activity and review audit logs from database (FastAPI or Supabase)
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

