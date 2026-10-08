from fastapi import APIRouter

from .schemas import (
    VitalsInput,
    TriageAssessmentRequest,
    DoctorOverrideRequest,
    QwenSymptomExtractRequest,
    QwenTriageCaseSubmission,
    NurseActionRequest,
    AnswerRevertedQuestionsRequest,
    StaffStatusUpdateRequest,
    NurseIntakeRequest,
)

from .symptoms import router as symptoms_router
from .tickets import router as tickets_router
from .queue import router as queue_router
from .actions import router as actions_router
from .intake import router as intake_router
from .facility import router as facility_router

router = APIRouter(prefix="/api/triage", tags=["Clinical Triage"])

# Mount all domain sub-routers into the unified /api/triage route group
router.include_router(symptoms_router)
router.include_router(tickets_router)
router.include_router(queue_router)
router.include_router(actions_router)
router.include_router(intake_router)
router.include_router(facility_router)

__all__ = [
    "router",
    "VitalsInput",
    "TriageAssessmentRequest",
    "DoctorOverrideRequest",
    "QwenSymptomExtractRequest",
    "QwenTriageCaseSubmission",
    "NurseActionRequest",
    "AnswerRevertedQuestionsRequest",
    "StaffStatusUpdateRequest",
    "NurseIntakeRequest",
]
