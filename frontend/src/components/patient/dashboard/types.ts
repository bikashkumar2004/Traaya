import { TriageTicket, normalizeStatus } from "@/components/patient/timeline";
import { CareReminder, ReminderStats } from "@/components/patient/reminders";

export { normalizeStatus };
export type { TriageTicket, CareReminder, ReminderStats };

export interface PatientVitalLog {
  id?: string;
  patient_id?: string;
  ticket_id?: string | null;
  systolic?: number | null;
  diastolic?: number | null;
  pulse?: number | null;
  spo2?: number | null;
  blood_sugar?: number | null;
  temperature?: number | string | null;
  notes?: string | null;
  logged_at?: string;
}

export const formatDate = (isoStr?: string): string => {
  if (!isoStr) return "Recent";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
};
