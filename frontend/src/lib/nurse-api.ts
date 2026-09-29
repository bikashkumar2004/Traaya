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
  const reportsList = (linkedReports || []).map((r: any) => r.file_name || "medical_report.pdf");
  if ((t.uploaded_report_url || t.report_url) && !reportsList.length) {
    reportsList.push(t.uploaded_report_data?.file_name || "Uploaded_Diagnostic_Report.pdf");
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
    chiefComplaint: sdata.chief_complaint || t.chief_complaint || (symptoms.length ? symptoms.join(", ") : "Clinical evaluation"),
    aiInfo: {
      symptoms,
      duration: sdata.duration || "3 days",
      severity: sdata.severity || "Moderate",
      associated: sdata.associated || "None",
      redFlags: sdata.red_flags || "None detected yet",
    },
    missingDetails,
    reports: reportsList.length > 0 ? reportsList : (t.reports || []),
    aiReportAnalysis: ["Clinical symptom intake report generated & stored in storage"],
    aiSuggestion,
    facility: "CHC Khandapada",
    facilityLocation: "Nayagarh, Odisha",
    consultationMode: t.consultation_mode || "online",
    scheduleTime: t.schedule_time || undefined,
    revertedQuestions: t.reverted_questions || [],
    referalFacility: t.referal_facility || undefined,
    referalFacilityId: t.referal_facility_id || undefined,
    transferReason: t.transfer_reason || undefined,
    newPatientId: t.new_patient_id || undefined,
  };
}

/**
 * Fetch all triage tickets live from FastAPI backend or Supabase
 */
export async function fetchLiveNurseQueue(): Promise<{ cases: CaseDetails[]; source: "api" | "supabase" | "fallback" }> {
  // 1. Try FastAPI backend endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/nurse-queue`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.cases) && data.cases.length > 0) {
        return { cases: data.cases, source: "api" };
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] FastAPI backend unreachable, querying Supabase directly...", err);
  }

  // 2. Fallback to direct Supabase client
  if (supabase) {
    try {
      const { data: tickets, error: tErr } = await supabase
        .from("triage_tickets")
        .select("*, profiles:patient_id(full_name, age, gender, phone, user_id), new_patient:new_patient_id(*)")
        .order("created_at", { ascending: false });


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
        return { cases: mappedCases, source: "supabase" };
      }
    } catch (err) {
      console.warn("[NurseAPI] Direct Supabase query error:", err);
    }
  }

  return { cases: [], source: "fallback" };
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
  referral_destination?: string;
  referal_facility?: string;
  referal_facility_id?: string;
  transfer_reason?: string;
  nurse_id?: string;
  nurse_name?: string;
  schedule_time?: string;
  reverted_questions?: { id: string; question: string; answer?: string }[];
}): Promise<boolean> {
  const statusMap: Record<string, string> = {
    "verified": "Completed",
    "mark as verified": "Completed",
    "resolve": "Completed",
    "resolved": "Completed",
    "completed": "Completed",
    "schedule & forward to doctor": "Scheduled",
    "forward to doctor": "Scheduled",
    "forwarded to doctor": "Scheduled",
    "scheduled": "Scheduled",
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
  const normalizedStatus = statusMap[payload.target_status.toLowerCase()] || "Under Review";

  // 1. Try FastAPI endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/nurse-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, target_status: normalizedStatus }),
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
        if (normalizedStatus === "Completed" || payload.action_type === "Resolve") {
          updatePayload.resolve_notes = payload.review_note;
        }
        if (payload.schedule_time) {
          updatePayload.schedule_time = payload.schedule_time;
        }
        if (payload.referal_facility || payload.referral_destination) {
          updatePayload.referal_facility = payload.referal_facility || payload.referral_destination;
        }
        if (payload.referal_facility_id) {
          updatePayload.referal_facility_id = payload.referal_facility_id;
        }
        if (payload.transfer_reason) {
          updatePayload.transfer_reason = payload.transfer_reason;
        } else if (normalizedStatus === "Referred" && payload.review_note) {
          updatePayload.transfer_reason = payload.review_note;
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

        await supabase
          .from("triage_tickets")
          .update(updatePayload)
          .eq("id", tData.id);

        await supabase.from("nurse_review_actions").insert({
          ticket_id: tData.id,
          case_number: payload.case_number,
          nurse_id: payload.nurse_id || null,
          nurse_name: payload.nurse_name || "Nurse Staff",
          action_type: payload.action_type,
          review_note: payload.review_note,
          template_used: payload.action_type,
          assigned_doctor_name: payload.assigned_doctor_name,
          referral_destination: payload.referral_destination,
          previous_status: tData.status,
          resulting_status: normalizedStatus,
        });

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
      const { data } = await supabase.from("phc_facilities").select("*").limit(1).maybeSingle();
      if (data) return data;
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

      const { data: actions } = await supabase
        .from("nurse_review_actions")
        .select("action_type, resulting_status");

      if (actions && actions.length > 0) {
        const handoffs = actions.filter((a) =>
          a.action_type?.toLowerCase().includes("doctor") || a.resulting_status === "Scheduled"
        ).length;
        const referrals = actions.filter((a) =>
          a.action_type?.toLowerCase().includes("refer") || a.resulting_status === "Referred"
        ).length;
        const resolved = actions.filter((a) =>
          a.resulting_status === "Completed" || a.action_type?.toLowerCase().includes("verified")
        ).length;

        doctorHandoffs = Math.max(doctorHandoffs, handoffs);
        emergencyReferrals = Math.max(emergencyReferrals, referrals);
        resolvedByMe = Math.max(resolvedByMe, resolved);
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
export async function fetchLiveNurseActivityLog(): Promise<any[]> {
  // 1. Try FastAPI backend endpoint
  try {
    const res = await fetch(`${API_BASE}/api/triage/nurse-activity`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.records) && data.records.length > 0) {
        return data.records;
      }
    }
  } catch (err) {
    console.warn("[NurseAPI] FastAPI nurse-activity unreachable, trying direct Supabase...", err);
  }

  // 2. Fallback to direct Supabase
  if (!supabase) return [];

  try {
    const { data: actions, error } = await supabase
      .from("nurse_review_actions")
      .select("*, triage_tickets(*, profiles:patient_id(*))")
      .order("created_at", { ascending: false });

    if (!error && actions && actions.length > 0) {
      return actions;
    }
  } catch (e) {
    console.warn("Failed fetching live nurse actions from Supabase:", e);
  }

  return [];
}

