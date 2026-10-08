import random
from typing import Optional

from fastapi import APIRouter, HTTPException
import httpx

from config import SUPABASE_URL, SUPABASE_KEY
from .schemas import NurseIntakeRequest

router = APIRouter()

@router.post("/nurse-intake")
async def create_nurse_intake(req: NurseIntakeRequest):
    """
    Creates a new intake triage ticket from the nurse station workflow.
    For new patients, stores record in new_patient table (NEVER in profiles table).
    """
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
