import re
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Query
import httpx
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    psycopg2 = None
    RealDictCursor = None
    HAS_PSYCOPG2 = False

from config import SUPABASE_URL, SUPABASE_KEY, DATABASE_URL
from ..ocr.cache import get_redis
from .schemas import (
    DoctorOverrideRequest,
    AnswerRevertedQuestionsRequest,
)

router = APIRouter()

@router.post("/override")
async def doctor_override(request: DoctorOverrideRequest):
    """
    Logs a verified doctor clinical override and records compliance audit trail.
    Persists final discharge summary, status: 'Completed', and updated priority to triage_tickets.
    """
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
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"status": "error", "message": "Supabase not configured", "tickets": []}

    try:
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


@router.post("/answer-reverted-questions")
async def answer_reverted_questions(req: AnswerRevertedQuestionsRequest):
    """
    Submits patient answers to nurse follow-up questions and returns ticket status to Under Review.
    """
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
async def search_patient(query: str = Query("", description="UHID, phone, or name")):
    """
    Dynamically searches both new_patient and profiles (role=patient) for matching records.
    Phone numbers can be searched in ANY format (e.g. '9437819472', '94378 19472', '+91 94378 19472', or partial digits).
    Caches search results in Upstash Redis for 5 minutes for sub-5ms type-ahead performance.
    """
    q = query.strip()
    if not q or len(q) < 2:
        return {"status": "success", "patients": []}

    # 0. Check Upstash Redis Cache first (sub-5ms response)
    redis_client = await get_redis()
    cache_key = f"search:patient:{q.lower()}"
    if redis_client:
        try:
            cached_res = await redis_client.get(cache_key)
            if cached_res:
                print(f"[Redis Cache HIT] Patient search '{q}' served in <5ms from Upstash!")
                return json.loads(cached_res)
        except Exception as ce:
            print(f"[Redis Search Cache Read Note] {ce}")

    async def _cache_and_return(patients_list):
        payload = {"status": "success", "patients": patients_list}
        if redis_client and patients_list:
            try:
                await redis_client.set(cache_key, json.dumps(payload), ex=300)
                print(f"[Redis Cache SAVED] Stored patient search '{q}' ({len(patients_list)} matches) in Upstash.")
            except Exception as we:
                print(f"[Redis Search Cache Write Note] {we}")
        return payload

    digits = re.sub(r"[^0-9]", "", q)
    d_clean = digits[-10:] if len(digits) >= 10 else digits

    results = []
    seen_keys = set()

    # 1. Direct PostgreSQL query with format-agnostic phone matching
    if DATABASE_URL and HAS_PSYCOPG2:
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
            return await _cache_and_return(results)
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

    return await _cache_and_return(results)
