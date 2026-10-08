from typing import List, Dict, Any

def generate_esanjeevani_inquiries(
    test_name: str,
    parameters: List[Dict[str, Any]],
    symptoms: List[str],
    symptom_text: str,
    follow_up_answers: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generates dynamic clinical follow-up inquiries in simple, everyday English
    so any patient can easily understand and answer them.
    """
    symptoms_str = ", ".join(symptoms) if symptoms else (symptom_text[:50] or "sickness")
    primary_sym = symptoms[0] if symptoms else (symptom_text[:30] or "sickness")

    # Question 1: Simple timing question
    q1 = {
        "id": "q_test_timing",
        "question": f"Did you do this {test_name} before or after your {primary_sym} started?",
        "type": "radio",
        "options": [
            f"After my {primary_sym} started",
            f"Before my {primary_sym} started (routine checkup)",
            "On the same day my sickness started"
        ]
    }

    # Question 2: Simple progression question
    q2 = {
        "id": "q_symptom_progression",
        "question": f"Since this report was done, how are you feeling now with your {symptoms_str}?",
        "type": "radio",
        "options": [
            "Feeling worse (getting more sick)",
            "Feeling the same (no change)",
            "Feeling a little better"
        ]
    }

    # Question 3: Simple medicine question
    q3 = {
        "id": "q_medication_initiated",
        "question": "Did you take any medicine for this sickness?",
        "type": "radio",
        "options": [
            "Yes, medicine given by a doctor",
            "Yes, basic medicine from shop (like Paracetamol)",
            "No, have not taken any medicine yet"
        ]
    }

    # Question 4: Targeted simple question based on report numbers
    abnormals = [p for p in parameters if p.get("status", "").upper() in ["HIGH", "LOW", "CRITICAL"]]
    q4 = None

    temp_val = follow_up_answers.get("current_temperature") or follow_up_answers.get("temperature") or ""
    temp_suffix = f" (fever {temp_val}°F)" if temp_val else ""

    for ab in abnormals:
        p_name = ab.get("name", "").lower()
        val = str(ab.get("value", ""))
        unit = ab.get("unit", "")
        status = ab.get("status", "").upper()

        if "wbc" in p_name or "leukocyte" in p_name or "tlc" in p_name:
            q4 = {
                "id": "q_wbc_correlation",
                "question": f"Your blood report shows a high infection count ({val} {unit}){temp_suffix}: Do you have shaking cold chills or cough with yellow/green phlegm?",
                "type": "radio",
                "options": [
                    "Yes, shaking with cold or coughing yellow/green phlegm",
                    "Feverish, but no shivering or cough",
                    "No shivering and no cough"
                ]
            }
            break
        elif "platelet" in p_name and status == "LOW":
            q4 = {
                "id": "q_platelet_warning",
                "question": f"Your blood report shows low platelets ({val} {unit}): Have you seen any bleeding from gums, nose, or tiny red skin spots?",
                "type": "radio",
                "options": [
                    "Yes, bleeding from gums or nose, or red skin spots",
                    "Mild rash, but no bleeding",
                    "No bleeding and no skin spots"
                ]
            }
            break
        elif "glucose" in p_name or "sugar" in p_name or "rbs" in p_name:
            q4 = {
                "id": "q_glucose_intake",
                "question": f"Your blood report shows high sugar ({val} {unit}): Are you feeling very thirsty, dry mouth, or going to toilet very often?",
                "type": "radio",
                "options": [
                    "Yes, very thirsty and going to toilet often",
                    "A little more thirsty than usual",
                    "Normal thirst and normal toilet"
                ]
            }
            break
        elif "hemoglobin" in p_name or "hb" in p_name:
            q4 = {
                "id": "q_anemia_dizziness",
                "question": f"Your report shows low hemoglobin / low blood count ({val} {unit}): Do you feel dizzy, very tired, or breathless when walking?",
                "type": "radio",
                "options": [
                    "Yes, dizzy or out of breath when walking",
                    "Feeling tired and weak only",
                    "Feeling normal and active"
                ]
            }
            break
        elif "bilirubin" in p_name or "sgpt" in p_name or "sgot" in p_name:
            q4 = {
                "id": "q_jaundice_check",
                "question": f"Your liver report numbers are high ({ab.get('name')} {val} {unit}): Have you noticed yellow color in your eyes or dark yellow urine?",
                "type": "radio",
                "options": [
                    "Yes, yellow eyes or dark yellow urine",
                    "Not feeling hungry or feeling like vomiting only",
                    "No yellow eyes or dark urine"
                ]
            }
            break
        elif "creatinine" in p_name or "urea" in p_name:
            q4 = {
                "id": "q_kidney_check",
                "question": f"Your kidney report numbers are high ({ab.get('name')} {val} {unit}): Have you noticed passing less urine, or swelling on your feet or face?",
                "type": "radio",
                "options": [
                    "Yes, passing less urine and swelling on feet or face",
                    "Mild lower back pain only",
                    "Normal urination and no swelling"
                ]
            }
            break
        elif "pus" in p_name or "urine" in p_name:
            q4 = {
                "id": "q_urine_infection",
                "question": f"Your urine report shows an infection ({ab.get('name')} {val} {unit}): Do you feel burning or pain when passing urine, or lower stomach pain?",
                "type": "radio",
                "options": [
                    "Yes, burning pain when passing urine",
                    "Mild discomfort or lower stomach pain",
                    "No burning pain"
                ]
            }
            break

    if not q4:
        q4 = {
            "id": "q_additional_symptoms",
            "question": f"Along with this {test_name}, are you having any other problem today that was not mentioned before?",
            "type": "radio",
            "options": [
                "No, all my problems were already mentioned",
                "Yes, feeling very weak and tired all over",
                "Yes, new pain or sickness started today"
            ]
        }

    return [q1, q2, q3, q4]
