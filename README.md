# TriageAssist Healthcare Platform

**Ayushman Bharat & ABDM Compliant Primary Healthcare Triage Platform**  
*Origin: Stitch Project ID `16145198624808548216` — Design System: "Clinical Calm & Precision"*

Built with:
- **Frontend**: Next.js 14+ (App Router), Tailwind CSS v4, Lucide Icons, Drizzle ORM, Supabase Client & Auth
- **Backend API**: FastAPI (Python 3.14+), Uvicorn, Pydantic, Clinical Triage Engine & OCR Diagnostics Parser
- **Database & Storage**: Supabase (PostgreSQL with Row Level Security, Supabase Auth, Supabase Storage `medical-reports` bucket) with Drizzle ORM typed schema

---

## System Architecture

```
TriageAssist/
├── db/                           # Dedicated Drizzle ORM Database Package (like Nexus)
│   ├── schema.ts                 # Typed PostgreSQL Schemas (profiles, triage_tickets, etc.)
│   ├── drizzle.config.ts         # Drizzle Kit Configuration
│   ├── index.ts                  # Drizzle Database Connection Instance
│   ├── package.json              # db:generate, db:push, db:studio scripts
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                     # Next.js 14 App Router + Tailwind CSS
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx          # Landing & Marketing Showcase
│   │   │   ├── login/page.tsx    # Role-Based Login & 1-Click Demo Personas
│   │   │   ├── patient/          # Citizen Portal (Dashboard, Symptoms, Upload, Timeline, Profile)
│   │   │   ├── nurse/            # Field Health Worker / ANM Station (Queue, Intake, OCR, Escalations)
│   │   └── components/common/    # Header, UrgencyBadge, TrustBadge, DisclaimerBanner
│   └── package.json
│
├── backend/                      # FastAPI Microservices Backend
│   ├── main.py                   # FastAPI Application Entry Point & CORS Setup
│   ├── clinical_engine.py        # Algorithmic Tri-Color Urgency Evaluation & Rules
│   ├── routers/
│   │   ├── triage.py             # /api/triage/assess & /api/triage/override
│   │   ├── ocr.py                # /api/ocr/extract-sample (CBC, Glucose, Vitals)
│   │   ├── users.py              # /api/users/profile & Directory
│   │   └── analytics.py          # /api/analytics/overview (Syndromic Outbreak Trends)
│   └── requirements.txt
```

---

## Quick Start (Running Locally)

### 1. Start the FastAPI Backend
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Start the Next.js Frontend
```bash
cd frontend
npm install
npm run dev -p 3000
```
Open `http://localhost:3000` in your browser.

---

## Database & Drizzle ORM Setup

1. Configure your PostgreSQL connection string in `db/.env`:
   ```env
   # Recommended IPv4 Connection Pooler (Session mode):
   DATABASE_URL=postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```
   *(Note: If your password contains special characters like `@`, percent-encode them, e.g. `%40`)*
2. Run Drizzle schema push directly from `db/`:
   ```bash
   cd db
   npm run db:push
   ```
   This automatically creates and synchronizes the `profiles`, `triage_tickets`, `medical_reports`, `audit_logs`, and `patient_reminders` tables in your PostgreSQL database.
3. (Optional) Run `db/supabase.sql` in the Supabase SQL editor only if you want the automatic `on_auth_user_created` trigger for Supabase Auth and the `medical-reports` storage bucket.
4. Launch Drizzle Studio to inspect and manage rows locally:
   ```bash
   cd db
   npm run db:studio
   ```

---

## 1-Click Demo Personas

The application includes built-in fast 1-click test logins accessible from `/login` or the top navigation bar:
- **Doctor / Medical Officer**: `Dr. Kavita Verma, MD` (District Civil Hospital)
- **Health Worker / Nurse**: `Priya Nair, ANM` (Sector 4 Community Sub-Centre)
- **Patient / Citizen**: `Aarav Sharma` (ABHA ID: `91-4421-8932-1049`)
- **Administrator**: Chief Medical Officer (CMO)
