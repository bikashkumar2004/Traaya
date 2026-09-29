from typing import Dict, Any, List, Tuple

class ClinicalTriageEngine:
    """
    Intelligent Clinical Triage Engine based on Emergency Severity Index (ESI)
    and Primary Health Care (PHC) guidelines for triage in India.
    """

    RED_FLAG_KEYWORDS = [
        "chest pain", "crushing chest pain", "difficulty breathing", "severe breathlessness",
        "loss of consciousness", "unconscious", "stroke", "facial droop", "slurred speech",
        "hemiparesis", "heavy bleeding", "uncontrolled bleeding", "seizure", "convulsions",
        "cyanosis", "anaphylaxis", "snake bite", "severe trauma", "postpartum hemorrhage"
    ]

    PRIORITY_KEYWORDS = [
        "high fever", "persistent vomiting", "moderate pain", "dehydration",
        "abdominal pain", "asthma flare", "diabetic hyperglycemia", "head injury without loss of consciousness",
        "productive cough with fever", "deep laceration"
    ]

    @classmethod
    def evaluate_vitals(cls, vitals: Dict[str, Any]) -> Tuple[str, List[str]]:
        """
        Evaluates physiological parameters and returns urgency + triggered reasons.
        """
        triggers = []
        urgency = "Routine"

        spo2 = vitals.get("spo2")
        bp_sys = vitals.get("bp_sys")
        bp_dia = vitals.get("bp_dia")
        pulse = vitals.get("pulse")
        temp = vitals.get("temp")
        resp_rate = vitals.get("resp_rate")

        # SpO2 checks
        if spo2 is not None:
            if spo2 < 90:
                triggers.append(f"Severe Hypoxemia: SpO2 {spo2}% (< 90%)")
                urgency = "Urgent"
            elif spo2 <= 94:
                triggers.append(f"Borderline Oxygenation: SpO2 {spo2}% (90-94%)")
                if urgency != "Urgent":
                    urgency = "Priority"

        # Blood Pressure checks
        if bp_sys is not None:
            if bp_sys >= 180 or bp_sys < 85:
                triggers.append(f"Critical Blood Pressure: Systolic {bp_sys} mmHg")
                urgency = "Urgent"
            elif bp_sys >= 140 or bp_sys <= 95:
                triggers.append(f"Abnormal Blood Pressure: Systolic {bp_sys} mmHg")
                if urgency != "Urgent":
                    urgency = "Priority"

        if bp_dia is not None and bp_dia >= 120:
            triggers.append(f"Hypertensive Crisis: Diastolic {bp_dia} mmHg")
            urgency = "Urgent"

        # Pulse Rate checks
        if pulse is not None:
            if pulse > 125 or pulse < 45:
                triggers.append(f"Extreme Heart Rate: {pulse} bpm")
                urgency = "Urgent"
            elif pulse > 100 or pulse < 55:
                triggers.append(f"Borderline Tachycardia/Bradycardia: {pulse} bpm")
                if urgency != "Urgent":
                    urgency = "Priority"

        # Body Temperature checks (Fahrenheit)
        if temp is not None:
            if temp >= 104.0 or temp < 95.0:
                triggers.append(f"Critical Temperature: {temp}°F")
                urgency = "Urgent"
            elif temp >= 101.0:
                triggers.append(f"Elevated Fever: {temp}°F")
                if urgency != "Urgent":
                    urgency = "Priority"

        # Respiratory Rate
        if resp_rate is not None:
            if resp_rate >= 32 or resp_rate < 10:
                triggers.append(f"Critical Respiratory Distress: {resp_rate} breaths/min")
                urgency = "Urgent"
            elif resp_rate >= 24:
                triggers.append(f"Tachypnea: {resp_rate} breaths/min")
                if urgency != "Urgent":
                    urgency = "Priority"

        return urgency, triggers

    @classmethod
    def analyze(cls, chief_complaint: str, symptoms: List[str], vitals: Dict[str, Any], age: int = None, chronic_conditions: List[str] = None) -> Dict[str, Any]:
        """
        Synthesizes complaint, symptoms, and physiological telemetry into clinical triage recommendation.
        """
        complaint_lower = chief_complaint.lower()
        all_symptom_text = " ".join([s.lower() for s in symptoms]) + " " + complaint_lower

        vitals_urgency, vital_triggers = cls.evaluate_vitals(vitals)

        symptom_triggers = []
        symptom_urgency = "Routine"

        for red_flag in cls.RED_FLAG_KEYWORDS:
            if red_flag in all_symptom_text:
                symptom_triggers.append(f"Red Flag Detected: '{red_flag.title()}'")
                symptom_urgency = "Urgent"

        if symptom_urgency != "Urgent":
            for prio in cls.PRIORITY_KEYWORDS:
                if prio in all_symptom_text:
                    symptom_triggers.append(f"Priority Indicator: '{prio.title()}'")
                    symptom_urgency = "Priority"

        # Resolve overall urgency (Highest takes precedence)
        urgency_order = {"Routine": 1, "Priority": 2, "Urgent": 3}
        max_level = max(urgency_order[vitals_urgency], urgency_order[symptom_urgency])
        final_urgency = [k for k, v in urgency_order.items() if v == max_level][0]

        # Calculate assistive clinical risk score (0 - 100)
        risk_score = 15
        if final_urgency == "Priority":
            risk_score = 55 + min(30, (len(vital_triggers) + len(symptom_triggers)) * 10)
        elif final_urgency == "Urgent":
            risk_score = 85 + min(15, (len(vital_triggers) + len(symptom_triggers)) * 5)
        else:
            risk_score = 20 + min(20, len(symptom_triggers) * 10)

        # Differential & recommendations
        differential = []
        action_plan = []

        if "chest pain" in all_symptom_text or vitals.get("bp_sys", 0) > 170:
            differential.extend(["Acute Coronary Syndrome (ACS)", "Severe Essential Hypertension", "Musculoskeletal Chest Wall Strain"])
            action_plan.extend(["Administer 12-lead ECG stat", "Initiate supplemental Oxygen if SpO2 < 94%", "Urgent Tele-consult with Medical Officer"])
        elif "fever" in all_symptom_text or vitals.get("temp", 0) >= 101:
            differential.extend(["Acute Febrile Illness", "Vector-borne infection (Dengue/Malaria screening)", "Upper Respiratory Tract Infection (URTI)"])
            action_plan.extend(["Order Rapid Diagnostic Kit (RDK) for Malaria/Dengue NS1", "Hydration therapy & Paracetamol as per PHC protocol", "Monitor vitals q2h"])
        elif "breath" in all_symptom_text or vitals.get("spo2", 100) < 94:
            differential.extend(["Acute Exacerbation of COPD / Asthma", "Lower Respiratory Tract Infection / Pneumonia", "Congestive Heart Failure"])
            action_plan.extend(["Nebulization with Salbutamol/Ipratropium", "Continuous pulse oximetry monitoring", "Chest X-ray referral"])
        else:
            differential.extend(["Routine Primary Ambulatory Case", "Symptomatic Gastrointestinal Distress", "Musculoskeletal Strain"])
            action_plan.extend(["Standard OPD clinical queue", "Hydration and lifestyle advisories", "Follow-up in 48-72 hours if unresolved"])

        return {
            "urgency": final_urgency,
            "risk_score": risk_score,
            "vital_triggers": vital_triggers,
            "symptom_triggers": symptom_triggers,
            "differential_considerations": differential,
            "recommended_actions": action_plan,
            "human_verification_required": True,
            "clinical_disclaimer": "Triage assistive algorithm only. Not a definitive clinical diagnosis. Final triage decision rests with the attending healthcare professional."
        }
