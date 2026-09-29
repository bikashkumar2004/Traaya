import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date, numeric } from "drizzle-orm/pg-core";

// ==============================================================================
// 1. User Profiles (Unified multi-role authentication anchor)
// ==============================================================================
export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").unique(), // Universal Role Identifier for all roles (e.g. PAT-849201, DOC-4412, NUR-0021, ADM-0001, ORG-0001, CMP-001, MED-001)
  email: text("email").unique(),
  fullName: text("full_name").notNull(),
  role: text("role").default("patient").notNull(), // 'patient', 'nurse', 'doctor', 'admin', 'organization', 'healthcamp', 'facility'
  phone: text("phone"),
  gender: text("gender").default("other"),
  dateOfBirth: date("date_of_birth"),
  age: integer("age"),
  addressLine1: text("address_line1"),
  state: text("state").default("Odisha"),
  district: text("district").default("Nayagarh"),
  city: text("city").default("Nayagarh"),
  block: text("block"),
  postalCode: text("postal_code"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 1.1 Patient Role Profile (Medical & Health History)
// ==============================================================================
export const patientProfiles = pgTable("patient_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique().notNull(),
  bloodGroup: text("blood_group"),
  disability: text("disability").default("No").notNull(),
  primaryFacilityName: text("primary_facility_name").default("Community Health Centre (CHC) Khandapada"),
  isAffilatedToOrg: boolean("is_affilated_to_org").default(false).notNull(),
  organizationName: text("organization_name"),
  idInOrg: text("id_in_org"),
  orgIdCard: text("org_id_card"), // Supabase storage public URL
  chronicConditions: jsonb("chronic_conditions").default([]),
  allergies: jsonb("allergies").default([]),
  dependents: jsonb("dependents").default([]),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 1.1.1 New Patient Intake Table (Direct Nurse Intake Desk - Independent from profiles)
// ==============================================================================
export const newPatient = pgTable("new_patient", {
  id: uuid("id").defaultRandom().primaryKey(),
  uhid: text("uhid").unique().notNull(), // e.g. "PT-0042", "NPAT-9102"
  fullName: text("full_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  phone: text("phone"),
  location: text("location"),
  preferredLanguage: text("preferred_language").default("Odia").notNull(),
  consentStatus: text("consent_status").default("Given").notNull(),
  intakeNotes: text("intake_notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type NewPatient = typeof newPatient.$inferSelect;

// ==============================================================================
// 1.2 Doctor Role Profile (Clinical Specialty & Review Roster)
// ==============================================================================
export const doctorProfiles = pgTable("doctor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique().notNull(),
  medicalRegistrationNumber: text("medical_registration_number").notNull(), // e.g. "MCI-2014-88912"
  stateCouncilReg: text("state_council_reg"), // e.g. "MCI-2014-88912"
  hprId: text("hpr_id"), // e.g. "91-7712-3321-4402@hpr"
  designation: text("designation").default("Senior Attending Physician & Clinical Specialist").notNull(),
  qualification: text("qualification").default("MBBS, MD").notNull(),
  department: text("department").default("Department of Medicine").notNull(),
  roomNumber: text("room_number").default("OPD Room 102"),
  facilityId: uuid("facility_id").references(() => profiles.id), // references profiles table where role = 'facility'
  facilityName: text("facility_name").default("Community Health Centre (CHC) Khandapada"),
  shiftSchedule: text("shift_schedule").default("Morning OPD (08:00 AM - 02:00 PM)"),
  availabilityStatus: text("availability_status").default("Available").notNull(),
  aadhaarEkycVerified: boolean("aadhaar_ekyc_verified").default(true).notNull(),
  activeCasesCount: integer("active_cases_count").default(0).notNull(),
  emergencyReferralsCount: integer("emergency_referrals_count").default(0).notNull(),
  completeCasesCount: integer("complete_cases_count").default(0).notNull(),
  teleconsultCount: integer("teleconsult_count").default(0).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
export type DoctorProfile = typeof doctorProfiles.$inferSelect;


// ==============================================================================
// 1.3 Facility / Pharmacy Staff Role Profile (Jan Aushadhi & Lab Operations)
// ==============================================================================
export const facilityProfiles = pgTable("facility_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique().notNull(),
  staffId: text("staff_id").unique().notNull(), // e.g. "FAC-001"
  pharmacyLicenseNumber: text("pharmacy_license_number").default("DL-OD-NAY-2022-819"),
  department: text("department").default("Central Pharmacy & Lab").notNull(),
  staffDesignation: text("staff_designation").default("Registered Pharmacist").notNull(),
  facilityId: uuid("facility_id"),
  facilityName: text("facility_name").default("Jan Aushadhi Kendra & CHC Pathology Counter"),
  counterNumber: text("counter_number").default("Dispensary Desk 1"),
  isJanAushadhiIncharge: boolean("is_jan_aushadhi_incharge").default(true).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 1.4 Health Camp / MMU Outreach Role Profile
// ==============================================================================
export const healthcampProfiles = pgTable("healthcamp_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique().notNull(),
  campId: text("camp_id").unique().notNull(), // e.g. "CMP-001"
  mmuUnitCode: text("mmu_unit_code").default("MMU-OD-04").notNull(),
  campName: text("camp_name").notNull(),
  assignedBlock: text("assigned_block").default("Khandapada Block").notNull(),
  district: text("district").default("Nayagarh").notNull(),
  leadOfficer: text("lead_officer").notNull(),
  operationalStatus: text("operational_status").default("Active").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 2. PHC Facilities (Primary Health Centres & Community Health Centres)
// ==============================================================================
export const phcFacilities = pgTable("phc_facilities", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityName: text("facility_name").notNull(),
  abdmFacilityCode: text("abdm_facility_code").unique().notNull(), // e.g. "PHC-OD-NAY-042"
  facilityType: text("facility_type").default("CHC").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull().default("Odisha"),
  address: text("address"),
  pincode: text("pincode"),
  totalBeds: integer("total_beds").default(30).notNull(),
  occupiedBeds: integer("occupied_beds").default(18).notNull(),
  availableBeds: integer("available_beds").default(12).notNull(),
  icuBedsTotal: integer("icu_beds_total").default(6).notNull(),
  icuBedsAvailable: integer("icu_beds_available").default(2).notNull(),
  oxygenCylindersAvailable: integer("oxygen_cylinders_available").default(14).notNull(),
  bloodUnitsAvailable: integer("blood_units_available").default(24).notNull(),
  ambulanceReady: boolean("ambulance_ready").default(true).notNull(),
  emergencyContact: text("emergency_contact").default("108").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 3. PHC Staff Roster & Real-time Duty Availability
// ==============================================================================
export const phcStaffRoster = pgTable("phc_staff_roster", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").references(() => phcFacilities.id),
  profileId: uuid("profile_id").references(() => profiles.id),
  staffName: text("staff_name").notNull(),
  staffRole: text("staff_role").notNull(), // "Doctor", "Authorized clinical reviewer", "Nurse", "Pharmacist", "Lab Technician"
  department: text("department").notNull(),
  status: text("status").default("Available").notNull(), // 'Available', 'Busy', 'Offline', 'On Standby'
  currentTask: text("current_task"),
  contactExt: text("contact_ext"),
  phone: text("phone"),
  shiftTimings: text("shift_timings").default("08:00 AM - 04:00 PM"),
  isAuthorizedReviewer: boolean("is_authorized_reviewer").default(false).notNull(),
  lastStatusChange: timestamp("last_status_change", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 4. Nurse Profiles & Clinical Credentials
// ==============================================================================
export const nurseProfiles = pgTable("nurse_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique().notNull(),
  stateCouncilReg: text("state_council_reg").notNull(), // e.g. "ONRC-2018-9941"
  hprId: text("hpr_id"), // "91-8821-4433-2011@hpr"
  designation: text("designation").default("Senior Staff Nurse & Triage Specialist").notNull(),
  facilityId: uuid("facility_id").references(() => profiles.id), // references profiles table where role = 'facility'
  facilityName: text("facility_name").default("Community Health Centre (CHC) Khandapada"),
  shiftSchedule: text("shift_schedule").default("Morning Roster (08:00 AM - 04:00 PM)"),
  aadhaarEkycVerified: boolean("aadhaar_ekyc_verified").default(true).notNull(),
  casesTriagedCount: integer("cases_triaged_count").default(0).notNull(),
  doctorHandoffsCount: integer("doctor_handoffs_count").default(0).notNull(),
  emergencyReferralsCount: integer("emergency_referrals_count").default(0).notNull(),
  resolvedByMeCount: integer("resolved_by_me_count").default(0).notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 4b. New Patient Walk-In Registry (Direct Intake - Not stored in profiles)
// ==============================================================================
export const newPatient = pgTable("new_patient", {
  id: uuid("id").defaultRandom().primaryKey(),
  uhid: text("uhid").unique().notNull(), // e.g. "OD-2026-XXXX"
  fullName: text("full_name").notNull(),
  age: integer("age"),
  gender: text("gender"),
  phone: text("phone"),
  location: text("location"),
  preferredLanguage: text("preferred_language").default("Odia"),
  consentStatus: text("consent_status").default("Given"),
  intakeNotes: text("intake_notes"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 5. Triage Tickets & Encounters (Patient Symptoms & Clinical Lifecycle)
// ==============================================================================
export const triageTickets = pgTable("triage_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseNumber: text("case_number").unique().notNull(), // e.g. "#LS1024", "TR-9041"
  patientId: uuid("patient_id").references(() => profiles.id),
  newPatientId: uuid("new_patient_id").references(() => newPatient.id),

  // Family context
  isFamilyMember: boolean("is_family_member").default(false).notNull(),
  familyMemberName: text("family_member_name"),
  familyMemberRelationship: text("family_member_relationship"),
  familyMemberUhid: text("family_member_uhid"),
  familyMemberAge: integer("family_member_age"),
  familyMemberGender: text("family_member_gender"),
  familyMemberPhone: text("family_member_phone"),

  preferredLanguage: text("preferred_language").default("en").notNull(),
  consentStatus: text("consent_status").default("Given").notNull(),
  consultationMode: text("consultation_mode").default("online").notNull(),

  // Location & Present Address (Single JSONB column storing state, district, block, street/village/landmark)
  presentAddress: jsonb("present_address").default({}).notNull(),

  // Symptoms Data (Single JSONB column containing complaint, symptoms list, duration, severity, follow-up Q&A, vitals, AI reasoning)
  symptomsData: jsonb("symptoms_data").default({}).notNull(),

  // Uploaded Diagnostic Report (OCR Lab Data & Storage URL - only populated when user uploads a file)
  uploadedReportData: jsonb("uploaded_report_data").default({}),
  uploadedReportUrl: text("uploaded_report_url"),

  // Final Clinical Consultation / Discharge Summary (Stored in Storage upon completion)
  dischargeReportText: text("discharge_report_text"),
  dischargeReportUrl: text("discharge_report_url"),

  // Priority: Red, Yellow, Green
  priority: text("priority").default("Yellow").notNull(),

  // Facility Staff, Doctor & Nurse
  facilityId: uuid("facility_id").references(() => profiles.id),
  doctorId: uuid("doctor_id").references(() => profiles.id),
  nurseId: uuid("nurse_id").references(() => profiles.id),

  resolveNotes: text("resolve_notes"),
  submittedVia: text("submitted_via").default("Mobile App").notNull(),

  // Status: Draft, Under Review, Reverted, Referred, Scheduled, Completed
  status: text("status").default("Under Review").notNull(),

  // Clinical Workflow, Escalations & Schedule
  scheduleTime: timestamp("schedule_time", { withTimezone: true }),
  revertedQuestions: jsonb("reverted_questions").default([]).notNull(),
  referalFacility: text("referal_facility"),
  referalFacilityId: uuid("referal_facility_id").references(() => profiles.id),
  transferReason: text("transfer_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 6. Nurse Review Actions Audit Trail
// ==============================================================================
export const nurseReviewActions = pgTable("nurse_review_actions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id).notNull(),
  caseNumber: text("case_number").notNull(),
  nurseId: uuid("nurse_id").references(() => profiles.id).notNull(),
  nurseName: text("nurse_name").default("Nurse Priya S.").notNull(),
  actionType: text("action_type").notNull(),
  reviewNote: text("review_note").notNull(),
  templateUsed: text("template_used"),
  visibility: text("visibility").default("Medical Team (Assigned)").notNull(),
  saveToHistory: boolean("save_to_history").default(true).notNull(),
  notifyTeam: boolean("notify_team").default(true).notNull(),
  referralDestination: text("referral_destination"),
  assignedDoctorId: uuid("assigned_doctor_id").references(() => profiles.id),
  assignedDoctorName: text("assigned_doctor_name"),
  previousStatus: text("previous_status"),
  resultingStatus: text("resulting_status").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 7. Inter-Hospital Referrals (Medical / CHC Referral Network)
// ==============================================================================
export const hospitalReferrals = pgTable("hospital_referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id),
  patientUhid: text("patient_uhid").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  phone: text("phone"),
  referringHospital: text("referring_hospital").notNull(),
  referringDoctor: text("referring_doctor").notNull(),
  targetFacilityId: uuid("target_facility_id").references(() => phcFacilities.id),
  targetFacilityName: text("target_facility_name").default("CHC Khandapada").notNull(),
  assignedDoctorId: uuid("assigned_doctor_id").references(() => profiles.id),
  assignedDoctorName: text("assigned_doctor_name"),
  triagePriority: text("triage_priority").default("Urgent").notNull(),
  status: text("status").default("Pending Review").notNull(),
  clinicalReason: text("clinical_reason").notNull(),
  vitalsSummary: jsonb("vitals_summary").default({}),
  assignmentNotes: text("assignment_notes"),
  referredAt: timestamp("referred_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 8. Medical Pharmacy Inventory & Jan Aushadhi Stock
// ==============================================================================
export const medicalInventory = pgTable("medical_inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  facilityId: uuid("facility_id").references(() => phcFacilities.id),
  medicineName: text("medicine_name").notNull(),
  medicineCode: text("medicine_code").notNull(),
  category: text("category").notNull(),
  stockLevel: integer("stock_level").default(0).notNull(),
  minThreshold: integer("min_threshold").default(50).notNull(),
  unit: text("unit").default("strips").notNull(),
  batchNo: text("batch_no").default("BCH-2026-01").notNull(),
  expiryDate: date("expiry_date").notNull(),
  status: text("status").default("In Stock").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 9. Medical Prescriptions & Dispensation Desk
// ==============================================================================
export const medicalPrescriptions = pgTable("medical_prescriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id),
  patientId: uuid("patient_id").references(() => profiles.id),
  patientUhid: text("patient_uhid").notNull(),
  patientName: text("patient_name").notNull(),
  doctorId: uuid("doctor_id").references(() => profiles.id),
  doctorName: text("doctor_name").notNull(),
  medications: jsonb("medications").default([]).notNull(),
  dispensedById: uuid("dispensed_by_id").references(() => profiles.id),
  dispensedByName: text("dispensed_by_name"),
  status: text("status").default("Pending Dispensation").notNull(),
  dispensedAt: timestamp("dispensed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 10. Uploaded Reports (Patient Report Upload & Summary Check)
// ==============================================================================
export const uploadedReport = pgTable("uploaded_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => profiles.id).notNull(),
  reportType: text("report_type").notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: text("file_type"),
  reportSummary: jsonb("report_summary").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 11. Patient Reminders & Vitals Logs
// ==============================================================================
export const patientReminders = pgTable("patient_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => profiles.id).notNull(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id),
  type: text("type").default("medication").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dosage: text("dosage"),
  frequency: text("frequency").default("Daily"),
  scheduledTime: text("scheduled_time").default("08:00 AM"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isCompleted: boolean("is_completed").default(false).notNull(),
  lastCompletedAt: timestamp("last_completed_at", { withTimezone: true }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const patientVitalsLogs = pgTable("patient_vitals_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  patientId: uuid("patient_id").references(() => profiles.id).notNull(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id),
  systolic: integer("systolic"),
  diastolic: integer("diastolic"),
  pulse: integer("pulse"),
  spo2: integer("spo2"),
  bloodSugar: numeric("blood_sugar", { precision: 5, scale: 1 }),
  temperature: numeric("temperature", { precision: 4, scale: 1 }),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 12. Organization Profiles & Workforce Health Screenings
// ==============================================================================
export const organizationProfiles = pgTable("organization_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").references(() => profiles.id).unique(),
  orgCode: text("org_code").unique().notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  state: text("state").default("Odisha").notNull(),
  totalWorkforce: integer("total_workforce").default(1000).notNull(),
  activeScreened: integer("active_screened").default(0).notNull(),
  contactEmail: text("contact_email"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const organizationScreenings = pgTable("organization_screenings", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id").references(() => organizationProfiles.id).notNull(),
  employeeId: text("employee_id").notNull(),
  employeeName: text("employee_name").notNull(),
  department: text("department").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone"),
  vitals: jsonb("vitals").default({}),
  riskTier: text("risk_tier").default("Low Risk").notNull(),
  recommendations: text("recommendations"),
  screenedAt: timestamp("screened_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 13. Health Camp Outreach & Mobile Medical Unit (MMU) Sessions
// ==============================================================================
export const healthcampSessions = pgTable("healthcamp_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campName: text("camp_name").notNull(),
  mmuCode: text("mmu_code").default("MMU-OD-04").notNull(),
  district: text("district").default("Nayagarh").notNull(),
  location: text("location").notNull(),
  campDate: date("camp_date").defaultNow().notNull(),
  campLead: text("camp_lead").notNull(),
  targetScreenings: integer("target_screenings").default(200).notNull(),
  completedScreenings: integer("completed_screenings").default(0).notNull(),
  status: text("status").default("Active").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const campAttendees = pgTable("camp_attendees", {
  id: uuid("id").defaultRandom().primaryKey(),
  campId: uuid("camp_id").references(() => healthcampSessions.id).notNull(),
  tokenNumber: text("token_number").notNull(),
  patientName: text("patient_name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone"),
  bp: text("bp"),
  pulse: integer("pulse"),
  spo2: integer("spo2"),
  temp: text("temp"),
  complaint: text("complaint").notNull(),
  urgency: text("urgency").default("Routine").notNull(),
  status: text("status").default("Screened").notNull(),
  registeredTime: timestamp("registered_time", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// 14. Audit & Compliance Logs
// ==============================================================================
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => triageTickets.id),
  caseNumber: text("case_number"),
  performedBy: uuid("performed_by").references(() => profiles.id),
  performedByName: text("performed_by_name"),
  role: text("role"),
  action: text("action").notNull(),
  previousUrgency: text("previous_urgency"),
  finalUrgency: text("final_urgency"),
  reason: text("reason"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==============================================================================
// Role-Specific Profile Inferred TypeScript Types
// ==============================================================================
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type DoctorProfile = typeof doctorProfiles.$inferSelect;
export type NurseProfile = typeof nurseProfiles.$inferSelect;
export type FacilityProfile = typeof facilityProfiles.$inferSelect;
export type OrganizationProfile = typeof organizationProfiles.$inferSelect;
export type HealthcampProfile = typeof healthcampProfiles.$inferSelect;
export type NewPatientRecord = typeof newPatient.$inferSelect;
export type NewPatientInsert = typeof newPatient.$inferInsert;
