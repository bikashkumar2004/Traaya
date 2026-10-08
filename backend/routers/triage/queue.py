import re
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter
import httpx

from config import SUPABASE_URL, SUPABASE_KEY

router = APIRouter()

@router.get("/nurse-queue")
async def get_nurse_queue(facility_id: Optional[str] = None, facility_name: Optional[str] = None):
    """
    Fetches the live clinical triage queue from Supabase with attached medical reports,
    ordered by creation date descending, scoped to the nurse's assigned facility.
    """
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


@router.get("/nurse-activity")
async def get_nurse_activity(nurse_id: Optional[str] = None):
    """
    Fetches real clinical activity records directly from triage_tickets where nurse_id matches the nurse,
    joining patient profiles, nurse profiles, and doctor profiles, ordered by updated_at descending.
    """
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
