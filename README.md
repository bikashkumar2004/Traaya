# TRAAYA: Clinical Healthcare & Frontline Triage Assistive Platform

> **Ayushman Bharat Digital Mission (ABDM) & National Health Systems Resource Centre (NHSRC) Compliant**  
> *Transforming Frontline Clinical Workflows, Multilingual Voice Anamnesis (23 Indian Languages), Diagnostic Lab Report OCR, and Care Coordination Across India*

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=for-the-badge&logo=python)](https://python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Managed_Cloud-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-7--Alpine-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ED?style=for-the-badge&logo=docker)](https://docker.com/)

---

## Table of Contents

1. [Executive Overview & National Health Context](#1-executive-overview--national-health-context)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [Exhaustive Project Directory Structure](#3-exhaustive-project-directory-structure)
4. [Healthcare Personas & Operational Workflows](#4-healthcare-personas--operational-workflows)
5. [Clinical AI & Decision Support Engines](#5-clinical-ai--decision-support-engines)
6. [Database Relational Architecture & Schemas](#6-database-relational-architecture--schemas)
7. [Comprehensive API Reference](#7-comprehensive-api-reference)
8. [1-Click Interactive Demo Personas](#8-1-click-interactive-demo-personas)
9. [Local Development & Docker Deployment Guide](#9-local-development--docker-deployment-guide)
10. [Environment Variables Reference](#10-environment-variables-reference)
11. [Verification, Testing & Diagnostics](#11-verification-testing--diagnostics)
12. [Standards Compliance & Ethical Safeguards](#12-standards-compliance--ethical-safeguards)

---

## 1. Executive Overview & National Health Context

**TRAAYA** (formerly *TriageAssist*) is a full-stack, enterprise-grade clinical decision support and health triage ecosystem engineered in compliance with **Ayushman Bharat Digital Mission (ABDM)** building blocks and **National Health Systems Resource Centre (NHSRC)** clinical triage protocols.

In India's tiered public healthcare network (Sub-Centres, Ayushman Arogya Mandirs, Primary Health Centres [PHC], Community Health Centres [CHC], and District Hospitals), clinical facilities face critical operational bottlenecks:

1. **Emergency & OPD Congestion**: Overcrowded waiting halls where critical, deteriorating patients often wait alongside routine, self-limiting cases due to subjective manual token queues.
2. **Frontline Diagnostic Latency**: Grassroots ASHA and ANM health workers at rural health posts lack structured algorithmic guidance to rapidly stratify clinical acuity and detect subtle shock signs.
3. **Linguistic Fragmentation**: Over 80% of beneficiaries in rural and semi-urban belts speak regional Indian languages and cannot engage with conventional text-based digital health forms.
4. **Information Asymmetry & Lost Diagnostics**: Handwritten prescription slips, paper-based lab reports, and fragmented telemetry result in fractured care continuity during inter-facility referrals.

### The TRAAYA Solution
- **Multilingual Voice Anamnesis (23 Indian Languages)**: Powered by Sarvam AI speech models (Hindi, Odia, Bengali, Telugu, Tamil, Marathi, Punjabi, Gujarati, Kannada, etc.).
- **Algorithmic Tri-Color Urgency Stratification**: Classifies cases into **Immediate (Red)**, **Priority (Yellow)**, and **Routine (Green)** based on validated Emergency Severity Index (ESI) thresholds and physiological shock indices.
- **Multimodal Lab Report OCR Scanner**: Automatic parameter extraction from printed or mobile-photographed diagnostic lab reports (Complete Blood Count, Liver Function, Lipid Panel, Blood Glucose).
- **Bi-Directional Nurse-Patient Clarification Loop**: Enables frontline nurses to request specific clinical clarifications directly through the portal, which patients answer and submit back in real time without physical re-queuing.
- **Database-Driven Telemetry & Vitals Tracking**: Direct PostgreSQL logging of systolic/diastolic blood pressure, pulse rate, body temperature, and SpO2 oxygenation with automated clinical status indicators.
- **MoHFW-Compliant AI Hospital Discharge Generator**: Synthesizes intake complaints, vital signs, physical exam notes, diagnoses, and treatments into a standardized, downloadable, printable hospital discharge PDF adhering to Ministry of Health & Family Welfare guidelines.
- **7 Role-Specialized Consoles**: Custom operational stations for Citizens, Frontline Nurses/ASHAs, Doctors/Medical Officers, Pharmacists, Corporate/PSU Health Teams, Mobile Medical Units, and District Chief Medical Officers.

---

## 2. High-Level System Architecture

```
                                  TRAAYA ARCHITECTURAL TOPOLOGY
                                  
     [ Beneficiary / Patient ]      [ Nurse / ASHA Worker ]      [ Medical Officer / Doctor ]
                 │                              │                              │
                 ▼                              ▼                              ▼
     ┌─────────────────────────────────────────────────────────────────────────────────────┐
     │                      NEXT.JS 16 ENTERPRISE CLIENT (App Router)                      │
     │   - React 19 Engine                         - Tailwind CSS v4 Clinical Design       │
     │   - Lucide Healthcare Iconography           - Dynamic Role-Based Route Handlers     │
     │   - Session Storage Offline Hydration       - Real-Time Supabase WebSocket Channels │
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
     │  - Typed Drizzle ORM Schema             - Supabase Auth & JWT Engine                │
     │  - Row-Level Security (RLS) Policies     - Real-Time Database Publication Channels  │
     │  - Encrypted Medical Storage Bucket     - Transactional Connection Pooling (IPv4)   │
     └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Exhaustive Project Directory Structure

```
TriageAssist/
├── backend/                                   # FastAPI Async Python Microservices (Port 8000)
│   ├── main.py                                # Application entry point, OpenAPI metadata, CORS middleware, router registration
│   ├── config.py                              # Environment loader, Supabase keys, Groq/Sarvam API credentials, CORS origins
│   ├── clinical_engine.py                     # Algorithmic Tri-Color Urgency Engine (Red/Yellow/Green physiological thresholds)
│   ├── requirements.txt                       # Python dependencies (fastapi, uvicorn, httpx, pydantic, redis, python-dotenv)
│   ├── Dockerfile                             # Python 3.14 lightweight slim container build specification
│   ├── .dockerignore                          # Docker build exclusion rules (virtual environments, cache, git)
│   ├── .env                                   # Backend environment variables and secrets (local development)
│   ├── .gitignore                             # Git ignore rules for Python artifacts and caches
│   │
│   ├── agents/                                # AI Subagents & LLM Pipelines
│   │   ├── __init__.py                        # Agent package initializer
│   │   ├── triage_agent.py                    # Voice anamnesis and clinical triage evaluation agent
│   │   ├── clinical_rag.py                    # Knowledge-base RAG & rule-based clinical priority engine
│   │   ├── ocr_agent.py                       # Lab diagnostic document parser & biochemical parameter extractor
│   │   └── llm_client.py                      # Universal model client supporting Groq, Hugging Face, and Kaggle ngrok tunnels
│   │
│   ├── routers/                               # FastAPI Route Controllers
│   │   ├── auth.py                            # /api/auth/* (login, session verification, user role provisioning)
│   │   ├── analytics.py                       # /api/analytics/* (syndromic outbreak surveillance, block heatmaps)
│   │   ├── reminders.py                       # /api/reminders/* (medication adherence and vital telemetry logger)
│   │   ├── users.py                           # /api/users/* (ABHA patient profiles, doctor rosters, health worker directories)
│   │   │
│   │   ├── triage/                            # Clinical Triage Microservice Endpoints
│   │   │   ├── __init__.py                    # Router aggregation and prefix definition
│   │   │   ├── actions.py                     # Case actions (revert ticket, resolve ticket, refer to CHC/DH, escalate)
│   │   │   ├── facility.py                    # Facility referral management and inter-hospital bed telemetry
│   │   │   ├── intake.py                      # Rapid walk-in patient direct registration desk
│   │   │   ├── queue.py                       # /api/triage/cases (triage listings, urgency filtering, search)
│   │   │   ├── schemas.py                     # Pydantic request/response validation schemas for triage workflows
│   │   │   ├── symptoms.py                    # /api/triage/evaluate-symptoms (dynamic adaptive anamnesis generator)
│   │   │   └── tickets.py                     # /api/triage/patient-tickets (ticket retrieval, updates, status changes)
│   │   │
│   │   └── ocr/                               # Diagnostic OCR & Lab Scanner Endpoints
│   │       ├── __init__.py                    # OCR router aggregation
│   │       ├── cache.py                       # In-memory and disk OCR extraction caching layer
│   │       ├── inquiries.py                   # /api/ocr/inquire (AI chatbot explaining lab results to beneficiaries)
│   │       ├── scanner.py                     # /api/ocr/analyze (multimodal vision parameter extraction from lab slips)
│   │       ├── schemas.py                     # Pydantic schemas for lab biomarkers, units, and reference ranges
│   │       └── summaries.py                   # /api/ocr/summarize (plain-language diagnostic summaries)
│   │
│   └── uploads/                               # Temporary storage directory for uploaded lab report images and audio
│
├── frontend/                                  # Next.js 16 Enterprise Client Application (Port 3000)
│   ├── next.config.ts                         # Next.js build configuration (Turbopack, image domains, headers)
│   ├── tsconfig.json                          # TypeScript strict type configuration and path aliases (`@/*`)
│   ├── package.json                           # NPM dependencies, scripts, and package version specifications
│   ├── postcss.config.mjs                     # PostCSS Tailwind CSS v4 processing configuration
│   ├── eslint.config.mjs                      # ESLint linting configuration
│   ├── Dockerfile                             # Multi-stage production container build for Next.js 16
│   ├── .dockerignore                          # Container exclusion rules (node_modules, .next)
│   ├── .env                                   # Frontend client and server runtime environment variables
│   │
│   ├── public/                                # Public Static Assets
│   │   ├── traaya-logo.png                    # Primary brand logo
│   │   ├── Traaya Healthcare Logo.png         # High-resolution brand emblem
│   │   ├── traaya-logo-short.png              # Compact brand favicon and icon
│   │   ├── traaya-pdf-logo.png                # High-contrast logo embedded in official discharge summary PDFs
│   │   └── Doctor nurse patient portrait.png  # 3D clinical consultation illustration
│   │
│   └── src/
│       ├── middleware.ts                      # Route protection, role-based access control, and session validation
│       │
│       ├── app/                               # Next.js App Router Page Hierarchy
│       │   ├── layout.tsx                     # Universal root layout, font imports, and theme providers
│       │   ├── page.tsx                       # Public Landing Page & National Pilot Showcase
│       │   ├── login/page.tsx                 # Universal Login with 1-Click Interactive Demo Personas
│       │   ├── register/page.tsx              # Multi-step role registration
│       │   ├── register/complete-profile/     # Post-signup clinical profile completion
│       │   │
│       │   ├── citizen/                       # Citizen / Beneficiary Health Locker Station
│       │   │   ├── page.tsx                   # Citizen Dashboard (Active Ticket, Latest Vitals, Daily Self-Log)
│       │   │   ├── symptoms/page.tsx          # 4-Step Voice & AI Symptom Intake Wizard (23 Indian Languages)
│       │   │   ├── timeline/page.tsx          # Complete Clinical Encounter History Table
│       │   │   ├── timeline/[id]/page.tsx     # Interactive Encounter Journey & Bi-Directional Clarification Form
│       │   │   ├── reminders/page.tsx         # Medication Schedule & Vitals Tracker
│       │   │   ├── upload/page.tsx            # Lab Report OCR Upload & Diagnostic Parameter Inspector
│       │   │   └── profile/page.tsx           # ABHA Profile, Blood Group, Allergies, Emergency Contacts
│       │   │
│       │   ├── nurse/                         # Frontline Health Worker / ANM Station
│       │   │   ├── page.tsx                   # Tri-Color Triage Queue & Bedside Review Deck
│       │   │   ├── intake/page.tsx            # Walk-in Patient Direct Intake Desk
│       │   │   ├── ocr/page.tsx               # Dedicated ANM Diagnostic Lab Report OCR Scanner
│       │   │   ├── escalations/page.tsx       # Inter-Facility Referral & Emergency Transfer Worklist
│       │   │   └── profile/page.tsx           # Nursing Credentials, Facility Assignment, Roster Details
│       │   │
│       │   ├── doctor/                        # Medical Officer & Specialist Command Station
│       │   │   ├── page.tsx                   # Doctor OPD Priority Queue & Case Audit Deck
│       │   │   ├── decision/page.tsx          # Clinical Prescription & Treatment Handoff Form
│       │   │   ├── history/page.tsx           # Doctor Patient Consultation History
│       │   │   ├── audit/page.tsx             # Clinical Decision Audit Trail & Triage Overrides
│       │   │   ├── analytics/page.tsx         # Caseload Analytics, Triage Accuracy & Throughput Metrics
│       │   │   └── profile/page.tsx           # HPR Credentials, MCI/SMC Registration, OPD Room
│       │   │
│       │   ├── medical/page.tsx               # Pharmacy & Jan Aushadhi Dispensary Queue
│       │   ├── organization/page.tsx          # Enterprise & PSU Occupational Workforce Health Console
│       │   ├── healthcamp/page.tsx            # Mobile Medical Unit (MMU) Camp Operations & 108 Dispatch
│       │   ├── admin/page.tsx                 # District Chief Medical Officer (CMO) Epidemiological Surveillance
│       │   ├── facility/page.tsx              # Central Facility Bed, Oxygen, and Ambulance Telemetry
│       │   │
│       │   └── api/                           # Next.js Serverless API Route Handlers
│       │       ├── admin/facilities/          # Facility list and bed occupancy telemetry
│       │       ├── admin/register/            # Administrative practitioner provisioning
│       │       ├── auth/login/                # User authentication and JWT cookie issuance
│       │       ├── auth/logout/               # Session termination and cookie invalidation
│       │       ├── auth/refresh/              # Token refresh handler
│       │       ├── auth/session/              # Active user session lookup
│       │       ├── auth/register/             # User registration handler
│       │       ├── doctor/generate-discharge/ # Automated AI MoHFW-standard Hospital Discharge Summary synthesizer
│       │       ├── doctor/save-discharge/     # Discharge document persistence to Supabase bucket
│       │       ├── patient/dependents/        # Family member and dependent management
│       │       ├── patient/reminders/         # Medication schedule and appointment reminders
│       │       ├── patient/reminders/vitals/  # GET/POST database-backed patient vitals logs (PostgreSQL)
│       │       ├── patient/reports/           # Medical report uploads and extraction results
│       │       ├── patient/triage/            # Patient intake ticket proxy & PDF receipt generator
│       │       ├── sarvam/speech-to-text/     # 23 Indian languages speech-to-text proxy (Sarvam AI)
│       │       └── sarvam/translate/          # Regional language translation endpoint
│       │
│       ├── components/                        # Modular React UI Components
│       │   ├── admin/                         # Outbreak heatmaps, audit tables, facility roster widgets
│       │   ├── auth/                          # LoginBrandPanel, LoginHeader, RoleBadge, AuthForms
│       │   ├── common/                        # AppHeader, Sidebar, Navigation, StatusPill, StatCards
│       │   ├── doctor/                        # DoctorShell, DecisionDeck, DischargeModal, CaseTabs
│       │   ├── medical/                       # PharmacyQueue, MedicineDispenser, InventoryCard
│       │   ├── nurse/                         # NurseShell, TriageQueueView, CaseReviewWorkspace, CaseActionDeck
│       │   ├── organization/                  # WorkforceMetrics, RiskDistributionChart, MassScreeningTable
│       │   ├── patient/                       # PatientShell, DashboardWidgets, SymptomWizard, TelemetryLogger
│       │   ├── register/                      # RegistrationSteps, AadhaarEkycModal, RoleSelector
│       │   └── ui/                            # Reusable Design System Primitives (Button, Modal, Input, Badge)
│       │
│       └── lib/                               # Core Application Utilities & Clients
│           ├── auth-context.tsx               # Global React Authentication context and user state
│           ├── supabase.ts                    # Typed Supabase client singleton & WebSocket channel manager
│           ├── utils.ts                       # Tailwind merge (`cn`), currency, and date formatting helpers
│           ├── data/                          # Mock seed data, district taxonomies, and static options
│           ├── doctor/                        # Doctor clinical calculation helpers and prescription serializers
│           ├── nurse/                         # Nurse queue filters and triage sorting utilities
│           └── pdf/                           # jsPDF client-side discharge summary layout and canvas routines
│
├── db/                                        # Database Layer & Migrations (PostgreSQL + Drizzle ORM)
│   ├── schema.ts                              # Strictly typed Drizzle ORM PostgreSQL table schemas
│   ├── supabase.sql                           # Idempotent Supabase DDL, triggers, indexes, and RLS policies
│   ├── drizzle.config.ts                      # Drizzle Kit CLI configuration file
│   ├── index.ts                               # Database connection pooler initialization (postgres.js)
│   ├── package.json                           # Drizzle ORM npm scripts and migration tools
│   ├── SCHEMA_ARCHITECTURE_AND_VERIFICATION.md# Exhaustive database schema documentation & verification guide
│   └── test_verify.py                         # Automated database connection, table integrity, and RLS test suite
│
├── docs/                                      # Research, Architecture & Hackathon Presentation Assets
│   ├── BUILD_EXE_Presentation.pdf             # Official slide deck for pitch competitions and jury presentations
│   ├── Medical_OCR_Hackathon_Technical_Report.pdf # In-depth technical report on diagnostic lab report vision OCR
│   ├── Qwen2.5-7B Clinical Triage Technical Dossier.pdf # Documentation on fine-tuned clinical triage LLM models
│   ├── dataset.pdf                            # Clinical anamnesis and symptom benchmark dataset details
│   ├── EasyJot_20261008_181216 (1).pdf        # Clinical notes and field interview records
│   ├── PS_03_Rkl.pdf                          # Problem statement specification document
│   ├── Traaya Healthcare Logo.png             # Official high-resolution platform logo
│   └── TRAAYA Wellness Logo.png               # Brand alternate logo
│
├── docker-compose.yml                         # Multi-container orchestration (FastAPI + Next.js + Redis 7)
├── Hospital-Discharge-Format.pdf              # Ministry of Health & Family Welfare reference discharge summary
├── annual.jpeg                                # Architectural and system workflow visual diagram
├── test_bn.mp3                                # Sample Bengali audio file for speech-to-text intake testing
└── README.md                                  # Comprehensive Platform Documentation (This File)
```

---

## 4. Healthcare Personas & Operational Workflows

### 4.1 Citizen & Beneficiary Journey (`/citizen`)
```
[Voice/Text Input in Indian Language] ──► [Adaptive AI Clinical Anamnesis] ──► [Lab Report Upload (Optional)]
                                                                                      │
                                                                                      ▼
[Encounter Created (#CaseID)] ◄── [Tri-Color Urgency Assessed] ◄── [AI Intake Engine Validates]
            │
            ├─► [Live Dashboard]: Real-time status badge ("Under Review", "Reverted", "Resolved")
            ├─► [Telemetry Logger]: Log daily BP, Pulse, Temp, SpO2 directly to PostgreSQL database
            ├─► [Care Reminders]: Daily medication alerts, clinic appointments, ASHA home visits
            └─► [Interactive Encounter Timeline]:
                     ├─ If nurse requires more info: Patient answers reverted questions directly
                     └─ If resolved: View clinical advice, diagnostic analysis & discharge PDF
```
1. **Intake & Voice Anamnesis (`/citizen/symptoms`)**: Beneficiaries speak or type their symptoms. The Sarvam AI speech model transcribes 23 regional Indian languages into clinical text. The system triggers 5–8 adaptive follow-up questions tailored dynamically to the complaint (e.g., pain radiation, headache severity, duration, red flags).
2. **Telemetry Self-Logging (`/citizen`)**: Beneficiaries can self-log their resting blood pressure, pulse, temperature, and SpO2. The values are committed to `public.patient_vitals_logs` and render instantly without page reloads.
3. **Interactive Timeline & Clarification Response (`/citizen/timeline/[id]`)**: If a nurse reverts the ticket with clarifying questions, a prominent alert prompts the patient to respond directly, automatically updating the status back to `Under Review`.

### 4.2 Frontline Health Worker & ASHA / ANM Station (`/nurse`)
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
1. **Tri-Color Triage Queue (`/nurse`)**: Algorithmic sorting into **Immediate (Red)**, **Priority (Yellow)**, and **Routine (Green)** queues with visual alerts for abnormal vitals.
2. **Bedside Case Review Workspace**: Multi-tab view displaying chief complaints, structured anamnesis Q&A, vitals history, and OCR lab values.
3. **Clinical Action Deck**:
   - *Revert with Question*: Sends targeted questions back to the patient.
   - *Refer / Transfer*: Routes high-acuity patients to CHCs or District Hospitals with transfer notes.
   - *Direct Resolve*: Provides nursing guidance for uncomplicated cases.

### 4.3 Medical Officer & Doctor Command Station (`/doctor`)
```
[Doctor Clinical Queue] ──► [Inspect AI Differential & Lab Parameters] ──► [Conduct OPD / Teleconsult]
                                                                                     │
                                                                                     ▼
[Generate Standardized Discharge Summary] ◄── [Prescribe Medicines & Clinical Plan]
           │
           ▼
[Download Official Hospital Discharge PDF] ──► Synchronized to Patient Health Locker & ABDM
```
1. **Specialist Priority Worklist (`/doctor`)**: Prioritized queue with AI-assisted differential diagnosis suggestions and automated critical lab alerts.
2. **Clinical Decision Deck (`/doctor/decision`)**: Doctor inputs provisional/final diagnosis, clinical notes, e-prescriptions (dosage, frequency, duration), and dietary instructions.
3. **Automated Discharge Synthesizer (`/api/doctor/generate-discharge`)**: Assembles intake data, lab parameters, doctor notes, and prescriptions into a standardized Hospital Discharge Summary PDF adhering to MoHFW guidelines.

### 4.4 Secondary Operational Personas
- **Pharmacy & Dispensary Desk (`/medical`)**: Real-time queue for dispensing Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP) generic medicines with inventory tracking.
- **Enterprise & Industrial Occupational Health (`/organization`)**: Mass screening and chronic lifestyle monitoring for industrial workforces (e.g., NALCO, MCL, Tata Steel).
- **Mobile Medical Unit (MMU) / Health Camps (`/healthcamp`)**: Rural camp operations with rapid offline-tolerant token generation and one-click 108 Emergency Ambulance dispatch.
- **District Chief Medical Officer (`/admin`)**: District-level epidemiological heatmaps tracking syndromic trends (fever spikes, dengue, gastroenteritis) with full audit logging.

---

## 5. Clinical AI & Decision Support Engines

### 5.1 Algorithmic Tri-Color Urgency Evaluator (`backend/clinical_engine.py`)
Deterministic clinical heuristics and physiological shock indices evaluated in under 45 milliseconds:
- 🔴 **Immediate (Red)**:
  - Oxygen Saturation (SpO2) < 92%
  - Systolic BP > 180 mmHg or < 80 mmHg
  - Pulse Rate > 130 bpm or < 45 bpm
  - Critical symptoms: Crushing chest pain, sudden thunderclap headache, acute shortness of breath, altered consciousness, severe trauma.
- 🟡 **Priority (Yellow)**:
  - Body Temperature ≥ 101.0°F (high fever)
  - Systolic BP between 140–179 mmHg (Stage 2 Hypertension)
  - Persistent vomiting, moderate abdominal tenderness, abnormal lab biomarkers.
- 🟢 **Routine (Green)**:
  - Normal vital signs with self-limiting, localized symptoms (mild cold, minor rash, chronic medication refill).

### 5.2 Multilingual Voice Anamnesis Agent (`backend/agents/triage_agent.py`)
- Powered by Sarvam AI speech models supporting 23 Indian languages.
- Analyzes initial complaints and dynamically generates 5–8 adaptive anamnesis questions assessing onset, duration, pain radiation, aggravating/relieving factors, and emergency red flags.

### 5.3 Diagnostic Lab Report OCR Scanner (`backend/routers/ocr/scanner.py`)
- Ingests smartphone photographs or scanned PDFs of diagnostic reports.
- Normalizes parameter names across lab formats (e.g., Hemoglobin, Platelets, Total Leukocyte Count, Fasting Blood Sugar, HbA1c, SGPT/ALT, Serum Creatinine).
- Compares extracted values against biological reference intervals, tagging them as `NORMAL`, `ELEVATED`, `CRITICAL_LOW`, or `URGENT_EVALUATION`.

### 5.4 MoHFW-Standard Hospital Discharge Synthesizer (`/api/doctor/generate-discharge`)
- Merges patient demographic data, intake history, vital signs logs, physical examination findings, doctor diagnoses, and prescribed medicines into an official hospital discharge PDF format adhering to the Ministry of Health & Family Welfare standards.

---

## 6. Database Relational Architecture & Schemas

The database is built on **PostgreSQL** hosted via **Supabase** and typed using **Drizzle ORM** (`db/schema.ts`).

```mermaid
erDiagram
    PROFILES ||--o{ TRIAGE_TICKETS : "files or reviews"
    PROFILES ||--o{ PATIENT_VITALS_LOGS : "logs telemetry"
    PROFILES ||--o{ PATIENT_REMINDERS : "schedules adherence"
    PROFILES ||--o{ UPLOADED_REPORTS : "owns lab reports"
    PROFILES ||--o| DOCTOR_PROFILES : "specialist credentials"
    PROFILES ||--o| NURSE_PROFILES : "nursing license"
    PROFILES ||--o| ORGANIZATION_PROFILES : "workforce portal"
    PROFILES ||--o| HEALTHCAMP_PROFILES : "camp operations"

    TRIAGE_TICKETS ||--o{ PATIENT_VITALS_LOGS : "linked encounter vitals"
    TRIAGE_TICKETS ||--o{ UPLOADED_REPORTS : "attached diagnostic slips"
    TRIAGE_TICKETS ||--o{ NEW_PATIENT : "walk-in link"
```

### Core Database Tables (`db/schema.ts`)

| Table Name | Description | Key Columns |
| :--- | :--- | :--- |
| **`public.profiles`** | Universal user identity table for all 7 roles | `id` (UUID, PK), `user_id` (Role ID e.g. `PAT-622589`, `DOC-4412`), `full_name`, `email`, `role`, `phone`, `gender`, `age`, `state`, `district`, `block` |
| **`public.triage_tickets`** | Central clinical encounter and ticket record | `id` (UUID), `case_number` (`#LS1024`), `patient_id`, `doctor_id`, `nurse_id`, `priority` (`Red`/`Yellow`/`Green`), `status` (`Under Review`, `Reverted`, `Approved`, `Resolved`), `symptoms_data` (JSONB), `reverted_questions` (JSONB), `discharge_report_text`, `discharge_report_url` |
| **`public.patient_vitals_logs`** | Time-series telemetry powering dashboard vitals | `id` (UUID), `patient_id` (UUID FK), `ticket_id` (UUID FK), `systolic`, `diastolic`, `pulse`, `spo2`, `blood_sugar`, `temperature`, `notes`, `logged_at` |
| **`public.patient_reminders`** | Medication adherence and clinical appointments | `id` (UUID), `patient_id`, `ticket_id`, `type` (`medication`, `consultation`), `title`, `dosage`, `frequency`, `scheduled_time`, `is_completed` |
| **`public.uploaded_reports`** | Extracted OCR diagnostic report files and parameters | `id` (UUID), `patient_id`, `report_type`, `file_url`, `report_summary` (JSONB parameters with reference ranges) |
| **`public.doctor_profiles`** | Doctor credentials and OPD roster settings | `id` (UUID), `profile_id`, `medical_registration_number`, `hpr_id`, `qualification`, `department`, `room_number`, `facility_name`, `shift_schedule` |
| **`public.nurse_profiles`** | Nursing council credentials and triage station | `id` (UUID), `profile_id`, `state_council_reg`, `hpr_id`, `designation`, `facility_name`, `shift_schedule`, `cases_triaged_count` |
| **`public.new_patient`** | Direct walk-in patient registration registry | `id` (UUID), `uhid` (`OD-2026-XXXX`), `full_name`, `age`, `gender`, `phone`, `preferred_language`, `consent_status` |
| **`public.organization_profiles`**| Corporate / PSU workforce health portals | `id` (UUID), `org_code`, `name`, `category`, `city`, `total_workforce`, `active_screened` |
| **`public.organization_screenings`**| Employee health screening records | `id` (UUID), `org_id`, `employee_id`, `employee_name`, `vitals` (JSONB), `risk_tier` (`Low Risk`, `Medium Risk`, `High Risk`) |

---

## 7. Comprehensive API Reference

### 7.1 Backend FastAPI Microservices (`http://localhost:8000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API discovery and platform health status |
| `GET` | `/health` | Kubernetes / Docker liveness probe (`{"status": "healthy"}`) |
| `GET` | `/docs` / `/swagger` | Interactive Swagger UI API documentation |
| `GET` | `/redoc` | ReDoc API documentation reference |
| `GET` | `/api/triage/cases` | Fetches active triage queue cases filtered by urgency, status, or facility |
| `GET` | `/api/triage/patient-tickets`| Retrieves all triage tickets for a specific patient ID |
| `POST` | `/api/triage/evaluate-symptoms`| Evaluates complaints & vitals, generating adaptive anamnesis questions |
| `POST` | `/api/triage/revert-ticket` | Reverts ticket to patient with nurse clarification questions |
| `POST` | `/api/triage/resolve-ticket` | Marks ticket resolved with frontline nursing advice |
| `POST` | `/api/triage/refer-ticket` | Transfers patient to higher medical facility (CHC/District Hospital) |
| `POST` | `/api/ocr/analyze` | Multimodal OCR parameter extraction from uploaded diagnostic reports |
| `POST` | `/api/ocr/inquire` | AI medical chatbot answering beneficiary questions on lab reports |
| `POST` | `/api/reminders/log-vitals`| Logs resting patient vital telemetry directly to database |
| `GET` | `/api/analytics/overview` | District syndromic surveillance metrics and fever clusters |
| `POST` | `/api/auth/login` | Practitioner and citizen authentication endpoint |

### 7.2 Frontend Next.js API Routes (`http://localhost:3000`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/patient/reminders/vitals` | Retrieves latest logged resting vitals from `patient_vitals_logs` |
| `POST` | `/api/patient/reminders/vitals` | Persists a new self-logged vitals entry directly to PostgreSQL |
| `GET/POST`| `/api/patient/reminders` | Fetches, creates, toggles, or deletes care reminders |
| `POST` | `/api/doctor/generate-discharge`| Synthesizes and exports MoHFW-standard Hospital Discharge Summary PDF |
| `POST` | `/api/doctor/save-discharge` | Uploads generated discharge PDF to Supabase storage bucket |
| `POST` | `/api/sarvam/speech-to-text` | Proxy for Sarvam AI speech-to-text across 23 Indian languages |
| `POST` | `/api/sarvam/translate` | Regional language text translation proxy |
| `POST` | `/api/patient/triage` | Triage intake ticket submission proxy with PDF receipt generation |

---

## 8. 1-Click Interactive Demo Personas

TRAAYA includes built-in test credentials on the `/login` page for demonstrations, hackathon juries, and clinical reviews:

| Persona Role | Demo Name | Identifier | Facility / Station | Key Workflow to Showcase |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen / Patient** | `Prayas Das` | `PAT-622589` | CHC Khandapada, Odisha | Multilingual voice intake, dynamic anamnesis, answering reverted questions, daily vitals self-log. |
| **Triage Nurse / ANM**| `Sunita Behera, GNM`| `NUR-8812` | Sector 4 Ayushman Arogya Mandir | Tri-Color queue sorting (Red/Yellow/Green), reviewing OCR lab values, reverting with questions, CHC referral. |
| **Doctor / MO** | `Dr. Bikash Mohanty, MD` | `DOC-4412` | CHC Khandapada | Reviewing high-acuity queue, AI differential review, entering e-prescriptions, generating MoHFW discharge PDF. |
| **Pharmacy / Lab** | `Ranjan Sahu, D.Pharm` | `MED-2014` | Jan Aushadhi Kendriya Store | Dispensing e-prescriptions, inventory management, hospital bed & oxygen telemetry. |
| **PSU / Industry** | `NALCO Health Officer` | `ORG-502` | Angul Industrial Division | Mass employee health screening, chronic disease tiering, workplace referrals. |
| **Mobile Health Camp** | `Camp Team Lead` | `CMP-104` | Rural Outreach MMU Nayagarh | Field triage tokens, rapid vital logging, emergency 108 ambulance dispatch linkage. |
| **Admin / CMO** | `Chief Medical Officer`| `ADM-001` | District Civil Administration | Syndromic surveillance heatmaps, facility utilization metrics, audit trail inspections. |

---

## 9. Local Development & Docker Deployment Guide

### Prerequisites
- **Node.js**: `v20.x` or `v24.x` (with `npm` or `pnpm`)
- **Python**: `3.10` through `3.14`
- **Docker & Docker Compose** (optional for containerized deployment)
- **Supabase Account** with a PostgreSQL database instance

---

### Option A: Manual Local Setup

#### 1. Backend Service Setup (FastAPI)
```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend Swagger UI will be live at: `http://localhost:8000/docs`*

#### 2. Frontend Client Setup (Next.js 16)
```bash
cd frontend

# Install npm dependencies
npm install

# Start the Next.js development server on port 3000
npm run dev
```
*Frontend Portal will be live at: `http://localhost:3000`*

#### 3. Database Migrations (Drizzle ORM)
```bash
cd db

# Install Drizzle CLI dependencies
npm install

# Push schema changes to your Supabase PostgreSQL instance
npx drizzle-kit push
```

---

### Option B: Docker Compose Full-Stack Deployment

To run the entire ecosystem (Next.js 16 + FastAPI + Redis 7) in isolated containers:

```bash
# Build and launch all containers in detached mode
docker compose up -d --build

# Inspect live container logs
docker compose logs -f

# Check container health status
docker compose ps

# Gracefully stop all containers
docker compose down
```

The services will be exposed at:
- **Frontend Portal**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **Redis Queue**: `localhost:6379`

---

## 10. Environment Variables Reference

### Backend Configuration (`backend/.env`)
```env
# Supabase Connection
SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SUPABASE_SERVICE_ROLE_KEY]"
SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Server Port & Environment
PORT=8000
ENVIRONMENT="development"

# AI Inference Keys
GROQ_API_KEY="gsk_[YOUR_GROQ_API_KEY]"
SARVAM_API_KEY="sk_[YOUR_SARVAM_API_KEY]"

# Redis Cache & Queue
REDIS_URL="redis://localhost:6379"

# Hugging Face / Custom Model Tunnels (Optional for fine-tuned Qwen2.5-7B)
HF_TOKEN=""
TRIAGE_MODEL_URL="https://router.huggingface.co/v1"
OCR_MODEL_URL="https://router.huggingface.co/v1"
```

### Frontend Configuration (`frontend/.env`)
```env
# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR_PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR_SUPABASE_ANON_KEY]"

# Database Connection (for Serverless Route Handlers)
DATABASE_URL="postgresql://postgres.[YOUR_PROJECT_ID]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"

# Backend Microservice Endpoint
NEXT_PUBLIC_API_URL="http://localhost:8000"

# AI Inference Keys (Used by Server Route Proxies)
GROQ_API_KEY="gsk_[YOUR_GROQ_API_KEY]"
SARVAM_API_KEY="sk_[YOUR_SARVAM_API_KEY]"
```

---

## 11. Verification, Testing & Diagnostics

### Automated Database & Table Verification
Run the database test script to verify PostgreSQL connectivity, schema tables, and RLS policies:
```bash
python db/test_verify.py
```

### API Health & Discovery Probes
- **Liveness Health Check**: `curl http://localhost:8000/health`
- **Platform Metadata**: `curl http://localhost:8000/`
- **Raw OpenAPI Schema**: `curl http://localhost:8000/openapi.json`

### Audio Anamnesis Verification
A sample Bengali medical inquiry audio file is provided at `test_bn.mp3` in the root directory. You can test speech transcription via:
```bash
curl -X POST "http://localhost:8000/api/sarvam/speech-to-text" \
  -F "file=@test_bn.mp3" \
  -F "language_code=bn-IN"
```

---

## 12. Standards Compliance & Ethical Safeguards

1. **Ayushman Bharat Digital Mission (ABDM)**:
   - Compatible with Ayushman Bharat Health Account (ABHA) IDs and Healthcare Professional Registry (HPR) credentials.
   - Designed for seamless FHIR-standard clinical document exchange.
2. **Ministry of Health & Family Welfare (MoHFW) Guidelines**:
   - Automated hospital discharge documentation strictly follows the national standard discharge template.
3. **Strict Human-in-the-Loop Safeguards**:
   - TRAAYA operates strictly as an **assistive clinical copilot**. It does not produce autonomous binding medical diagnoses or initiate pharmacotherapy without licensed physician or nurse validation.
4. **Data Privacy & Row-Level Security (RLS)**:
   - All medical encounters, vitals logs, and diagnostic slips are protected by PostgreSQL Row-Level Security policies, ensuring patient records are accessible only to authorized clinical actors.

---

## License & Attribution

Designed and engineered under the **TRAAYA Healthcare Initiative** for the **National Digital Health Ecosystem**.  
*Empowering frontline healthcare workers and bridging rural healthcare delivery across India.*
