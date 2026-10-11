from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routers import triage, ocr, users, analytics, reminders, auth

tags_metadata = [
    {
        "name": "System Health",
        "description": "Platform status, health probe, and API root discovery.",
    },
    {
        "name": "Authentication & Security",
        "description": "Secure JWT authentication, role-based login, and HTTP-only session management.",
    },
    {
        "name": "Clinical Triage Engine",
        "description": "Multi-step anamnesis intake, algorithmic tri-color urgency classification, and physician overrides.",
    },
    {
        "name": "OCR Lab Diagnostics",
        "description": "Automated medical report OCR scanner and clinical metric parser (CBC, Sugar, Vitals).",
    },
    {
        "name": "Users & Profiles",
        "description": "Patient ABHA profiles, practitioner records, and health worker directories.",
    },
    {
        "name": "Syndromic Analytics",
        "description": "Real-time epidemiological surveillance and syndromic outbreak monitoring.",
    },
    {
        "name": "Patient Reminders",
        "description": "Automated appointment reminders and medication follow-up scheduler.",
    },
]

app = FastAPI(
    title="TriageAssist Healthcare Platform API",
    description="""
## 🏥 Ayushman Bharat & ABDM Compliant Primary Healthcare API

Welcome to the **TriageAssist Swagger API Documentation**.

Explore and test interactive endpoints below:
- **Interactive Swagger UI**: [`/docs`](/docs) or [`/swagger`](/swagger)
- **Alternative ReDoc UI**: [`/redoc`](/redoc)
- **Raw OpenAPI Specification**: [`/openapi.json`](/openapi.json)
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    openapi_tags=tags_metadata,
)

# CORS configuration supporting credentials (required for HttpOnly cookies)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount feature routers
app.include_router(auth.router)
app.include_router(triage.router)
app.include_router(ocr.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(reminders.router)

@app.get("/swagger", include_in_schema=False)
def swagger_redirect():
    """Convenience redirect to Swagger UI"""
    return RedirectResponse(url="/docs")

@app.get("/", tags=["System Health"])
def root():
    return {
        "platform": "TriageAssist Healthcare Platform",
        "status": "online",
        "version": "1.0.0",
        "swagger_docs": "/docs",
        "redoc": "/redoc",
        "disclaimer": "Assistive clinical triage tool only. Not a definitive clinical diagnosis."
    }

@app.get("/health", tags=["System Health"])
def health_check():
    return {"status": "healthy", "service": "triageassist-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
