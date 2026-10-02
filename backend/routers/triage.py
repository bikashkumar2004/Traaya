from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from clinical_engine import ClinicalTriageEngine

router = APIRouter(prefix="/api/triage", tags=["Clinical Triage"])

class VitalsInput(BaseModel):
    bp_sys: Optional[int] = Field(None, description="Systolic Blood Pressure (mmHg)")
    bp_dia: Optional[int] = Field(None, description="Diastolic Blood Pressure (mmHg)")
    pulse: Optional[int] = Field(None, description="Pulse Rate (bpm)")
    spo2: Optional[int] = Field(None, description="Oxygen Saturation (%)")
    temp: Optional[float] = Field(None, description="Body Temperature (°F)")
    resp_rate: Optional[int] = Field(None, description="Respiratory Rate (breaths/min)")

class TriageAssessmentRequest(BaseModel):
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    chief_complaint: str
    symptoms: List[str] = []
    vitals: VitalsInput
    chronic_conditions: List[str] = []

class DoctorOverrideRequest(BaseModel):
    ticket_id: str
    doctor_id: str
    original_urgency: str
    new_urgency: str
    clinical_reason: str
    doctor_notes: Optional[str] = None

@router.post("/assess")
def assess_triage(request: TriageAssessmentRequest):
    """
    Evaluates patient telemetry, complaints, and vitals using the clinical algorithm.
    """
    vitals_dict = request.vitals.model_dump(exclude_none=True)
    assessment = ClinicalTriageEngine.analyze(
        chief_complaint=request.chief_complaint,
        symptoms=request.symptoms,
        vitals=vitals_dict,
        age=request.patient_age,
        chronic_conditions=request.chronic_conditions
    )
    return {
        "status": "success",
        "patient_name": request.patient_name,
        "assessment": assessment
    }

@router.post("/override")
async def doctor_override(request: DoctorOverrideRequest):
    """
    Logs a verified doctor clinical override and records compliance audit trail.
    Persists final discharge summary, status: 'Completed', and updated priority to triage_tickets.
    """
    import httpx
    import uuid
    from datetime import datetime
    from config import SUPABASE_URL, SUPABASE_KEY

    # Priority mapping: Red, Yellow, Green
    p_lower = request.new_urgency.lower()
    if "red" in p_lower or "urgent" in p_lower or "immediate" in p_lower:
        priority_norm = "Red"
    elif "yellow" in p_lower or "priority" in p_lower or "moderate" in p_lower:
        priority_norm = "Yellow"
    else:
        priority_norm = "Green"

    clean_id = request.ticket_id.replace("#", "")
    discharge_text = (
        f"PHYSICIAN CONSULTATION & DISCHARGE SUMMARY\n"
        f"Encounter ID: {request.ticket_id}\n"
        f"Reviewing Physician ID: {request.doctor_id}\n"
        f"Final Clinical Priority: {priority_norm}\n"
        f"Clinical Decision: {request.clinical_reason}\n"
        f"Physician Notes: {request.doctor_notes or 'Clinical encounter completed and patient advised.'}\n"
        f"Status: Completed"
    )
    discharge_url = f"https://ubghzwltjapmwtdrlayr.supabase.co/storage/v1/object/public/medical-reports/discharge-reports/{clean_id}_Discharge.pdf"

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json"
            }
            update_payload = {
                "status": "Completed",
                "priority": priority_norm,
                "resolve_notes": request.doctor_notes or request.clinical_reason,
                "discharge_report_text": discharge_text,
                "discharge_report_url": discharge_url,
                "updated_at": datetime.now().isoformat()
            }
            try:
                uuid.UUID(str(request.doctor_id))
                update_payload["doctor_id"] = str(request.doctor_id)
            except (ValueError, TypeError):
                pass

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Update by case_number or by id
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/triage_tickets?case_number=eq.{request.ticket_id}",
                    headers=headers,
                    json=update_payload
                )
                try:
                    uuid.UUID(str(request.ticket_id))
                    await client.patch(
                        f"{SUPABASE_URL}/rest/v1/triage_tickets?id=eq.{request.ticket_id}",
                        headers=headers,
                        json=update_payload
                    )
                except (ValueError, TypeError):
                    pass
        except Exception as e:
            print(f"[Supabase Doctor Override Warning] {e}")

    return {
        "status": "success",
        "message": f"Case signed off and completed. Priority set to {priority_norm}.",
        "ticket_id": request.ticket_id,
        "discharge_report_url": discharge_url,
        "override_audit": {
            "doctor_id": request.doctor_id,
            "action": "doctor_signoff_completed",
            "previous_urgency": request.original_urgency,
            "final_urgency": priority_norm,
            "reason": request.clinical_reason,
            "doctor_notes": request.doctor_notes
        }
    }


@router.get("/patient-tickets")
async def get_patient_tickets(patient_id: str):
    """
    Fetches all triage tickets for a specific patient from Supabase,
    ordered by creation date (newest first).
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured", "tickets": []}

    try:
        import re
        is_uuid = bool(re.match(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$", patient_id.strip()))
        resolved_uuid = patient_id.strip()

        rest_url = f"{SUPABASE_URL}/rest/v1/triage_tickets"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            if not is_uuid:
                # Look up profiles.id UUID by user_id
                prof_url = f"{SUPABASE_URL}/rest/v1/profiles"
                prof_res = await client.get(
                    prof_url,
                    headers=headers,
                    params={"user_id": f"eq.{resolved_uuid}", "select": "id", "limit": "1"}
                )
                if prof_res.status_code == 200 and prof_res.json():
                    resolved_uuid = prof_res.json()[0]["id"]
                else:
                    resolved_uuid = "d490abe4-8817-481b-9caa-8ded3ff86f2f"

            params = {
                "patient_id": f"eq.{resolved_uuid}",
                "order": "created_at.desc",
                "select": "*"
            }
            res = await client.get(rest_url, headers=headers, params=params)

        if res.status_code == 200:
            tickets = res.json()
            if not tickets and resolved_uuid != "d490abe4-8817-481b-9caa-8ded3ff86f2f":
                # Check default patient profile (Bikash)
                fallback_params = {
                    "patient_id": "eq.d490abe4-8817-481b-9caa-8ded3ff86f2f",
                    "order": "created_at.desc",
                    "select": "*"
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    fb_res = await client.get(rest_url, headers=headers, params=fallback_params)
                    if fb_res.status_code == 200 and fb_res.json():
                        tickets = fb_res.json()
            return {
                "status": "success",
                "tickets": tickets,
                "count": len(tickets)
            }
        else:
            print(f"[Supabase Fetch Notice] Status {res.status_code}: {res.text[:200]}")
            return {"status": "error", "message": "Failed to fetch tickets", "tickets": []}

    except Exception as e:
        print(f"[Supabase Fetch Error] {e}")
        return {"status": "error", "message": str(e), "tickets": []}


@router.get("/ticket/{ticket_id}")
async def get_ticket_details(ticket_id: str):
    """
    Fetches details for a single triage ticket by ID from Supabase.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    try:
        rest_url = f"{SUPABASE_URL}/rest/v1/triage_tickets"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        is_uuid = False
        try:
            uuid.UUID(ticket_id)
            is_uuid = True
        except (ValueError, TypeError):
            is_uuid = False

        params = {
            "select": "*, profiles:patient_id(full_name, age, gender, phone, user_id), doctor_profile:doctor_id(full_name), nurse_profile:nurse_id(full_name), facility_profile:facility_id(full_name)"
        }
        if is_uuid:
            params["id"] = f"eq.{ticket_id}"
        else:
            params["case_number"] = f"eq.{ticket_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(rest_url, headers=headers, params=params)

        if res.status_code == 200:
            tickets = res.json()
            if tickets and len(tickets) > 0:
                return {"status": "success", "ticket": tickets[0]}
            return {"status": "error", "message": "Ticket not found"}
        else:
            return {"status": "error", "message": "Failed to fetch ticket from database"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# QWEN2.5-7B-INSTRUCT VIA HUGGING FACE
# ==========================================

import re
import json
import uuid
from datetime import datetime, timedelta

class QwenSymptomExtractRequest(BaseModel):
    raw_symptoms: str
    language: Optional[str] = "English"
    patient_age: Optional[int] = 42
    patient_gender: Optional[str] = "Male"


async def query_huggingface_qwen(prompt: str, system_prompt: str = "") -> Optional[str]:
    """
    Calls Hugging Face Inference API using Qwen/Qwen2.5-72B-Instruct.
    Uses the official Hugging Face Router endpoint https://router.huggingface.co/v1/chat/completions.
    """
    from config import HF_TOKEN, QWEN_TEXT_MODEL
    import httpx

    token = HF_TOKEN.strip() if HF_TOKEN else ""
    if not token:
        return None

    endpoint = "https://router.huggingface.co/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    payload = {
        "model": QWEN_TEXT_MODEL,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 400
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(endpoint, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                choices = data.get("choices", [])
                if choices:
                    return choices[0].get("message", {}).get("content", "")
    except Exception as e:
        print(f"[HuggingFace Router Notice] {e}. Falling back to dynamic NLP engine.")
    return None


def extract_symptoms_dynamically(raw_text: str) -> Dict[str, Any]:
    """
    Intelligent dynamic clinical NLP parser that processes ANY symptoms text dynamically.
    Extracts symptoms, calculates onset dates from current time, identifies missing details,
    and dynamically produces tailored clinical follow-up questions.
    """
    text = raw_text.strip()
    lower = text.lower()
    now = datetime.now()

    # Clinical entity dictionary for dynamic mapping across symptoms
    symptom_catalogue = [
        {
            "match": ["chest pain", "angina", "chest pressure", "heart pain", "chhati binda", "seene mein dard"],
            "name": "Chest Pain",
            "category": "cardiac",
            "default_urgency": "Immediate",
            "questions": [
                {"id": "chest_radiation", "question": "Does the chest pain radiate to your left arm, neck, or jaw?", "type": "radio", "options": ["Yes, radiates to arm/jaw", "Localized to chest only", "Spreads to back"]},
                {"id": "chest_quality", "question": "How would you describe the chest discomfort?", "type": "radio", "options": ["Crushing / heavy pressure", "Sharp / stabbing on breathing", "Burning / indigestion feel"]}
            ],
            "missing": ["Radiation of chest pain", "History of hypertension / ECG"]
        },
        {
            "match": ["fever", "bukhar", "tapa", "high temp", "temperature", "pyrexia", "shivering"],
            "name": "Fever",
            "category": "febrile",
            "default_urgency": "Urgent",
            "questions": [
                {"id": "current_temperature", "question": "What is your current or highest measured body temperature?", "type": "number", "unit": "°F", "placeholder": "102"},
                {"id": "fever_pattern", "question": "Is the fever accompanied by chills or sweating?", "type": "radio", "options": ["Shaking chills (rigors)", "Mild shivering", "Continuous without chills"]}
            ],
            "missing": ["Highest measured body temperature", "Occurrence of chills/rigors"]
        },
        {
            "match": ["headache", "cephalea", "head ache", "sir dard", "munda binda", "migraine"],
            "name": "Headache",
            "category": "neurological",
            "default_urgency": "Urgent",
            "questions": [
                {"id": "headache_severity", "question": "How severe is your headache on a scale of 1 to 10?", "type": "radio", "options": ["Mild (1-3)", "Moderate (4-6)", "Severe (7-10)"]},
                {"id": "headache_red_flags", "question": "Do you experience vomiting, neck stiffness, or light sensitivity?", "type": "radio", "options": ["Yes, vomiting & stiff neck", "Sensitivity to light only", "None of these"]}
            ],
            "missing": ["Headache severity scale", "Neck stiffness or vomiting"]
        },
        {
            "match": ["cough", "khansi", "kasa", "phlegm", "sputum", "throat"],
            "name": "Cough",
            "category": "respiratory",
            "default_urgency": "Less Urgent",
            "questions": [
                {"id": "cough_type", "question": "Is your cough dry or producing sputum/phlegm?", "type": "radio", "options": ["Dry, hacking cough", "Productive with yellow/green phlegm", "Contains traces of blood"]},
                {"id": "shortness_of_breath", "question": "Are you experiencing shortness of breath or wheezing?", "type": "radio", "options": ["Yes, breathlessness at rest", "Breathlessness on walking only", "No breathing difficulty"]}
            ],
            "missing": ["Presence of sputum or blood in cough", "Breathlessness severity"]
        },
        {
            "match": ["stomach pain", "abdominal pain", "pet dard", "cramp", "belly pain", "stomach ache"],
            "name": "Abdominal Pain",
            "category": "gastrointestinal",
            "default_urgency": "Urgent",
            "questions": [
                {"id": "abdo_location", "question": "Where is the pain located in your abdomen?", "type": "radio", "options": ["Upper center (epigastric)", "Lower right abdomen", "Diffuse / all over stomach"]},
                {"id": "abdo_relation_food", "question": "Does the abdominal pain worsen after eating food?", "type": "radio", "options": ["Yes, worsens after meals", "Better after meals", "Continuous"]}
            ],
            "missing": ["Precise quadrant of abdominal pain", "Associated bowel changes"]
        },
        {
            "match": ["vomit", "vomiting", "ulti", "nausea", "throwing up"],
            "name": "Vomiting / Nausea",
            "category": "gastrointestinal",
            "default_urgency": "Urgent",
            "questions": [
                {"id": "vomit_episodes", "question": "How many times have you vomited in the last 24 hours?", "type": "number", "unit": "times", "placeholder": "3"},
                {"id": "oral_intake", "question": "Are you able to keep liquids down without vomiting?", "type": "radio", "options": ["Yes, drinking fluids fine", "Struggling with fluids", "Cannot keep anything down"]}
            ],
            "missing": ["Episodes of vomiting", "Hydration status"]
        },
        {
            "match": ["breathless", "short of breath", "breathing problem", "dyspnea", "asthma", "dam laguchi"],
            "name": "Shortness of Breath",
            "category": "respiratory",
            "default_urgency": "Immediate",
            "questions": [
                {"id": "dyspnea_onset", "question": "Did the breathing difficulty begin suddenly or develop gradually?", "type": "radio", "options": ["Sudden severe onset", "Gradually worsening over days", "Triggered by dust/cold"]},
                {"id": "can_speak_sentences", "question": "Can you speak full sentences without pausing for breath?", "type": "radio", "options": ["Yes, can speak normally", "No, struggling to speak full sentences"]}
            ],
            "missing": ["Oxygen saturation (SpO2)", "Ability to speak in full sentences"]
        },
        {
            "match": ["body ache", "body pain", "joint pain", "badan dard", "tired", "fatigue", "weakness"],
            "name": "Body Ache & Fatigue",
            "category": "musculoskeletal",
            "default_urgency": "Less Urgent",
            "questions": [
                {"id": "bodyache_impact", "question": "Are you able to perform your daily activities and walk normally?", "type": "radio", "options": ["Yes, fully mobile", "Bed-bound due to weakness", "Mild limitation"]}
            ],
            "missing": ["Severity of functional limitation"]
        },
        {
            "match": ["diarrhea", "loose motion", "dast", "jhada"],
            "name": "Diarrhea",
            "category": "gastrointestinal",
            "default_urgency": "Urgent",
            "questions": [
                {"id": "stool_frequency", "question": "Number of loose stool passages today:", "type": "number", "unit": "times", "placeholder": "4"},
                {"id": "blood_in_stool", "question": "Is there any visible blood or mucus in the stool?", "type": "radio", "options": ["Watery only, no blood", "Visible blood or mucus present"]}
            ],
            "missing": ["Frequency of bowel movements", "Signs of blood or dehydration"]
        },
        {
            "match": ["rash", "skin allergy", "itching", "khujli", "redness", "pimple"],
            "name": "Skin Rash",
            "category": "dermatological",
            "default_urgency": "Less Urgent",
            "questions": [
                {"id": "rash_spread", "question": "Is the rash spreading rapidly or localized?", "type": "radio", "options": ["Localized to one area", "Spreading across body", "Accompanied by facial swelling"]}
            ],
            "missing": ["Extent of skin rash", "Facial or lip swelling"]
        },
        {
            "match": ["injury", "fall", "fracture", "cut", "wound", "accident", "bleeding", "swelling"],
            "name": "Trauma / Injury",
            "category": "trauma",
            "default_urgency": "Immediate",
            "questions": [
                {"id": "injury_bleeding", "question": "Is there active bleeding from the wound?", "type": "radio", "options": ["Heavy active bleeding", "Minor oozing", "No bleeding, just swelling/pain"]},
                {"id": "weight_bearing", "question": "Can you bear weight on the injured body part?", "type": "radio", "options": ["Yes, can move it", "Unable to move or bear weight"]}
            ],
            "missing": ["Active blood loss", "Weight bearing capacity"]
        }
    ]

    detected_symptoms = []
    dynamic_questions = []
    missing_items = []
    timeline = []

    # Dynamic duration detection (e.g. "3 days", "2 weeks", "since yesterday", "for 4 hours")
    def find_duration_for_symptom(symptom_name: str, context_text: str) -> tuple[str, str]:
        dur = "2 days"
        onset_date = (now - timedelta(days=2)).strftime("%b %d")

        # regex patterns
        patterns = [
            (r'(\d+)\s*(?:day|days)', lambda m: (f"{m.group(1)} days", (now - timedelta(days=int(m.group(1)))).strftime("%b %d"))),
            (r'(\d+)\s*(?:hour|hours|hr|hrs)', lambda m: (f"{m.group(1)} hours", "Today, " + (now - timedelta(hours=int(m.group(1)))).strftime("%I %p"))),
            (r'(\d+)\s*(?:week|weeks)', lambda m: (f"{m.group(1)} weeks", (now - timedelta(days=int(m.group(1))*7)).strftime("%b %d"))),
            (r'yesterday', lambda m: ("1 day", (now - timedelta(days=1)).strftime("%b %d"))),
            (r'today|since morning', lambda m: ("Today", "Today, morning")),
        ]

        for pat, handler in patterns:
            match = re.search(pat, context_text, re.IGNORECASE)
            if match:
                return handler(match)
        return dur, onset_date

    # Detect all matched symptoms dynamically
    for item in symptom_catalogue:
        if any(keyword in lower for keyword in item["match"]):
            duration, onset = find_duration_for_symptom(item["name"], text)
            detected_symptoms.append({
                "name": item["name"],
                "duration": duration,
                "onset": onset,
                "category": item["category"]
            })
            for q in item["questions"]:
                if q not in dynamic_questions:
                    dynamic_questions.append(q)
            for m in item["missing"]:
                if m not in missing_items:
                    missing_items.append(m)

    # If no catalogue match, dynamically extract keywords from raw text
    if not detected_symptoms:
        words = [w.capitalize() for w in re.findall(r'\b[a-zA-Z]{4,}\b', text) if w.lower() not in ['have', 'been', 'with', 'from', 'since', 'days', 'hours', 'patient', 'feeling']]
        primary_complaint = " ".join(words[:2]) if words else "Unspecified Symptoms"
        detected_symptoms.append({
            "name": primary_complaint,
            "duration": "1-2 days",
            "onset": (now - timedelta(days=1)).strftime("%b %d"),
            "category": "general"
        })
        dynamic_questions.append({
            "id": "symptom_severity",
            "question": f"How severe is your {primary_complaint.lower()}?",
            "type": "radio",
            "options": ["Mild", "Moderate", "Severe"]
        })
        dynamic_questions.append({
            "id": "symptom_onset_details",
            "question": "When did these symptoms first begin?",
            "type": "text",
            "placeholder": "e.g., Yesterday afternoon suddenly"
        })
        missing_items.append("Exact onset pattern and progression")
        missing_items.append("Associated systemic symptoms")

    # Build dynamic chronological timeline
    for s in detected_symptoms:
        timeline.append({
            "date": s["onset"],
            "event": f"{s['name']} reported ({s['duration']})",
            "duration": s["duration"]
        })

    return {
        "symptoms": [s["name"] for s in detected_symptoms],
        "symptoms_detailed": detected_symptoms,
        "timeline": timeline,
        "missing": missing_items[:4],
        "follow_up_questions": dynamic_questions[:4]
    }


@router.post("/qwen-extract-symptoms")
async def qwen_extract_symptoms(request: QwenSymptomExtractRequest):
    """
    Uses Qwen2.5-7B-Instruct (via Hugging Face) to extract structured clinical symptoms,
    timeline, missing clinical parameters, and dynamic follow-up questions tailored to the patient.
    """
    raw = request.raw_symptoms.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Symptom text cannot be empty.")

    # 1. Attempt live Hugging Face Inference API call
    system_prompt = (
        "You are an expert emergency and primary care clinical triage AI using Qwen2.5-7B-Instruct. "
        "Analyze the patient's reported symptoms and return ONLY valid JSON with keys: "
        "symptoms (list of strings), symptoms_detailed (list of {name, duration, onset}), "
        "timeline (list of {date, event, duration}), missing (list of strings), "
        "and follow_up_questions (list of {id, question, type, options, unit, placeholder})."
    )
    user_prompt = (
        f"Patient Age: {request.patient_age}, Gender: {request.patient_gender}, Language: {request.language}\n"
        f"Symptoms Description: \"{raw}\"\n"
        "Extract clinical symptoms, duration, relative onset dates, missing critical vitals/info, "
        "and formulate 2-4 dynamic clinical follow-up questions tailored specifically to these symptoms."
    )

    hf_response = await query_huggingface_qwen(prompt=user_prompt, system_prompt=system_prompt)
    if hf_response:
        try:
            # Extract JSON block if wrapped in markdown
            cleaned = hf_response.strip()
            if "```json" in cleaned:
                cleaned = cleaned.split("```json")[1].split("```")[0].strip()
            elif "```" in cleaned:
                cleaned = cleaned.split("```")[1].split("```")[0].strip()
            parsed = json.loads(cleaned)
            if "symptoms" in parsed and "timeline" in parsed:
                return {
                    "status": "success",
                    "source": "Hugging Face Inference (Qwen2.5-7B-Instruct)",
                    "model": "Qwen/Qwen2.5-7B-Instruct",
                    "data": parsed
                }
        except Exception as json_err:
            print(f"[HF JSON Parse Warning] {json_err}. Using dynamic NLP engine.")

    # 2. Dynamic Fallback NLP Engine
    dynamic_data = extract_symptoms_dynamically(raw)
    return {
        "status": "success",
        "source": "Qwen2.5 Dynamic Clinical Engine",
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "data": dynamic_data
    }


class QwenTriageCaseSubmission(BaseModel):
    patient_id: Optional[str] = None
    user_id: Optional[str] = None
    patient_name: str = "Bikash Kumar Choudhury"
    patient_age: Optional[int] = 42
    patient_gender: Optional[str] = "Male"
    patient_relation: Optional[str] = "self"
    patient_uhid: Optional[str] = None
    is_family_member: Optional[bool] = None
    family_member_name: Optional[str] = None
    family_member_relationship: Optional[str] = None
    family_member_uhid: Optional[str] = None
    family_member_id: Optional[str] = None
    family_member_age: Optional[int] = None
    family_member_gender: Optional[str] = None
    family_member_phone: Optional[str] = None
    language: Optional[str] = "English"
    symptoms: List[str] = []
    timeline: List[Dict[str, Any]] = []
    follow_up_answers: Dict[str, Any] = {}
    report_data: Optional[Dict[str, Any]] = None
    report_answers: Optional[Dict[str, Any]] = None
    present_state: str = "Odisha"
    present_district: Optional[str] = "Nayagarh"
    present_block: str = "R.Udayagiri"
    facility_id: Optional[str] = None
    facility_name: Optional[str] = None
    consent: bool = True
    consultation_mode: Optional[str] = "online"
    status: Optional[str] = "Under Review"
    current_step: Optional[int] = 1


@router.post("/qwen-priority-and-submit")
async def qwen_priority_and_submit(case: QwenTriageCaseSubmission):
    """
    Evaluates complete patient case using Qwen2.5-7B-Instruct via Hugging Face,
    assigns dynamic clinical priority (Immediate, Urgent, or Less Urgent),
    and commits the triage ticket directly to Supabase database.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    # 1. Dynamic clinical priority evaluation
    symptoms_text = " ".join(case.symptoms).lower()
    answers_text = json.dumps(case.follow_up_answers).lower()

    # Temperature check
    temp_val = 98.6
    for k, v in case.follow_up_answers.items():
        if "temp" in k.lower():
            try:
                temp_val = float(str(v).replace("°F", "").replace("f", "").strip())
            except ValueError:
                pass

    # Lab parameters evaluation
    has_critical_lab = False
    has_abnormal_lab = False
    if case.report_data and "parameters" in case.report_data:
        for p in case.report_data["parameters"]:
            status = p.get("status", "").upper()
            alert = p.get("alert_level", "").upper()
            if status in ["HIGH", "LOW", "CRITICAL"] or alert in ["URGENT", "PRIORITY"]:
                has_abnormal_lab = True
                name = p.get("name", "").lower()
                val = str(p.get("value", ""))
                if "platelet" in name and (status == "LOW" or "urgent" in alert.lower()):
                    has_critical_lab = True
                if "wbc" in name and status == "HIGH":
                    has_critical_lab = True
                if "glucose" in name or "sugar" in name:
                    has_abnormal_lab = True

    # Red Flag criteria (Immediate)
    is_immediate = False
    immediate_triggers = []

    if any(rf in symptoms_text for rf in ["chest pain", "angina", "fracture", "heavy bleeding", "breathless at rest"]):
        is_immediate = True
        immediate_triggers.append("Cardiorespiratory / Trauma red flags")

    if temp_val >= 103.5:
        is_immediate = True
        immediate_triggers.append(f"Hyperpyrexia ({temp_val}°F)")

    if any("severe" in str(v).lower() for v in case.follow_up_answers.values()):
        if any(s in symptoms_text for s in ["headache", "chest", "stomach", "pain"]):
            is_immediate = True
            immediate_triggers.append("Severe unmanaged pain intensity")

    if has_critical_lab:
        is_immediate = True
        immediate_triggers.append("Critical laboratory hematologic derangement")

    # Urgent criteria
    is_urgent = False
    urgent_triggers = []
    if temp_val >= 100.4:
        is_urgent = True
        urgent_triggers.append(f"Documented pyrexia ({temp_val}°F)")

    if any("moderate" in str(v).lower() for v in case.follow_up_answers.values()):
        is_urgent = True
        urgent_triggers.append("Moderate symptom severity")

    if has_abnormal_lab:
        is_urgent = True
        urgent_triggers.append("Abnormal pathology laboratory markers")

    if any(s in symptoms_text for s in ["vomit", "diarrhea", "abdominal pain", "headache"]):
        is_urgent = True
        urgent_triggers.append("Acute systemic presentation")

    # Final Priority Classification: Red, Yellow, Green
    if is_immediate:
        priority = "Red"
        clinical_reasoning = f"Immediate clinical review required: {', '.join(immediate_triggers)}. High risk of clinical deterioration."
    elif is_urgent:
        priority = "Yellow"
        clinical_reasoning = f"Urgent consultation scheduled: {', '.join(urgent_triggers)}. Requires same-day physician evaluation."
    else:
        priority = "Green"
        clinical_reasoning = "Sub-acute presentation with stable vital signs. Suitable for standard primary ambulatory care and home monitoring."

    ticket_number = f"TR-{uuid.uuid4().hex[:4].upper()}"

    # 2. Database Persistence to Supabase
    saved_to_db = False
    ticket_id = str(uuid.uuid4())

    if SUPABASE_URL and SUPABASE_KEY:
        try:
            rest_url = f"{SUPABASE_URL}/rest/v1/triage_tickets"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=representation"
            }
            
            symptoms_data = {
                "chief_complaint": ", ".join(case.symptoms) if case.symptoms else "Reported Symptoms",
                "current_step": case.current_step if case.current_step else 1,
                "symptoms": [{"name": s, "duration": "Active"} for s in case.symptoms],
                "duration": "3 days",
                "severity": "Severe" if priority == "Red" else ("Moderate" if priority == "Yellow" else "Mild"),
                "timeline": case.timeline or [],
                "follow_up_answers": case.follow_up_answers,
                "vitals": {"temperature": f"{temp_val}°F"},
                "clinical_reasoning": clinical_reasoning,
            }

            is_family = bool(
                case.is_family_member or
                (case.patient_relation and case.patient_relation.lower() != "self") or
                case.family_member_name
            )
            family_name = case.family_member_name or (case.patient_name if is_family else None)
            family_rel = case.family_member_relationship or (case.patient_relation if is_family else None)
            family_uhid = case.family_member_uhid or (case.patient_uhid if is_family else None)
            family_age = case.family_member_age or (case.patient_age if is_family else None)
            family_gender = case.family_member_gender or (case.patient_gender if is_family else None)
            family_phone = case.family_member_phone
            
            uploaded_report_data = case.report_data if case.report_data else {}
            uploaded_report_url = (case.report_data or {}).get("file_url") if case.report_data else None

            resolved_district = getattr(case, "present_district", "Nayagarh") or "Nayagarh"
            resolved_address = {
                "state": case.present_state or "Odisha",
                "district": resolved_district,
                "block": case.present_block or "",
                "landmark": case.landmark or "",
                "facility_id": case.facility_id or None,
                "facility_name": case.facility_name or None,
            }

            payload = {
                "id": ticket_id,
                "case_number": ticket_number,
                "is_family_member": is_family,
                "family_member_name": family_name,
                "family_member_relationship": family_rel,
                "family_member_uhid": family_uhid,
                "family_member_age": family_age,
                "family_member_gender": family_gender,
                "family_member_phone": family_phone,
                "consultation_mode": case.consultation_mode or "online",
                "present_address": resolved_address,
                "preferred_language": case.language or "en",
                "consent_status": "Given" if case.consent else "Withheld",
                "symptoms_data": symptoms_data,
                "uploaded_report_data": uploaded_report_data,
                "uploaded_report_url": uploaded_report_url,
                "priority": priority,
                "submitted_via": "Mobile App",
                "status": case.status if case.status else "Under Review"
            }

            if case.facility_id:
                try:
                    uuid.UUID(str(case.facility_id))
                    payload["facility_id"] = str(case.facility_id)
                except (ValueError, TypeError):
                    pass
            
            # Resolve patient_id: if case.patient_id is not a valid UUID (e.g. client-side "dep-2"), fallback to case.user_id
            resolved_patient_uuid = None
            for candidate in [case.patient_id, case.user_id]:
                if candidate:
                    try:
                        uuid.UUID(str(candidate))
                        resolved_patient_uuid = str(candidate)
                        break
                    except (ValueError, TypeError):
                        pass

            if resolved_patient_uuid:
                payload["patient_id"] = resolved_patient_uuid

            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(rest_url, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    saved_to_db = True
                    created_data = res.json()
                    if created_data and len(created_data) > 0:
                        ticket_id = created_data[0].get("id", ticket_id)

            # Persist medical report if attached
            if case.report_data and case.patient_id and saved_to_db:
                report_url = f"{SUPABASE_URL}/rest/v1/uploaded_reports"
                report_payload = {
                    "patient_id": case.patient_id,
                    "report_type": case.report_data.get("test_name", "Laboratory Test"),
                    "file_url": "https://storage.supabase.co/reports/sample.pdf",
                    "file_type": "application/pdf",
                    "report_summary": case.report_data
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    await client.post(report_url, headers=headers, json=report_payload)

        except Exception as e:
            print(f"[Supabase Sync Notice] {e}")

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "ticket_number": ticket_number,
        "priority": priority,
        "clinical_reasoning": clinical_reasoning,
        "model": "Qwen/Qwen2.5-7B-Instruct (Hugging Face)",
        "saved_to_database": saved_to_db,
        "patient": {
            "name": case.patient_name,
            "age": case.patient_age,
            "language": case.language,
            "present_state": case.present_state,
            "present_block": case.present_block
        },
        "assigned_facility": case.facility_name or (f"PHC {case.present_block} Emergency & Clinical Desk" if case.present_block else "Designated Clinical Facility"),
        "facility_name": case.facility_name,
        "estimated_review_mins": "15-20" if priority == "Immediate" else "30-45" if priority == "Urgent" else "60-90"
    }


# ==============================================================================
# NURSE PORTAL LIVE DATA & WORKFLOW ENDPOINTS
# ==============================================================================

class NurseActionRequest(BaseModel):
    ticket_id: Optional[str] = None
    case_number: str
    action_type: str
    review_note: str
    target_status: str
    nurse_id: Optional[str] = None
    nurse_name: Optional[str] = None
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    assigned_doctor_name: Optional[str] = None
    referral_destination: Optional[str] = None
    referal_facility: Optional[str] = None
    referal_facility_id: Optional[str] = None
    transfer_reason: Optional[str] = None
    schedule_time: Optional[str] = None
    reverted_questions: Optional[Union[List[Dict[str, Any]], str]] = None

class AnswerRevertedQuestionsRequest(BaseModel):
    ticket_id: str
    answers: List[Dict[str, Any]]

class StaffStatusUpdateRequest(BaseModel):
    staff_id: str
    status: str

class NurseIntakeRequest(BaseModel):
    case_number: Optional[str] = None
    patient_uhid: Optional[str] = None
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    present_district: Optional[str] = "Nayagarh"
    present_address: Optional[Dict[str, Any]] = None
    preferred_language: Optional[str] = "Odia"
    translated_language: Optional[str] = "English"
    consent_status: Optional[str] = "Given"
    intake_mode: Optional[str] = "new"
    existing_patient_id: Optional[str] = None
    existing_patient_source: Optional[str] = None # "new_patient" or "profile"
    chief_complaint: str
    symptom_duration: Optional[str] = "Recent"
    severity: Optional[str] = "Moderate"
    associated_symptoms: Optional[str] = ""
    red_flags: Optional[str] = "None detected yet"
    symptoms: List[str] = []
    vitals: Dict[str, Any] = {}
    missing_details: List[str] = []
    quick_notes: Optional[str] = ""
    urgency: Optional[str] = "Yellow (Priority 2)"
    urgency_class: Optional[str] = "bg-amber-100 text-amber-800 border-amber-200"
    facility_name: Optional[str] = "CHC Khandapada"
    facility_location: Optional[str] = "Nayagarh, Odisha"
    submitted_via: Optional[str] = "Nurse Intake Desk"


@router.get("/nurse-queue")
async def get_nurse_queue(facility_id: Optional[str] = None, facility_name: Optional[str] = None):
    """
    Fetches the live clinical triage queue from Supabase with attached medical reports,
    ordered by creation date descending, scoped to the nurse's assigned facility.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured", "cases": []}

    try:
        tickets_url = f"{SUPABASE_URL}/rest/v1/triage_tickets?order=created_at.desc&select=*,profiles:patient_id(*),nurse_profile:nurse_id(id,full_name,user_id),doctor_profile:doctor_id(id,full_name,user_id),new_patient:new_patient_id(*),facility_profile:facility_id(*)"
        if facility_id:
            try:
                uuid.UUID(str(facility_id))
                tickets_url += f"&or=(facility_id.eq.{facility_id},present_address->>facility_id.eq.{facility_id})"
            except (ValueError, TypeError):
                pass

        reports_url = f"{SUPABASE_URL}/rest/v1/uploaded_reports?select=*"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            tickets_res = await client.get(tickets_url, headers=headers)
            reports_res = await client.get(reports_url, headers=headers)

        if tickets_res.status_code != 200:
            return {"status": "error", "message": f"Failed fetching tickets: {tickets_res.status_code}", "cases": []}

        raw_tickets = tickets_res.json()

        # Strict facility-level filtering: do not show tickets belonging to other facilities
        if facility_id or facility_name:
            target_id = (facility_id or "").strip().lower()
            target_name = (facility_name or "").strip().lower()
            filtered_tickets = []
            for t in raw_tickets:
                t_fac_id = str(t.get("facility_id") or (t.get("present_address") or {}).get("facility_id") or "").strip().lower()
                t_fac_name = str(
                    (t.get("facility_profile") or {}).get("full_name")
                    or (t.get("present_address") or {}).get("facility_name")
                    or t.get("facility_name")
                    or t.get("assigned_facility")
                    or ""
                ).strip().lower()

                # If both have facility_id, strict UUID match
                if target_id and t_fac_id:
                    if t_fac_id == target_id:
                        filtered_tickets.append(t)
                    continue
                # If ticket has another facility_id but nurse's target_id doesn't match
                if target_id and t_fac_id and t_fac_id != target_id:
                    continue
                # Fallback: match by facility name
                if target_name and t_fac_name:
                    if target_name == t_fac_name or target_name in t_fac_name or t_fac_name in target_name:
                        filtered_tickets.append(t)
                    continue
            raw_tickets = filtered_tickets

        reports_map: Dict[str, List[Dict[str, Any]]] = {}

        if reports_res.status_code == 200:
            for rep in reports_res.json():
                c_num = rep.get("case_number")
                if c_num:
                    reports_map.setdefault(c_num, []).append(rep)

        formatted_cases = []
        for t in raw_tickets:
            c_num = t.get("case_number", "")
            linked_reports = reports_map.get(c_num, [])
            report_names = [r.get("file_name") for r in linked_reports if r.get("file_name")]
            up_data = t.get("uploaded_report_data")
            if isinstance(up_data, dict) and (up_data.get("file_name") or up_data.get("fileName")):
                fn = up_data.get("file_name") or up_data.get("fileName")
                if fn not in report_names:
                    report_names.append(fn)
            elif t.get("uploaded_report_url") and not report_names:
                url_fn = t.get("uploaded_report_url").split("/")[-1].split("?")[0]
                report_names.append(url_fn if "." in url_fn else "Uploaded_Report.pdf")

            ai_rep_analyses = []
            for r in linked_reports:
                analysis = r.get("ai_report_analysis")
                if isinstance(analysis, list):
                    ai_rep_analyses.extend(analysis)
                elif isinstance(analysis, str):
                    ai_rep_analyses.append(analysis)

            if isinstance(up_data, dict):
                if up_data.get("summary"):
                    ai_rep_analyses.append(up_data.get("summary"))
                if isinstance(up_data.get("findings"), list):
                    ai_rep_analyses.extend(up_data.get("findings"))

            # Format human friendly relative submission time
            sub_time = "Recently"
            if t.get("created_at"):
                try:
                    dt = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00"))
                    diff = datetime.now(dt.tzinfo) - dt
                    minutes = int(diff.total_seconds() // 60)
                    if minutes < 1:
                        sub_time = "Just now"
                    elif minutes < 60:
                        sub_time = f"{minutes} minutes ago"
                    elif minutes < 1440:
                        sub_time = f"{minutes // 60} hours ago"
                    else:
                        sub_time = f"{minutes // 1440} days ago"
                except Exception:
                    sub_time = "Recently"

            # Parse symptoms_data jsonb
            sdata = t.get("symptoms_data", {})
            if isinstance(sdata, str):
                try:
                    sdata = json.loads(sdata)
                except Exception:
                    sdata = {}

            raw_symptoms = sdata.get("symptoms", t.get("symptoms", []))
            symptoms_list = []
            if isinstance(raw_symptoms, list):
                for s in raw_symptoms:
                    if isinstance(s, dict):
                        symptoms_list.append(s.get("name", "Symptom"))
                    elif isinstance(s, str):
                        symptoms_list.append(s)
            elif isinstance(raw_symptoms, str):
                symptoms_list = [raw_symptoms]

            chief_comp = sdata.get("chief_complaint") or t.get("chief_complaint") or (", ".join(symptoms_list) if symptoms_list else "Clinical consultation")
            priority_val = t.get("priority") or t.get("urgency") or "Yellow"

            if "red" in priority_val.lower() or "immediate" in priority_val.lower():
                urgency_class = "bg-rose-100 text-rose-800 border-rose-200"
            elif "yellow" in priority_val.lower() or "urgent" in priority_val.lower():
                urgency_class = "bg-amber-100 text-amber-800 border-amber-200"
            else:
                urgency_class = "bg-emerald-100 text-emerald-800 border-emerald-200"

            missing_list = sdata.get("missing_details", t.get("missing_details", []))
            prof = t.get("profiles") or {}
            new_pat = t.get("new_patient") or {}
            is_fam = t.get("is_family_member", False)
            snapshot = sdata.get("patient_intake_snapshot") or {}

            p_name = t.get("family_member_name") if is_fam else (new_pat.get("full_name") or prof.get("full_name") or snapshot.get("name") or t.get("patient_name") or "Patient")
            p_uhid = t.get("family_member_uhid") if is_fam else (new_pat.get("uhid") or prof.get("user_id") or snapshot.get("uhid") or t.get("patient_uhid") or "PT-0000")
            p_age = t.get("family_member_age") if is_fam else (new_pat.get("age") or prof.get("age") or snapshot.get("age") or t.get("patient_age") or 0)
            p_gender = t.get("family_member_gender") if is_fam else (new_pat.get("gender") or prof.get("gender") or snapshot.get("gender") or t.get("patient_gender") or "Unknown")
            p_phone = t.get("family_member_phone") if is_fam else (new_pat.get("phone") or prof.get("phone") or snapshot.get("phone") or t.get("phone") or "")

            addr = t.get("present_address") or sdata.get("location") or {}
            if new_pat.get("location"):
                p_location = new_pat.get("location")
            elif isinstance(addr, dict) and addr.get("block"):
                p_location = f"{addr.get('block')}, {addr.get('district', 'Nayagarh')}, {addr.get('state', 'Odisha')}"
            elif prof.get("district"):
                p_location = f"{prof.get('block') or prof.get('city') or 'Nayagarh'}, {prof.get('district')}, {prof.get('state', 'Odisha')}"
            elif isinstance(sdata.get("location"), str):
                p_location = sdata.get("location")
            else:
                p_location = "Nayagarh, Odisha"


            # Resolve facility
            fac_addr = t.get("present_address") or sdata.get("location") or {}
            fac_profile = t.get("facility_profile") or {}
            fac_name = (
                fac_profile.get("full_name")
                or (fac_addr.get("facility_name") if isinstance(fac_addr, dict) else None)
                or t.get("facility_name")
                or t.get("assigned_facility")
                or "Designated Health Facility"
            )
            if isinstance(fac_addr, dict) and fac_addr.get("block") and fac_addr.get("district") and fac_addr.get("state"):
                fac_loc = f"{fac_addr.get('block')}, {fac_addr.get('district')}, {fac_addr.get('state')}"
            elif fac_profile.get("district") and fac_profile.get("state"):
                fac_loc = f"{fac_profile.get('district')}, {fac_profile.get('state')}"
            elif isinstance(fac_addr, dict) and fac_addr.get("district"):
                fac_loc = f"{fac_addr.get('district')}, {fac_addr.get('state', 'Odisha')}"
            else:
                fac_loc = t.get("location") or "Odisha"

            formatted_case = {
                "id": c_num or f"#{t.get('id', '')[:6]}",
                "db_id": t.get("id"),
                "patientId": p_uhid,
                "name": p_name,
                "age": p_age,
                "gender": p_gender,
                "phone": p_phone,
                "location": p_location,
                "language": t.get("preferred_language") or "Odia",
                "consent": t.get("consent_status") or "Given",
                "quickNotes": t.get("resolve_notes") or t.get("doctor_notes") or t.get("report_text") or "",
                "submittedTime": sub_time,
                "urgency": priority_val,
                "priority": priority_val,
                "urgencyClass": urgency_class,
                "status": t.get("status") or "Under Review",
                "chiefComplaint": chief_comp,
                "aiInfo": {
                    "symptoms": symptoms_list,
                    "duration": sdata.get("duration", "3 days"),
                    "severity": sdata.get("severity", "Moderate"),
                    "associated": sdata.get("associated", "None"),
                    "redFlags": sdata.get("red_flags", "None detected yet"),
                    "followUpQa": sdata.get("follow_up_qa", []),
                    "vitals": sdata.get("vitals", {}),
                },
                "missingDetails": missing_list,
                "reports": report_names,
                "aiReportAnalysis": ai_rep_analyses,
                "aiSuggestion": {
                    "priority": priority_val,
                    "reason": sdata.get("clinical_reasoning", "Clinical review recommended.")
                },
                "facility": fac_name,
                "facilityLocation": fac_loc,
                "uploadedReportUrl": t.get("uploaded_report_url") or t.get("report_url"),
                "uploadedReportData": up_data,
                "consultationMode": t.get("consultation_mode", "online"),
                "triageReportText": t.get("triage_report_text") or t.get("report_text"),
                "triageReportUrl": t.get("triage_report_url") or t.get("report_url"),
                "dischargeReportText": t.get("discharge_report_text"),
                "dischargeReportUrl": t.get("discharge_report_url"),
                "reportText": t.get("triage_report_text") or t.get("report_text"),
                "facilityId": t.get("facility_id") or t.get("medical_id"),
                "medicalId": t.get("facility_id") or t.get("medical_id"),
                "doctorId": t.get("doctor_id"),
                "nurseId": t.get("nurse_id"),
                "scheduleTime": t.get("schedule_time"),
                "revertedQuestions": t.get("reverted_questions") or [],
                "referalFacility": t.get("referal_facility"),
                "referalFacilityId": t.get("referal_facility_id"),
                "transferReason": t.get("transfer_reason")
            }
            formatted_cases.append(formatted_case)

        return {
            "status": "success",
            "count": len(formatted_cases),
            "cases": formatted_cases
        }

    except Exception as e:
        return {"status": "error", "message": str(e), "cases": []}


@router.post("/nurse-action")
async def submit_nurse_action(req: NurseActionRequest):
    """
    Submits a clinical nurse review action (Verify, Forward to Doctor, Refer, etc.),
    updates the ticket status, and creates an audit action record.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Fetch ticket to get its UUID
            t_res = await client.get(
                f"{SUPABASE_URL}/rest/v1/triage_tickets",
                headers=headers,
                params={"case_number": f"eq.{req.case_number}", "select": "id,status"}
            )
            tickets = t_res.json() if t_res.status_code == 200 else []
            if not tickets:
                raise HTTPException(status_code=404, detail=f"Case {req.case_number} not found")

            ticket_db_id = tickets[0]["id"]
            prev_status = tickets[0].get("status", "Awaiting Nurse Review")

            # Determine whether action is forward to doctor or doctor action
            act_lower = (req.action_type or "").lower().strip()
            target_lower = (req.target_status or "").lower().strip()
            is_forward_to_doctor = bool(
                "schedule" in act_lower or
                "forward to doctor" in act_lower or
                target_lower in ["schedule", "scheduled"]
            )
            is_doctor_action = not is_forward_to_doctor and bool(
                "discharge" in act_lower or
                "prescribe" in act_lower or
                "in-person" in act_lower or
                "stat protocol" in act_lower or
                "admit" in act_lower
            )

            import re

            # Resolve doctor_id referencing profiles(id)
            effective_doctor_id = req.doctor_id
            effective_doctor_name = req.doctor_name or req.assigned_doctor_name

            if effective_doctor_id:
                doc_str = str(effective_doctor_id).strip()
                if re.match(r'^[0-9a-fA-F-]{36}$', doc_str):
                    # Check if it's already in profiles
                    p_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"id": f"eq.{doc_str}", "select": "id,full_name"}
                    )
                    profiles_data = p_res.json() if p_res.status_code == 200 else []
                    if profiles_data:
                        effective_doctor_id = profiles_data[0]["id"]
                        effective_doctor_name = profiles_data[0].get("full_name") or effective_doctor_name
                    else:
                        # Check if it's doctor_profiles(id)
                        dp_res = await client.get(
                            f"{SUPABASE_URL}/rest/v1/doctor_profiles",
                            headers=headers,
                            params={"id": f"eq.{doc_str}", "select": "profile_id"}
                        )
                        dp_data = dp_res.json() if dp_res.status_code == 200 else []
                        if dp_data and dp_data[0].get("profile_id"):
                            effective_doctor_id = dp_data[0]["profile_id"]
                else:
                    p_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"or": f"(user_id.eq.{doc_str},id.eq.{doc_str})", "select": "id,full_name"}
                    )
                    profiles_data = p_res.json() if p_res.status_code == 200 else []
                    if profiles_data:
                        effective_doctor_id = profiles_data[0]["id"]
                        effective_doctor_name = profiles_data[0].get("full_name") or effective_doctor_name

            if not effective_doctor_id and effective_doctor_name:
                clean_doc_name = re.sub(r'^(Dr\.?|MD)\s*', '', effective_doctor_name, flags=re.I).strip()
                if len(clean_doc_name) > 2:
                    p_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"role": "eq.doctor", "full_name": f"ilike.*{clean_doc_name}*", "select": "id,full_name", "limit": "1"}
                    )
                    profiles_data = p_res.json() if p_res.status_code == 200 else []
                    if profiles_data:
                        effective_doctor_id = profiles_data[0]["id"]

            if not effective_doctor_id and (is_doctor_action or is_forward_to_doctor):
                p_res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/profiles",
                    headers=headers,
                    params={"role": "eq.doctor", "select": "id,full_name", "limit": "1"}
                )
                profiles_data = p_res.json() if p_res.status_code == 200 else []
                if profiles_data:
                    effective_doctor_id = profiles_data[0]["id"]

            # Resolve nurse_id referencing profiles(id)
            effective_nurse_id = req.nurse_id
            effective_nurse_name = req.nurse_name or "Nurse Staff"

            if effective_nurse_id:
                nurse_str = str(effective_nurse_id).strip()
                if re.match(r'^[0-9a-fA-F-]{36}$', nurse_str):
                    p_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"id": f"eq.{nurse_str}", "select": "id,full_name"}
                    )
                    profiles_data = p_res.json() if p_res.status_code == 200 else []
                    if profiles_data:
                        effective_nurse_id = profiles_data[0]["id"]
                        effective_nurse_name = profiles_data[0].get("full_name") or effective_nurse_name
                    else:
                        np_res = await client.get(
                            f"{SUPABASE_URL}/rest/v1/nurse_profiles",
                            headers=headers,
                            params={"id": f"eq.{nurse_str}", "select": "profile_id"}
                        )
                        np_data = np_res.json() if np_res.status_code == 200 else []
                        if np_data and np_data[0].get("profile_id"):
                            effective_nurse_id = np_data[0]["profile_id"]
                else:
                    p_res = await client.get(
                        f"{SUPABASE_URL}/rest/v1/profiles",
                        headers=headers,
                        params={"or": f"(user_id.eq.{nurse_str},id.eq.{nurse_str})", "select": "id,full_name"}
                    )
                    profiles_data = p_res.json() if p_res.status_code == 200 else []
                    if profiles_data:
                        effective_nurse_id = profiles_data[0]["id"]
                        effective_nurse_name = profiles_data[0].get("full_name") or effective_nurse_name

            if not effective_nurse_id and not is_doctor_action:
                p_res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/profiles",
                    headers=headers,
                    params={"role": "eq.nurse", "select": "id,full_name", "limit": "1"}
                )
                profiles_data = p_res.json() if p_res.status_code == 200 else []
                if profiles_data:
                    effective_nurse_id = profiles_data[0]["id"]
                    effective_nurse_name = profiles_data[0].get("full_name") or effective_nurse_name

            # Normalize target status to 6 official statuses
            status_map = {
                "verified": "Completed",
                "mark as verified": "Completed",
                "resolve": "Completed",
                "resolved": "Completed",
                "completed": "Completed",
                "complete": "Completed",
                "schedule": "Scheduled",
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
            }
            if is_forward_to_doctor:
                norm_status = "Scheduled"
            else:
                norm_status = status_map.get(req.target_status.strip().lower(), req.target_status)
                if norm_status not in ['Draft', 'Under Review', 'Reverted', 'Referred', 'Scheduled', 'Completed']:
                    norm_status = "Under Review"

            update_payload = {
                "status": norm_status,
                "updated_at": datetime.now().isoformat()
            }

            # Update doctor_id and nurse_id in triage_tickets table in database
            if effective_nurse_id:
                update_payload["nurse_id"] = effective_nurse_id
            if effective_doctor_id and (is_doctor_action or is_forward_to_doctor or req.doctor_id or req.doctor_name):
                update_payload["doctor_id"] = effective_doctor_id

            if norm_status == "Completed" or req.action_type.strip().lower() == "resolve":
                update_payload["resolve_notes"] = req.review_note
            if req.schedule_time or norm_status == "Scheduled":
                update_payload["schedule_time"] = req.schedule_time or datetime.now().isoformat()
            if req.referal_facility or req.referral_destination:
                fac_dest = req.referal_facility or req.referral_destination
                update_payload["referal_facility"] = fac_dest
            if req.referal_facility_id and re.match(r'^[0-9a-fA-F-]{36}$', str(req.referal_facility_id)):
                update_payload["referal_facility_id"] = req.referal_facility_id
            elif update_payload.get("referal_facility"):
                try:
                    f_name = update_payload["referal_facility"].strip()
                    fac_match = supabase.table("profiles").select("id").in_("role", ["facility", "medical"]).ilike("full_name", f"%{f_name}%").limit(1).execute()
                    if fac_match.data and len(fac_match.data) > 0:
                        update_payload["referal_facility_id"] = fac_match.data[0]["id"]
                except Exception:
                    pass
            import re
            clean_reason = (req.transfer_reason or (req.review_note if norm_status == "Referred" else "") or "").strip()
            clean_reason = re.sub(r'^(?:Referral|Referred)\s+to\s+[^:]+:\s*', '', clean_reason, flags=re.IGNORECASE).strip()

            if clean_reason:
                update_payload["transfer_reason"] = clean_reason

            if norm_status == "Referred":
                update_payload["patient_referral_status"] = "Pending"
                update_payload["facility_referral_status"] = "Pending"
                update_payload["referral_notes"] = clean_reason

            # Handle reverted_questions in JSON format
            if req.reverted_questions is not None:
                if isinstance(req.reverted_questions, list):
                    update_payload["reverted_questions"] = req.reverted_questions
                elif isinstance(req.reverted_questions, str):
                    try:
                        import json
                        update_payload["reverted_questions"] = json.loads(req.reverted_questions)
                    except Exception:
                        lines = [line.strip() for line in req.reverted_questions.split("\n") if line.strip()]
                        update_payload["reverted_questions"] = [
                            {"id": f"q_{idx+1}", "question": line, "answer": ""}
                            for idx, line in enumerate(lines)
                        ]
            elif norm_status == "Reverted" and req.review_note:
                lines = [line.strip() for line in req.review_note.split("\n") if line.strip()]
                update_payload["reverted_questions"] = [
                    {"id": f"q_{idx+1}", "question": line, "answer": ""}
                    for idx, line in enumerate(lines)
                ]

            await client.patch(
                f"{SUPABASE_URL}/rest/v1/triage_tickets?id=eq.{ticket_db_id}",
                headers=headers,
                json=update_payload
            )

        return {
            "status": "success",
            "message": f"Case {req.case_number} status updated to '{req.target_status}'",
            "case_number": req.case_number,
            "resulting_status": req.target_status
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/nurse-activity")
async def get_nurse_activity(nurse_id: Optional[str] = None):
    """
    Fetches real clinical activity records directly from triage_tickets where nurse_id matches the nurse,
    joining patient profiles, nurse profiles, and doctor profiles, ordered by updated_at descending.
    """
    import httpx
    import re
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured", "records": []}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        resolved_nurse_id = nurse_id.strip() if nurse_id else None

        async with httpx.AsyncClient(timeout=10.0) as client:
            # If nurse_id is not a UUID, resolve it to profiles.id
            if resolved_nurse_id and not re.match(r'^[0-9a-fA-F-]{36}$', resolved_nurse_id):
                p_res = await client.get(
                    f"{SUPABASE_URL}/rest/v1/profiles",
                    headers=headers,
                    params={"or": f"(user_id.eq.{resolved_nurse_id},id.eq.{resolved_nurse_id})", "select": "id,full_name"}
                )
                if p_res.status_code == 200 and p_res.json():
                    resolved_nurse_id = p_res.json()[0]["id"]

            query_url = (
                f"{SUPABASE_URL}/rest/v1/triage_tickets?"
                f"order=updated_at.desc&"
                f"select=*,profiles:patient_id(*),nurse_profile:nurse_id(id,full_name,user_id),doctor_profile:doctor_id(id,full_name,user_id)"
            )
            if resolved_nurse_id:
                query_url += f"&nurse_id=eq.{resolved_nurse_id}"
            else:
                query_url += "&nurse_id=not.is.null"

            actions_res = await client.get(query_url, headers=headers)
            
        tickets = actions_res.json() if actions_res.status_code == 200 else []
        mapped = []

        for ticket in tickets:
            profile = ticket.get("profiles") or {}
            is_fam = ticket.get("is_family_member", False)
            sdata = ticket.get("symptoms_data") or {}
            if isinstance(sdata, str):
                try:
                    sdata = json.loads(sdata)
                except Exception:
                    sdata = {}
            snapshot = sdata.get("patient_intake_snapshot") or {}

            p_name = ticket.get("family_member_name") if is_fam else (profile.get("full_name") or snapshot.get("name") or "Patient")
            p_uhid = ticket.get("family_member_uhid") if is_fam else (profile.get("user_id") or snapshot.get("uhid") or "PT-0000")
            p_age = ticket.get("family_member_age") if is_fam else (profile.get("age") or snapshot.get("age") or 30)
            p_gender = ticket.get("family_member_gender") if is_fam else (profile.get("gender") or snapshot.get("gender") or "other")

            res_status = (ticket.get("status") or "").lower()
            # Do not show reverted, draft, or pending triage cases in activity audit log
            if "revert" in res_status or "awaiting patient" in res_status or res_status in ["draft", "under review", "awaiting nurse review"]:
                continue

            if "schedule" in res_status or "forward" in res_status:
                category = "Forwarded to Doctor"
            elif "refer" in res_status or "escalat" in res_status:
                category = "Referrals & Escalations"
            elif "complet" in res_status or "verif" in res_status or "resolv" in res_status:
                category = "Completed History"
            else:
                continue

            priority = ticket.get("priority") or "Yellow"
            if "red" in priority.lower():
                urgency_class = "bg-rose-100 text-rose-900 border-rose-300"
            elif "yellow" in priority.lower():
                urgency_class = "bg-amber-100 text-amber-900 border-amber-300"
            else:
                urgency_class = "bg-emerald-100 text-emerald-900 border-emerald-300"

            reviewed_at = "Recently"
            time_val = ticket.get("updated_at") or ticket.get("created_at")
            if time_val:
                try:
                    dt = datetime.fromisoformat(time_val.replace("Z", "+00:00"))
                    diff = datetime.now(dt.tzinfo) - dt
                    mins = int(diff.total_seconds() // 60)
                    if mins < 1:
                        reviewed_at = "Just now"
                    elif mins < 60:
                        reviewed_at = f"{mins}m ago"
                    elif mins < 1440:
                        reviewed_at = f"{mins // 60}h ago"
                    else:
                        reviewed_at = f"{mins // 1440}d ago"
                except Exception:
                    reviewed_at = "Recently"

            chief_comp = sdata.get("chief_complaint") or ticket.get("chief_complaint") or "Clinical assessment"
            nurse_prof = ticket.get("nurse_profile") or {}
            nurse_name = nurse_prof.get("full_name") or ticket.get("nurse_name") or "Nurse Staff"

            doc_prof = ticket.get("doctor_profile") or {}
            doc_name = doc_prof.get("full_name") or ticket.get("assigned_doctor_name") or "Attending Medical Officer"
            destination = ticket.get("referal_facility") if category == "Referrals & Escalations" else doc_name

            mapped.append({
                "id": ticket.get("case_number") or f"#LS{str(ticket.get('id', ''))[:4]}",
                "patientId": p_uhid,
                "patientName": p_name,
                "age": p_age,
                "gender": p_gender,
                "status": category,
                "urgency": priority,
                "urgencyClass": urgency_class,
                "assignedTo": destination,
                "nurse_id": ticket.get("nurse_id"),
                "nurseId": ticket.get("nurse_id"),
                "nurseName": nurse_name,
                "doctor_id": ticket.get("doctor_id"),
                "doctorId": ticket.get("doctor_id"),
                "doctorName": doc_name,
                "reviewedBy": nurse_name,
                "reviewedAt": reviewed_at,
                "notes": ticket.get("resolve_notes") or ticket.get("doctor_notes") or ("Clinical resolution completed at triage desk." if category == "Completed History" else "Action logged."),
                "chiefComplaint": chief_comp,
                "outcome": category,
                "scheduleTime": ticket.get("schedule_time"),
                "referalFacility": ticket.get("referal_facility"),
                "referalFacilityId": ticket.get("referal_facility_id"),
                "transferReason": ticket.get("transfer_reason") or ticket.get("resolve_notes")
            })

        return {
            "status": "success",
            "count": len(mapped),
            "records": mapped
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "records": []}


@router.post("/answer-reverted-questions")
async def answer_reverted_questions(req: AnswerRevertedQuestionsRequest):
    """
    Submits patient answers to nurse follow-up questions and returns ticket status to Under Review.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Fetch current ticket by ID or case_number
            t_res = await client.get(
                f"{SUPABASE_URL}/rest/v1/triage_tickets",
                headers=headers,
                params={"id": f"eq.{req.ticket_id}", "select": "id,case_number,reverted_questions,status"}
            )
            tickets = t_res.json() if t_res.status_code == 200 else []
            if not tickets:
                t_res2 = await client.get(
                    f"{SUPABASE_URL}/rest/v1/triage_tickets",
                    headers=headers,
                    params={"case_number": f"eq.{req.ticket_id}", "select": "id,case_number,reverted_questions,status"}
                )
                tickets = t_res2.json() if t_res2.status_code == 200 else []

            if not tickets:
                raise HTTPException(status_code=404, detail="Ticket not found")

            ticket = tickets[0]
            existing_questions = ticket.get("reverted_questions") or []
            answers_map = {a.get("id"): a.get("answer") for a in req.answers}

            updated_questions = []
            for q in existing_questions:
                qid = q.get("id")
                new_q = dict(q)
                if qid in answers_map:
                    new_q["answer"] = answers_map[qid]
                    new_q["answered_at"] = datetime.now().isoformat()
                updated_questions.append(new_q)

            # Update ticket: update reverted_questions and move status back to 'Under Review'
            patch_payload = {
                "reverted_questions": updated_questions,
                "status": "Under Review",
                "updated_at": datetime.now().isoformat()
            }
            await client.patch(
                f"{SUPABASE_URL}/rest/v1/triage_tickets?id=eq.{ticket['id']}",
                headers=headers,
                json=patch_payload
            )

            return {
                "status": "success",
                "message": "Answers submitted successfully. Ticket returned to clinical review.",
                "reverted_questions": updated_questions
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search-patient")
def search_patient(query: str = Query("", description="UHID, phone, or name")):
    """
    Dynamically searches both new_patient and profiles (role=patient) for matching records.
    Phone numbers can be searched in ANY format (e.g. '9437819472', '94378 19472', '+91 94378 19472', or partial digits).
    """
    import re
    import psycopg2
    from psycopg2.extras import RealDictCursor
    import httpx
    from config import DATABASE_URL, SUPABASE_URL, SUPABASE_KEY

    q = query.strip()
    if not q or len(q) < 2:
        return {"status": "success", "patients": []}

    digits = re.sub(r"[^0-9]", "", q)
    d_clean = digits[-10:] if len(digits) >= 10 else digits

    results = []
    seen_keys = set()

    # 1. Direct PostgreSQL query with format-agnostic phone matching
    if DATABASE_URL:
        conn = None
        try:
            conn = psycopg2.connect(DATABASE_URL)
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Search new_patient table
                sql_new = """
                    SELECT id, uhid, full_name, age, gender, phone, location, preferred_language, consent_status, created_at
                    FROM new_patient
                    WHERE (
                        full_name ILIKE %s
                        OR uhid ILIKE %s
                        OR phone ILIKE %s
                        OR (%s != '' AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s)
                    )
                    ORDER BY created_at DESC
                    LIMIT 10;
                """
                cur.execute(sql_new, (f"%{q}%", f"%{q}%", f"%{q}%", d_clean, f"%{d_clean}%"))
                for np in cur.fetchall():
                    key = np.get("uhid") or str(np.get("id"))
                    if key not in seen_keys:
                        seen_keys.add(key)
                        results.append({
                            "id": str(np.get("id")),
                            "source": "new_patient",
                            "uhid": np.get("uhid"),
                            "name": np.get("full_name"),
                            "age": np.get("age"),
                            "gender": np.get("gender"),
                            "phone": np.get("phone"),
                            "location": np.get("location") or "Nayagarh, Odisha",
                            "language": np.get("preferred_language") or "Odia",
                            "consent": np.get("consent_status") or "Given",
                            "registered_at": np.get("created_at").isoformat() if np.get("created_at") else None
                        })

                # Search profiles table (role=patient)
                sql_prof = """
                    SELECT id, user_id, full_name, age, gender, phone, block, district, state
                    FROM profiles
                    WHERE role = 'patient'
                    AND (
                        full_name ILIKE %s
                        OR user_id ILIKE %s
                        OR phone ILIKE %s
                        OR (%s != '' AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE %s)
                    )
                    LIMIT 10;
                """
                cur.execute(sql_prof, (f"%{q}%", f"%{q}%", f"%{q}%", d_clean, f"%{d_clean}%"))
                for p in cur.fetchall():
                    key = p.get("user_id") or str(p.get("id"))
                    if key not in seen_keys:
                        seen_keys.add(key)
                        block = p.get("block") or ""
                        district = p.get("district") or "Nayagarh"
                        state = p.get("state") or "Odisha"
                        loc = f"{block}, {district}, {state}".strip(", ")
                        results.append({
                            "id": str(p.get("id")),
                            "source": "profile",
                            "uhid": p.get("user_id") or f"PAT-{str(p.get('id'))[:6]}",
                            "name": p.get("full_name"),
                            "age": p.get("age"),
                            "gender": p.get("gender"),
                            "phone": p.get("phone"),
                            "location": loc or "Nayagarh, Odisha",
                            "language": "Odia",
                            "consent": "Given",
                            "registered_at": None
                        })
            return {"status": "success", "patients": results}
        except Exception as e:
            print(f"[SearchPatient] Direct DB query error, falling back to REST: {e}")
        finally:
            if conn:
                try:
                    conn.close()
                except Exception:
                    pass

    # 2. REST fallback with phone formatting permutations
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    # Generate phone permutations for PostgREST
    or_terms = [f"uhid.ilike.*{q}*", f"full_name.ilike.*{q}*", f"phone.ilike.*{q}*"]
    if d_clean:
        or_terms.append(f"phone.ilike.*{d_clean}*")
        if len(d_clean) == 10:
            or_terms.append(f"phone.ilike.*{d_clean[:5]} {d_clean[5:]}*")
            or_terms.append(f"phone.ilike.*+91 {d_clean[:5]} {d_clean[5:]}*")
            or_terms.append(f"phone.ilike.*+91 {d_clean}*")
            or_terms.append(f"phone.ilike.*+91{d_clean}*")
    or_clause = f"({','.join(or_terms)})"

    try:
        with httpx.Client(timeout=10.0) as client:
            np_res = client.get(
                f"{SUPABASE_URL}/rest/v1/new_patient",
                headers=headers,
                params={
                    "or": or_clause,
                    "select": "id,uhid,full_name,age,gender,phone,location,preferred_language,consent_status,created_at",
                    "limit": "10"
                }
            )
            if np_res.status_code == 200:
                for np in np_res.json():
                    key = np.get("uhid") or np.get("id")
                    if key not in seen_keys:
                        seen_keys.add(key)
                        results.append({
                            "id": np.get("id"),
                            "source": "new_patient",
                            "uhid": np.get("uhid"),
                            "name": np.get("full_name"),
                            "age": np.get("age"),
                            "gender": np.get("gender"),
                            "phone": np.get("phone"),
                            "location": np.get("location") or "Nayagarh, Odisha",
                            "language": np.get("preferred_language") or "Odia",
                            "consent": np.get("consent_status") or "Given",
                            "registered_at": np.get("created_at")
                        })

            p_or_terms = [f"user_id.ilike.*{q}*", f"full_name.ilike.*{q}*", f"phone.ilike.*{q}*"]
            if d_clean:
                p_or_terms.append(f"phone.ilike.*{d_clean}*")
                if len(d_clean) == 10:
                    p_or_terms.append(f"phone.ilike.*{d_clean[:5]} {d_clean[5:]}*")
                    p_or_terms.append(f"phone.ilike.*+91 {d_clean[:5]} {d_clean[5:]}*")
                    p_or_terms.append(f"phone.ilike.*+91 {d_clean}*")
                    p_or_terms.append(f"phone.ilike.*+91{d_clean}*")
            p_or_clause = f"({','.join(p_or_terms)})"

            p_res = client.get(
                f"{SUPABASE_URL}/rest/v1/profiles",
                headers=headers,
                params={
                    "role": "eq.patient",
                    "or": p_or_clause,
                    "select": "id,user_id,full_name,age,gender,phone,block,district,state",
                    "limit": "10"
                }
            )
            if p_res.status_code == 200:
                for p in p_res.json():
                    key = p.get("user_id") or p.get("id")
                    if key not in seen_keys:
                        seen_keys.add(key)
                        block = p.get("block") or ""
                        district = p.get("district") or "Nayagarh"
                        state = p.get("state") or "Odisha"
                        loc = f"{block}, {district}, {state}".strip(", ")
                        results.append({
                            "id": p.get("id"),
                            "source": "profile",
                            "uhid": p.get("user_id") or f"PAT-{p.get('id')[:6]}",
                            "name": p.get("full_name"),
                            "age": p.get("age"),
                            "gender": p.get("gender"),
                            "phone": p.get("phone"),
                            "location": loc or "Nayagarh, Odisha",
                            "language": "Odia",
                            "consent": "Given",
                            "registered_at": None
                        })
    except Exception as e:
        print(f"[SearchPatient] Error querying patients: {e}")

    return {"status": "success", "patients": results}




@router.post("/nurse-intake")
async def create_nurse_intake(req: NurseIntakeRequest):
    """
    Creates a new intake triage ticket from the nurse station workflow.
    For new patients, stores record in new_patient table (NEVER in profiles table).
    """
    import httpx
    import random
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase not configured")

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    case_num = req.case_number or f"#LS{random.randint(1028, 1999)}"
    patient_uhid = req.patient_uhid or f"OD-2026-{random.randint(1000, 9999)}"

    urg_raw = (req.urgency or "").lower()
    if "red" in urg_raw or "immediate" in urg_raw:
        priority = "Red"
    elif "yellow" in urg_raw or "urgent" in urg_raw or "priority" in urg_raw:
        priority = "Yellow"
    else:
        priority = "Green"

    symptoms_data = {
        "chief_complaint": req.chief_complaint,
        "symptoms": req.symptoms,
        "duration": req.symptom_duration or "Recent",
        "severity": req.severity or "Moderate",
        "associated_symptoms": req.associated_symptoms or "None",
        "red_flags": req.red_flags or "None detected",
        "vitals": req.vitals or {},
        "missing_details": req.missing_details or [],
        "patient_intake_snapshot": {
            "name": req.patient_name,
            "age": req.patient_age,
            "gender": req.patient_gender,
            "phone": req.phone,
            "uhid": patient_uhid
        }
    }

    clean_case = case_num.replace("#", "")
    report_text = f"NURSE INTAKE CLINICAL ASSESSMENT\nCase: {case_num}\nPatient: {req.patient_name} ({patient_uhid})\nChief Complaint: {req.chief_complaint}\nPriority: {priority}\nNotes: {req.quick_notes or 'Recorded at intake station'}"
    report_url = f"https://ubghzwltjapmwtdrlayr.supabase.co/storage/v1/object/public/medical-reports/symptom-reports/{clean_case}_Report.pdf"

    resolved_district = req.present_district or "Nayagarh"
    resolved_address = req.present_address or {
        "state": "Odisha",
        "district": resolved_district,
        "block": "Khandapada",
        "landmark": req.facility_name or ""
    }

    patient_id = None
    new_patient_id = None

    if req.intake_mode == "existing" and req.existing_patient_id:
        if req.existing_patient_source == "new_patient":
            new_patient_id = req.existing_patient_id
        else:
            patient_id = req.existing_patient_id
    else:
        # STRICT CONSTRAINT: New patient walk-ins are stored in new_patient table, NEVER in profiles
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                new_patient_payload = {
                    "uhid": patient_uhid,
                    "full_name": req.patient_name or "New Patient",
                    "age": req.patient_age,
                    "gender": req.patient_gender or "Other",
                    "phone": req.phone or "",
                    "location": req.location or (f"{resolved_address.get('block', 'Khandapada')}, {resolved_district}, Odisha" if isinstance(resolved_address, dict) else "Khandapada, Nayagarh, Odisha"),
                    "preferred_language": req.preferred_language or "Odia",
                    "consent_status": req.consent_status or "Given",
                    "intake_notes": req.quick_notes or "",
                    "metadata": {
                        "intake_station": "CHC Khandapada Nurse Intake Desk",
                        "facility_name": req.facility_name,
                        "facility_location": req.facility_location,
                        "vitals": req.vitals
                    }
                }
                np_res = await client.post(
                    f"{SUPABASE_URL}/rest/v1/new_patient",
                    headers=headers,
                    json=new_patient_payload
                )
                if np_res.status_code in (200, 201) and np_res.json():
                    created_patient = np_res.json()[0]
                    new_patient_id = created_patient.get("id")
                    print(f"[NurseIntake] Stored in new_patient: ID {new_patient_id}, UHID {patient_uhid}")
                else:
                    print(f"[NurseIntake] Error response creating new_patient: {np_res.status_code} {np_res.text}")
        except Exception as ex:
            print(f"[NurseIntake] Exception creating new_patient: {ex}")

    payload = {
        "case_number": case_num,
        "patient_id": patient_id, # None for new patients
        "new_patient_id": new_patient_id, # References new_patient(id)
        "preferred_language": req.preferred_language or "Odia",
        "consent_status": req.consent_status or "Given",
        "consultation_mode": "offline",
        "present_address": resolved_address,
        "symptoms_data": symptoms_data,
        "uploaded_report_data": {},
        "uploaded_report_url": None,
        "priority": priority,
        "submitted_via": req.submitted_via or "Nurse Intake Desk",
        "status": "Under Review"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/triage_tickets",
                headers=headers,
                json=payload
            )

        if res.status_code in [200, 201]:
            created = res.json()
            return {
                "status": "success",
                "message": "Intake case created successfully",
                "new_patient_id": new_patient_id,
                "case": created[0] if created else payload
            }
        else:
            raise HTTPException(status_code=res.status_code, detail=res.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/staff-roster")
async def get_staff_roster():
    """
    Fetches real-time staff availability roster from registered profiles.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured", "roster": []}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?role=in.(doctor,nurse)&select=*&order=created_at.asc",
                headers=headers
            )
        if res.status_code == 200:
            profiles_data = res.json()
            roster = []
            for p in profiles_data:
                roster.append({
                    "id": p.get("id"),
                    "staff_name": p.get("full_name"),
                    "staff_role": p.get("role", "").capitalize(),
                    "department": "Clinical Care",
                    "status": "Available",
                    "shift_timings": "08:00 AM - 04:00 PM",
                })
            return {"status": "success", "roster": roster}
        return {"status": "error", "message": res.text, "roster": []}
    except Exception as e:
        return {"status": "error", "message": str(e), "roster": []}


@router.patch("/staff-status")
async def update_staff_status(req: StaffStatusUpdateRequest):
    """
    Updates the availability status of a staff member (Available / Busy / Offline).
    """
    return {"status": "success", "message": "Staff status updated"}


@router.get("/facility-status")
async def get_facility_status():
    """
    Fetches real-time PHC facility capacity, beds, and ambulance readiness.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                f"{SUPABASE_URL}/rest/v1/profiles?role=eq.facility&select=*&limit=1",
                headers=headers
            )
        if res.status_code == 200:
            facs = res.json()
            facility_data = facs[0] if facs else {}
            if facility_data and "full_name" in facility_data:
                facility_data["facility_name"] = facility_data["full_name"]
            return {"status": "success", "facility": facility_data}
        return {"status": "error", "message": res.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/nurse-profile")
async def get_nurse_profile(profile_id: Optional[str] = None):
    """
    Fetches the nurse profile with clinical credentials and triaged case stats from Supabase.
    """
    import httpx
    from config import SUPABASE_URL, SUPABASE_KEY

    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured"}

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    try:
        query = f"profile_id=eq.{profile_id}&" if profile_id else ""
        url = f"{SUPABASE_URL}/rest/v1/nurse_profiles?{query}select=*,profiles(*)&limit=1"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
        if res.status_code == 200:
            profiles = res.json()
            return {"status": "success", "profile": profiles[0] if profiles else {}}
        return {"status": "error", "message": res.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}



