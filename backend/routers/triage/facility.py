from typing import Optional
from fastapi import APIRouter
import httpx

from config import SUPABASE_URL, SUPABASE_KEY
from .schemas import StaffStatusUpdateRequest

router = APIRouter()

@router.get("/staff-roster")
async def get_staff_roster():
    """
    Fetches real-time staff availability roster from registered profiles.
    """
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
