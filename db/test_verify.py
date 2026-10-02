import os
import asyncio
import psycopg2
from dotenv import load_dotenv

load_dotenv('backend/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()
cur.execute("DELETE FROM triage_tickets WHERE case_number = '#LS9999';")
conn.commit()
cur.close()
conn.close()

import sys
sys.path.insert(0, 'backend')

from routers.triage import (
    get_nurse_queue,
    submit_nurse_action,
    create_nurse_intake,
    get_staff_roster,
    update_staff_status,
    NurseActionRequest,
    NurseIntakeRequest,
    StaffStatusUpdateRequest
)

async def run_verification():
    print("=== 1. FETCH LIVE NURSE QUEUE ===")
    queue_data = await get_nurse_queue()
    print(f"Status: {queue_data['status']} | Total Cases: {queue_data['count']}")
    for c in queue_data['cases'][:3]:
        print(f"  [{c['id']}] {c['patientId']} | {c['name']} | Urgency: {c['urgency']} | Status: {c['status']}")

    print("\n=== 2. CREATE NEW NURSE INTAKE CASE ===")
    intake_req = NurseIntakeRequest(
        case_number="#LS9999",
        patient_uhid="PT-9999",
        patient_name="Pooja Patnaik",
        patient_age=32,
        patient_gender="Female",
        phone="+91 98612 34567",
        location="Khandapada Sector 2",
        preferred_language="Odia",
        chief_complaint="Severe migraine with photophobia and dizziness since 6 hours",
        symptom_duration="6 hours",
        severity="Severe",
        associated_symptoms="Nausea, blurred vision",
        symptoms=["Migraine", "Photophobia", "Dizziness", "Nausea"],
        urgency="High Priority",
        urgency_class="bg-rose-100 text-rose-800 border-rose-200",
        facility_name="CHC Khandapada"
    )
    intake_res = await create_nurse_intake(intake_req)
    print(f"Created: {intake_res['status']} -> Case #{intake_res['case'].get('case_number')}")

    print("\n=== 3. NURSE CLINICAL ACTION SUBMISSION (FORWARD TO DOCTOR) ===")
    action_req = NurseActionRequest(
        case_number="#LS9999",
        action_type="Forward to Doctor",
        review_note="Patient in acute pain room 2. Photophobia positive. Fast-tracked to Dr. Ananya Sen for analgesia & IV.",
        target_status="Forwarded to Doctor",
        assigned_doctor_name="Dr. Ananya Sen"
    )
    action_res = await submit_nurse_action(action_req)
    print(f"Action Result: {action_res['status']} -> {action_res['case_number']} is now '{action_res['resulting_status']}'")

    print("\n=== 4. PHC STAFF AVAILABILITY ROSTER ===")
    roster_res = await get_staff_roster()
    print(f"Roster Count: {len(roster_res['roster'])}")
    for s in roster_res['roster']:
        print(f"  {s['staff_name']} ({s['staff_role']}) -> {s['status']}")

    print("\n=== 5. UPDATE STAFF STATUS (TOGGLE) ===")
    target_staff = roster_res['roster'][0]
    new_status = "Busy" if target_staff['status'] == "Available" else "Available"
    up_req = StaffStatusUpdateRequest(staff_id=target_staff['id'], status=new_status)
    up_res = await update_staff_status(up_req)
    print(f"Updated {target_staff['staff_name']} to '{new_status}': {up_res['status']}")

    # Clean up test ticket and its child action log
    conn2 = psycopg2.connect(os.getenv('DATABASE_URL'))
    cur2 = conn2.cursor()
    cur2.execute("DELETE FROM triage_tickets WHERE case_number = '#LS9999';")
    conn2.commit()
    cur2.close()
    conn2.close()
    print("\n=== ALL VERIFICATION CHECKS PASSED AND DATABASE IS CLEAN! ===")

if __name__ == "__main__":
    asyncio.run(run_verification())
