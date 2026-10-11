from typing import List, Dict, Any, Tuple

def generate_patient_summary_details(test_name: str, parameters: List[Dict[str, Any]], clinical_flags: List[str]) -> Tuple[str, Dict[str, Any]]:
    """
    Generates plain-language, patient-centric summary details for patients
    who may struggle with complex medical terminology and lab biomarker metrics.
    """
    abnormal = [p for p in parameters if p.get("status") in ("HIGH", "LOW")]
    normal = [p for p in parameters if p.get("status") == "NORMAL" or not p.get("status")]

    if not abnormal:
        health_status = "Normal"
        urgency = "Routine Checkup"
        patient_summary = (
            f"Great news! All biomarkers in your {test_name} appear to be within healthy standard limits. "
            "Continue following your routine lifestyle and keep up with your regular preventive checkups."
        )
    elif any(p.get("alert_level") == "Urgent" for p in abnormal):
        health_status = "Action Required"
        urgency = "Urgent Medical Review"
        names = " and ".join(p.get("name", "parameter") for p in abnormal[:2])
        patient_summary = (
            f"Your {test_name} indicates notable variations in {names}. "
            "These findings require attention from your healthcare provider. Please share this report with your PHC doctor or ASHA worker for clinical guidance and treatment planning."
        )
    else:
        health_status = "Needs Attention"
        urgency = "Schedule Doctor Visit"
        names = ", ".join(p.get("name", "parameter") for p in abnormal[:3])
        patient_summary = (
            f"Your {test_name} shows mild variations in {names}. "
            "While not an immediate emergency, discussing these findings with your doctor will help adjust your diet, lifestyle, or medications to restore healthy balance."
        )

    abnormal_findings = []
    for p in abnormal:
        name = p.get("name", "")
        raw_val = str(p.get("value", "")).strip()
        raw_unit = str(p.get("unit", "")).strip()
        val = raw_val if (not raw_unit or raw_unit.lower() in raw_val.lower()) else f"{raw_val} {raw_unit}".strip()
        st = p.get("status", "ABNORMAL").upper()
        nl = name.lower()

        meaning = p.get("clinical_significance") or f"Value is {st.lower()} compared to the standard reference range ({p.get('reference_range', 'normal')})."
        action = "Discuss with your doctor to determine if medication or dietary adjustments are needed."

        if "hemoglobin" in nl or "hb" in nl:
            if st == "LOW":
                meaning = "Low hemoglobin means fewer red blood cells carrying oxygen, which can cause tiredness, weakness, or feeling cold."
                action = "Eat iron-rich foods such as spinach, lentils, jaggery, and dates. Consult your doctor regarding iron supplements."
        elif "wbc" in nl or "leukocyte" in nl or "tlc" in nl:
            if st == "HIGH":
                meaning = "Elevated white blood cells typically mean your immune system is actively fighting an infection or inflammation."
                action = "Stay well hydrated and get adequate rest. Report any persistent fever or body ache to your doctor."
        elif "platelet" in nl:
            if st == "LOW":
                meaning = "Lower platelet levels can slow down clotting and lead to easy bruising."
                action = "Avoid intense contact sports and consult your physician if you experience spontaneous bruises or gum bleeding."
        elif "glucose" in nl or "sugar" in nl or "rbs" in nl or "hba1c" in nl:
            if st == "HIGH":
                meaning = "Elevated blood glucose indicates higher sugar levels in your bloodstream, requiring dietary and glycemic monitoring."
                action = "Reduce refined carbohydrates and sugary items. Plan a follow-up with your doctor to evaluate diabetic management."
        elif "cholesterol" in nl or "lipid" in nl or "triglyceride" in nl or "ldl" in nl:
            meaning = f"{st.title()} lipid level can contribute to plaque accumulation in blood vessels over time."
            action = "Adopt a heart-healthy diet with reduced fried foods and engage in daily 30-minute brisk walking."
        elif "bilirubin" in nl or "sgpt" in nl or "sgot" in nl or "alt" in nl or "ast" in nl:
            meaning = "Elevated liver markers suggest the liver may be experiencing mild stress or inflammation."
            action = "Avoid alcohol or unverified supplements. Stay on a simple, easily digestible diet and consult your physician."
        elif "creatinine" in nl or "urea" in nl:
            meaning = "Elevated kidney filtration markers suggest your kidneys may be under stress or need increased hydration."
            action = "Drink ample clean water and avoid self-medicating with painkiller drugs."

        abnormal_findings.append({
            "parameter": name,
            "value": val,
            "status": st,
            "meaning": meaning,
            "action": action,
            "reference_range": p.get("reference_range", "-")
        })

    normal_findings = [f"{p.get('name')}: Healthy ({p.get('value')} {p.get('unit', '')})".strip() for p in normal]

    what_to_ask_doctor = [
        f"What is the most likely cause of my {abnormal[0]['name'] if abnormal else 'results'}?",
        "Do I need any follow-up tests or specific medications?",
        "What dietary or daily activity adjustments do you recommend for me?"
    ]

    lifestyle_tips = [
        "Drink 8-10 glasses of clean water daily to support cell metabolism and kidney function.",
        "Ensure 7-8 hours of sound sleep every night to help your body recuperate.",
        "Keep a printed or digital copy of this report handy during your clinic or PHC visit."
    ]

    summary_details = {
        "overview": patient_summary,
        "health_status": health_status,
        "urgency": urgency,
        "abnormal_findings": abnormal_findings,
        "normal_findings": normal_findings,
        "what_to_ask_doctor": what_to_ask_doctor,
        "lifestyle_tips": lifestyle_tips,
        "clinical_flags": clinical_flags
    }

    return patient_summary, summary_details
