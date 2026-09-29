from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/analytics", tags=["Clinical Analytics"])

@router.get("/overview")
def get_analytics_overview():
    """
    Returns clinical analytics, syndromic surveillance, and queue metrics.
    """
    return {
        "status": "success",
        "timestamp": "2026-09-15T03:00:00Z",
        "summary": {
            "total_screened_today": 142,
            "urgent_cases": 18,
            "priority_cases": 46,
            "routine_cases": 78,
            "average_triage_minutes": 3.8,
            "doctor_verification_rate": 98.4,
            "emergency_escalations": 5
        },
        "urgency_distribution": [
            {"label": "Routine", "count": 78, "percentage": 55, "color": "#10B981"},
            {"label": "Priority", "count": 46, "percentage": 32, "color": "#F59E0B"},
            {"label": "Urgent", "count": 18, "percentage": 13, "color": "#E11D48"}
        ],
        "syndromic_surveillance": [
            {
                "syndrome": "Acute Febrile Illness (AFI)",
                "trend": "+18% this week",
                "cases": 54,
                "status": "ALERT",
                "focus_area": "Ward 7 & Sector 4 Sub-Centres (Possible Dengue cluster)"
            },
            {
                "syndrome": "Acute Respiratory Infection (ARI)",
                "trend": "-4% this week",
                "cases": 39,
                "status": "MONITORING",
                "focus_area": "General Outpatient Intake"
            },
            {
                "syndrome": "Acute Diarrheal Disease (ADD)",
                "trend": "Stable",
                "cases": 21,
                "status": "NORMAL",
                "focus_area": "Community Water Source Testing clear"
            }
        ],
        "facility_workload": [
            {"facility": "Dharavi PHC Sector 3", "active_queue": 14, "urgent_count": 2, "avg_wait": "12 min"},
            {"facility": "Kurla Community Sub-Centre", "active_queue": 9, "urgent_count": 1, "avg_wait": "8 min"},
            {"facility": "District Civil Hospital Triage Station", "active_queue": 26, "urgent_count": 6, "avg_wait": "4 min"}
        ]
    }
