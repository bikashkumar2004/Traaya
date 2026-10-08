export type TriageEncounterStatus =
  | "Draft"
  | "Under Review"
  | "Reverted"
  | "Referred"
  | "Scheduled"
  | "Completed";

export function normalizeStatus(status?: string): TriageEncounterStatus {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("draft")) return "Draft";
  if (s.includes("revert") || s.includes("returned") || s.includes("awaiting patient")) return "Reverted";
  if (s.includes("refer") || s.includes("forwarded") || s.includes("escalat")) return "Referred";
  if (s.includes("schedule") || s.includes("booked") || s.includes("appoint")) return "Scheduled";
  if (s.includes("complet") || s === "resolved" || s === "closed" || s.includes("finish")) return "Completed";
  // default for active / pending / in_progress / under review
  return "Under Review";
}

export interface TriageTicket {
  id: string;
  case_number?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  is_family_member?: boolean;
  family_member_name?: string;
  family_member_relationship?: string;
  family_member_uhid?: string;
  urgency?: string;
  priority?: string;
  chief_complaint?: string;
  reverted_questions?: Array<{
    id: string;
    question: string;
    answer?: string;
    answered_at?: string;
  }>;
  schedule_time?: string;
  symptoms?: Array<{ name: string; duration?: string }>;
  symptoms_data?: {
    chief_complaint?: string;
    symptoms?: Array<{ name: string; duration?: string; severity?: string }>;
    duration?: string;
    severity?: string;
    follow_up_qa?: Array<{ question: string; answer: string }>;
    vitals?: Record<string, any>;
    clinical_reasoning?: string;
  };
  uploaded_report_data?: Record<string, any>;
  uploaded_report_url?: string;
  discharge_report_text?: string;
  discharge_report_url?: string;
  report_text?: string;
  report_url?: string;
  vitals?: {
    temperature?: string;
    follow_up_answers?: Record<string, any>;
  };
  ai_recommendation?: {
    priority?: string;
    clinical_reasoning?: string;
    model?: string;
    present_location?: {
      state?: string;
      block?: string;
    };
  };
  status: string;
  created_at: string;
  patient_id?: string;
  patient_referral_status?: string;
  patient_referral_accepted_at?: string;
  facility_referral_status?: string;
  referal_facility?: string;
  referal_facility_id?: string;
  transfer_reason?: string;
  referral_notes?: string;
}

export interface TimelineStats {
  total: number;
  draft: number;
  underReview: number;
  reverted: number;
  referred: number;
  scheduled: number;
  completed: number;
}
