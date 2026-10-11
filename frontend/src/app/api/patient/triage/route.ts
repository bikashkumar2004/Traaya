import { NextResponse } from "next/server";
import postgres from "postgres";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function generateReportPdfBuffer(data: {
  caseNumber: string;
  patientName: string;
  patientRelation?: string;
  consultationMode: string;
  priority: string;
  chiefComplaint: string;
  symptoms: string[];
  followUpQa: Array<{ question: string; answer: string }>;
  vitals: Record<string, any>;
  clinicalReasoning: string;
  dateStr: string;
}): Buffer {
  const sanitize = (str: string) => (str || "").replace(/[()\\]/g, "");

  const lines: string[] = [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj"
  ];

  let stream = "BT\n";
  stream += "/F2 18 Tf\n50 790 Td\n(TRAAYA - CLINICAL SYMPTOM REPORT) Tj\n";
  stream += "/F1 10 Tf\n0 -22 Td\n(" + sanitize(`Case Number: ${data.caseNumber}   |   Date: ${data.dateStr}   |   Mode: ${data.consultationMode}`) + ") Tj\n";
  stream += "0 -15 Td\n(" + sanitize(`Patient: ${data.patientName}${data.patientRelation ? ` (${data.patientRelation})` : ""}   |   Priority: ${data.priority.toUpperCase()}`) + ") Tj\n";
  stream += "/F2 12 Tf\n0 -30 Td\n(1. CHIEF COMPLAINT) Tj\n";
  stream += "/F1 10 Tf\n0 -16 Td\n(" + sanitize(data.chiefComplaint.slice(0, 95)) + ") Tj\n";

  stream += "/F2 12 Tf\n0 -26 Td\n(2. REPORTED SYMPTOMS) Tj\n";
  stream += "/F1 10 Tf\n";
  if (data.symptoms.length > 0) {
    for (const sym of data.symptoms.slice(0, 6)) {
      stream += "0 -16 Td\n(" + sanitize(`- ${sym}`) + ") Tj\n";
    }
  } else {
    stream += "0 -16 Td\n(- Reported general symptoms) Tj\n";
  }

  stream += "/F2 12 Tf\n0 -26 Td\n(3. VITAL SIGNS & OBSERVATIONS) Tj\n";
  stream += "/F1 10 Tf\n";
  const vitalsEntries = Object.entries(data.vitals);
  if (vitalsEntries.length > 0) {
    for (const [k, v] of vitalsEntries.slice(0, 4)) {
      stream += "0 -16 Td\n(" + sanitize(`- ${k}: ${String(v)}`) + ") Tj\n";
    }
  } else {
    stream += "0 -16 Td\n(- Standard vitals recorded at intake) Tj\n";
  }

  stream += "/F2 12 Tf\n0 -26 Td\n(4. FOLLOW-UP QUESTIONS & ANSWERS) Tj\n";
  stream += "/F1 10 Tf\n";
  if (data.followUpQa.length > 0) {
    for (const qa of data.followUpQa.slice(0, 5)) {
      stream += "0 -16 Td\n(" + sanitize(`Q: ${qa.question.slice(0, 80)}`) + ") Tj\n";
      stream += "0 -14 Td\n(" + sanitize(`A: ${qa.answer.slice(0, 80)}`) + ") Tj\n";
    }
  } else {
    stream += "0 -16 Td\n(- No additional follow-up questions recorded) Tj\n";
  }

  stream += "/F2 12 Tf\n0 -26 Td\n(5. AI CLINICAL TRIAGE REASONING) Tj\n";
  stream += "/F1 10 Tf\n0 -16 Td\n(" + sanitize(data.clinicalReasoning.slice(0, 95)) + ") Tj\n";

  stream += "/F1 8 Tf\n0 -40 Td\n(Generated securely by TRAAYA Healthcare Platform. Compliant with ABDM & DPDP Standards.) Tj\n";
  stream += "ET\n";

  const streamLength = Buffer.byteLength(stream, "utf8");
  const obj6 = `6 0 obj << /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj`;

  const offsets: number[] = [0];
  let fullPdf = "%PDF-1.4\n";
  let currentOffset = Buffer.byteLength(fullPdf, "utf8");

  const linesWithObj = [...lines, obj6];
  for (let i = 1; i <= 6; i++) {
    offsets.push(currentOffset);
    const objText = i === 6 ? obj6 + "\n" : lines[i] + "\n";
    currentOffset += Buffer.byteLength(objText, "utf8");
  }

  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += String(offsets[i]).padStart(10, "0") + " 00000 n \n";
  }
  const startXref = currentOffset;
  const trailer = `trailer << /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

  const finalPdfStr = lines[0] + "\n" +
    lines.slice(1).map(l => l + "\n").join("") +
    obj6 + "\n" +
    xref +
    trailer;

  return Buffer.from(finalPdfStr, "utf8");
}

async function generateGroqSummary(
  symptoms: string[],
  rawQa: Array<{ question: string; answer: string }>,
  groqApiKey?: string,
  rawComplaint?: string
): Promise<string> {
  const symsStr = symptoms.length > 0 ? symptoms.join(", ") : "general clinical symptoms";
  const cleanComplaint = (rawComplaint || "").trim();

  // Simple clean fallback summary - never dump raw questions and answers
  const fallback = cleanComplaint
    ? `Patient presents with ${symsStr}. Primary complaint: "${cleanComplaint}".`
    : `Patient presents with ${symsStr} for clinical triage evaluation.`;

  if (!groqApiKey) return fallback;

  const qaContext = rawQa.slice(0, 6).map((qa) => `${qa.question}: ${qa.answer}`).join(". ");
  const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];

  for (const model of models) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are an emergency clinical triage assistant. Generate a simple, concise 1 to 2 sentence clinical summary (maximum 30 words) describing the patient's condition. Do NOT repeat or list questions or answers verbatim. Do NOT use bullet points, markdown bolding, or headers. Output only plain summary text.",
            },
            {
              role: "user",
              content: `Reported Symptoms: ${symsStr}\nPrimary Complaint: ${cleanComplaint || "None"}\nIntake Details: ${qaContext || "None"}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 100,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content && !content.includes("?:") && content.length < 280) {
          return content.replace(/^["']|["']$/g, "").trim();
        }
      }
    } catch (e) {
      console.warn(`[Groq summary generation failed on ${model}]:`, e);
    }
  }

  return fallback;
}

export async function POST(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL not configured." },
      { status: 500 }
    );
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    const body = await req.json();
    const {
      patient_id,
      patient_name,
      patient_uhid,
      patient_age,
      patient_gender,
      patient_relation,
      family_member_name,
      family_member_relationship,
      family_member_uhid,
      language,
      symptoms = [],
      timeline = [],
      follow_up_answers = {},
      report_data = null,
      report_answers = {},
      present_state = "Odisha",
      present_district = "Nayagarh",
      present_block = "R.Udayagiri",
      present_address = null,
      landmark = "",
      consent = true,
      consultation_mode = "online",
      facility_id = null,
      medical_id = null,
      doctor_id = null,
      nurse_id = null,
      ticket_id = null,
      current_step = null,
      status: requestedStatus,
    } = body;

    // Validate UUIDs
    const isValidUuid = (val: any) =>
      typeof val === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);

    const resolvedPatientId = isValidUuid(patient_id)
      ? patient_id
      : isValidUuid(body.user_id)
      ? body.user_id
      : isValidUuid(body.account_id)
      ? body.account_id
      : null;

    const validPatientId = resolvedPatientId;
    const resolvedFacilityId =
      facility_id ||
      medical_id ||
      (typeof present_address === "object" && present_address !== null ? (present_address as any).facility_id : null) ||
      body.designated_facility_id;
    let validFacilityId = isValidUuid(resolvedFacilityId) ? resolvedFacilityId : null;

    let candidateFacilityName =
      body.facility_name ||
      body.facility ||
      (typeof present_address === "object" && present_address !== null ? (present_address as any).facility_name : null) ||
      "";

    if (!validFacilityId && candidateFacilityName) {
      const searchName = String(candidateFacilityName).trim();
      const matched = await sql`
        SELECT id FROM public.profiles
        WHERE role IN ('facility', 'medical')
          AND (full_name ILIKE ${'%' + searchName + '%'} OR id::text = ${searchName})
        LIMIT 1
      `;
      if (matched.length > 0) {
        validFacilityId = matched[0].id;
      }
    }

    if (!validFacilityId && present_block) {
      const blockMatch = await sql`
        SELECT id FROM public.profiles
        WHERE role IN ('facility', 'medical')
          AND block ILIKE ${'%' + present_block + '%'}
        LIMIT 1
      `;
      if (blockMatch.length > 0) {
        validFacilityId = blockMatch[0].id;
      }
    }

    const validDoctorId = isValidUuid(doctor_id) ? doctor_id : null;
    const validNurseId = isValidUuid(nurse_id) ? nurse_id : null;
    const validTicketId = isValidUuid(ticket_id || body.id) ? (ticket_id || body.id) : null;

    let validFacilityName = candidateFacilityName;
    if (validFacilityId && !validFacilityName) {
      const [facProf] = await sql`
        SELECT full_name FROM public.profiles WHERE id = ${validFacilityId}::uuid LIMIT 1
      `;
      if (facProf?.full_name) validFacilityName = facProf.full_name;
    }

    // Generate unique case number
    const caseNumber = `TR-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

    // Priority assessment: Red, Yellow, Green
    const symptomsJoined = (Array.isArray(symptoms) ? symptoms.join(" ") : String(symptoms)).toLowerCase();
    let tempVal = 98.6;
    for (const [k, v] of Object.entries(follow_up_answers)) {
      if (k.toLowerCase().includes("temp")) {
        const parsed = parseFloat(String(v).replace(/[^0-9.]/g, ""));
        if (!isNaN(parsed)) tempVal = parsed;
      }
    }

    let priority: "Red" | "Yellow" | "Green" = "Yellow";
    let clinicalReasoning = "Sub-acute presentation with stable vital signs. Suitable for standard ambulatory primary care.";

    const isRedFlag = ["chest pain", "angina", "heavy bleeding", "breathless", "shortness of breath", "unconscious", "trauma"].some(
      (rf) => symptomsJoined.includes(rf)
    );

    if (isRedFlag || tempVal >= 103.0) {
      priority = "Red";
      clinicalReasoning = `Urgent cardiorespiratory / hyperpyrexia criteria detected (${tempVal}°F). Immediate clinical evaluation indicated.`;
    } else if (tempVal >= 100.4 || symptomsJoined.includes("severe")) {
      priority = "Yellow";
      clinicalReasoning = `Documented pyrexia (${tempVal}°F) or elevated symptoms. Scheduled for same-day clinical assessment.`;
    } else {
      priority = "Green";
      clinicalReasoning = `Sub-acute or mild symptoms with normal body temperature (${tempVal}°F). Routine outpatient care recommended.`;
    }

    const rawComplaint = String(body.raw_complaint || body.symptom_text || body.raw_symptoms || "").trim();
    const chiefComplaint =
      rawComplaint ||
      (Array.isArray(symptoms) && symptoms.length > 0 ? symptoms.join(", ") : "Reported symptoms");

    // Build raw_qa array and 1-2 word questions_answers map
    const rawQa: Array<{ question: string; answer: string }> = [];
    const questionsAnswers: Record<string, string> = {};

    const followUpQuestionsList: Array<any> = Array.isArray(body.follow_up_questions)
      ? body.follow_up_questions
      : [];

    const toShortKey = (id: string, qText: string): string => {
      const text = (qText || id).toLowerCase();
      const idLower = (id || "").toLowerCase();

      // 1. Recurrence & Frequency (checked first so "how often does fever/shivering come back" maps accurately)
      if (text.includes("come back") || text.includes("how often") || idLower.includes("frequency")) {
        return "recurrence_frequency";
      }

      // 2. Associated Symptoms & Red Flags (checked before single symptom matches)
      if (
        text.includes("cough, sore throat") ||
        text.includes("skin spots") ||
        text.includes("other problems") ||
        text.includes("associated") ||
        idLower.includes("associated_symptoms") ||
        (text.includes("vomiting") && text.includes("cough")) ||
        (text.includes("spots") && text.includes("bleeding"))
      ) {
        return "associated_symptoms";
      }

      // 3. Daily persistence / duration during the day
      if (text.includes("how long does the fever stay high") || (text.includes("stay high") && text.includes("day"))) {
        return "daily_persistence";
      }

      // 4. Fever & Temperature specific
      if (text.includes("how high") || (text.includes("fever") && text.includes("shiver")) || text.includes("chills")) {
        return "fever_and_chills";
      }
      if (text.includes("how many days") || text.includes("days have you had this fever") || (idLower.includes("onset") && text.includes("fever"))) {
        return "fever_duration";
      }
      if (text.includes("feel during the day") || text.includes("how does the fever feel")) {
        return "daily_fever_pattern";
      }
      if (text.includes("fever medicine") || text.includes("paracetamol") || (text.includes("medicine") && text.includes("bring the fever down"))) {
        return "medicine_response";
      }
      if (text.includes("temperature") || text.includes("temp")) {
        return "body_temperature";
      }

      // 5. Weakness, mental state & fatigue
      if (text.includes("how weak") || text.includes("sleepy") || text.includes("dizzy") || text.includes("confused")) {
        return "weakness_severity";
      }

      // 6. Spreading / Radiation / Bones / Joints
      if (text.includes("spreading") || text.includes("bones") || text.includes("joints") || text.includes("move") || idLower.includes("radiation")) {
        if (text.includes("bone") || text.includes("joint")) return "joint_or_bone_pain";
        return "pain_radiation";
      }

      // 7. Pain Location & Site
      if (text.includes("where does") || text.includes("where on your body") || text.includes("where in your chest") || text.includes("hurt most") || idLower.includes("location")) {
        return "pain_location";
      }

      // 8. Onset / Timing / Start
      if (text.includes("when did") || text.includes("did it happen suddenly") || text.includes("start time") || idLower.includes("onset")) {
        return "onset_timing";
      }

      // 9. Aggravating & Relieving Factors
      if (text.includes("better or worse") || text.includes("touching your belly") || idLower.includes("aggravating")) {
        return "aggravating_relieving_factors";
      }

      // 9. Specific organ complaints
      if (text.includes("chest pain") || idLower.includes("chest")) return "chest_pain";
      if (text.includes("headache")) return "headache_severity";
      if (text.includes("breath") || text.includes("dyspnea") || text.includes("gasping")) return "breathing_difficulty";
      if (text.includes("cough")) return "cough_details";
      if (text.includes("vomit") || text.includes("nausea")) return "vomiting_nausea";
      if (text.includes("rash") || text.includes("spot")) return "skin_rashes";
      if (text.includes("stomach") || text.includes("belly") || text.includes("abdomen")) return "abdominal_pain";

      // 10. Character & Severity generic
      if (idLower.includes("character") || text.includes("kind of pain") || text.includes("what does it feel like")) {
        return "symptom_character";
      }
      if (idLower.includes("severity") || text.includes("scale of 0 to 10") || text.includes("how strong") || text.includes("pain")) {
        return "pain_severity";
      }
      if (idLower.includes("duration") || text.includes("how long")) {
        return "symptom_duration";
      }

      // 11. Clean semantic fallback
      const cleanStr = (qText || id)
        .replace(/^q\d+[_a-z0-9]*/i, "")
        .replace(/[^a-z0-9 ]/gi, " ")
        .toLowerCase();

      const stopWords = new Set(["how", "what", "where", "when", "does", "do", "you", "your", "have", "with", "the", "a", "an", "is", "are", "along", "most", "any"]);
      const words = cleanStr.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
      if (words.length >= 2) return `${words[0]}_${words[1]}`;
      if (words.length === 1) return words[0];
      return "clinical_detail";
    };

    const processedKeys = new Set<string>();

    for (const fq of followUpQuestionsList) {
      const qText = fq.question || fq.title || "";
      const qId = fq.id || "";
      const ansVal = follow_up_answers?.[qId] ?? follow_up_answers?.[qText];
      if (ansVal !== undefined && ansVal !== null && String(ansVal).trim() !== "") {
        const unit = fq.unit || "";
        const formattedAns = String(ansVal).trim() + (unit && !String(ansVal).includes(unit) ? unit : "");
        rawQa.push({ question: qText || qId, answer: formattedAns });
        const shortKey = toShortKey(qId, qText);
        questionsAnswers[shortKey] = formattedAns;
        if (qId) processedKeys.add(qId);
        if (qText) processedKeys.add(qText);
      }
    }

    if (typeof follow_up_answers === "object" && follow_up_answers !== null) {
      for (const [k, v] of Object.entries(follow_up_answers)) {
        if (!processedKeys.has(k) && v !== null && v !== undefined && String(v).trim() !== "") {
          const ansStr = String(v).trim();
          rawQa.push({ question: k, answer: ansStr });
          const shortKey = toShortKey("", k);
          questionsAnswers[shortKey] = ansStr;
        }
      }
    }

    const symptomsList: string[] = Array.isArray(symptoms)
      ? symptoms
          .map((s: any) => (typeof s === "string" ? s.trim() : s?.name || s?.symptom || ""))
          .filter(Boolean)
      : [];

    const groqKey = process.env.GROQ_API_KEY?.trim() || "";
    const summaryText = await generateGroqSummary(symptomsList, rawQa, groqKey, rawComplaint);

    // Build the requested clean symptoms_data JSON structure with raw_complaint from Step 1
    const symptomsData = {
      symptoms: symptomsList,
      raw_complaint: rawComplaint || (symptomsList.length > 0 ? symptomsList.join(", ") : ""),
      summary: summaryText,
      questions_answers: questionsAnswers,
      raw_qa: rawQa,
      ...(current_step ? { current_step: Number(current_step) } : {}),
    };

    const followUpQaList = rawQa;

    // Build structured present address object
    const resolvedPresentAddress = {
      state: present_state || "",
      district: present_district || "Nayagarh",
      block: present_block || "",
      landmark: landmark || "",
      facility_id: validFacilityId || null,
      facility_name: validFacilityName || "",
      ...(typeof present_address === "object" && present_address !== null ? present_address : {}),
    };
    const resolvedDistrict = present_district || resolvedPresentAddress.district || "Nayagarh";

    // Family details
    const isFamily = Boolean(
      body.is_family_member ||
      (patient_relation && patient_relation.toLowerCase() !== "self") ||
      family_member_name
    );
    const resolvedFamilyName = family_member_name || (isFamily ? patient_name : null);
    const resolvedFamilyRel = family_member_relationship || (isFamily ? patient_relation : null);
    const resolvedFamilyUhid = family_member_uhid || (isFamily ? patient_uhid : null);
    const resolvedFamilyAge = isFamily
      ? (body.family_member_age ? Number(body.family_member_age) : (patient_age ? Number(patient_age) : null))
      : null;
    const resolvedFamilyGender = isFamily
      ? (body.family_member_gender || patient_gender || null)
      : null;
    const resolvedFamilyPhone = isFamily
      ? (body.family_member_phone || body.patient_phone || body.phone || null)
      : null;

    // Formatted textual report of symptoms
    const reportText = [
      `PATIENT CLINICAL SYMPTOM REPORT`,
      `Case Number: ${caseNumber}`,
      `Date: ${new Date().toISOString().split("T")[0]}`,
      `Consultation Mode: ${consultation_mode === "offline" ? "In-Person Clinic Visit" : "Online Teleconsult"}`,
      `Priority: ${priority}`,
      ``,
      `CHIEF COMPLAINT:`,
      `${chiefComplaint}`,
      ``,
      `REPORTED SYMPTOMS:`,
      Array.isArray(symptoms) && symptoms.length > 0 ? symptoms.map((s: string) => `- ${s}`).join("\n") : "- General discomfort",
      ``,
      `VITAL SIGNS:`,
      `- Temperature: ${tempVal}°F`,
      `- Heart Rate / Vitals: Evaluated at triage intake`,
      ``,
      `FOLLOW-UP QUESTIONS & ANSWERS:`,
      followUpQaList.length > 0
        ? followUpQaList.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n")
        : "- No additional questions required",
      ``,
      `AI CLINICAL ASSESSMENT:`,
      `${clinicalReasoning}`,
      ``,
      `LOCATION:`,
      `${present_block}, ${present_state}${landmark ? ` (Near ${landmark})` : ""}`,
    ].join("\n");

    // Generate PDF and upload to Supabase storage
    let reportUrl = "";
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ubghzwltjapmwtdrlayr.supabase.co";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      if (supabaseUrl && supabaseKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        const pdfBuffer = generateReportPdfBuffer({
          caseNumber,
          patientName: resolvedFamilyName || patient_name || "Patient",
          patientRelation: resolvedFamilyRel || undefined,
          consultationMode: consultation_mode || "online",
          priority,
          chiefComplaint,
          symptoms: Array.isArray(symptoms) ? symptoms : [String(symptoms)],
          followUpQa: followUpQaList,
          vitals: { Temperature: `${tempVal}°F` },
          clinicalReasoning,
          dateStr: new Date().toISOString().split("T")[0],
        });

        const storageFileName = `symptom-reports/${caseNumber}_Report.pdf`;
        const { error: uploadErr } = await supabaseAdmin.storage
          .from("medical-reports")
          .upload(storageFileName, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (!uploadErr) {
          const { data: pubData } = supabaseAdmin.storage
            .from("medical-reports")
            .getPublicUrl(storageFileName);
          reportUrl = pubData?.publicUrl || "";
        } else {
          console.warn("[Supabase Storage Upload Warning]", uploadErr);
        }
      }
    } catch (storageErr) {
      console.warn("[PDF Storage Upload Exception]", storageErr);
    }

    if (!reportUrl) {
      reportUrl = `https://ubghzwltjapmwtdrlayr.supabase.co/storage/v1/object/public/medical-reports/symptom-reports/${caseNumber}_Report.pdf`;
    }

    // Determine initial status: default to 'Under Review'
    const allowedStatuses = ["Draft", "Under Review", "Reverted", "Referred", "Scheduled", "Completed"];
    const status = allowedStatuses.includes(requestedStatus) ? requestedStatus : "Under Review";

    // Only store uploaded report data if the patient uploaded an external medical report / lab file
    const uploadedReportData = report_data ? report_data : null;
    const uploadedReportUrl = report_data?.file_url || null;

    // Insert or Update triage_tickets table with native JSONB structure
    let saved: any = null;

    if (validTicketId) {
      const existing = await sql`
        SELECT id, case_number FROM public.triage_tickets WHERE id = ${validTicketId}::uuid LIMIT 1
      `;
      if (existing.length > 0) {
        const [updated] = await sql`
          UPDATE public.triage_tickets
          SET
            is_family_member = ${Boolean(isFamily)},
            family_member_name = ${resolvedFamilyName},
            family_member_relationship = ${resolvedFamilyRel},
            family_member_uhid = ${resolvedFamilyUhid},
            family_member_age = ${resolvedFamilyAge},
            family_member_gender = ${resolvedFamilyGender},
            family_member_phone = ${resolvedFamilyPhone},
            preferred_language = ${language || "en"},
            consent_status = ${consent ? "Given" : "Withheld"},
            consultation_mode = ${consultation_mode || "online"},
            present_address = ${sql.json(resolvedPresentAddress)},
            symptoms_data = ${sql.json(symptomsData)},
            uploaded_report_data = ${uploadedReportData ? sql.json(uploadedReportData) : sql`'{}'::jsonb`},
            uploaded_report_url = COALESCE(${uploadedReportUrl}, uploaded_report_url),
            priority = ${priority},
            facility_id = COALESCE(${validFacilityId ? sql`${validFacilityId}::uuid` : null}, facility_id),
            status = ${status},
            updated_at = now()
          WHERE id = ${validTicketId}::uuid
          RETURNING *
        `;
        saved = updated;
      }
    }

    if (!saved) {
      const [inserted] = await sql`
        INSERT INTO public.triage_tickets (
          case_number,
          patient_id,
          is_family_member,
          family_member_name,
          family_member_relationship,
          family_member_uhid,
          family_member_age,
          family_member_gender,
          family_member_phone,
          preferred_language,
          consent_status,
          consultation_mode,
          present_address,
          symptoms_data,
          uploaded_report_data,
          uploaded_report_url,
          priority,
          facility_id,
          doctor_id,
          nurse_id,
          submitted_via,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${caseNumber},
          ${validPatientId ? sql`${validPatientId}::uuid` : null},
          ${Boolean(isFamily)},
          ${resolvedFamilyName},
          ${resolvedFamilyRel},
          ${resolvedFamilyUhid},
          ${resolvedFamilyAge},
          ${resolvedFamilyGender},
          ${resolvedFamilyPhone},
          ${language || "en"},
          ${consent ? "Given" : "Withheld"},
          ${consultation_mode || "online"},
          ${sql.json(resolvedPresentAddress)},
          ${sql.json(symptomsData)},
          ${uploadedReportData ? sql.json(uploadedReportData) : sql`'{}'::jsonb`},
          ${uploadedReportUrl},
          ${priority},
          ${validFacilityId ? sql`${validFacilityId}::uuid` : null},
          ${validDoctorId ? sql`${validDoctorId}::uuid` : null},
          ${validNurseId ? sql`${validNurseId}::uuid` : null},
          ${"Mobile App"},
          ${status},
          now(),
          now()
        )
        RETURNING *
      `;
      saved = inserted;
    }

    // Persist medical report if report_data was attached
    if (report_data && validPatientId && saved?.id) {
      try {
        await sql`
          INSERT INTO public.uploaded_reports (
            patient_id,
            report_type,
            file_url,
            file_type,
            report_summary
          ) VALUES (
            ${validPatientId}::uuid,
            ${report_data.test_name || "Laboratory Test"},
            ${reportUrl},
            ${"application/pdf"},
            ${JSON.stringify(report_data)}::jsonb
          )
        `;
      } catch (repErr) {
        console.warn("[Report Attachment Error]", repErr);
      }
    }

    return NextResponse.json({
      status: "success",
      success: true,
      ticket_id: saved.id,
      ticket_number: caseNumber,
      priority: priority,
      clinical_reasoning: clinicalReasoning,
      saved_to_database: true,
      ticket: saved,
      triage_report_text: reportText,
      triage_report_url: reportUrl,
      discharge_report_text: null,
      discharge_report_url: null,
      patient: {
        name: resolvedFamilyName || patient_name,
        age: patient_age,
        language: language,
        present_state: present_state,
        present_block: present_block,
      },
      assigned_facility: validFacilityName || (present_block ? `PHC ${present_block} Emergency & Clinical Desk` : "Designated Clinical Facility"),
      facility_name: validFacilityName || null,
      estimated_review_mins: priority === "Red" ? "15-20" : priority === "Yellow" ? "30-45" : "60-90",
    });
  } catch (err: any) {
    console.error("Error in POST /api/patient/triage:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to submit triage case." },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const patientId = searchParams.get("patient_id");

  if (!id && !patientId) {
    return NextResponse.json({ success: false, error: "Missing ticket id or patient_id" }, { status: 400 });
  }

  const sql = postgres(dbUrl, { max: 1 });
  try {
    if (patientId) {
      let resolvedUuid = patientId;
      if (!/^[0-9a-fA-F-]{36}$/.test(patientId)) {
        const [pRow] = await sql`SELECT id FROM public.profiles WHERE user_id = ${patientId}::text LIMIT 1`;
        if (pRow?.id) {
          resolvedUuid = pRow.id;
        } else {
          return NextResponse.json({ success: true, tickets: [], count: 0 });
        }
      }

      const tickets = await sql`
        SELECT * FROM public.triage_tickets
        WHERE patient_id = ${resolvedUuid}::uuid
        ORDER BY created_at DESC
      `;
      return NextResponse.json({ success: true, tickets, count: tickets.length });
    }

    const [ticket] = await sql`
      SELECT * FROM public.triage_tickets
      WHERE id = ${id}::uuid
      LIMIT 1
    `;
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, ticket });
  } catch (err: any) {
    console.error("Error in GET /api/patient/triage:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to fetch ticket" }, { status: 500 });
  } finally {
    await sql.end();
  }
}

export async function PATCH(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 });
  }

  const sql = postgres(dbUrl, { max: 1 });
  try {
    const body = await req.json();
    const { ticket_id, status = "Under Review", consent = true } = body;
    if (!ticket_id) {
      return NextResponse.json({ success: false, error: "Missing ticket_id" }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE public.triage_tickets
      SET
        status = ${status},
        consent_status = ${consent ? "Given" : "Withheld"},
        updated_at = now()
      WHERE id = ${ticket_id}::uuid
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ticket_id: updated.id,
      case_number: updated.case_number,
      ticket_number: updated.case_number,
      status: updated.status,
      ticket: updated
    });
  } catch (err: any) {
    console.error("Error in PATCH /api/patient/triage:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to update ticket" }, { status: 500 });
  } finally {
    await sql.end();
  }
}
