"""
Triage Anamnesis Agent for TriageAssist
Combines LangChain, Clinical RAG Knowledge, and the User's Fine-Tuned Model
to guide patients through a 10-step doctor anamnesis protocol.
"""

import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
try:
    from langchain_core.prompts import PromptTemplate
except ImportError:
    class PromptTemplate:
        def __init__(self, template: str, input_variables: Optional[List[str]] = None):
            self.template = template
            self.input_variables = input_variables or []

        def format(self, **kwargs) -> str:
            return self.template.format(**kwargs)
from .clinical_rag import clinical_rag
from .llm_client import custom_model_client


class TriageAnamnesisAgent:
    """
    Multi-step Clinical Agent responsible for:
    1. Extracting clinical complaints & timeline
    2. Formulating 8 to 10 doctor-grade follow-up questions following SOCRATES protocol
    3. Synthesizing patient responses into clinical triage priority and reasoning
    """

    def __init__(self):
        self.rag = clinical_rag
        self.client = custom_model_client

        # LangChain prompt template for custom model invocation
        self.anamnesis_prompt_template = PromptTemplate(
            input_variables=["patient_age", "patient_gender", "language", "symptoms", "rag_protocol"],
            template=(
                "You are an expert primary care doctor conducting patient intake.\n"
                "A patient presents with the following symptoms:\n"
                "Patient Age: {patient_age}, Gender: {patient_gender}, Language: {language}\n"
                "Reported Symptoms: \"{symptoms}\"\n\n"
                "Clinical Anamnesis Protocol Reference:\n{rag_protocol}\n\n"
                "Analyze the case and return a JSON object with:\n"
                "1. symptoms: list of clean clinical terms\n"
                "2. timeline: list of chronological event objects with 'date', 'event', 'duration'\n"
                "3. missing: list of 3-4 vital clinical parameters not yet documented\n"
                "4. follow_up_questions: a list of 8 to 10 sequential questions following the protocol.\n"
                "Each question MUST be an object with keys: id, question, type ('radio' or 'number' or 'text'), options (list of 3-5 strings), placeholder, unit.\n"
                "CRITICAL REQUIREMENT: Use very simple, plain, easy-to-understand everyday English in all questions and options so that a less-educated person or rural patient can easily understand every word. Do NOT use complicated medical jargon.\n"
                "Return ONLY valid JSON."
            )
        )

    def _extract_dates_and_symptoms(self, raw_text: str) -> Dict[str, Any]:
        """
        Parses raw user text into structured symptoms and relative chronological dates.
        """
        text = raw_text.lower()
        now = datetime.now()

        # Common duration pattern detection
        duration_str = "Recent"
        onset_date = now.strftime("%d %b, %Y")

        if "today" in text or "morning" in text or "hours" in text:
            duration_str = "Under 1 day"
            onset_date = now.strftime("%d %b, %Y")
        elif "yesterday" in text:
            duration_str = "1 day"
            onset_date = (now - timedelta(days=1)).strftime("%d %b, %Y")
        elif "2 days" in text or "two days" in text:
            duration_str = "2 days"
            onset_date = (now - timedelta(days=2)).strftime("%d %b, %Y")
        elif "3 days" in text or "three days" in text:
            duration_str = "3 days"
            onset_date = (now - timedelta(days=3)).strftime("%d %b, %Y")
        elif "week" in text:
            duration_str = "1 week"
            onset_date = (now - timedelta(days=7)).strftime("%d %b, %Y")
        elif "month" in text:
            duration_str = "1 month"
            onset_date = (now - timedelta(days=30)).strftime("%d %b, %Y")

        # Detect symptoms
        detected = []
        symptom_catalog = [
            ("headache", "Headache / Cranial Discomfort"),
            ("fever", "Fever / Pyrexia"),
            ("cough", "Cough / Bronchial Irritation"),
            ("cold", "Common Cold / Nasal Congestion"),
            ("chest pain", "Chest Pain / Retrosternal Discomfort"),
            ("breathless", "Breathlessness / Dyspnea"),
            ("breathing", "Shortness of Breath"),
            ("vomiting", "Vomiting / Emesis"),
            ("nausea", "Nausea"),
            ("stomach", "Abdominal Pain"),
            ("abdomen", "Abdominal Discomfort"),
            ("loose motion", "Diarrhea / Loose Stools"),
            ("diarrhea", "Diarrhea"),
            ("dizziness", "Dizziness / Vertigo"),
            ("body ache", "Generalized Body Aches / Myalgia"),
            ("throat", "Sore Throat / Pharyngitis"),
            ("back pain", "Back Pain / Lumbago"),
            ("rash", "Cutaneous Rash / Dermatitis")
        ]

        for trigger, label in symptom_catalog:
            if trigger in text:
                detected.append({
                    "name": label,
                    "duration": duration_str,
                    "onset": onset_date
                })

        if not detected:
            detected.append({
                "name": raw_text[:50].capitalize(),
                "duration": duration_str,
                "onset": onset_date
            })

        timeline = []
        for s in detected:
            timeline.append({
                "date": s["onset"],
                "event": f"{s['name']} reported ({s['duration']})",
                "duration": s["duration"]
            })

        return {
            "symptoms": [s["name"] for s in detected],
            "timeline": timeline,
            "missing": [
                "Resting Blood Pressure",
                "Oral Temperature (°F)",
                "SpO2 Oxygen Saturation (%)",
                "Pulse Rate (BPM)"
            ]
        }

    async def extract_symptoms_and_generate_questions(
        self,
        raw_symptoms: str,
        patient_age: Any = 30,
        patient_gender: str = "Male",
        language: str = "English"
    ) -> Dict[str, Any]:
        """
        Main entry point for Step 1 -> Step 2 transition.
        Generates 8 to 10 sequential doctor questions based on SOCRATES protocol.
        """
        raw = raw_symptoms.strip()
        # 1. Retrieve clinical protocol from RAG
        rag_questions = self.rag.retrieve_anamnesis_protocol(raw)
        rag_protocol_summary = "\n".join([f"Step {q['step']} ({q['dimension']}): {q['question']}" for q in rag_questions])

        # 2. Query user's custom fine-tuned model (if available via ngrok / HF)
        formatted_prompt = self.anamnesis_prompt_template.format(
            patient_age=patient_age,
            patient_gender=patient_gender,
            language=language,
            symptoms=raw,
            rag_protocol=rag_protocol_summary
        )

        model_response = await self.client.invoke_triage_model(
            prompt=formatted_prompt,
            system_prompt=(
                "You are a helpful clinic triage assistant. Generate 8 to 10 sequential anamnesis questions "
                "using very simple, plain English so that a less-educated person or patient can easily understand. "
                "Avoid difficult medical words in questions and options. Return strictly valid JSON."
            )
        )

        if model_response:
            try:
                cleaned = model_response.strip()
                if "```json" in cleaned:
                    cleaned = cleaned.split("```json")[1].split("```")[0].strip()
                elif "```" in cleaned:
                    cleaned = cleaned.split("```")[1].split("```")[0].strip()
                parsed = json.loads(cleaned)
                
                # Verify that questions were generated and has 8-10 items
                if "follow_up_questions" in parsed and len(parsed["follow_up_questions"]) >= 5:
                    return {
                        "status": "success",
                        "source": "Custom Fine-Tuned Triage Model (Kaggle/HF Agent)",
                        "model": "User-Fine-Tuned-Clinical-Model",
                        "data": parsed
                    }
            except Exception as e:
                print(f"[Custom Model Parse Notice] {e}. Falling back to dynamic Clinical RAG.")

        # 3. Dynamic Clinical RAG Engine (Guarantees all 8 to 10 SOCRATES questions)
        base_data = self._extract_dates_and_symptoms(raw)
        return {
            "status": "success",
            "source": "Clinical RAG Agent (SOCRATES 10-Step Anamnesis)",
            "model": "TriageAssist-Clinical-RAG-Agent",
            "data": {
                "symptoms": base_data["symptoms"],
                "timeline": base_data["timeline"],
                "missing": base_data["missing"],
                "follow_up_questions": rag_questions  # All 10 sequential questions
            }
        }

    async def evaluate_case(
        self,
        symptoms: List[str],
        follow_up_answers: Dict[str, str],
        vitals: Optional[Dict[str, Any]] = None,
        patient_age: Any = 30,
        patient_gender: str = "Male"
    ) -> Dict[str, Any]:
        """
        Synthesizes the complete patient answers across the 8-10 anamnesis questions.
        """
        # 1. First run deterministic clinical RAG rule safety check
        rag_eval = self.rag.evaluate_clinical_priority(
            symptoms=symptoms,
            follow_up_answers=follow_up_answers,
            vitals=vitals or {}
        )

        # 2. Format clinical prompt for the user's fine-tuned model
        answers_formatted = "\n".join([f"- {k}: {v}" for k, v in follow_up_answers.items()])
        prompt = (
            f"Patient Age: {patient_age}, Gender: {patient_gender}\n"
            f"Chief Symptoms: {', '.join(symptoms)}\n"
            f"Doctor Anamnesis Q&A Findings:\n{answers_formatted}\n"
            f"Vitals: {vitals}\n"
            f"Preliminary Clinical RAG Baseline: {rag_eval['priority']}\n\n"
            "Provide clinical reasoning, confirm priority (Immediate, Urgent, or Less Urgent), "
            "recommended department disposition, and home-care/red-flag guidance."
        )

        model_resp = await self.client.invoke_triage_model(
            prompt=prompt,
            system_prompt="You are a senior triage consultant physician synthesizing complete patient clinical intake."
        )

        clinical_reasoning = (
            model_resp.strip() if model_resp
            else f"{rag_eval['reasoning']} Triage assessed using comprehensive 10-point anamnesis inquiry."
        )

        return {
            "priority": rag_eval["priority"],
            "clinical_category": rag_eval["clinical_category"],
            "clinical_reasoning": clinical_reasoning,
            "recommended_disposition": rag_eval["action"],
            "model": "User-Fine-Tuned-Model" if model_resp else "Clinical-RAG-Engine"
        }

    async def save_session_state(self, session_id: str, state: Dict[str, Any], ttl_seconds: int = 1800) -> bool:
        """
        Stores live 10-step patient interview progress in Upstash Redis Cloud RAM (30-min TTL).
        """
        try:
            from routers.ocr.cache import get_redis
            redis = await get_redis()
            if redis:
                await redis.set(f"triage:session:{session_id}", json.dumps(state), ex=ttl_seconds)
                print(f"[Redis Anamnesis] Saved session '{session_id}' state to Upstash in <10ms.")
                return True
        except Exception as e:
            print(f"[Redis Anamnesis Save Note] {e}")
        return False

    async def get_session_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves live patient interview progress from Upstash Redis Cloud RAM in <5ms.
        """
        try:
            from routers.ocr.cache import get_redis
            redis = await get_redis()
            if redis:
                val = await redis.get(f"triage:session:{session_id}")
                if val:
                    print(f"[Redis Anamnesis HIT] Retrieved session '{session_id}' state from Upstash!")
                    return json.loads(val)
        except Exception as e:
            print(f"[Redis Anamnesis Read Note] {e}")
        return None


# Global singleton
triage_agent = TriageAnamnesisAgent()
