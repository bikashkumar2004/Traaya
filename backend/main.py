from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routers import triage, ocr, users, analytics, reminders, auth

app = FastAPI(
    title="TriageAssist Healthcare Platform API",
    description="Clinical Triage Intelligence, Lab OCR Extraction & Healthcare Operations API",
    version="1.0.0"
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

@app.get("/")
def root():
    return {
        "platform": "TriageAssist Healthcare Platform",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "disclaimer": "Assistive clinical triage tool only. Not a definitive clinical diagnosis."
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "triageassist-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
