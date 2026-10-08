from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union

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

class QwenSymptomExtractRequest(BaseModel):
    raw_symptoms: str
    language: Optional[str] = "English"
    patient_age: Optional[int] = 42
    patient_gender: Optional[str] = "Male"

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
    landmark: Optional[str] = None

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
