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

# Hugging Face User Access Token Configuration
HF_TOKEN = os.getenv("HF_TOKEN")

HF_ROUTER_BASE = "https://router.huggingface.co/v1"
QWEN_TEXT_MODEL = "Qwen/Qwen2.5-72B-Instruct"
QWEN_VL_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct"


