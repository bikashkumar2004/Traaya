import re
import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
import httpx

from clinical_engine import ClinicalTriageEngine
from config import HF_TOKEN, SUPABASE_URL, SUPABASE_KEY, TRIAGE_MODEL_URL
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
