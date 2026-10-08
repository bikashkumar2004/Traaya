import { supabase } from "@/lib/supabase";
import { CaseDetails } from "@/components/nurse/CaseReviewWorkspace";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
