import { supabase } from "@/lib/supabase";
import { buildAutoResolveNotes } from "@/lib/doctor/doctor-resolve-notes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
        .select("id, status, symptoms_data, chief_complaint")
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
          if (payload.review_note && payload.review_note.includes("stable hemodynamics")) {
            updatePayload.resolve_notes = payload.review_note;
          } else {
            updatePayload.resolve_notes = buildAutoResolveNotes({
              chiefComplaint: tData.chief_complaint,
              symptomsData: tData.symptoms_data,
            }, payload.review_note);
          }
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

export async function updateLiveTriageAssessment(
  caseNumber: string,
  priority: string,
  summary: string
): Promise<boolean> {
  const cleanId = String(caseNumber).replace(/^#?LS/i, "").trim();

  if (supabase) {
    try {
      const { data: tickets } = await supabase
        .from("triage_tickets")
        .select("id, symptoms_data")
        .or(`case_number.eq.${caseNumber},case_number.eq.${cleanId},id.eq.${cleanId}`);

      const ticket = tickets && tickets[0];
      if (ticket) {
        const existingData =
          typeof ticket.symptoms_data === "object" && ticket.symptoms_data !== null
            ? ticket.symptoms_data
            : {};

        const updatedData = {
          ...existingData,
          summary: summary,
        };

        await supabase
          .from("triage_tickets")
          .update({
            priority: priority,
            urgency: priority,
            symptoms_data: updatedData,
          })
          .eq("id", ticket.id);

        return true;
      }
    } catch (err) {
      console.warn("[NurseAPI] Notice persisting assessment to Supabase:", err);
    }
  }

  try {
    await fetch(`${API_BASE}/api/nurse/triage/assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_number: caseNumber, priority, summary }),
    });
  } catch {
    // ignore
  }

  return true;
}
