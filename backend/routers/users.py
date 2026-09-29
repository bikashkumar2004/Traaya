from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

router = APIRouter(prefix="/api/users", tags=["Users & Profiles"])

class UserProfile(BaseModel):
    id: str
    email: Optional[str] = None
    full_name: str
    role: str = "patient" # 'patient', 'nurse', 'doctor', 'admin'
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    abha_id: Optional[str] = None
    facility_name: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    blood_group: Optional[str] = None
    facility_name: Optional[str] = None

# In-memory storage fallback for demo mode
DEMO_PROFILES = {
    "patient-demo-1": {
        "id": "patient-demo-1",
        "email": "aarav.sharma@example.com",
        "full_name": "Aarav Sharma",
        "role": "patient",
        "phone": "+91 98765 43210",
        "gender": "male",
        "date_of_birth": "1988-06-14",
        "blood_group": "B+",
        "abha_id": "91-4421-8932-1049",
        "facility_name": "Dharavi PHC Sector 3"
    },
    "nurse-demo-1": {
        "id": "nurse-demo-1",
        "email": "priya.nair@phc.gov.in",
        "full_name": "Priya Nair, ANM",
        "role": "nurse",
        "phone": "+91 98230 11223",
        "gender": "female",
        "date_of_birth": "1992-11-04",
        "blood_group": "O+",
        "abha_id": "91-8812-4521-9901",
        "facility_name": "Sector 4 Community Sub-Centre"
    },
    "doctor-demo-1": {
        "id": "doctor-demo-1",
        "email": "dr.kavita.verma@district.gov.in",
        "full_name": "Dr. Kavita Verma, MD",
        "role": "doctor",
        "phone": "+91 99100 88776",
        "gender": "female",
        "date_of_birth": "1980-03-22",
        "blood_group": "A+",
        "abha_id": "91-3301-9021-4412",
        "facility_name": "District Civil Hospital & Emergency Unit"
    },
    "org-demo-1": {
        "id": "org-demo-1",
        "email": "wellness@nit-rourkela.ac.in",
        "full_name": "NIT & PSU Employee Health Division",
        "role": "organization",
        "phone": "+91 94371 00221",
        "gender": "other",
        "facility_name": "National Institute Health Centre & PSU Wellness"
    },
    "camp-demo-1": {
        "id": "camp-demo-1",
        "email": "camp.nayagarh@odishahealth.org",
        "full_name": "Nayagarh Rural Outreach Health Camp #4",
        "role": "healthcamp",
        "phone": "+91 98612 88440",
        "gender": "other",
        "facility_name": "Mobile Medical Unit & Rural Camp"
    },
    "medical-demo-1": {
        "id": "medical-demo-1",
        "email": "dispensary.chc@odishahealth.gov.in",
        "full_name": "CHC Central Pharmacy & Diagnostic Lab",
        "role": "medical",
        "phone": "+91 94370 77890",
        "gender": "other",
        "facility_name": "Jan Aushadhi Kendra & CHC Pathology"
    }
}

@router.get("/profile/{user_id}", response_model=UserProfile)
def get_user_profile(user_id: str):
    profile = DEMO_PROFILES.get(user_id)
    if not profile:
        # Generate default profile for unknown demo ID
        return UserProfile(
            id=user_id,
            email=f"{user_id}@example.com",
            full_name=f"User {user_id}",
            role="patient",
            abha_id="91-9988-7766-5544"
        )
    return UserProfile(**profile)

@router.put("/profile/{user_id}")
def update_user_profile(user_id: str, request: ProfileUpdateRequest):
    if user_id not in DEMO_PROFILES:
        DEMO_PROFILES[user_id] = {
            "id": user_id,
            "full_name": request.full_name or "User",
            "role": "patient",
            "email": f"{user_id}@example.com"
        }
    
    update_data = request.model_dump(exclude_unset=True)
    DEMO_PROFILES[user_id].update(update_data)
    return {"status": "success", "profile": DEMO_PROFILES[user_id]}

@router.get("/directory")
def get_directory(role: Optional[str] = None):
    results = list(DEMO_PROFILES.values())
    if role:
        results = [p for p in results if p.get("role") == role]
    return {"status": "success", "users": results}
