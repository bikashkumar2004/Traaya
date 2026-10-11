"""
Triage Anamnesis Agent for TriageAssist
Combines LangChain, Clinical RAG Knowledge, and the User's Fine-Tuned Model
to guide patients through a 10-step doctor anamnesis protocol.
"""

import json
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from langchain_core.prompts import PromptTemplate
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
            input_variables=["patient_age", "patient_gender", "language", "symptoms"],
            template=(
                "Patient Age: {patient_age}, Gender: {patient_gender}, Language: {language}.\n"
                "Reported Symptoms: {symptoms}.\n"
                "Generate 8 to 10 sequential doctor anamnesis questions in simple everyday language.\n"
                "Return a JSON object with 'follow_up_questions': [\"question 1\", \"question 2\", ...]."
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

    def _parse_custom_model_output(self, model_response: str, raw: str) -> Optional[Dict[str, Any]]:
        """
        Parses fine-tuned model output whether returned as pure JSON or as a structured Markdown clinical report.
        """
        if not model_response or not model_response.strip():
            return None

        cleaned = model_response.strip()
        parsed: Dict[str, Any] = {}

        # 1. Attempt direct JSON parsing if wrapped in { ... }
        try:
            candidate = cleaned
            if "```json" in candidate:
                candidate = candidate.split("```json")[1].split("```")[0].strip()
            elif "```" in candidate:
                candidate = candidate.split("```")[1].split("```")[0].strip()

            start_idx = candidate.find("{")
            end_idx = candidate.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_candidate = candidate[start_idx:end_idx + 1]
                p = json.loads(json_candidate)
                if isinstance(p, dict):
                    parsed = p
        except Exception:
            pass

        # 2. Extract balanced JSON array for follow_up_questions if not in top-level JSON
        raw_questions = parsed.get("follow_up_questions") or parsed.get("questions") or []
        if not raw_questions or not isinstance(raw_questions, list):
            search_key = "follow_up_questions" if "follow_up_questions" in cleaned.lower() else "questions"
            idx = cleaned.lower().find(search_key)
            if idx != -1:
                bracket_start = cleaned.find("[", idx)
                if bracket_start != -1:
                    depth = 0
                    in_string = False
                    escape = False
                    for i in range(bracket_start, len(cleaned)):
                        ch = cleaned[i]
                        if escape:
                            escape = False
                            continue
                        if ch == "\\":
                            escape = True
                            continue
                        if ch == '"':
                            in_string = not in_string
                            continue
                        if not in_string:
                            if ch == "[":
                                depth += 1
                            elif ch == "]":
                                depth -= 1
                                if depth == 0:
                                    try:
                                        array_json = cleaned[bracket_start:i + 1]
                                        q_list = json.loads(array_json)
                                        if isinstance(q_list, list):
                                            raw_questions = q_list
                                    except Exception:
                                        pass
                                    break

        # If questions list is still missing or too short, return None to safely fall back to Clinical RAG
        if not isinstance(raw_questions, list) or len(raw_questions) < 2:
            return None

        # 3. Format questions into standardized UI schema
        formatted_questions = []
        for idx, q in enumerate(raw_questions):
            if isinstance(q, str):
                formatted_questions.append({
                    "id": f"q_{idx + 1}",
                    "question": q,
                    "type": "radio",
                    "options": [
                        "Yes, definitely",
                        "Mild / Only sometimes",
                        "No, not at all",
                        "Not sure / Cannot say"
                    ]
                })
            elif isinstance(q, dict):
                q_id = str(q.get("id") or f"q_{idx + 1}")
                q_text = str(q.get("question") or q.get("text") or "")
                q_type = str(q.get("type") or "radio")
                q_options = q.get("options")
                if not q_options or not isinstance(q_options, list) or len(q_options) == 0:
                    q_options = ["Yes", "No", "Mild", "Not sure"]
                formatted_questions.append({
                    "id": q_id,
                    "question": q_text,
                    "type": q_type,
                    "options": q_options,
                    "placeholder": q.get("placeholder", ""),
                    "unit": q.get("unit", "")
                })

        base_data = self._extract_dates_and_symptoms(raw)

        # 4. Extract symptoms from markdown if not parsed
        symptoms = parsed.get("symptoms")
        if not symptoms:
            symp_match = re.search(r"(?:1\.\s*)?(?:\*\*)?symptoms(?:\*\*)?\s*:\s*([^\n\r]+)", cleaned, re.IGNORECASE)
            if symp_match:
                symptoms = [s.strip(" -*,") for s in symp_match.group(1).split(",") if s.strip(" -*,")]
        if not symptoms or not isinstance(symptoms, list):
            symptoms = base_data["symptoms"]

        # 5. Extract timeline from markdown if not parsed
        timeline = parsed.get("timeline")
        if not timeline:
            time_match = re.search(r"(?:2\.\s*)?(?:\*\*)?timeline(?:\*\*)?\s*:\s*([^\n\r]+)", cleaned, re.IGNORECASE)
            if time_match:
                t_str = time_match.group(1).strip(" -*")
                if t_str:
                    timeline = [{"date": "Reported", "event": t_str, "duration": "Recent"}]
        if not timeline or not isinstance(timeline, list):
            timeline = base_data["timeline"]

        # 6. Extract missing parameters from markdown if not parsed
        missing = parsed.get("missing")
        if not missing:
            miss_match = re.search(r"(?:3\.\s*)?(?:\*\*)?missing(?:\*\*)?\s*:\s*([\s\S]*?)(?:(?:4\.\s*)?(?:\*\*)?follow_up|$)", cleaned, re.IGNORECASE)
            if miss_match:
                m_lines = [line.strip(" -*\t\r") for line in miss_match.group(1).splitlines() if line.strip(" -*\t\r")]
                if m_lines:
                    missing = m_lines
        if not missing or not isinstance(missing, list):
            missing = base_data["missing"]

        return {
            "status": "success",
            "source": "Custom Fine-Tuned Triage Model (Kaggle/HF Agent)",
            "model": "User-Fine-Tuned-Clinical-Model",
            "data": {
                "symptoms": symptoms,
                "timeline": timeline,
                "missing": missing,
                "follow_up_questions": formatted_questions
            }
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
            symptoms=raw
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
                parsed_model_data = self._parse_custom_model_output(model_response, raw)
                if parsed_model_data:
                    return parsed_model_data
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


# Global singleton
triage_agent = TriageAnamnesisAgent()
