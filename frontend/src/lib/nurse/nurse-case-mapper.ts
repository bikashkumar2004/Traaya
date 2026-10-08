import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

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
