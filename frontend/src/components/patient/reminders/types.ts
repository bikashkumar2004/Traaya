export interface CareReminder {
  id: string;
  patient_id: string;
  ticket_id?: string;
  type: "medication" | "consultation" | "asha_visit" | "vitals_log";
  title: string;
  description?: string;
  dosage?: string;
  frequency?: string;
  scheduled_time?: string;
  due_date?: string;
  is_completed: boolean;
  last_completed_at?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface ReminderStats {
  total: number;
  completed: number;
  rate: number;
  nextMed?: CareReminder;
  nextConsult?: CareReminder;
  ashaVisit?: CareReminder;
}

export interface WeekDayItem {
  day: string;
  date: string;
  active: boolean;
}
