# TRAAYA: Clinical Healthcare & Triage Assistive Platform
> **Ayushman Bharat & ABDM Compliant Primary Healthcare Triage Platform**  
> *Transforming Frontline Clinical Workflows, AI Symptom Anamnesis, Diagnostic OCR, and Care Coordination Across India*

---

## Executive Overview & Value Proposition

**TRAAYA** (formerly TriageAssist) is a full-stack, AI-augmented clinical decision support and health triage ecosystem designed in compliance with the **Ayushman Bharat Digital Mission (ABDM)** and **National Health Systems Resource Centre (NHSRC)** standards. 

In India's tiered public healthcare network (Sub-Centres, Ayushman Arogya Mandirs, Primary Health Centres [PHC], Community Health Centres [CHC], and District Hospitals), clinical facilities face severe bottlenecks:
1. **Emergency & OPD Congestion**: Overcrowded waiting halls where critical patients often wait alongside routine minor cases.
2. **Frontline Diagnostic Delays**: ASHA and ANM health workers at rural health posts lack algorithmic guidance to accurately stratify triage urgency.
3. **Information Asymmetry**: Handwritten diagnostic slips, non-standardized vitals records, and lack of automated discharge summaries create fractured care continuity.
4. **Linguistic Barriers**: Over 80% of beneficiaries in rural and semi-urban belts speak regional Indian languages and struggle with traditional digital portal forms.

TRAAYA solves these challenges by combining:
- **Multilingual Voice Anamnesis (23 Indian Languages)** powered by Sarvam AI.
- **Tri-Color Clinical Urgency Stratification**: Algorithmic sorting into **Immediate (Red)**, **Priority (Yellow)**, and **Routine (Green)** cases based on validated emergency triage protocols.
- **Multimodal Lab Report OCR Scanner**: Automated parameter extraction from printed or mobile-photographed diagnostic lab reports (CBC, Liver Function, Lipid Panel, Glucose, etc.).
- **Bi-Directional Nurse-Patient Clarification Loop**: Enables frontline nurses to request specific clinical clarifications from patients directly through the portal, which patients answer and submit back in real time.
- **Database-Driven Telemetry & Vitals Tracking**: Direct PostgreSQL logging of systolic/diastolic BP, pulse rate, body temperature, and SpO2 oxygenation with automated clinical status indicators.
- **Structured AI Discharge Summary Generator**: Automates standard hospital discharge documentation, generating downloadable, formatted PDFs aligned with Ministry of Health & Family Welfare guidelines.
- **Role-Specialized Workspaces**: Custom operational stations for Citizens, Frontline Nurses/ASHAs, Doctors/Medical Officers, Pharmacists, Corporate/PSU Health Teams, Mobile Health Camps, and District Chief Medical Officers (CMOs).

---

## High-Level System Architecture

```
                                  TRAAYA ARCHITECTURE TOPOLOGY
                                  
     [ Beneficiary / Patient ]      [ Nurse / ASHA Worker ]      [ Medical Officer / Doctor ]
                 │                              │                              │
                 ▼                              ▼                              ▼
     ┌─────────────────────────────────────────────────────────────────────────────────────┐
     │                      NEXT.JS 16 ENTERPRISE FRONTEND (App Router)                   │
     │   - Tailwind CSS v4 Engine                   - Lucide Healthcare Iconography        │
     │   - Role-Based Dynamic Shell Routing         - Session Storage Offline Hydration    │
     │   - Real-Time Supabase WebSocket Listeners   - Multilingual UI (23 Indian Langs)    │
     └──────────────────────────┬───────────────────────────────┬──────────────────────────┘
                                │                               │
                   REST API / SSE Streams            Client-Side SDK Queries
                                │                               │
                                ▼                               │
     ┌──────────────────────────────────────────────────┐       │
     │        FASTAPI ASYNC BACKEND (Python 3.14)       │       │
     │  - Algorithmic Tri-Color Urgency Evaluator       │       │
     │  - Vision AI Diagnostic OCR Engine               │       │
     │  - Clinical Knowledge Graph & RAG Classifier     │       │
     │  - Real-Time Queue Escalation Router             │       │
     └──────────────┬───────────────────┬───────────────┘       │
                    │                   │                       │
           Analyzer & Vision        Sarvam Indian AI            │
      (Traaya-brain & Traaya-OCR)   (23 Languages STT)          │
                    │                   │                       │
                    └───────────┬───────┘                       │
                                │                               │
                                ▼                               ▼
     ┌─────────────────────────────────────────────────────────────────────────────────────┐
     │                    POSTGRESQL DATABASE & SUPABASE MANAGED CLOUD                     │
     │  - Typed Drizzle ORM Schema             - Supabase Auth Engine                      │
     │  - Row-Level Security (RLS) Policies     - Real-Time Publication Channels           │
     │  - Encrypted Medical Storage Bucket     - Transactional Connection Pooling (IPv4)   │
     └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Operational Workflow Across Healthcare Personas

### 1. Citizen & Beneficiary Journey (`/citizen`)
```
[Voice/Text Input in Indian Language] ──► [Adaptive AI Clinical Questions] ──► [Lab Report Upload (Optional)]
                                                                                       │
                                                                                       ▼
[Encounter Created (#CaseID)] ◄── [Tri-Color Urgency Assessed] ◄── [AI Intake Engine Validates]
            │
            ├─► [Live Dashboard]: Real-time status badge ("Under Review", "Reverted", "Resolved")
            ├─► [Telemetry Logger]: Log daily BP, Pulse, Temp, SpO2 directly to PostgreSQL database
            ├─► [Care Reminders]: Daily medication alerts, clinic appointments, ASHA home visits
            └─► [Interactive Encounter Timeline]:
                     ├─ If nurse requires more info: Patient answers reverted questions directly
                     ├─ If resolved: View clinical advice, diagnostic analysis & discharge PDF
```

1. **Intake & Anamnesis (`/citizen/symptoms`)**:
   - Citizens enter chief complaints via text or click the microphone to speak in Odia, Hindi, Bengali, Telugu, Tamil, Marathi, Punjabi, Gujarati, Kannada, or English.
   - Sarvam AI transcribes regional speech into standardized clinical text.
   - The Traaya-brain Clinical RAG engine triggers 5–8 adaptive anamnesis questions dynamically customized to the complaint (e.g., pain radiation, headache severity, duration, red flags).
   - Beneficiaries can optionally upload lab reports or mobile photos of previous prescriptions.
2. **Digital Health Locker & Dashboard (`/citizen`)**:
   - Displays active encounters with live status chips (`Under Review`, `Reverted`, `Approved`, `Resolved`).
   - **Latest Vitals Telemetry**: Shows real resting vital measurements (Systolic/Diastolic BP, Pulse, Body Temp, SpO2) fetched directly from `public.patient_vitals_logs`.
   - **Daily Vitals Self-Log**: Allows the citizen to input their daily BP, pulse, temp, and oxygen levels directly on the dashboard. Submitting persists to PostgreSQL and immediately updates the telemetry card without page reloads.
3. **Interactive Encounter Review (`/citizen/timeline/[id]`)**:
   - Chronological symptom progression and diagnostic report findings.
   - **Bi-Directional Follow-Up**: If a triage nurse reverts the case with clarifying questions, a prominent alert prompts the patient to fill in the answers and submit them back, immediately transitioning the ticket back to `Under Review`.

---

### 2. Frontline Health Worker & ASHA / ANM Station (`/nurse`)
```
[Triage Review Queue] ──► Filter by [Immediate / Priority / Routine] or [Search by UHID]
          │
          ▼
[Case Review Deck] ──► Inspect Chief Complaint, Anamnesis Answers, Vitals & OCR Lab Values
          │
          ├─► [Revert with Question] ──► Enters specific clarification questions ──► Reverts to Citizen
          ├─► [Escalate / Refer]      ──► Selects Higher Center (CHC/DH) + Transfer Reason
          └─► [Direct Consult/Resolve]─► Enters Nurse Clinical Notes ──► Resolves Case
```

1. **Tri-Color Triage Queue (`/nurse`)**:
   - Real-time queue partitioned into **Immediate (Red)**, **Priority (Yellow)**, and **Routine (Green)** based on algorithmic risk scores.
   - Real-time indicators alert staff to pending lab reports, high fever alerts, or abnormal vitals.
2. **Case Review Deck (`CaseReviewWorkspace`)**:
   - Multi-tab inspection: Case Overview, Clinical Anamnesis Q&A, Vitals & Labs, and Facility Referral notes.
3. **Clinical Action Deck (`CaseActionDeck`)**:
   - **Revert with Question**: Allows staff to add one or multiple targeted questions (e.g., *"Did the fever subside after paracetamol?", "Any history of neck stiffness?"*) and revert the case back to the patient.
   - **Refer / Transfer**: Routes the patient to nearby CHC or District Hospital with transfer reason and vehicle dispatch coordination.
   - **Direct Resolve**: Adds nursing guidance and marks the ticket resolved for routine cases.

---

### 3. Medical Officer & Doctor Command Station (`/doctor`)
```
[Doctor Clinical Queue] ──► [Inspect AI Differential & Lab Parameters] ──► [Conduct OPD / Teleconsult]
                                                                                     │
                                                                                     ▼
[Generate Standardized Discharge Summary] ◄── [Prescribe Medicines & Clinical Plan]
           │
           ▼
[Download Official Hospital Discharge PDF] ──► Synchronized to Patient Health Locker & ABDM
```

1. **Specialist Review Queue (`/doctor`)**:
   - High-throughput worklist sorted by clinical priority, presenting AI differential suggestions, red flag indicators, and extracted diagnostic parameters.
2. **Clinical Decision Deck (`/doctor/decision`)**:
   - Physician enters diagnosis, clinical notes, prescribed medications (with dosage, frequency, and duration), and dietary instructions.
3. **Automated Discharge Summary Synthesizer (`/api/doctor/generate-discharge`)**:
   - Automatically merges the patient profile, clinical intake complaint, vital signs, physical exam notes, diagnoses, and treatments into a standardized Hospital Discharge Summary.
   - Renders a downloadable, printable PDF document formatted in accordance with Ministry of Health & Family Welfare standards.

---

### 4. Pharmacy & Central Dispensary Desk (`/medical` & `/facility`)
- **Jan Aushadhi Prescription Queue**: Dispenses prescribed generic medications directly to citizens.
- **Inventory & Telemetry**: Tracks availability of essential drugs (Paracetamol, Amoxicillin, ORS, Metformin) and telemetry on hospital bed, oxygen, and ICU occupancy.
- **Referral Coordination**: Manages inbound and outbound inter-facility patient transfers.

---

### 5. Enterprise, PSU Industries & Campuses (`/organization`)
- **Workforce Health Monitoring**: Enables organizations (e.g., NALCO, MCL, Tata Steel, universities) to monitor employee occupational health risks.
- **Mass Screening Sessions**: Logs employee vitals, chronic lifestyle conditions (hypertension, diabetes), and schedules periodic PHC medical reviews.

---

### 6. Mobile Medical Unit (MMU) & Rural Health Camps (`/healthcamp`)
- **Rural Outreach Station**: Deployed in mobile health vans for remote tribal and rural blocks.
- **Fast Token Generation**: Rapid offline-capable beneficiary registration and vital recording.
- **Direct 108 Emergency Ambulance Dispatch**: One-click ambulance coordination for critical patients.

---

### 7. Chief Medical Officer & District Administration (`/admin`)
- **District Health Dashboard**: Real-time map view of block-level syndromic trends and fever spikes (e.g., Dengue, Malaria, Acute Gastroenteritis).
- **Audit Logs & Provider Directory**: Complete audit trail of every triage decision, AI recommendation override, and clinical action.

---

## Detailed Technology Stack

| Layer | Technology | Version | Purpose in TRAAYA |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | `16.3.5` | Universal server-rendered and client-hydrated reactive healthcare portal. |
| **Styling & Design System** | Tailwind CSS v4 | `4.x` | Modern styling adhering to the "Clinical Calm & Precision" design tokens. |
| **Icons & Visual Language** | Lucide React | `1.46.0` | Comprehensive clinical iconography (Stethoscope, HeartPulse, Activity, etc.). |
| **Document Generation** | jsPDF | `4.2.1` | Client-side and server-assisted generation of standard clinical discharge summaries. |
| **Backend API** | FastAPI (Python) | `0.115+` | High-throughput asynchronous Python microservices architecture. |
| **Server Engine** | Uvicorn (ASGI) | `0.34+` | Production ASGI web server running on port 8000. |
| **Language & Data Validation** | Python & Pydantic | `3.14 / 2.10` | Strict data validation, schema enforcement, and type safety. |
| **Database & ORM** | PostgreSQL & Drizzle ORM | `0.45.2` | Fully typed relational database schema with migrations and direct query capabilities. |
| **Database Pooler & Client** | Postgres.js / Supabase | `3.4.9` | Transactional and session connection pooling via Supabase cloud infrastructure. |
| **LLM Inference** | Traaya-brain| Latest API | Sub-second generative anamnesis follow-up questions and clinical report synthesis. |
| **Voice Processing** | Sarvam AI | v1 API | Speech-to-text supporting 23 Indian languages and regional dialects. |
| **Computer Vision OCR** | Traaya-OCR | Latest | High-precision extraction of diagnostic parameters from lab report imagery. |

---

## Repository File Structure

```
TriageAssist/
├── backend/                                   # FastAPI Async Python Microservices
│   ├── main.py                                # Application entry point, CORS middleware, router registration
│   ├── config.py                              # Environment variables, API keys, Supabase credentials
│   ├── clinical_engine.py                     # Algorithmic Tri-Color Urgency Evaluation logic
│   ├── agents/                                # AI Subagents & LLM Modules
│   │   ├── triage_agent.py                    # Voice anamnesis and clinical triage evaluation agent
│   │   ├── clinical_rag.py                    # Knowledge-base RAG & rule-based clinical priority engine
│   │   ├── ocr_agent.py                       # Lab diagnostic document parser
│   │   └── llm_client.py                      # Groq & multimodal LLM client wrapper
│   ├── routers/                               # API Route Controllers
│   │   ├── triage/
│   │   │   ├── tickets.py                     # /api/triage/patient-tickets, get/update tickets
│   │   │   ├── queue.py                       # /api/triage/cases, nurse queue, triage listings
│   │   │   ├── symptoms.py                    # /api/triage/evaluate-symptoms, dynamic Q&A generator
│   │   │   ├── actions.py                     # Case actions (revert, resolve, escalate, refer)
│   │   │   ├── intake.py                      # Rapid walk-in patient intake endpoint
│   │   │   ├── facility.py                    # Facility referral management
│   │   │   └── schemas.py                     # Pydantic request/response schemas
│   │   ├── ocr/
│   │   │   ├── scanner.py                     # /api/ocr/analyze, full document parameter extraction
│   │   │   ├── inquiries.py                   # Patient chat & AI report query explanation
│   │   │   └── summaries.py                   # Plain-language diagnostic report summaries
│   │   ├── reminders.py                       # /api/reminders/* and /api/reminders/log-vitals
│   │   ├── auth.py                            # Authentication, session verification, user provisioning
│   │   ├── users.py                           # User profile updates and doctor/nurse rosters
│   │   └── analytics.py                       # Syndromic outbreak metrics and district analytics
│   └── requirements.txt                       # Python dependencies (fastapi, uvicorn, httpx, pydantic)
│
├── frontend/                                  # Next.js 16 App Router Enterprise Client
│   ├── public/                                # Static assets (TRAAYA logo, illustrations, avatars)
│   │   ├── traaya-logo.png                    # Primary brand logo
│   │   ├── Traaya Healthcare Logo.png         # High-resolution brand emblem
│   │   └── Doctor nurse patient portrait.png  # 3D clinical consultation illustration
│   ├── src/
│   │   ├── app/                               # App Router Page Directory
│   │   │   ├── page.tsx                       # Public Landing Page & National Pilot Showcase
│   │   │   ├── login/page.tsx                 # Universal Login with 1-Click Demo Personas
│   │   │   ├── register/page.tsx              # Role-based Account Registration
│   │   │   ├── citizen/                       # Citizen & Beneficiary Health Locker
│   │   │   │   ├── page.tsx                   # Citizen Dashboard (Active Ticket, Telemetry, Self-Log)
│   │   │   │   ├── symptoms/page.tsx          # 4-Step Voice & AI Symptom Intake Wizard
│   │   │   │   ├── timeline/page.tsx          # Clinical Encounter History Table
│   │   │   │   ├── timeline/[id]/page.tsx     # Interactive Case Journey & Clarification Q&A Form
│   │   │   │   ├── reminders/page.tsx         # Medication Schedule & Vitals Tracker
│   │   │   │   ├── upload/page.tsx            # Lab Report OCR Upload & Extraction Locker
│   │   │   │   └── profile/page.tsx           # ABHA Profile, Allergies, Emergency Contacts
│   │   │   ├── nurse/                         # Frontline Health Worker / ANM Station
│   │   │   │   ├── page.tsx                   # Triage Queue & Bedside Review Deck
│   │   │   │   └── ocr/page.tsx               # Dedicated ANM Lab Report OCR Desk
│   │   │   ├── doctor/                        # Medical Officer & Specialist Command Station
│   │   │   │   ├── page.tsx                   # Doctor OPD Queue & Case Audit Deck
│   │   │   │   ├── decision/page.tsx          # Prescription & Clinical Handoff Form
│   │   │   │   └── profile/page.tsx           # HPR Credentials & Clinical Specialization
│   │   │   ├── medical/page.tsx               # Pharmacy & Jan Aushadhi Dispensary Queue
│   │   │   ├── organization/page.tsx          # Enterprise & Campus Workforce Health Dashboard
│   │   │   ├── healthcamp/page.tsx            # Mobile Medical Unit (MMU) Camp Operations
│   │   │   ├── admin/page.tsx                 # Chief Medical Officer District Surveillance
│   │   │   └── api/                           # Next.js Serverless API Route Handlers
│   │   │       ├── patient/reminders/vitals/  # GET/POST database-backed patient vitals logs
│   │   │       ├── patient/reminders/         # GET/POST/PATCH/DELETE care reminders
│   │   │       ├── patient/triage/            # Patient intake ticket proxy & PDF generator
│   │   │       ├── doctor/generate-discharge/ # Automated AI hospital discharge summary builder
│   │   │       └── sarvam/speech-to-text/     # 23 Indian languages speech-to-text proxy
│   │   ├── components/                        # Modular Component Architecture
│   │   │   ├── auth/                          # LoginBrandPanel, LoginHeader, AuthForms
│   │   │   ├── patient/                       # PatientShell, DashboardWidgets, SymptomWizard
│   │   │   ├── nurse/                         # NurseShell, TriageQueueView, CaseReviewWorkspace
│   │   │   ├── doctor/                        # DoctorShell, DoctorCaseTabs, DischargeModal
│   │   │   └── common/                        # Header, Navigation, Modals, StatusBadges
│   │   └── lib/                               # Contexts, Utilities & Supabase Client
│   │       ├── auth-context.tsx               # Client authentication state & role permissions
│   │       ├── supabase.ts                    # Supabase client singleton & channel manager
│   │       └── utils.ts                       # Classnames merger and date formatting helpers
│   └── package.json                           # Frontend npm dependencies and build scripts
│
├── db/                                        # Drizzle ORM Database Schema Package
│   ├── schema.ts                              # PostgreSQL typed table definitions
│   ├── supabase.sql                           # Idempotent Supabase DDL, indices & RLS policies
│   ├── drizzle.config.ts                      # Drizzle Kit CLI configuration
│   └── SCHEMA_ARCHITECTURE_AND_VERIFICATION.md# Complete relational database verification guide
└── README.md                                  # Platform Documentation (This File)
```

---

## Database Relational Architecture & Tables

TRAAYA utilizes a relational PostgreSQL schema managed with **Drizzle ORM** and hosted on **Supabase**.

```mermaid
erDiagram
    PROFILES ||--o{ TRIAGE_TICKETS : "files or reviews"
    PROFILES ||--o{ PATIENT_VITALS_LOGS : "logs telemetry"
    PROFILES ||--o{ PATIENT_REMINDERS : "schedules adherence"
    PROFILES ||--o{ MEDICAL_REPORTS : "owns lab reports"
    PROFILES ||--o| DOCTOR_PROFILES : "specialist credentials"
    PROFILES ||--o| NURSE_PROFILES : "nursing license"
    PROFILES ||--o| ORGANIZATION_PROFILES : "workforce portal"

    TRIAGE_TICKETS ||--o{ PATIENT_VITALS_LOGS : "linked encounter vitals"
    TRIAGE_TICKETS ||--o{ MEDICAL_REPORTS : "attached diagnostic slips"
    TRIAGE_TICKETS ||--o{ AUDIT_LOGS : "records clinical actions"
    TRIAGE_TICKETS ||--o{ HOSPITAL_REFERRALS : "generates inter-facility transfer"
```

### Key Database Tables

1. **`public.profiles`**: Core identity table anchoring all 7 system roles.
   - Fields: `id` (UUID, PK), `user_id` (e.g. `PAT-622589`, `DOC-102`), `full_name`, `email`, `role`, `phone`, `gender`, `age`, `district`, `state`.
2. **`public.triage_tickets`**: Central encounter table storing every triage submission.
   - Fields: `id` (UUID), `case_number` (`#4C359538`), `patient_id`, `doctor_id`, `nurse_id`, `urgency` (`immediate`, `priority`, `routine`), `status` (`Under Review`, `Reverted`, `Approved`, `Resolved`), `chief_complaint`, `symptoms_data` (JSONB with AI anamnesis, duration, severity), `reverted_questions` (JSONB array of nurse questions and patient responses), `discharge_report_text`, `discharge_report_url`, `created_at`.
3. **`public.patient_vitals_logs`**: Time-series telemetry table powering the live dashboard vitals.
   - Fields: `id` (UUID), `patient_id` (UUID FK), `ticket_id` (UUID FK nullable), `systolic` (INT), `diastolic` (INT), `pulse` (INT), `spo2` (INT), `temperature` (NUMERIC), `blood_sugar` (NUMERIC), `notes` (TEXT), `logged_at` (TIMESTAMPTZ).
4. **`public.patient_reminders`**: Medication adherence and clinical appointments.
   - Fields: `id` (UUID), `patient_id`, `type` (`medication`, `consultation`, `asha_visit`, `vitals_log`), `title`, `dosage`, `frequency`, `scheduled_time`, `is_completed`, `last_completed_at`.
5. **`public.medical_reports`**: Extracted OCR diagnostic report files and structured parameters.
   - Fields: `id` (UUID), `patient_id`, `report_type` (CBC, Lipid, LFT), `file_url`, `extracted_data` (JSONB parameters with HIGH/LOW/NORMAL status), `created_at`.
6. **`public.audit_logs`**: Non-repudiation audit trail for medical legal compliance.
   - Fields: `id` (UUID), `ticket_id`, `actor_id`, `actor_role`, `action` (`TRIAGE_OVERRIDE`, `REVERT_QUESTION`, `DISCHARGE_GENERATED`), `previous_state`, `new_state`, `created_at`.

---

## Clinical AI & Decision Support Engines

### 1. Tri-Color Clinical Evaluation (`clinical_engine.py`)
- Evaluates vital signs against emergency thresholds:
  - **Immediate (Red)**: SpO2 < 92%, Systolic BP > 180 or < 80 mmHg, Pulse > 130 or < 45 bpm, Severe chest pain, Sudden thunderclap headache, Altered consciousness.
  - **Priority (Yellow)**: Temp ≥ 101°F, Moderate respiratory distress, Persistent vomiting, High BP (Stage 2: > 140/90).
  - **Routine (Green)**: Stable vitals with mild localized symptoms (mild cold, minor rash, chronic refill).

### 2. Adaptive Anamnesis Agent (`backend/agents/triage_agent.py`)
- Uses Traaya-brain instructed as a Senior Primary Care Clinical Specialist.
- Reviews patient's initial complaint and dynamically generates tailored follow-up questions to identify red flags, symptom duration, radiation, and aggravating/relieving factors before the patient meets clinical staff.

### 3. Diagnostic OCR Parser (`backend/routers/ocr/scanner.py`)
- Ingests laboratory report images or PDFs.
- Normalizes parameter names (e.g., Hemoglobin, Platelet Count, Total Leukocyte Count, Fasting Blood Sugar, HbA1c, Serum Creatinine).
- Compares measured values against age/gender reference ranges, assigning clinical flags (`NORMAL`, `ELEVATED`, `CRITICAL_LOW`, `URGENT_EVALUATION`).

### 4. Automated Hospital Discharge Synthesizer (`/api/doctor/generate-discharge`)
- Combines clinical diagnosis, course in hospital/OPD, lab summaries, and prescribed pharmacotherapy into an official discharge summary document adhering to the Indian National Health Portal standards.

---

## Complete API Route Reference

### Backend FastAPI Microservices (`http://localhost:8000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/triage/cases` | Fetches active triage queue cases with symptoms, urgency, and facility status. |
| `GET` | `/api/triage/patient-tickets` | Fetches all triage tickets for a specific patient by ID/UUID. |
| `POST` | `/api/triage/evaluate-symptoms` | Evaluates complaints and vitals, generating adaptive anamnesis questions. |
| `POST` | `/api/triage/revert-ticket` | Reverts ticket back to patient with nurse clarification questions. |
| `POST` | `/api/triage/resolve-ticket` | Marks ticket resolved with nurse/doctor guidance notes. |
| `POST` | `/api/triage/refer-ticket` | Escalates and transfers patient to higher healthcare center (CHC/DH). |
| `POST` | `/api/ocr/analyze` | Multimodal OCR parameter extraction from uploaded diagnostic reports. |
| `POST` | `/api/ocr/inquire` | AI chatbot answering patient questions about their lab report findings. |
| `POST` | `/api/reminders/log-vitals` | Logs resting vital telemetry to health locker. |
| `GET` | `/api/analytics/overview` | Aggregated syndromic surveillance metrics and fever clusters. |

### Frontend Next.js API Routes (`http://localhost:3000`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/patient/reminders/vitals` | Retrieves latest logged vitals (BP, pulse, temp, SpO2) from PostgreSQL. |
| `POST` | `/api/patient/reminders/vitals` | Inserts new self-logged vitals entry into `public.patient_vitals_logs`. |
| `GET/POST`| `/api/patient/reminders` | Fetches, creates, toggles, or deletes care reminders. |
| `POST` | `/api/doctor/generate-discharge` | Generates official formatted Hospital Discharge Summary with AI synthesis. |
| `POST` | `/api/sarvam/speech-to-text` | Proxy for Sarvam AI speech-to-text supporting 23 Indian languages. |
| `POST` | `/api/patient/triage` | Proxy creating triage intake tickets and generating PDF receipts. |

---

## 1-Click Demo Personas (For Juries & Presentations)

TRAAYA includes built-in demo credentials accessible directly from the `/login` page:

| Persona Role | Demo Name | Facility / Jurisdiction | Key Features to Demonstrate |
|---|---|---|---|
| **Citizen / Patient** | `Prayas Das` (`PAT-622589`) | CHC Khandapada, Odisha | Voice intake in Indian languages, live encounter tracking, answering nurse follow-up questions, logging daily vitals. |
| **Triage Nurse / ANM** | `Sunita Behera, GNM` (`NUR-8812`) | Sector 4 Ayushman Arogya Mandir | Tri-color queue sorting, reviewing symptoms, reverting cases with clarifying questions, initiating CHC escalations. |
| **Doctor / MO** | `Dr. Bikash Mohanty, MD` (`DOC-4412`) | CHC Khandapada | Reviewing high-priority queue, differential review, entering e-prescriptions, generating and downloading official discharge PDFs. |
| **Pharmacy / Lab** | `Ranjan Sahu, D.Pharm` (`MED-2014`) | Jan Aushadhi Kendriya Store | Viewing e-prescription queue, marking dispensed medications, reviewing oxygen/bed telemetry. |
| **PSU / Industry** | `NALCO Health Officer` (`ORG-502`) | Angul Industrial Division | Mass employee health screening, chronic disease tiering, workplace referrals. |
| **Mobile Health Camp** | `Camp Team Lead` (`CMP-104`) | Rural Outreach MMU Nayagarh | Field triage tokens, rapid vital logging, emergency 108 ambulance dispatch linkage. |
| **Admin / CMO** | `Chief Medical Officer` (`ADM-001`) | District Civil Administration | Syndromic surveillance heatmaps, facility utilization metrics, audit trail inspections. |

---

## Local Setup & Deployment Guide

### Prerequisites
- **Node.js**: `v20.x` or `v24.x`
- **Python**: `3.10` to `3.14`
- **PostgreSQL / Supabase** account

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
.\venv\Scripts\uvicorn.exe main:app --reload --port 8000
```
*API Documentation available at:*
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **Direct Swagger Alias**: `http://localhost:8000/swagger`
- **Clean ReDoc Reference**: `http://localhost:8000/redoc`
- **Raw OpenAPI JSON**: `http://localhost:8000/openapi.json`


### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web application runs locally at: `http://localhost:3000`*

### 3. Environment Variables
#### `backend/.env`
```env
SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
SUPABASE_KEY="[YOUR_SUPABASE_SERVICE_OR_ANON_KEY]"
GROQ_API_KEY="gsk_[YOUR_GROQ_API_KEY]"
SARVAM_API_KEY="sk_[YOUR_SARVAM_API_KEY]"
```

#### `frontend/.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
DATABASE_URL=postgresql://postgres.[YOUR_PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
NEXT_PUBLIC_API_URL=http://localhost:8000
GROQ_API_KEY=gsk_[YOUR_GROQ_API_KEY]
SARVAM_API_KEY=sk_[YOUR_SARVAM_API_KEY]
```

---

## Presentation & Pitch Deck Outline (For PPT Slides)

When compiling presentation slides for hackathons, clinical juries, or stakeholder reviews:

- **Slide 1: Title & Vision**: *TRAAYA — Ayushman Bharat & ABDM Compliant Intelligent Healthcare Triage Platform*.
- **Slide 2: The Problem**: Rural diagnostic delays, emergency OPD crowding, handwritten records, linguistic barriers in regional India.
- **Slide 3: The Solution**: Multilingual AI intake, algorithmic tri-color urgency categorization, multimodal lab OCR, and connected role stations.
- **Slide 4: Citizen Experience**: Voice intake in 23 languages, real-time ticket progression, daily vitals telemetry logging directly to health locker.
- **Slide 5: Clinical Frontline Workflow**: ANM/Nurse station, bidirectional clarification loop, specialist handoff, and CHC referral.
- **Slide 6: Doctor Station & Discharge AI**: OPD decision deck, automated standard hospital discharge summaries with instant PDF generation.
- **Slide 7: Enterprise, Health Camps & Pharmacy**: Jan Aushadhi inventory telemetry, PSU employee screening, and mobile camp MMU integration.
- **Slide 8: Architecture & Technology**: Next.js 16, Tailwind CSS v4, FastAPI, PostgreSQL (Drizzle ORM), Traaya-brain, Sarvam AI.
- **Slide 9: Standards Compliance**: ABDM/ABHA account linking, FHIR compliance, MoHFW discharge formats, and RLS audit logs.
- **Slide 10: Live Demonstration**: 1-Click login personas showcasing the end-to-end journey from Citizen Voice Intake to Doctor Discharge Summary.

---

## License & Attribution

Designed and engineered for the **National Digital Health Ecosystem** under the **TRAAYA Healthcare Initiative**. Built with precision, security, and accessibility for frontline healthcare workers across India.
