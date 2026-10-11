import re
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
import httpx

from clinical_engine import ClinicalTriageEngine
from config import HF_TOKEN, SUPABASE_URL, SUPABASE_KEY, TRIAGE_MODEL_URL, GROQ_API_KEY
from agents.triage_agent import triage_agent
from .schemas import (
    TriageAssessmentRequest,
    QwenSymptomExtractRequest,
    QwenTriageCaseSubmission,
)

router = APIRouter()

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


@router.post("/qwen-extract-symptoms")
@router.post("/extract-symptoms")
async def qwen_extract_symptoms(request: QwenSymptomExtractRequest):
    """
    Uses Custom Fine-Tuned Model & Clinical RAG Agent to extract structured clinical symptoms,
    relative timeline, and formulate an in-depth 8 to 10 question anamnesis sequence (SOCRATES protocol).
    """
    raw = request.raw_symptoms.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Symptom text cannot be empty.")

    return await triage_agent.extract_symptoms_and_generate_questions(
        raw_symptoms=raw,
        patient_age=request.patient_age,
        patient_gender=request.patient_gender,
        language=request.language
    )


@router.post("/qwen-priority-and-submit")
async def qwen_priority_and_submit(case: QwenTriageCaseSubmission):
    """
    Evaluates complete patient case using Qwen2.5-7B-Instruct via Hugging Face,
    assigns dynamic clinical priority (Immediate, Urgent, or Less Urgent),
    and commits the triage ticket directly to Supabase database.
    """
    # 1. Dynamic clinical priority evaluation using Triage Anamnesis Agent & SOCRATES findings
    temp_val = 98.6
    for k, v in case.follow_up_answers.items():
        if "temp" in k.lower():
            try:
                temp_val = float(str(v).replace("°F", "").replace("f", "").strip())
            except ValueError:
                pass

    has_critical_lab = False
    has_abnormal_lab = False
    if case.report_data and "parameters" in case.report_data:
        for p in case.report_data["parameters"]:
            status = p.get("status", "").upper()
            alert = p.get("alert_level", "").upper()
            if status in ["HIGH", "LOW", "CRITICAL"] or alert in ["URGENT", "PRIORITY"]:
                has_abnormal_lab = True
                name = p.get("name", "").lower()
                if "platelet" in name and (status == "LOW" or "urgent" in alert.lower()):
                    has_critical_lab = True
                if "wbc" in name and status == "HIGH":
                    has_critical_lab = True

    vitals_dict = {
        "temperature": f"{temp_val}°F",
        "has_critical_lab": has_critical_lab,
        "has_abnormal_lab": has_abnormal_lab,
    }
    if case.report_data and "parameters" in case.report_data:
        vitals_dict["lab_parameters"] = case.report_data["parameters"]

    eval_result = await triage_agent.evaluate_case(
        symptoms=case.symptoms,
        follow_up_answers=case.follow_up_answers,
        vitals=vitals_dict,
        patient_age=case.patient_age,
        patient_gender=case.patient_gender
    )

    priority_map = {
        "Immediate": "Red",
        "Urgent": "Yellow",
        "Less Urgent": "Green"
    }
    priority = priority_map.get(eval_result.get("priority", "Less Urgent"), "Green")
    clinical_reasoning = eval_result.get("clinical_reasoning", "Clinical anamnesis evaluated.")

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
            
            # Build raw_qa and 1-2 word questions_answers
            raw_qa = []
            questions_answers = {}
            processed_keys = set()

            def to_short_key(id_str: str, q_str: str) -> str:
                text = f"{q_str} {id_str}".lower()
                id_lower = (id_str or "").lower()

                # 1. Recurrence & Frequency (checked first so "how often does fever/shivering come back" maps accurately)
                if "come back" in text or "how often" in text or "frequency" in id_lower:
                    return "recurrence_frequency"

                # 2. Associated Symptoms & Red Flags (checked before single symptom matches)
                if (
                    "cough, sore throat" in text or
                    "skin spots" in text or
                    "other problems" in text or
                    "associated" in text or
                    "associated_symptoms" in id_lower or
                    ("vomiting" in text and "cough" in text) or
                    ("spots" in text and "bleeding" in text)
                ):
                    return "associated_symptoms"

                # 3. Daily persistence / duration during the day
                if "how long does the fever stay high" in text or ("stay high" in text and "day" in text):
                    return "daily_persistence"

                # 4. Fever & Temperature specific
                if "how high" in text or ("fever" in text and "shiver" in text) or "chills" in text:
                    return "fever_and_chills"
                if "how many days" in text or "days have you had this fever" in text or ("onset" in id_lower and "fever" in text):
                    return "fever_duration"
                if "feel during the day" in text or "how does the fever feel" in text:
                    return "daily_fever_pattern"
                if "fever medicine" in text or "paracetamol" in text or ("medicine" in text and "bring the fever down" in text):
                    return "medicine_response"
                if "temperature" in text or "temp" in text:
                    return "body_temperature"

                # 5. Weakness, mental state & fatigue
                if "how weak" in text or "sleepy" in text or "dizzy" in text or "confused" in text:
                    return "weakness_severity"

                # 6. Spreading / Radiation / Bones / Joints
                if "spreading" in text or "bones" in text or "joints" in text or "move" in text or "radiation" in id_lower:
                    if "bone" in text or "joint" in text:
                        return "joint_or_bone_pain"
                    return "pain_radiation"

                # 7. Pain Location & Site
                if "where does" in text or "where on your body" in text or "where in your chest" in text or "hurt most" in text or "location" in id_lower:
                    return "pain_location"

                # 8. Onset / Timing / Start
                if "when did" in text or "did it happen suddenly" in text or "start time" in text or "onset" in id_lower:
                    return "onset_timing"

                # 9. Aggravating & Relieving Factors
                if "better or worse" in text or "touching your belly" in text or "aggravating" in id_lower:
                    return "aggravating_relieving_factors"

                # 9. Specific organ complaints
                if "chest pain" in text or "chest" in id_lower:
                    return "chest_pain"
                if "headache" in text:
                    return "headache_severity"
                if "breath" in text or "dyspnea" in text or "gasping" in text:
                    return "breathing_difficulty"
                if "cough" in text:
                    return "cough_details"
                if "vomit" in text or "nausea" in text:
                    return "vomiting_nausea"
                if "rash" in text or "spot" in text:
                    return "skin_rashes"
                if "stomach" in text or "belly" in text or "abdomen" in text:
                    return "abdominal_pain"

                # 10. Character & Severity generic
                if "character" in id_lower or "kind of pain" in text or "what does it feel like" in text:
                    return "symptom_character"
                if "severity" in id_lower or "scale of 0 to 10" in text or "how strong" in text or "pain" in text:
                    return "pain_severity"
                if "duration" in id_lower or "how long" in text:
                    return "symptom_duration"

                # 11. Clean semantic fallback
                clean_str = re.sub(r'^q\d+[_a-z0-9]*', '', f"{q_str} {id_str}", flags=re.IGNORECASE)
                clean_str = re.sub(r'[^a-zA-Z0-9 ]', ' ', clean_str).lower()
                stop_words = {"how", "what", "where", "when", "does", "do", "you", "your", "have", "with", "the", "a", "an", "is", "are", "along", "most", "any"}
                words = [w for w in clean_str.split() if len(w) > 2 and w not in stop_words]
                if len(words) >= 2:
                    return f"{words[0]}_{words[1]}"
                if len(words) == 1:
                    return words[0]
                return "clinical_detail"

            for fq in (case.follow_up_questions or []):
                q_text = fq.get("question") or fq.get("title") or ""
                q_id = fq.get("id") or ""
                ans_val = case.follow_up_answers.get(q_id) if case.follow_up_answers else None
                if ans_val is None and case.follow_up_answers:
                    ans_val = case.follow_up_answers.get(q_text)
                if ans_val is not None and str(ans_val).strip():
                    unit = fq.get("unit") or ""
                    formatted_ans = str(ans_val).strip() + (unit if unit and unit not in str(ans_val) else "")
                    raw_qa.append({"question": q_text or q_id, "answer": formatted_ans})
                    short_k = to_short_key(q_id, q_text)
                    questions_answers[short_k] = formatted_ans
                    if q_id:
                        processed_keys.add(q_id)
                    if q_text:
                        processed_keys.add(q_text)

            for k, v in (case.follow_up_answers or {}).items():
                if k not in processed_keys and v is not None and str(v).strip():
                    ans_str = str(v).strip()
                    raw_qa.append({"question": k, "answer": ans_str})
                    short_k = to_short_key("", k)
                    questions_answers[short_k] = ans_str

            raw_complaint = (getattr(case, "raw_complaint", None) or getattr(case, "symptom_text", None) or "").strip()
            syms_str = ", ".join(case.symptoms) if case.symptoms else "clinical symptoms"

            # Simple clean summary fallback (never dump full questions and answers)
            if raw_complaint:
                summary_text = f"Patient presents with {syms_str}. Primary complaint: {raw_complaint}."
            else:
                summary_text = f"Patient presents with {syms_str} for clinical triage evaluation."

            groq_key = GROQ_API_KEY or ""
            if groq_key:
                try:
                    qa_context = ". ".join([f"{i['question']}: {i['answer']}" for i in raw_qa[:6]])
                    prompt = f"Reported Symptoms: {syms_str}\nPrimary Complaint: {raw_complaint or 'None'}\nIntake Details: {qa_context or 'None'}"
                    for gm in ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                        with httpx.Client(timeout=4.0) as client:
                            resp = client.post(
                                "https://api.groq.com/openai/v1/chat/completions",
                                headers={
                                    "Authorization": f"Bearer {groq_key}",
                                    "Content-Type": "application/json"
                                },
                                json={
                                    "model": gm,
                                    "messages": [
                                        {"role": "system", "content": "You are an emergency clinical triage assistant. Generate a simple, concise 1 to 2 sentence clinical summary (maximum 30 words) describing the patient's condition. Do NOT repeat or list questions or answers verbatim. Do NOT use bullet points, markdown bolding, or headers. Output only plain summary text."},
                                        {"role": "user", "content": prompt}
                                    ],
                                    "temperature": 0.2,
                                    "max_tokens": 100
                                }
                            )
                            if resp.status_code == 200:
                                parsed_c = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                                if parsed_c and "?:" not in parsed_c and len(parsed_c) < 280:
                                    summary_text = parsed_c.strip("\"'")
                                    break
                except Exception as ge:
                    print(f"[Groq Summary Exception]: {ge}")
            symptoms_data = {
                "symptoms": case.symptoms or [],
                "raw_complaint": raw_complaint or (", ".join(case.symptoms) if case.symptoms else ""),
                "summary": summary_text,
                "questions_answers": questions_answers,
                "raw_qa": raw_qa,
                "current_step": case.current_step if case.current_step else 1,
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
                "landmark": getattr(case, "landmark", "") or "",
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
