-- ==============================================================================
-- TriageAssist Healthcare Platform: Comprehensive PostgreSQL / Supabase Schema
-- Unified schema supporting all 6 operational roles + Admin:
-- 1. Patient | 2. Nurse | 3. Doctor | 4. Medical / Pharmacy | 5. Organization | 6. Healthcamp
-- ==============================================================================

-- Enable essential extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 1. Storage Buckets (Medical Reports, OCR Slips, Organization ID Cards)
-- ==============================================================================
insert into storage.buckets (id, name, public) 
values ('medical-reports', 'medical-reports', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public) 
values ('org-id-cards', 'org-id-cards', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Access to Medical Reports" on storage.objects;
create policy "Public Access to Medical Reports" on storage.objects 
    for select using (bucket_id = 'medical-reports');

drop policy if exists "Authenticated users can upload reports" on storage.objects;
drop policy if exists "Anyone can upload to medical-reports" on storage.objects;
create policy "Anyone can upload to medical-reports" on storage.objects 
    for insert with check (bucket_id = 'medical-reports');

drop policy if exists "Anyone can update medical-reports" on storage.objects;
create policy "Anyone can update medical-reports" on storage.objects 
    for update using (bucket_id = 'medical-reports');

drop policy if exists "Public Access to Org ID Cards" on storage.objects;
create policy "Public Access to Org ID Cards" on storage.objects 
    for select using (bucket_id = 'org-id-cards');

drop policy if exists "Anyone can upload org ID cards" on storage.objects;
create policy "Anyone can upload org ID cards" on storage.objects 
    for insert with check (bucket_id = 'org-id-cards');

drop policy if exists "Anyone can update org ID cards" on storage.objects;
create policy "Anyone can update org ID cards" on storage.objects 
    for update using (bucket_id = 'org-id-cards');

-- ==============================================================================
-- 2. Core User Profiles Table (Unified Multi-Role Auth Anchor)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text unique,            -- Universal Role Identifier for all roles (e.g. PAT-849201, DOC-4412, NUR-0021, ADM-0001, ORG-0001, CMP-001, FAC-001)
  email text unique,
  full_name text not null,
  role text not null default 'patient' check (role in ('patient', 'nurse', 'doctor', 'admin', 'organization', 'healthcamp', 'facility', 'medical')),
  phone text,
  gender text default 'other',
  date_of_birth date,
  age integer,
  address_line1 text,
  state text default 'Odisha',
  district text default 'Nayagarh',
  city text default 'Nayagarh',
  block text,
  postal_code text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2.1 Role Table: Patient Profiles (Clinical History & Proxy Dependents)
-- ==============================================================================
create table if not exists public.patient_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  blood_group text,
  disability text default 'No',
  primary_facility_name text default 'Community Health Centre (CHC) Khandapada',
  is_affilated_to_org boolean default false not null,
  organization_name text,
  id_in_org text,
  org_id_card text,                             -- Supabase storage public URL
  chronic_conditions jsonb default '[]'::jsonb, -- [{ id, condition, diagnosedYear, notes }]
  allergies jsonb default '[]'::jsonb,          -- [{ id, allergen, severity, reaction }]
  dependents jsonb default '[]'::jsonb,         -- [{ id, name, relationship, age, gender, chronicConditions }]
  emergency_contact_name text,
  emergency_contact_phone text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2.2 Role Table: Doctor Profiles (Medical Credentials & Consultation Roster)
-- ==============================================================================
create table if not exists public.doctor_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  doctor_id text unique not null,               -- e.g. DOC-4412
  medical_registration_number text not null,   -- e.g. MCI-2014-88912
  specialization text default 'General Medicine' not null,
  qualification text default 'MBBS, MD' not null,
  department text default 'Department of Medicine' not null,
  room_number text default 'OPD Room 102',
  facility_id uuid references public.profiles(id) on delete cascade,
  facility_name text default 'Community Health Centre (CHC) Khandapada',
  shift_timings text default '08:00 AM - 02:00 PM',
  availability_status text default 'Available' not null,
  is_authorized_reviewer boolean default true not null,
  active_cases_count integer default 0 not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2.3 Role Table: Facility Profiles (Jan Aushadhi Dispensary Operations & Counter)
-- ==============================================================================
create table if not exists public.facility_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  hpr_id text,
  department text default 'Central Pharmacy & Lab' not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 2.4 Role Table: Health Camp / MMU Profiles (Outreach Fleet Operations)
-- ==============================================================================
create table if not exists public.healthcamp_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  camp_id text unique not null,                  -- e.g. CMP-001
  mmu_unit_code text default 'MMU-OD-04' not null,
  camp_name text not null,
  assigned_block text default 'Khandapada Block' not null,
  district text default 'Nayagarh' not null,
  lead_officer text not null,
  operational_status text default 'Active' not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Automatic Profile Creation Trigger on Supabase Auth Signup
-- Automatic Profile Creation Trigger on Supabase Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_user_name text;
  v_role text;
  v_user_id text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'patient');
  
  v_user_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    case 
      when new.email is not null and new.email <> '' then split_part(new.email, '@', 1)
      else 'User ' || right(coalesce(new.phone, '0000'), 4)
    end
  );

  v_user_id := coalesce(
    new.raw_user_meta_data->>'user_id',
    new.raw_user_meta_data->>'patient_uhid',
    case 
      when v_role = 'doctor' then 'DOC-' || floor(1000 + random() * 9000)::text
      when v_role = 'nurse' then 'NUR-' || floor(1000 + random() * 9000)::text
      when v_role = 'facility' then 'FAC-' || floor(100 + random() * 900)::text
      when v_role = 'medical' then 'FAC-' || floor(100 + random() * 900)::text
      when v_role = 'organization' then 'ORG-' || floor(100 + random() * 900)::text
      when v_role = 'healthcamp' then 'CMP-' || floor(100 + random() * 900)::text
      when v_role = 'admin' then 'ADM-' || floor(1000 + random() * 9000)::text
      else 'PAT-' || floor(100000 + random() * 900000)::text
    end
  );

  insert into public.profiles (
    id, 
    user_id, 
    email, 
    phone, 
    full_name, 
    role, 
    created_at, 
    updated_at
  )
  values (
    new.id,
    v_user_id,
    new.email,
    new.phone,
    v_user_name,
    v_role,
    now(),
    now()
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, public.profiles.email),
    phone = coalesce(excluded.phone, public.profiles.phone),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    user_id = coalesce(public.profiles.user_id, excluded.user_id),
    role = coalesce(public.profiles.role, excluded.role),
    updated_at = now();

  -- If patient, automatically ensure patient_profiles row exists
  if v_role = 'patient' then
    insert into public.patient_profiles (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
exception when others then
  -- Catch any unexpected errors to guarantee Supabase Auth signup never fails with "Database error saving new user"
  raise warning 'handle_new_user error: %', sqlerrm;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to sanitize instance_id and non-null token fields for Supabase GoTrue Auth engine
create or replace function public.sanitize_auth_user_tokens()
returns trigger as $$
begin
  new.instance_id := coalesce(new.instance_id, '00000000-0000-0000-0000-000000000000'::uuid);
  new.confirmation_token := coalesce(new.confirmation_token, '');
  new.recovery_token := coalesce(new.recovery_token, '');
  new.email_change_token_new := coalesce(new.email_change_token_new, '');
  new.email_change := coalesce(new.email_change, '');
  new.reauthentication_token := coalesce(new.reauthentication_token, '');
  new.phone_change := coalesce(new.phone_change, '');
  new.phone_change_token := coalesce(new.phone_change_token, '');
  new.email_change_token_current := coalesce(new.email_change_token_current, '');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sanitize_auth_user_tokens on auth.users;
create trigger trg_sanitize_auth_user_tokens
  before insert or update on auth.users
  for each row execute procedure public.sanitize_auth_user_tokens();

-- ==============================================================================
-- 3. Nurse Profiles & Clinical Credentials (Nurse Specialist Registry)
-- ==============================================================================
create table if not exists public.nurse_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique not null,
  state_council_reg text not null,         -- 'ONRC-2018-9941'
  hpr_id text,                             -- '91-8821-4433-2011@hpr'
  designation text not null default 'Senior Staff Nurse & Triage Specialist',
  facility_id uuid references public.profiles(id) on delete cascade,
  facility_name text default 'Community Health Centre (CHC) Khandapada',
  shift_schedule text default 'Morning Roster (08:00 AM - 04:00 PM)',
  aadhaar_ekyc_verified boolean not null default true,
  cases_triaged_count integer not null default 0,
  doctor_handoffs_count integer not null default 0,
  emergency_referrals_count integer not null default 0,
  resolved_by_me_count integer not null default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 6. Triage Tickets & Encounters (Patient Symptoms & Clinical Lifecycle)
-- ==============================================================================
create table if not exists public.triage_tickets (
  id uuid primary key default gen_random_uuid(),
  case_number text unique not null,        -- e.g. '#LS1024', 'TR-9041'
  patient_id uuid references public.profiles(id) on delete cascade,
  
  -- Family context
  is_family_member boolean not null default false,
  family_member_name text,
  family_member_relationship text,         -- 'Self', 'Spouse', 'Child', 'Parent', etc.
  family_member_uhid text,
  family_member_age integer,
  family_member_gender text,
  family_member_phone text,

  preferred_language text not null default 'en',
  consent_status text not null default 'Given' check (consent_status in ('Given', 'Withheld')),
  consultation_mode text not null default 'online' check (consultation_mode in ('online', 'offline')),

  -- Location & Present Address (Single JSONB column storing state, district, block, street/village/landmark)
  present_address jsonb not null default '{}'::jsonb,

  -- Consolidated Symptoms Data (Single JSONB column: complaint, symptoms list, duration, severity, follow-up Q&A, vitals, AI reasoning)
  symptoms_data jsonb not null default '{}'::jsonb,

  -- Uploaded Diagnostic Report (OCR Lab Data & Storage URL - only populated when user uploads a file)
  uploaded_report_data jsonb default '{}'::jsonb,
  uploaded_report_url text,

  -- Final Clinical Consultation / Discharge Summary (Stored in Storage upon completion)
  discharge_report_text text,
  discharge_report_url text,

  -- Priority: Red, Yellow, Green
  priority text not null default 'Yellow' check (priority in ('Red', 'Yellow', 'Green')),

  -- Facility Staff, Doctor & Nurse
  facility_id uuid references public.profiles(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  nurse_id uuid references public.profiles(id) on delete set null,

  resolve_notes text,
  submitted_via text not null default 'Mobile App' check (submitted_via in ('Mobile App', 'Nurse Intake Desk', 'ASHA', 'Health Camp', 'Emergency 108')),

  -- Status: Draft, Under Review, Reverted, Referred, Scheduled, Completed
  status text not null default 'Under Review' 
    check (status in ('Draft', 'Under Review', 'Reverted', 'Referred', 'Scheduled', 'Completed')),

  -- Clinical Workflow & Scheduling
  schedule_time timestamptz,
  reverted_questions jsonb not null default '[]'::jsonb,
  referal_facility text,
  referal_facility_id uuid references public.profiles(id) on delete set null,
  transfer_reason text,
  referred_from_ticket_id uuid references public.triage_tickets(id) on delete set null,
  referred_from_facility text,

  -- Patient & Facility Referral Acceptance Workflow
  patient_referral_status text default 'Pending' check (patient_referral_status in ('Pending', 'Accepted', 'Declined')),
  patient_referral_accepted_at timestamptz,
  facility_referral_status text default 'Pending' check (facility_referral_status in ('Pending', 'Accepted', 'Declined')),
  facility_referral_accepted_at timestamptz,
  referral_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- 7. Uploaded Reports (Patient Report Upload & Summary Check)
-- ==============================================================================
create table if not exists public.uploaded_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  report_type text not null,
  file_url text not null,
  file_type text,
  report_summary jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- View for singular alias uploaded_report
create or replace view public.uploaded_report as select * from public.uploaded_reports;

-- ==============================================================================
-- 12. Patient Reminders & Vitals Logs
-- ==============================================================================
create table if not exists public.patient_reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  ticket_id uuid references public.triage_tickets(id) on delete set null,
  type text not null default 'medication' check (type in ('medication', 'consultation', 'asha_visit', 'vitals_log')),
  title text not null,
  description text,
  dosage text,
  frequency text default 'Daily',
  scheduled_time text default '08:00 AM',
  due_date timestamptz,
  is_completed boolean not null default false,
  last_completed_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patient_vitals_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  ticket_id uuid references public.triage_tickets(id) on delete set null,
  systolic integer,
  diastolic integer,
  pulse integer,
  spo2 integer,
  blood_sugar numeric(5, 1),
  temperature numeric(4, 1),
  notes text,
  logged_at timestamptz not null default now()
);

-- ==============================================================================
-- 13. Organization Profiles & Workforce Health Screenings
-- ==============================================================================
create table if not exists public.organization_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade unique,
  org_code text unique not null,           -- 'NALCO-001', 'NITR-002', 'SAIL-003'
  name text not null,
  category text not null check (category in ('Industrial & PSU', 'Educational Institute', 'Corporate IT', 'Government Agency')),
  city text not null,
  state text not null default 'Odisha',
  total_workforce integer not null default 1000,
  active_screened integer not null default 0,
  contact_email text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_screenings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organization_profiles(id) on delete cascade not null,
  employee_id text not null,
  employee_name text not null,
  department text not null,
  age integer not null,
  gender text not null,
  phone text,
  vitals jsonb default '{}'::jsonb,        -- { bp, pulse, spo2, blood_sugar, bmi }
  risk_tier text not null default 'Low Risk' check (risk_tier in ('Low Risk', 'Moderate Risk', 'High Risk')),
  recommendations text,
  screened_at timestamptz not null default now()
);

-- ==============================================================================
-- 14. Health Camp Outreach & Mobile Medical Unit (MMU) Sessions
-- ==============================================================================
create table if not exists public.healthcamp_sessions (
  id uuid primary key default gen_random_uuid(),
  camp_name text not null,
  mmu_code text not null default 'MMU-OD-04',
  district text not null default 'Nayagarh',
  location text not null,
  camp_date date not null default current_date,
  camp_lead text not null,
  target_screenings integer not null default 200,
  completed_screenings integer not null default 0,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Scheduled')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.camp_attendees (
  id uuid primary key default gen_random_uuid(),
  camp_id uuid references public.healthcamp_sessions(id) on delete cascade not null,
  token_number text not null,              -- '#CMP-001'
  patient_name text not null,
  age integer not null,
  gender text not null,
  phone text,
  bp text,
  pulse integer,
  spo2 integer,
  temp text,
  complaint text not null,
  urgency text not null default 'Routine' check (urgency in ('Immediate', 'Urgent', 'Routine')),
  status text not null default 'Screened' check (status in ('Screened', 'Referred to CHC', 'Medicine Issued')),
  registered_time timestamptz not null default now()
);

-- ==============================================================================
-- 15. Audit & Compliance Logs (Clinical Safety & AI Overrides)
-- ==============================================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references public.triage_tickets(id) on delete set null,
  case_number text,
  performed_by uuid references public.profiles(id) on delete set null,
  performed_by_name text,
  role text,
  action text not null, -- 'triage_overridden', 'doctor_verified', 'nurse_forwarded', 'prescription_issued', 'inter_hospital_escalation'
  previous_urgency text,
  final_urgency text,
  reason text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_profiles_patient_uhid on public.profiles(patient_uhid);
create index if not exists idx_triage_tickets_case_number on public.triage_tickets(case_number);
create index if not exists idx_triage_tickets_patient_id on public.triage_tickets(patient_id);
create index if not exists idx_triage_tickets_status on public.triage_tickets(status);
create index if not exists idx_triage_tickets_priority on public.triage_tickets(priority);
create index if not exists idx_triage_tickets_facility_id on public.triage_tickets(facility_id);
create index if not exists idx_medical_inventory_facility on public.medical_inventory(facility_id);
create index if not exists idx_medical_prescriptions_patient on public.medical_prescriptions(patient_id);
create index if not exists idx_medical_reports_patient on public.medical_reports(patient_id);
create index if not exists idx_patient_reminders_patient on public.patient_reminders(patient_id);
create index if not exists idx_patient_vitals_patient on public.patient_vitals_logs(patient_id);
create index if not exists idx_org_screenings_org on public.organization_screenings(org_id);
create index if not exists idx_camp_attendees_camp on public.camp_attendees(camp_id);
create index if not exists idx_audit_logs_ticket on public.audit_logs(ticket_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.phc_facilities enable row level security;
alter table public.phc_staff_roster enable row level security;
alter table public.nurse_profiles enable row level security;
alter table public.triage_tickets enable row level security;
alter table public.medical_inventory enable row level security;
alter table public.medical_prescriptions enable row level security;
alter table public.medical_reports enable row level security;
alter table public.patient_reminders enable row level security;
alter table public.patient_vitals_logs enable row level security;
alter table public.organization_profiles enable row level security;
alter table public.organization_screenings enable row level security;
alter table public.healthcamp_sessions enable row level security;
alter table public.camp_attendees enable row level security;
alter table public.audit_logs enable row level security;

-- Permissive dev policies (allows application service key & client reading)
create policy "Allow all authenticated & public access to profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all access to patient_profiles" on public.patient_profiles for all using (true) with check (true);
create policy "Allow all access to doctor_profiles" on public.doctor_profiles for all using (true) with check (true);
create policy "Allow all access to facility_profiles" on public.facility_profiles for all using (true) with check (true);
create policy "Allow all access to healthcamp_profiles" on public.healthcamp_profiles for all using (true) with check (true);
create policy "Allow all access to phc_facilities" on public.phc_facilities for all using (true) with check (true);
create policy "Allow all access to phc_staff_roster" on public.phc_staff_roster for all using (true) with check (true);
create policy "Allow all access to nurse_profiles" on public.nurse_profiles for all using (true) with check (true);
create policy "Allow all access to triage_tickets" on public.triage_tickets for all using (true) with check (true);
create policy "Allow all access to medical_inventory" on public.medical_inventory for all using (true) with check (true);
create policy "Allow all access to medical_prescriptions" on public.medical_prescriptions for all using (true) with check (true);
create policy "Allow all access to medical_reports" on public.medical_reports for all using (true) with check (true);
create policy "Allow all access to patient_reminders" on public.patient_reminders for all using (true) with check (true);
create policy "Allow all access to patient_vitals_logs" on public.patient_vitals_logs for all using (true) with check (true);
create policy "Allow all access to organization_profiles" on public.organization_profiles for all using (true) with check (true);
create policy "Allow all access to organization_screenings" on public.organization_screenings for all using (true) with check (true);
create policy "Allow all access to healthcamp_sessions" on public.healthcamp_sessions for all using (true) with check (true);
create policy "Allow all access to camp_attendees" on public.camp_attendees for all using (true) with check (true);
create policy "Allow all access to audit_logs" on public.audit_logs for all using (true) with check (true);

-- ==============================================================================
-- Baseline Demo Seed Data (Guarantees all 6 Roles function immediately)
-- ==============================================================================

-- 1. Primary Health Facility
insert into public.phc_facilities (id, facility_name, abdm_facility_code, facility_type, district, state, total_beds, occupied_beds, available_beds, icu_beds_total, icu_beds_available, oxygen_cylinders_available, blood_units_available)
values ('a1111111-1111-1111-1111-111111111111', 'Community Health Centre (CHC) Khandapada', 'PHC-OD-NAY-042', 'CHC', 'Nayagarh', 'Odisha', 30, 18, 12, 6, 2, 14, 24)
on conflict (abdm_facility_code) do update set updated_at = now();

-- 2. User Profiles for all Roles
insert into public.profiles (id, user_id, email, full_name, role, phone, facility_name)
values 
  ('11111111-1111-1111-1111-111111111111', 'PAT-849201', 'aarav.sharma@patient.health.in', 'Aarav Sharma', 'patient', '+91 98201 44556', 'Community Health Centre (CHC) Khandapada'),
  ('22222222-2222-2222-2222-222222222222', 'NUR-0021', 'priya.nair@phc.gov.in', 'Priya Nair, ANM', 'nurse', '+91 98421 07890', 'Community Health Centre (CHC) Khandapada'),
  ('33333333-3333-3333-3333-333333333333', 'DOC-4412', 'dr.kavita.verma@district.gov.in', 'Dr. Kavita Verma, MD', 'doctor', '+91 99100 88776', 'Community Health Centre (CHC) Khandapada'),
  ('44444444-4444-4444-4444-444444444444', 'FAC-001', 'dispensary.chc@odishahealth.gov.in', 'CHC Central Pharmacy & Diagnostic Desk', 'facility', '+91 94370 77890', 'Community Health Centre (CHC) Khandapada'),
  ('55555555-5555-5555-5555-555555555555', 'ORG-001', 'occupational.health@nalcoindia.co.in', 'NALCO Occupational Health Desk', 'organization', '+91 94371 00221', 'NALCO Smelter Medical Complex'),
  ('66666666-6666-6666-6666-666666666666', 'CMP-001', 'camp.nayagarh@odishahealth.org', 'Nayagarh Mobile Medical Unit #4', 'healthcamp', '+91 98612 88440', 'Mobile Medical Unit (MMU) Khandapada Block')
on conflict (id) do nothing;

-- 2.1 Role-Specific Seed Profiles
insert into public.patient_profiles (profile_id, blood_group, disability, chronic_conditions, allergies)
values 
  ('11111111-1111-1111-1111-111111111111', 'B+', 'No', '[{"id": "cc-1", "condition": "Type-2 Diabetes Mellitus", "diagnosedYear": "2018"}]'::jsonb, '[{"id": "al-1", "allergen": "Penicillin", "severity": "Severe"}]'::jsonb)
on conflict (profile_id) do nothing;

insert into public.doctor_profiles (profile_id, doctor_id, medical_registration_number, specialization, qualification, department)
values 
  ('33333333-3333-3333-3333-333333333333', 'DOC-4412', 'MCI-OD-2012-9041', 'Cardiology & Emergency Medicine', 'MBBS, MD', 'Department of Medicine')
on conflict (profile_id) do nothing;

insert into public.facility_profiles (profile_id, hpr_id, department)
values 
  ('44444444-4444-4444-4444-444444444444', '91-7712-3321-4402@hpr', 'Central Pharmacy & Lab')
on conflict (profile_id) do nothing;

insert into public.healthcamp_profiles (profile_id, camp_id, mmu_unit_code, camp_name, lead_officer)
values 
  ('66666666-6666-6666-6666-666666666666', 'CMP-001', 'MMU-OD-04', 'Nayagarh Mobile Medical Unit #4', 'Dr. S. Mohapatra')
on conflict (profile_id) do nothing;

-- 3. Staff Roster
insert into public.phc_staff_roster (facility_id, profile_id, staff_name, staff_role, department, status, contact_ext, current_task, is_authorized_reviewer)
values 
  ('a1111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Dr. Kavita Verma', 'Authorized clinical reviewer', 'General Medicine & Acute Care', 'Available', 'Ext 101', 'Ready for incoming triage prescriptions & clinical review', true),
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Nurse Priya Nair', 'Nurse', 'Intake Station & Vitals Desk', 'Busy', 'Ext 104', 'Recording vitals & triage intake for incoming patients', false),
  ('a1111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'Pharmacist R. K. Barik', 'Pharmacist', 'Central Pharmacy', 'Available', 'Ext 108', 'Dispensing prescribed generic medications', false)
on conflict do nothing;

-- 4. Sample Triage Ticket
insert into public.triage_tickets (
  id, case_number, patient_id, priority, status, consultation_mode,
  symptoms_data, facility_id, doctor_id, nurse_id
)
values (
  'b2222222-2222-2222-2222-222222222222', '#LS1024', '11111111-1111-1111-1111-111111111111', 'Yellow', 'Under Review', 'online',
  '{
    "chief_complaint": "High fever (101.8°F), body chills, rigors, retro-orbital headache x 3 days",
    "symptoms": [{"name": "Fever", "duration": "3 days", "severity": "High"}, {"name": "Headache", "duration": "2 days", "severity": "Severe"}],
    "duration": "3 days",
    "severity": "Severe",
    "vitals": {"bp_sys": 124, "bp_dia": 82, "pulse": 104, "spo2": 96, "temp": 101.8, "resp_rate": 20},
    "follow_up_qa": [{"question": "Are you experiencing any skin rashes or petechiae?", "answer": "No"}]
  }'::jsonb,
  'a1111111-1111-1111-1111-111111111111',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222'
)
on conflict (case_number) do nothing;

-- 6. Sample Medical Inventory
insert into public.medical_inventory (facility_id, medicine_name, medicine_code, category, stock_level, min_threshold, unit, status)
values 
  ('a1111111-1111-1111-1111-111111111111', 'Paracetamol 650mg Tablets', 'MED-PCM-650', 'Antipyretic', 450, 100, 'strips', 'In Stock'),
  ('a1111111-1111-1111-1111-111111111111', 'Amoxicillin 500mg Capsules', 'MED-AMX-500', 'Antibiotics', 40, 60, 'strips', 'Low Stock'),
  ('a1111111-1111-1111-1111-111111111111', 'Oral Rehydration Salts (ORS) Sachet', 'MED-ORS-001', 'Supplies', 800, 200, 'sachets', 'In Stock')
on conflict do nothing;
