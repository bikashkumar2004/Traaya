from pydantic import BaseModel
from typing import Optional

class QwenVLScanRequest(BaseModel):
    file_name: Optional[str] = "CBC_Report.pdf"
    file_base64: Optional[str] = None
    report_type: Optional[str] = "CBC"
    patient_id: Optional[str] = None

class LinkReportRequest(BaseModel):
    record_id: Optional[str] = None
    ticket_id: Optional[str] = "2cb0a4ad-3e86-4b6d-9ef0-5ef9a2294921"
    file_url: Optional[str] = None
