# TRAAYA Frontend Architecture & Client Engineering Guide
> **Next.js 16 Enterprise Healthcare Client**  
> *For comprehensive platform architecture, database schemas, and AI microservices, refer to the root [README.md](../README.md).*

---

## 1. Overview & Core Modules

The TRAAYA frontend is built on **Next.js 16 (App Router)** and **Tailwind CSS v4**, delivering responsive stations for 7 distinct healthcare roles:

- `/citizen`: Digital Health Locker, Voice & AI Symptom Intake, Interactive Encounter Timeline, Daily Vitals Self-Log, and Care Reminders.
- `/nurse`: Frontline Triage Queue, Case Review Workspace, Bi-Directional Follow-up Question Reverts, and Lab OCR Scanner.
- `/doctor`: Specialist OPD Queue, Clinical Decisions, and Automated AI Hospital Discharge Summary Generator with PDF export.
- `/medical`: Jan Aushadhi Dispensary Queue, Drug Inventory, and Facility Telemetry.
- `/organization`: Workplace Health Screenings and Occupational Health Monitoring.
- `/healthcamp`: Mobile Medical Unit (MMU) Field Screening and Emergency 108 Dispatch.
- `/admin`: District Chief Medical Officer (CMO) Syndromic Outbreak Surveillance.

---

## 2. Directory Structure

```
frontend/src/
├── app/
│   ├── page.tsx                    # Landing Page & National Healthcare Pilot Showcase
│   ├── login/page.tsx              # Universal Login & 1-Click Demo Personas
│   ├── register/page.tsx           # Multi-role Registration Interface
│   ├── citizen/                    # Citizen & Beneficiary Health Locker
│   │   ├── page.tsx                # Dashboard (Telemetry, Active Ticket, Vitals Logger)
│   │   ├── symptoms/page.tsx       # 4-Step Voice & AI Symptom Intake Wizard
│   │   ├── timeline/page.tsx       # Encounter History Table
│   │   ├── timeline/[id]/page.tsx  # Interactive Case Review & Nurse Clarification Q&A
│   │   ├── reminders/page.tsx      # Medication Schedule & Resting Vitals Self-Log
│   │   ├── upload/page.tsx         # Standalone Lab Report OCR Locker
│   │   └── profile/page.tsx        # ABHA Profile, Allergies, and Baseline Telemetry
│   ├── nurse/                      # Frontline Health Worker Station
│   │   ├── page.tsx                # Tri-Color Review Queue & Case Action Deck
│   │   └── ocr/page.tsx            # Lab Report OCR Scanner Desk
│   ├── doctor/                     # Medical Officer Station
│   │   ├── page.tsx                # High-Priority OPD Review Queue
│   │   └── decision/page.tsx       # Prescription & Hospital Discharge Summary Synthesis
│   ├── medical/page.tsx            # Pharmacy & Facility Inventory
│   ├── organization/page.tsx       # Corporate & Campus Workforce Health
│   ├── healthcamp/page.tsx         # Rural Mobile Medical Unit (MMU) Camp Desk
│   ├── admin/page.tsx              # CMO District Health Surveillance Heatmap
│   └── api/                        # Next.js Serverless API Route Handlers
│       ├── patient/reminders/vitals/# GET/POST Database Vitals Logger
│       ├── doctor/generate-discharge/# Automated Hospital Discharge Summary Builder
│       └── sarvam/speech-to-text/  # Indian Languages Voice Proxy
├── components/
│   ├── auth/                       # LoginBrandPanel (Portrait Illustration), AuthForms
│   ├── patient/                    # PatientShell, DashboardVitalsWidget, SymptomWizard
│   ├── nurse/                      # NurseShell, TriageQueueView, CaseReviewWorkspace
│   ├── doctor/                     # DoctorShell, DoctorCaseTabs, DischargeModal
│   └── common/                     # Common Navbars, StatusBadges, DisclaimerBanners
└── lib/
    ├── auth/auth-context.tsx       # Client Authentication & Active Role Permissions
    └── supabase.ts                 # Supabase Client Singleton & WebSocket Channels
```

---

## 3. Key Frontend Features & Integrations

1. **Database-Driven Vitals Telemetry**:
   - `DashboardVitalsWidget` and `RemindersVitalsCard` fetch live resting vital sign measurements (Systolic/Diastolic BP, Pulse, Temperature, SpO2) directly from PostgreSQL (`public.patient_vitals_logs`).
   - Self-logging vitals updates the database and immediately updates the UI without page reloads.

2. **Multilingual Speech-to-Text**:
   - Integrated with Sarvam AI to support voice intake across 23 Indian languages, translating vernacular speech into clinical symptoms.

3. **Bi-Directional Follow-Up Loop**:
   - Frontline nurses can post specific clinical clarification questions; patients can answer and resubmit directly in their encounter timeline (`/citizen/timeline/[id]`).

4. **Automated Discharge Summary PDF**:
   - Uses `jspdf` and Next.js serverless route handlers to synthesize standardized Ministry of Health & Family Welfare Hospital Discharge Summaries.

---

## 4. Running the Frontend Locally

```bash
# Install dependencies
npm install

# Start the Next.js development server
npm run dev

# Type check
npx tsc --noEmit
```

*Open `http://localhost:3000` in your browser.*
