"""
Universal Model Client for TriageAssist
Connects to the user's fine-tuned model (hosted via Kaggle ngrok,
Hugging Face Inference Endpoint, or local container).
"""

import os
from typing import Optional, List, Dict, Any
import httpx
from config import HF_TOKEN, TRIAGE_MODEL_URL, OCR_MODEL_URL, CUSTOM_TRIAGE_MODEL, CUSTOM_OCR_MODEL


class CustomModelClient:
    """
    Client for invoking user's custom fine-tuned models hosted on:
    - Kaggle (via ngrok public HTTPS tunnel)
    - Hugging Face Inference Endpoints
    - Local or cloud vLLM / TGI / FastAPI instances
    """

    def __init__(self):
        self.hf_token = (HF_TOKEN or "").strip()

    async def invoke_chat(
        self,
        endpoint_url: str,
        messages: List[Dict[str, str]],
        max_tokens: int = 400,
        temperature: float = 0.2,
        model_name: Optional[str] = None,
        timeout: float = 60.0
    ) -> Optional[str]:
        """
        Sends an OpenAI-compatible /chat/completions request to the specified endpoint.
        """
        if not endpoint_url:
            return None

        # Ensure correct completion path
        target = endpoint_url.strip()
        if not target.endswith("/chat/completions"):
            if target.endswith("/v1"):
                target = f"{target}/chat/completions"
            elif "/v1" not in target:
                target = f"{target.rstrip('/')}/v1/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "TriageAssist-Agent/1.0",
            "ngrok-skip-browser-warning": "true"
        }
        if self.hf_token:
            headers["Authorization"] = f"Bearer {self.hf_token}"

        payload = {
            "model": model_name or CUSTOM_TRIAGE_MODEL,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                resp = await client.post(target, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "")
                else:
                    safe_text = resp.text[:120].encode("ascii", errors="ignore").decode("ascii")
                    print(f"[Model Call Warning] Endpoint {target} returned status {resp.status_code}: {safe_text}")
        except Exception as e:
            err_msg = str(e).encode("ascii", errors="ignore").decode("ascii")
            print(f"[Model Call Notice] Connection to {target} failed: {err_msg}. Utilizing dynamic RAG engine.")

        return None

    async def invoke_triage_model(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Calls the user's fine-tuned triage/doctor model."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        return await self.invoke_chat(
            endpoint_url=TRIAGE_MODEL_URL,
            messages=messages,
            max_tokens=600,
            temperature=0.2,
            timeout=60.0
        )

    async def invoke_ocr_model(self, prompt: str, system_prompt: str = "") -> Optional[str]:
        """Calls the user's fine-tuned medical report OCR scanner model."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        return await self.invoke_chat(
            endpoint_url=OCR_MODEL_URL,
            messages=messages,
            max_tokens=800,
            temperature=0.1,
            model_name=CUSTOM_OCR_MODEL,
            timeout=120.0
        )


custom_model_client = CustomModelClient()
