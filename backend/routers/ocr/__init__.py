from fastapi import APIRouter

from .schemas import QwenVLScanRequest, LinkReportRequest
from .inquiries import generate_esanjeevani_inquiries
from .summaries import generate_patient_summary_details
from .scanner import router as scanner_router

router = APIRouter(prefix="/api/ocr", tags=["OCR Report Extraction"])
router.include_router(scanner_router)

__all__ = [
    "router",
    "QwenVLScanRequest",
    "LinkReportRequest",
    "generate_esanjeevani_inquiries",
    "generate_patient_summary_details",
]
