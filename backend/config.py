import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", ""))
DATABASE_URL = os.getenv("DATABASE_URL", "")
PORT = int(os.getenv("PORT", 8000))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

# Model & Hugging Face Configuration
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Custom Fine-Tuned Model URLs (from Kaggle ngrok tunnels, HF endpoints, or local vLLM)
TRIAGE_MODEL_URL = os.getenv("TRIAGE_MODEL_URL", os.getenv("HF_ROUTER_BASE", "https://router.huggingface.co/v1"))
OCR_MODEL_URL = os.getenv("OCR_MODEL_URL", os.getenv("HF_ROUTER_BASE", "https://router.huggingface.co/v1"))

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

# Hugging Face & Model Configuration
HF_ROUTER_BASE = os.getenv("HF_ROUTER_BASE", "https://router.huggingface.co/v1")
CUSTOM_TRIAGE_MODEL = os.getenv("CUSTOM_TRIAGE_MODEL", "clinical-triage-doctor")
CUSTOM_OCR_MODEL = os.getenv("CUSTOM_OCR_MODEL", "clinical-ocr-scanner")



