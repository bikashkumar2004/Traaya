"""
Clinical Knowledge Base & RAG Engine for TriageAssist
Provides structured clinical anamnesis protocols (SOCRATES framework),
emergency red-flag criteria, and triage priority decision rules.
"""

from typing import Dict, Any, List


class ClinicalRAGKnowledgeBase:
    """
    In-memory clinical retrieval knowledge base incorporating:
    1. SOCRATES 10-step Anamnesis Clinical Protocol
    2. Emergency Severity Index (ESI) & WHO ETAT Triage Guidelines
    3. Standardized Laboratory Biomarker References (LOINC & SNOMED CT)
    """

    # 1. SOCRATES 10-Step Anamnesis Sequence in Simple, Everyday English
    SOCRATES_STEPS = [
        {
            "step": 1,
            "key": "urgency_red_flags",
            "clinical_dimension": "Urgency (How bad is it?)",
            "purpose": "Identify life-threatening conditions immediately.",
            "default_question": "Is this the first time you feel this, or is it the worst pain you ever had?",
            "type": "radio",
            "options": [
                "First time I am having this problem",
                "Worst pain I have ever felt in my life",
                "I had this before, but it feels normal",
                "I had this before, but today it is much worse"
            ],
            "red_flags": ["Worst episode ever", "Sudden 'thunderclap' onset", "Unbearable agony"]
        },
        {
            "step": 2,
            "key": "onset",
            "clinical_dimension": "Start Time (When did it start?)",
            "purpose": "Find out how fast symptoms started.",
            "default_question": "When did it start, and did it happen suddenly or slowly?",
            "type": "radio",
            "options": [
                "Suddenly (started in a few minutes)",
                "Quickly (started over a few hours)",
                "Slowly (started over 1 to 3 days)",
                "Very slowly (over many weeks or months)"
            ]
        },
        {
            "step": 3,
            "key": "location",
            "clinical_dimension": "Location (Where does it hurt?)",
            "purpose": "Find exact spot of pain.",
            "default_question": "Where on your body do you feel the pain or discomfort?",
            "type": "radio",
            "options": [
                "In one small specific spot",
                "Only on one side (left side or right side)",
                "On both sides equally",
                "All over my entire body"
            ]
        },
        {
            "step": 4,
            "key": "radiation",
            "clinical_dimension": "Spreading (Does the pain move?)",
            "purpose": "Check if pain moves to other body parts.",
            "default_question": "Does the pain move or spread to other parts of your body?",
            "type": "radio",
            "options": [
                "Stays in one place, does not move anywhere",
                "Spreads to my back or shoulder blades",
                "Spreads up to my neck, face, or jaw",
                "Spreads down into my arms or legs"
            ]
        },
        {
            "step": 5,
            "key": "character",
            "clinical_dimension": "Feeling (What does it feel like?)",
            "purpose": "Find what kind of pain it is.",
            "default_question": "What kind of pain or feeling is it?",
            "type": "radio",
            "options": [
                "Throbbing (beats like a heartbeat)",
                "Sharp or stabbing (like a needle or knife)",
                "Heavy pressure (feels tight or pressed down)",
                "Burning or hot feeling",
                "Dull ache (mild constant pain)",
                "Cramps that come and go in waves"
            ]
        },
        {
            "step": 6,
            "key": "severity",
            "clinical_dimension": "Pain Level (How strong is it?)",
            "purpose": "Assess how bad the pain is.",
            "default_question": "How strong is the pain right now on a scale of 0 to 10?",
            "type": "radio",
            "options": [
                "1–3 (Mild: Noticeable, but I can still do my daily work)",
                "4–6 (Medium: Hurts, hard to work or sleep)",
                "7–8 (Severe: Very bad pain, cannot do normal work)",
                "9–10 (Extremely bad: Unbearable, worst pain ever)"
            ]
        },
        {
            "step": 7,
            "key": "duration",
            "clinical_dimension": "Length (How long does it stay?)",
            "purpose": "Understand how long pain lasts.",
            "default_question": "How long does the pain stay when it comes?",
            "type": "radio",
            "options": [
                "Stays all the time without stopping",
                "Stays for a few hours at a time",
                "Comes for a few minutes then goes away",
                "Comes and goes many times in the day"
            ]
        },
        {
            "step": 8,
            "key": "frequency",
            "clinical_dimension": "Frequency (How often does it happen?)",
            "purpose": "Find how often symptoms repeat.",
            "default_question": "How often do you get this pain or feeling?",
            "type": "radio",
            "options": [
                "Continuous right now without stopping",
                "A few times every day",
                "A few times a week",
                "Started for the first time today"
            ]
        },
        {
            "step": 9,
            "key": "aggravating_relieving",
            "clinical_dimension": "Better or Worse (What changes it?)",
            "purpose": "Find triggers and what brings relief.",
            "default_question": "Does anything make the pain feel better or worse?",
            "type": "radio",
            "options": [
                "Worse when moving or walking; better when resting",
                "Worse when breathing deeply or coughing",
                "Worse after eating food; better when stomach is empty",
                "Worse in bright light or loud noise; better in a dark quiet room",
                "Nothing makes it better or worse so far"
            ]
        },
        {
            "step": 10,
            "key": "associated_symptoms",
            "clinical_dimension": "Other Symptoms (Any other problems?)",
            "purpose": "Screen for fever, vomiting, or breathing trouble.",
            "default_question": "Do you have any other problems, like fever, vomiting, or trouble breathing?",
            "type": "radio",
            "options": [
                "Yes, high fever, shivering, or shaking with cold",
                "Yes, vomiting or feeling like vomiting",
                "Yes, trouble breathing, sweating, or feeling dizzy",
                "Yes, blurry vision or bright light hurts my eyes",
                "No other problems, only this symptom"
            ]
        }
    ]

    # 2. Symptom Category Specific Tailoring in Simple, Everyday English
    SYMPTOM_SPECIFIC_GUIDANCE = {
        "headache": {
            "title": "Headache Evaluation",
            "red_flags": ["Sudden thunderclap pain", "Stiff neck", "Vision changes", "Fainting"],
            "tailored_questions": {
                "urgency_red_flags": {
                    "question": "Is this the first or worst headache you have ever had in your life?",
                    "options": [
                        "First time having a headache this bad",
                        "Worst headache of my entire life (sudden extreme pain)",
                        "Normal headache or migraine that I get often",
                        "Mild headache that is slowly getting worse"
                    ]
                },
                "onset": {
                    "question": "When did the headache start, and did it happen suddenly?",
                    "options": [
                        "Started all of a sudden in one minute (like a sudden hit)",
                        "Started quickly over 1 to 2 hours",
                        "Started slowly over 1 or 2 days",
                        "Has been there for more than a week"
                    ]
                },
                "location": {
                    "question": "Where does your head hurt?",
                    "options": [
                        "Only one side (left side or right side / behind one eye)",
                        "Front of the head and forehead",
                        "Back of the head and neck",
                        "All over my entire head"
                    ]
                },
                "radiation": {
                    "question": "Does the head pain spread anywhere else?",
                    "options": [
                        "Spreads down into my neck and shoulders",
                        "Spreads into my face, jaw, or teeth",
                        "Deep behind or around my eyes",
                        "Does not spread anywhere, stays in one place"
                    ]
                },
                "character": {
                    "question": "How does the headache feel?",
                    "options": [
                        "Throbbing (beats like a heartbeat)",
                        "Tight band squeezing around my head",
                        "Sharp or stabbing pain behind my eye",
                        "Heavy dull ache inside my head"
                    ]
                },
                "severity": {
                    "question": "How bad is the headache right now on a scale of 0 to 10?",
                    "options": [
                        "1–3 (Mild: Noticeable, but I can still do daily work)",
                        "4–6 (Medium: Pain hurts, hard to work or sleep)",
                        "7–8 (Severe: Very bad pain, must lie down in a dark room)",
                        "9–10 (Extremely bad: Unbearable, cannot open eyes)"
                    ]
                },
                "duration": {
                    "question": "How long does each headache attack last?",
                    "options": [
                        "Lasts for half a day to 2 or 3 days",
                        "Lasts for 1 to 2 hours then gets better",
                        "Constant ache that does not stop for days",
                        "Quick sharp pain lasting only a few minutes"
                    ]
                },
                "frequency": {
                    "question": "How often do you get these headaches?",
                    "options": [
                        "First time today, never had this before",
                        "1 to 3 times every month",
                        "A few days every week",
                        "Almost every single day"
                    ]
                },
                "aggravating_relieving": {
                    "question": "Does anything make the headache better or worse?",
                    "options": [
                        "Worse with bright light, loud sound, or moving; better resting in a dark quiet room",
                        "Worse when coughing, straining, or bending down",
                        "Worse with stress, little sleep, or skipping food",
                        "Pain medicine helps for a little while",
                        "Nothing makes it better or worse"
                    ]
                },
                "associated_symptoms": {
                    "question": "Do you feel like vomiting, stiff neck, or trouble with bright light?",
                    "options": [
                        "Yes, vomiting, feel sick to stomach, and light hurts my eyes",
                        "Yes, stiff neck (hard to bend chin down to chest)",
                        "Yes, seeing flashing lights, zigzag lines, or blurry vision",
                        "Yes, feeling dizzy, unsteady, or numb",
                        "No other problems, only headache"
                    ]
                }
            }
        },
        "fever": {
            "title": "Fever & Infection Evaluation",
            "red_flags": ["Fever over 103°F", "Confusion / Extreme sleepiness", "Skin spots", "Trouble breathing"],
            "tailored_questions": {
                "urgency_red_flags": {
                    "question": "How high is your fever, and do you have shaking chills?",
                    "options": [
                        "High fever (over 102°F) with strong shivering and shaking",
                        "Mild fever (around 100°F) with light shivering",
                        "Hot fever without shivering",
                        "Did not check with thermometer, but body feels very hot"
                    ]
                },
                "onset": {
                    "question": "How many days have you had this fever?",
                    "options": [
                        "Started suddenly today with high fever",
                        "Present for 2 to 3 days",
                        "Coming and going for more than a week",
                        "Comes mostly in the evening or night with heavy sweating"
                    ]
                },
                "location": {
                    "question": "Where does your body hurt most along with the fever?",
                    "options": [
                        "Whole body aches and muscle pain all over",
                        "Throat pain, cough, or runny nose",
                        "Chest pain or burning when passing urine",
                        "Stomach or belly pain",
                        "No body pain, only fever"
                    ]
                },
                "radiation": {
                    "question": "Do you have severe pain spreading in your bones or joints?",
                    "options": [
                        "Severe pain in joints and back (body feels broken)",
                        "Pain spreading in neck and shoulders",
                        "Mild body ache all over",
                        "No spreading pain"
                    ]
                },
                "character": {
                    "question": "How does the fever feel during the day?",
                    "options": [
                        "Hot fever that stays all the time and does not go down",
                        "Shivers and chills, then heavy sweating when fever drops",
                        "Mild warm feeling in the evening with tiredness",
                        "Goes up and down many times a day"
                    ]
                },
                "severity": {
                    "question": "How weak do you feel with this fever?",
                    "options": [
                        "Cannot get out of bed, too weak to drink water",
                        "Very tired, but can still drink water and eat light food",
                        "Mild fever, can walk and eat normally",
                        "Feeling confused, very sleepy, or dizzy"
                    ]
                },
                "duration": {
                    "question": "How long does the fever stay high during the day?",
                    "options": [
                        "Stays high all day and night (24 hours)",
                        "Stays for 4 to 6 hours then cools down",
                        "Comes and goes throughout the day",
                        "Only comes once a day, usually in evening or night"
                    ]
                },
                "frequency": {
                    "question": "How often does the high fever or shivering come back?",
                    "options": [
                        "Spikes high many times every day",
                        "Comes once every 1 or 2 days",
                        "Stays hot all the time",
                        "Started for the first time today"
                    ]
                },
                "aggravating_relieving": {
                    "question": "Does fever medicine (like paracetamol) bring the fever down?",
                    "options": [
                        "Medicine lowers fever for a few hours, then it comes back",
                        "Fever does not go down even after taking medicine",
                        "Fever goes away completely with sweating after medicine",
                        "Have not taken any fever medicine yet"
                    ]
                },
                "associated_symptoms": {
                    "question": "Do you have cough, sore throat, vomiting, or skin spots?",
                    "options": [
                        "Bad body ache, joint pain, or pain behind eyes",
                        "Sore throat, runny nose, or cough",
                        "Red spots on skin or bleeding from gums or nose",
                        "Burning pain when passing urine",
                        "No other problems except fever"
                    ]
                }
            }
        },
        "chest": {
            "title": "Chest & Heart Evaluation",
            "red_flags": ["Heavy crushing chest pressure", "Pain spreading to left arm/jaw", "Cold sweating", "Trouble breathing"],
            "tailored_questions": {
                "urgency_red_flags": {
                    "question": "Does your chest pain come with cold sweating, trouble breathing, or dizziness?",
                    "options": [
                        "Yes, cold sweating and trouble breathing (Emergency)",
                        "Yes, feeling dizzy or like fainting",
                        "A little out of breath when walking",
                        "No sweating or trouble breathing"
                    ]
                },
                "onset": {
                    "question": "When did the chest pain start, and did it happen suddenly?",
                    "options": [
                        "Started suddenly while resting in the last hour",
                        "Started suddenly while walking, working, or feeling angry",
                        "Started slowly earlier today",
                        "Comes and goes over several days"
                    ]
                },
                "location": {
                    "question": "Where in your chest does it hurt most?",
                    "options": [
                        "Middle of chest (behind the center chest bone)",
                        "Left side of chest over the heart",
                        "Right side of chest",
                        "Upper stomach just below the chest"
                    ]
                },
                "radiation": {
                    "question": "Does the pain move to your left arm, shoulder, neck, jaw, or back?",
                    "options": [
                        "Yes, moves down my left arm and shoulder",
                        "Yes, moves up to my neck or jaw",
                        "Yes, moves straight to my upper back",
                        "No, it stays only in my chest"
                    ]
                },
                "character": {
                    "question": "How does the chest pain feel?",
                    "options": [
                        "Heavy pressure (feels like a heavy stone or weight on my chest)",
                        "Tight squeezing or feeling suffocated",
                        "Sharp stabbing pain when taking a deep breath or coughing",
                        "Burning feeling like acidity or gas"
                    ]
                },
                "severity": {
                    "question": "How bad is the chest pain on a scale of 0 to 10?",
                    "options": [
                        "1–3 (Mild: Light discomfort, tolerable)",
                        "4–6 (Medium: Hurting and uncomfortable)",
                        "7–8 (Severe: Very painful and scary)",
                        "9–10 (Extremely bad: Unbearable crushing pain)"
                    ]
                },
                "duration": {
                    "question": "How long has the chest pain been there without stopping?",
                    "options": [
                        "Hurting continuously for more than 20 minutes",
                        "Lasts 2 to 10 minutes then stops when I rest",
                        "Quick sharp poke lasting only a few seconds",
                        "Dull ache for many hours or days"
                    ]
                },
                "frequency": {
                    "question": "How often do you get this chest pain?",
                    "options": [
                        "First time ever, happening right now",
                        "Happens every time I walk fast or climb stairs",
                        "Happens after heavy food or when lying down",
                        "Happens at random times"
                    ]
                },
                "aggravating_relieving": {
                    "question": "Does walking make it worse, and does resting make it better?",
                    "options": [
                        "Worse when walking or climbing stairs; better when sitting down to rest",
                        "Worse when breathing deeply or changing how I sit",
                        "Worse when pressing with fingers on my chest bones",
                        "Better after drinking water, burping, or taking gas medicine",
                        "Nothing changes it, it stays the same"
                    ]
                },
                "associated_symptoms": {
                    "question": "Do you have cold sweat, fast heartbeat, or sick stomach?",
                    "options": [
                        "Cold sweating, fast heartbeat, or feel like vomiting",
                        "Cough, fever, or whistling sound when breathing",
                        "Sour water in mouth or hard to swallow food",
                        "No other problems"
                    ]
                }
            }
        },
        "abdominal": {
            "title": "Stomach & Belly Evaluation",
            "red_flags": ["Rock-hard belly", "Non-stop vomiting", "Blood in vomit or stool", "High fever"],
            "tailored_questions": {
                "urgency_red_flags": {
                    "question": "Do you have severe vomiting, blood in vomit or stool, or is your belly rock hard?",
                    "options": [
                        "Belly is hard like a board and hurts very much to touch",
                        "Vomiting many times, cannot keep even water down",
                        "Blood in vomit or dark black stool",
                        "No vomiting or hard belly, but bad pain"
                    ]
                },
                "onset": {
                    "question": "When did the stomach pain start, and did it happen suddenly?",
                    "options": [
                        "Started all of a sudden in a few minutes with sharp pain",
                        "Started over a few hours and kept getting worse",
                        "Started slowly 1 or 2 days ago",
                        "Old stomach problem that got worse today"
                    ]
                },
                "location": {
                    "question": "Where does your stomach hurt most?",
                    "options": [
                        "Upper belly in the middle (just below chest / food pipe)",
                        "Right lower belly (appendix side)",
                        "Right upper belly below ribs",
                        "Around the belly button",
                        "Lower belly / bladder area",
                        "All over my entire stomach"
                    ]
                },
                "radiation": {
                    "question": "Does the stomach pain move anywhere else?",
                    "options": [
                        "Goes straight through to my back",
                        "Goes up to my right shoulder",
                        "Goes down to my lower waist or thigh",
                        "Stays only in one place in my stomach"
                    ]
                },
                "character": {
                    "question": "What kind of stomach pain is it?",
                    "options": [
                        "Sharp or burning pain that stays all the time",
                        "Cramps that come and go in waves",
                        "Heavy full belly, tight and bloated with gas",
                        "Sore ache that hurts more when moving"
                    ]
                },
                "severity": {
                    "question": "How bad is the stomach pain on a scale of 0 to 10?",
                    "options": [
                        "1–3 (Mild: Normal stomach ache, can do work)",
                        "4–6 (Medium: Need to curl up in bed)",
                        "7–8 (Severe: Hard to stand or walk straight)",
                        "9–10 (Extremely bad: Unbearable severe pain)"
                    ]
                },
                "duration": {
                    "question": "How long does the stomach pain stay?",
                    "options": [
                        "Stays continuously for hours without stopping",
                        "Comes in waves for 5 to 10 minutes then rests",
                        "Comes for 1 or 2 hours after eating food",
                        "Comes and goes throughout the day"
                    ]
                },
                "frequency": {
                    "question": "How often do you get this stomach pain?",
                    "options": [
                        "First time I ever had this pain",
                        "Happens often after eating oily or spicy food",
                        "I have a known stomach problem (gas, stones, or ulcer)",
                        "Happens during monthly period"
                    ]
                },
                "aggravating_relieving": {
                    "question": "Does touching your belly or eating food make it worse?",
                    "options": [
                        "Very sharp pain if belly is pressed and let go quickly",
                        "Worse after eating oily or heavy food",
                        "Better after passing gas or going to the toilet",
                        "Worse when walking, coughing, or riding on bumpy roads",
                        "Nothing makes it better or worse"
                    ]
                },
                "associated_symptoms": {
                    "question": "Do you have loose motions, vomiting, or burning in urine?",
                    "options": [
                        "Watery loose motions or diarrhea",
                        "Cannot pass stool or gas for 2 or more days",
                        "Vomiting many times, cannot hold water",
                        "Burning pain when passing urine",
                        "No other toilet or stomach problems"
                    ]
                }
            }
        },
        "respiratory": {
            "title": "Breathing & Cough Evaluation",
            "red_flags": ["Cannot speak full sentences", "Blue lips or fingers", "Whistling stridor", "Low oxygen"],
            "tailored_questions": {
                "urgency_red_flags": {
                    "question": "Do you have trouble breathing while sitting still or talking?",
                    "options": [
                        "Struggling to breathe even while sitting still (Emergency)",
                        "Cannot finish a sentence without gasping for air",
                        "Out of breath only when walking or climbing stairs",
                        "No trouble breathing, only cough and throat pain"
                    ]
                },
                "onset": {
                    "question": "When did the cough or breathing trouble start?",
                    "options": [
                        "Started suddenly within minutes or an hour",
                        "Started 1 or 2 days ago after catching a cold",
                        "Slowly got worse over the last 1 to 2 weeks",
                        "Old cough or asthma that flared up"
                    ]
                },
                "location": {
                    "question": "Where do you feel the chest tightness or cough?",
                    "options": [
                        "Deep inside both lungs",
                        "In the throat and windpipe",
                        "Tight feeling across the middle of chest",
                        "Sharp pain on one side when taking a deep breath"
                    ]
                },
                "radiation": {
                    "question": "Does the breathing tightness spread anywhere?",
                    "options": [
                        "Spreads up into throat and neck",
                        "Spreads to upper back and shoulders",
                        "Whole body feels weak and exhausted",
                        "Stays only in my chest"
                    ]
                },
                "character": {
                    "question": "Is your cough dry, or does it bring up phlegm (cough water)?",
                    "options": [
                        "Dry cough that does not stop",
                        "Wet cough with yellow or green phlegm",
                        "Contains small drops or streaks of red blood",
                        "Whistling or wheezing sound when breathing out",
                        "Feeling like not enough air goes into lungs"
                    ]
                },
                "severity": {
                    "question": "How hard is it to breathe on a scale of 0 to 10?",
                    "options": [
                        "1–3 (Mild: Light cough, breathing is normal while resting)",
                        "4–6 (Medium: Hard to walk fast or climb stairs)",
                        "7–8 (Severe: Out of breath with even small movement)",
                        "9–10 (Extremely bad: Feeling choked or suffocated)"
                    ]
                },
                "duration": {
                    "question": "How long does the coughing or breathing trouble last?",
                    "options": [
                        "Stays all the time without stopping",
                        "Bad coughing fits that last a few minutes each time",
                        "Worse at night or early morning",
                        "Happens after walking, dust, or smoke"
                    ]
                },
                "frequency": {
                    "question": "How often do you get these coughing or breathing attacks?",
                    "options": [
                        "First time today",
                        "Many times during the day and night",
                        "Happens in cold weather or around dust",
                        "Happens every day for a long time"
                    ]
                },
                "aggravating_relieving": {
                    "question": "Does lying flat on your bed make breathing harder?",
                    "options": [
                        "Yes, I must sit upright or use big pillows to breathe",
                        "Worse with cold air, dust, smoke, or walking",
                        "Better after using an asthma pump or steam",
                        "Warm water or tea helps soothe my throat",
                        "Nothing makes it better"
                    ]
                },
                "associated_symptoms": {
                    "question": "Do you have wheezing, blue lips, or runny nose?",
                    "options": [
                        "Whistling sound when breathing out",
                        "Heavy weight or tightness on chest",
                        "Lips or nails look dark or bluish",
                        "Runny nose, sore throat, sneezing, and fever",
                        "No other problems"
                    ]
                }
            }
        }
    }

    # 3. Triage Classification Rules
    TRIAGE_RULES = {
        "Immediate": {
            "priority": "Immediate (Priority 1 - Red)",
            "action": "Immediate emergency room resuscitation / clinician bedside evaluation within 0–15 minutes.",
            "triggers": [
                "Severe respiratory distress / SpO2 < 90%",
                "Crushing retrosternal chest pain with radiation or sweating",
                "Thunderclap headache with altered sensorium or neck stiffness",
                "Active profuse bleeding or unmanageable shock / trauma",
                "Acute anaphylaxis or stridor",
                "Severe pediatric dehydration or lethargy"
            ]
        },
        "Urgent": {
            "priority": "Urgent (Priority 2 - Yellow)",
            "action": "Clinician review and observation within 15–30 minutes at Primary Health Centre / OPD.",
            "triggers": [
                "High fever > 102°F with severe rigors or dehydration",
                "Moderate pain severity rated 7-8/10",
                "Suspected acute fracture, persistent vomiting, or dysuria",
                "Asthma exacerbation responding to initial bronchodilator",
                "Infection with vital signs borderline"
            ]
        },
        "Less Urgent": {
            "priority": "Less Urgent / Routine (Priority 3 - Green)",
            "action": "Routine ambulatory clinic consultation and prescription within 1–2 hours.",
            "triggers": [
                "Stable vitals with mild symptoms (pain severity <= 4/10)",
                "Gradual onset over days with no red flags",
                "Chronic symptom review or preventive health follow-up",
                "Minor viral upper respiratory tract symptoms"
            ]
        }
    }

    def retrieve_anamnesis_protocol(self, symptom_text: str) -> List[Dict[str, Any]]:
        """
        Smart Adaptive Clinical Anamnesis Retrieval:
        Dynamically adjusts question count (between 6 and 10 questions) based on:
        1. Clinical Acuity (High-risk complaints like chest pain/severe fever get 8-10 questions; mild cases get 6-7).
        2. Deduplication (Omits asking questions about data the patient already explicitly stated in initial text).
        3. Clinical Relevance (E.g. skips radiation for simple cold/rash; keeps it for chest/headache/abdomen).
        """
        import re
        text_lower = symptom_text.lower()
        matched_category = None

        category_synonyms = {
            "fever": ["fever", "bukhar", "tapa", "temperature", "pyrexia", "shiver", "chill", "febrile", "hot"],
            "headache": ["headache", "cephalea", "head ache", "sir dard", "migraine", "cranial", "head pain"],
            "chest": ["chest pain", "chest pressure", "heart", "angina", "chhati", "cardiac", "palpitation"],
            "abdominal": ["stomach", "abdominal", "abdomen", "pet dard", "belly", "cramp", "vomit", "nausea", "loose motion", "diarrhea", "gastric", "gut", "appendix"],
            "respiratory": ["breath", "cough", "khansi", "asthma", "wheez", "shortness of breath", "dyspnea", "throat", "lung", "sputum", "phlegm"]
        }

        for cat_key, synonyms in category_synonyms.items():
            if any(syn in text_lower for syn in synonyms):
                matched_category = cat_key
                break

        tailored_data = self.SYMPTOM_SPECIFIC_GUIDANCE.get(matched_category) if matched_category else None

        # 1. Detect if patient already explicitly provided onset / duration
        onset_duration_provided = bool(re.search(
            r'\b(\d+\s*(?:day|days|hour|hours|week|weeks|month|months)|since\s+yesterday|since\s+morning|today|yesterday|for\s+\d+)\b',
            text_lower
        ))

        # 2. Detect clinical acuity & red-flags
        has_red_flags = any(rf in text_lower for rf in [
            "severe", "unbearable", "worst", "crushing", "thunderclap", "blood",
            "stiff neck", "breathless", "faint", "sweat", "103", "104", "high fever",
            "rigor", "chills", "dyspnea", "shortness of breath", "struggling", "blackout"
        ])

        # High-acuity condition: chest pain, acute abdomen, or any symptom with red-flags
        is_critical = (matched_category in ["chest", "abdominal"]) or has_red_flags

        # 3. Determine steps to include adaptively (6 to 10 questions)
        steps_to_include = []
        for step in self.SOCRATES_STEPS:
            key = step["key"]

            # Filter 1: Radiation
            # Medically relevant for chest, headache, abdominal, and fever (myalgia);
            # for general mild symptoms (rash, scrape, fatigue, cough), omit radiation.
            if key == "radiation":
                if not matched_category or matched_category in ["respiratory"]:
                    if not is_critical:
                        continue

            # Filter 2: Duration / Episode Length
            # If the patient already explicitly stated their duration (e.g. "for 3 days", "since yesterday")
            # and it's not a critical complaint requiring episode breakdown, omit asking it again.
            elif key == "duration":
                if onset_duration_provided and not is_critical:
                    continue

            # Filter 3: Frequency & Recurrence
            # If the patient already stated duration for an acute simple issue, don't ask how often they get it.
            elif key == "frequency":
                if onset_duration_provided and not is_critical and ("migraine" not in text_lower and "asthma" not in text_lower):
                    continue

            # Filter 4: Aggravating / Relieving Factors
            # Skip for simple scrapes or mild rashes where mechanical exertion doesn't apply
            elif key == "aggravating_relieving":
                if not matched_category and not is_critical and len(steps_to_include) >= 6:
                    continue

            steps_to_include.append(step)

        # Enforce bounds: Minimum 6, Maximum 10
        if len(steps_to_include) < 6:
            steps_to_include = self.SOCRATES_STEPS[:6]
        elif len(steps_to_include) > 10:
            steps_to_include = steps_to_include[:10]

        questions: List[Dict[str, Any]] = []
        for current_idx, step in enumerate(steps_to_include, start=1):
            key = step["key"]
            question_text = step["default_question"]
            question_options = list(step["options"])

            # Override with specialized question text and options if clinical match exists
            if tailored_data and "tailored_questions" in tailored_data and key in tailored_data["tailored_questions"]:
                tailored_entry = tailored_data["tailored_questions"][key]
                if isinstance(tailored_entry, dict):
                    question_text = tailored_entry.get("question", question_text)
                    if "options" in tailored_entry and tailored_entry["options"]:
                        question_options = list(tailored_entry["options"])
                elif isinstance(tailored_entry, str):
                    question_text = tailored_entry

            # Build tailored question object with matched options
            q_obj = {
                "id": f"q{current_idx}_{key}",
                "step": current_idx,
                "dimension": step["clinical_dimension"],
                "question": question_text,
                "type": step["type"],
                "options": question_options,
                "placeholder": step.get("placeholder", "Select the most accurate option..."),
                "unit": step.get("unit")
            }
            questions.append(q_obj)

        return questions

    def evaluate_clinical_priority(
        self,
        symptoms: List[str],
        follow_up_answers: Dict[str, str],
        vitals: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        RAG rule-based clinical priority evaluation combining anamnesis answers and vitals.
        """
        all_answers_text = " ".join([str(v) for v in follow_up_answers.values()]).lower()
        symptoms_text = " ".join(symptoms).lower()
        vitals = vitals or {}

        # 1. Check for Immediate Red Flag triggers
        is_immediate = False
        immediate_reasons = []

        # Check SpO2
        spo2 = vitals.get("spo2")
        if spo2:
            try:
                spo2_val = float(str(spo2).replace("%", ""))
                if spo2_val < 90:
                    is_immediate = True
                    immediate_reasons.append(f"Critical Hypoxemia detected (SpO2: {spo2_val}%)")
            except Exception:
                pass

        # Check Blood Pressure
        bp = vitals.get("bp") or vitals.get("blood_pressure")
        if bp and "/" in str(bp):
            try:
                sys = float(str(bp).split("/")[0])
                if sys > 180 or sys < 85:
                    is_immediate = True
                    immediate_reasons.append(f"Critical Blood Pressure breach: {bp} mmHg")
            except Exception:
                pass

        # Check text red flags
        immediate_keywords = [
            "worst episode i have ever experienced",
            "unbearable agony",
            "suddenly (within seconds",
            "crushing",
            "radiates to the neck, face, or jaw",
            "radiates down the arm",
            "9–10 (extreme",
            "inability to speak",
            "loss of consciousness"
        ]
        for kw in immediate_keywords:
            if kw in all_answers_text:
                is_immediate = True
                immediate_reasons.append(f"High-risk clinical report matching: '{kw}'")

        if is_immediate:
            return {
                "priority": "Immediate",
                "clinical_category": "Priority 1 - Red (Immediate Medical Attention)",
                "action": self.TRIAGE_RULES["Immediate"]["action"],
                "reasoning": "; ".join(immediate_reasons) if immediate_reasons else "Acute clinical red flags identified during emergency triage anamnesis."
            }

        # 2. Check for Urgent triggers
        urgent_keywords = [
            "7–8 (severe",
            "high fever",
            "rapidly over a few hours",
            "shivering",
            "shortness of breath",
            "moderate pain"
        ]
        is_urgent = any(kw in all_answers_text for kw in urgent_keywords)
        temp = vitals.get("temperature") or vitals.get("temp")
        if temp:
            try:
                temp_val = float(str(temp).replace("°F", "").replace("F", ""))
                if temp_val >= 101.5:
                    is_urgent = True
            except Exception:
                pass

        if is_urgent:
            return {
                "priority": "Urgent",
                "clinical_category": "Priority 2 - Yellow (Expedited Clinical Evaluation)",
                "action": self.TRIAGE_RULES["Urgent"]["action"],
                "reasoning": "Elevated symptom severity and acute progression require doctor review within 15–30 minutes."
            }

        # 3. Default to Less Urgent / Routine
        return {
            "priority": "Less Urgent",
            "clinical_category": "Priority 3 - Green (Routine Clinical Consultation)",
            "action": self.TRIAGE_RULES["Less Urgent"]["action"],
            "reasoning": "Stable clinical presentation with no immediate systemic or vascular red flags detected."
        }


# Global singleton instance
clinical_rag = ClinicalRAGKnowledgeBase()
