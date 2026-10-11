"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  FileText,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Thermometer,
  MapPin,
  Printer,
  Copy,
  CheckCheck,
  Calendar,
  Stethoscope,
  PhoneCall,
  FileEdit,
  Download,
  ClipboardList,
  Building2,
  HeartPulse,
  Sparkles,
  Send,
  HelpCircle,
  Check,
  ArrowRightLeft,
  Pill,
  CalendarCheck,
  UserCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { submitPatientAnswers } from "@/lib/nurse-api";

function normalizeStatus(status?: string): "Draft" | "Under Review" | "Reverted" | "Referred" | "Scheduled" | "Completed" {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("draft")) return "Draft";
  if (s.includes("revert") || s.includes("returned") || s.includes("awaiting patient")) return "Reverted";
  if (s.includes("refer") || s.includes("forwarded") || s.includes("escalat")) return "Referred";
  if (s.includes("schedule") || s.includes("booked") || s.includes("appoint")) return "Scheduled";
  if (s.includes("complet") || s === "resolved" || s === "closed" || s.includes("finish")) return "Completed";
  return "Under Review";
}

/** Helper to display a professional dash '-' for any null, undefined, or empty values */
function valOrDash(v: any): string {
  if (v === null || v === undefined) return "-";
  const str = String(v).trim();
  if (
    !str ||
    str === "null" ||
    str === "undefined" ||
    str === "N/A" ||
    str === "None recorded" ||
    str === "Not specified" ||
    str === "Not recorded" ||
    str === "{}" ||
    str === "[]"
  ) {
    return "-";
  }
  return str;
}

interface TriageTicket {
  id: string;
  case_number?: string;
  patient_id?: string;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  phone?: string;
  urgency?: string;
  priority?: string;
  chief_complaint?: string;
  symptoms?: Array<any>;
  symptoms_data?: {
    raw_complaint?: string;
    complaint?: string;
    chief_complaint?: string;
    summary?: string;
    symptoms?: Array<any>;
    questions_answers?: Record<string, any>;
    raw_qa?: Array<{ question: string; answer: string }>;
    duration?: string;
    severity?: string;
    timeline?: Array<{ date?: string; event?: string; duration?: string }>;
    follow_up_answers?: Record<string, any>;
    vitals?: Record<string, any>;
    associated_symptoms?: string;
    red_flags?: string;
    clinical_reasoning?: string;
    current_step?: number;
    patient_name?: string;
    patient_age?: number | string;
    patient_gender?: string;
    family_member_age?: number | string;
    family_member_gender?: string;
    family_member_phone?: string;
  };
  preferred_language?: string;
  consent_status?: string;
  consultation_mode?: string;
  submitted_via?: string;
  facility_id?: string;
  medical_id?: string;
  doctor_id?: string;
  nurse_id?: string;
  assigned_doctor_name?: string;
  assigned_nurse_name?: string;
  resolve_notes?: string;
  doctor_notes?: string;
  reverted_questions?: Array<{
    id: string;
    question: string;
    answer?: string;
    answered_at?: string;
  }>;
  schedule_time?: string;
  report_text?: string;
  report_url?: string;
  uploaded_report_data?: Record<string, any>;
  uploaded_report_url?: string;
  discharge_report_text?: string;
  discharge_report_url?: string;
  is_family_member?: boolean;
  family_member_name?: string;
  family_member_relationship?: string;
  family_member_uhid?: string;
  family_member_age?: number | string;
  family_member_gender?: string;
  family_member_phone?: string;
  present_address?: {
    state?: string;
    district?: string;
    block?: string;
    landmark?: string;
  };
  profiles?:
    | {
        full_name?: string;
        age?: number;
        gender?: string;
        phone?: string;
        user_id?: string;
      }
    | Array<{
        full_name?: string;
        age?: number;
        gender?: string;
        phone?: string;
        user_id?: string;
      }>;
  doctor_profile?: { full_name?: string } | Array<{ full_name?: string }>;
  nurse_profile?: { full_name?: string } | Array<{ full_name?: string }>;
  facility_profile?: { full_name?: string } | Array<{ full_name?: string }>;
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
      district?: string;
    };
  };
  status: string;
  created_at: string;
  updated_at?: string;
  patient_referral_status?: "Pending" | "Accepted" | "Declined";
  patient_referral_accepted_at?: string;
  facility_referral_status?: "Pending" | "Accepted" | "Declined";
  facility_referral_accepted_at?: string;
  referal_facility?: string;
  referal_facility_id?: string;
  transfer_reason?: string;
  referral_notes?: string;
}

export default function PatientTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params?.id as string;
  const { user } = useAuth();

  const [ticket, setTicket] = useState<TriageTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);

  const normalizeRevertedQuestions = (raw: any) => {
    if (!raw) return [];
    let list = raw;
    if (typeof list === "string") {
      try {
        list = JSON.parse(list);
      } catch {
        list = list
          .split("\n")
          .map((line: string) => line.trim())
          .filter(Boolean)
          .map((line: string, idx: number) => ({ id: `q_${idx + 1}`, question: line, answer: "" }));
      }
    }
    if (!Array.isArray(list)) {
      list = typeof list === "object" && list !== null ? [list] : [];
    }
    return list
      .map((q: any, idx: number) => {
        if (typeof q === "string") {
          return { id: `q_${idx + 1}`, question: q.trim(), answer: "" };
        }
        return {
          id: String(q.id || `q_${idx + 1}`),
          question: q.question || q.q || q.title || q.text || "",
          answer: q.answer || "",
          answered_at: q.answered_at,
        };
      })
      .filter((q: any) => q.question && q.question.trim().length > 0);
  };

  // Reverted Questions answering state
  const [patientAnswers, setPatientAnswers] = useState<Record<string, string>>({});
  const [submittingAnswers, setSubmittingAnswers] = useState<boolean>(false);
  const [answersSubmittedSuccess, setAnswersSubmittedSuccess] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Sync questions from loaded ticket
  useEffect(() => {
    if (ticket?.reverted_questions) {
      const qs = normalizeRevertedQuestions(ticket.reverted_questions);
      if (qs.length > 0) {
        const initial: Record<string, string> = {};
        qs.forEach((q: any) => {
          initial[q.id] = q.answer || "";
        });
        setPatientAnswers(initial);
      }
    }
  }, [ticket?.id, ticket?.reverted_questions]);

  const handleSubmitPatientAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket?.id) return;
    setSubmittingAnswers(true);
    try {
      const answersPayload = Object.entries(patientAnswers).map(([id, answer]) => ({
        id,
        answer: answer.trim(),
      }));

      const ok = await submitPatientAnswers(ticket.id, answersPayload);
      if (ok) {
        setIsSubmitted(true);
        setAnswersSubmittedSuccess(true);
        setTicket((prev) => {
          if (!prev) return null;
          const updatedQs = (prev.reverted_questions || []).map((q: any) => ({
            ...q,
            answer: patientAnswers[q.id] || q.answer,
            answered_at: new Date().toISOString(),
          }));
          return {
            ...prev,
            status: "Under Review",
            reverted_questions: updatedQs,
          };
        });
        setTimeout(() => setAnswersSubmittedSuccess(false), 6000);
      }
    } catch (err) {
      console.error("Failed submitting patient answers:", err);
    } finally {
      setSubmittingAnswers(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!ticket?.id) return;
    setIsSubmittingDraft(true);
    try {
      const res = await fetch("/api/patient/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticket.id,
          status: "Under Review",
          consent: true,
        }),
      });
      if (res.ok) {
        setTicket((prev) => (prev ? { ...prev, status: "Under Review" } : null));
      }
    } catch (err) {
      console.error("Error submitting draft:", err);
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  const [isUpdatingReferral, setIsUpdatingReferral] = useState(false);

  const handlePatientReferralAction = async (action: "Accepted" | "Declined") => {
    if (!ticket?.id) return;
    setIsUpdatingReferral(true);
    try {
      if (supabase) {
        await supabase
          .from("triage_tickets")
          .update({
            patient_referral_status: action,
            patient_referral_accepted_at: action === "Accepted" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ticket.id);
      }
      setTicket((prev) => (prev ? {
        ...prev,
        patient_referral_status: action,
        patient_referral_accepted_at: action === "Accepted" ? new Date().toISOString() : undefined,
      } : null));
    } catch (e) {
      console.error("Error updating patient referral:", e);
    } finally {
      setIsUpdatingReferral(false);
    }
  };

  useEffect(() => {
    async function fetchTicket() {
      if (!ticketId) return;

      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // 1. Try FastAPI endpoint
        try {
          const res = await fetch(`${apiUrl}/api/triage/ticket/${ticketId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && data.ticket) {
              setTicket(data.ticket);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn("[FastAPI Ticket Fetch Warning]", apiErr);
        }

        // 2. Direct Supabase query
        if (supabase) {
          const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ticketId);
          let query = supabase
            .from("triage_tickets")
            .select("*, profiles:patient_id(full_name, age, gender, phone, user_id), doctor_profile:doctor_id(full_name), nurse_profile:nurse_id(full_name), facility_profile:facility_id(full_name)");

          if (isUuid) {
            query = query.eq("id", ticketId);
          } else {
            const cleanCase = ticketId.startsWith("#") ? ticketId.slice(1) : ticketId;
            query = query.eq("case_number", cleanCase);
          }

          const { data, error: sbErr } = await query.maybeSingle();

          if (!sbErr && data) {
            setTicket(data);
            setLoading(false);
            return;
          }
        }

        setError("Clinical encounter ticket not found or database record unavailable.");
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Unable to connect to healthcare records server.");
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [ticketId, user?.id]);

  const handleCopyId = () => {
    const textToCopy = ticket?.case_number || ticket?.id || "";
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getRecommendedAction = (urgency?: string) => {
    const val = (urgency || "").toLowerCase();
    if (val === "red" || val.includes("immediate")) {
      return {
        bannerBg: "bg-rose-50/80 border-rose-200 text-rose-950",
        badgeStyle: "bg-rose-50 text-rose-800 border-rose-200",
        badgeLabel: "Emergency Attention Advised (Priority Red)",
        border: "border-rose-300",
        iconBg: "bg-rose-100 text-rose-600",
        icon: <AlertCircle className="w-5 h-5" />,
        title: "Immediate Medical Attention Advised",
        desc: "Your reported symptoms indicate potentially critical indicators. Please visit the nearest Emergency Hospital or Dial 108 without delay for rapid clinical care.",
        isEmergency: true,
      };
    } else if (val === "yellow" || val.includes("urgent")) {
      return {
        bannerBg: "bg-amber-50/80 border-amber-200 text-amber-950",
        badgeStyle: "bg-amber-50 text-amber-800 border-amber-200",
        badgeLabel: "Same-Day Care Recommended (Priority Yellow)",
        border: "border-amber-300",
        iconBg: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-5 h-5" />,
        title: "Doctor Consultation Recommended Today",
        desc: "We recommend visiting your local Primary Health Centre (PHC) or consulting a registered medical practitioner within 24 hours to evaluate your symptoms.",
        isEmergency: false,
      };
    } else {
      return {
        bannerBg: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
        badgeStyle: "bg-emerald-50 text-emerald-800 border-emerald-200",
        badgeLabel: "Routine Care & Monitoring (Priority Green)",
        border: "border-emerald-300",
        iconBg: "bg-emerald-100 text-emerald-700",
        icon: <ShieldCheck className="w-5 h-5" />,
        title: "Routine Consultation & Home Monitoring",
        desc: "Your reported symptoms appear stable. Schedule a routine doctor appointment or continue monitoring your temperature, hydration, and rest at home.",
        isEmergency: false,
      };
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-44" />
        <div className="h-28 bg-white border border-slate-200 rounded-2xl p-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Encounter Record Not Found</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          {error || "We could not find the clinical encounter record matching the specified ID."}
        </p>
        <div className="pt-2">
          <Link
            href="/citizen/timeline"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Timeline</span>
          </Link>
        </div>
      </div>
    );
  }

  const action = getRecommendedAction(ticket.priority || ticket.urgency);

  // --- Dynamic Symptoms Data Parsing ---
  const sdata = ticket.symptoms_data || {};

  // 1. Primary Complaint
  const primaryComplaint = valOrDash(
    sdata.raw_complaint || sdata.complaint || sdata.summary || sdata.chief_complaint || ticket.chief_complaint
  );

  // 2. Symptoms List normalization (handles random shapes: string, array of strings, array of objects, etc.)
  const rawSymptoms: any = sdata.symptoms || ticket.symptoms || [];
  const normalizedSymptoms: Array<{ name: string; duration?: string; severity?: string }> = [];

  if (Array.isArray(rawSymptoms)) {
    rawSymptoms.forEach((s: any) => {
      if (!s) return;
      if (typeof s === "string") {
        const trimmed = s.trim();
        if (trimmed) normalizedSymptoms.push({ name: trimmed });
      } else if (typeof s === "object") {
        const name = s.name || s.symptom || s.title || s.label || s.complaint || "";
        if (name) {
          normalizedSymptoms.push({
            name: String(name),
            duration: s.duration && s.duration !== "Active" ? String(s.duration) : undefined,
            severity: s.severity ? String(s.severity) : undefined,
          });
        } else {
          // If random key-value map
          const entries = Object.entries(s).filter(([_, v]) => v !== null && v !== undefined && v !== "");
          if (entries.length > 0) {
            normalizedSymptoms.push({
              name: entries.map(([k, v]) => `${k}: ${String(v)}`).join(", "),
            });
          }
        }
      }
    });
  } else if (typeof rawSymptoms === "string" && rawSymptoms.trim()) {
    normalizedSymptoms.push({ name: rawSymptoms.trim() });
  }

  // Fallback: If no parsed symptoms but primary complaint exists, use it
  if (normalizedSymptoms.length === 0 && primaryComplaint !== "-") {
    normalizedSymptoms.push({ name: primaryComplaint });
  }

  // 3. Clinical Q&A Map
  const qaMap: Record<string, any> = (typeof sdata.questions_answers === "object" && sdata.questions_answers !== null)
    ? sdata.questions_answers
    : {};

  // 4. Chronological Timeline
  const rawTimeline = sdata.timeline || [];
  const timelineEvents: Array<{ date: string; event: string; duration?: string }> = [];
  if (Array.isArray(rawTimeline)) {
    rawTimeline.forEach((item: any) => {
      if (!item) return;
      if (typeof item === "object") {
        const dateStr = item.date || item.time || item.day || "Recorded";
        const eventStr = item.event || item.description || item.note || item.title || "";
        const durStr = item.duration || "";
        if (eventStr) {
          timelineEvents.push({
            date: String(dateStr),
            event: String(eventStr),
            duration: durStr ? String(durStr) : undefined,
          });
        }
      } else if (typeof item === "string" && item.trim()) {
        timelineEvents.push({ date: "Recorded", event: item.trim() });
      }
    });
  }

  // 5. Follow-up Questionnaire Answers
  const followUpRaw = sdata.follow_up_answers || ticket.vitals?.follow_up_answers || {};
  let followUpEntries: [string, string][] = [];
  if (Array.isArray(sdata.raw_qa) && sdata.raw_qa.length > 0) {
    followUpEntries = sdata.raw_qa.map((item: any) => [String(item.question || ""), String(item.answer || "")]);
  } else if (typeof sdata.questions_answers === "object" && sdata.questions_answers !== null) {
    followUpEntries = Object.entries(sdata.questions_answers).map(([k, v]) => [k, String(v)]);
  } else if (typeof followUpRaw === "object" && followUpRaw !== null) {
    followUpEntries = Object.entries(followUpRaw).filter(([_, v]) => v !== null && v !== undefined && String(v).trim() !== "") as [string, string][];
  }

  // 6. Vitals & Observations
  const vitalsObj = sdata.vitals || ticket.vitals || {};
  const bodyTemperature = valOrDash(vitalsObj.temperature);
  const extraVitals = Object.entries(vitalsObj).filter(
    ([k, v]) =>
      k.toLowerCase() !== "temperature" &&
      k.toLowerCase() !== "recorded_at" &&
      k.toLowerCase() !== "follow_up_answers" &&
      v !== null &&
      v !== undefined &&
      String(v).trim() !== ""
  );

  // 7. Clinical Reasoning
  const clinicalReasoning = valOrDash(sdata.clinical_reasoning || ticket.ai_recommendation?.clinical_reasoning);

  // 8. Uploaded Diagnostic Report (external lab file)
  const uploadedReportData = ticket.uploaded_report_data || null;
  const uploadedReportUrl = ticket.uploaded_report_url || ticket.report_url || null;
  const hasUploadedReport = Boolean(
    uploadedReportData &&
      typeof uploadedReportData === "object" &&
      Object.keys(uploadedReportData).length > 0 &&
      ((Array.isArray(uploadedReportData.parameters) && uploadedReportData.parameters.length > 0) ||
        uploadedReportData.test_name ||
        uploadedReportUrl)
  );
  const ocrParameters: any[] = Array.isArray(uploadedReportData?.parameters) ? uploadedReportData.parameters : [];
  const ocrFlags: string[] = Array.isArray(uploadedReportData?.clinical_flags) ? uploadedReportData.clinical_flags : [];

  // 9. Physician Discharge / Consultation Summary
  const dischargeReportText = valOrDash(ticket.discharge_report_text);
  const dischargeReportUrl = ticket.discharge_report_url;

  // Safely parse structured discharge report if available
  let parsedDischarge: {
    hospitalName?: string;
    hospitalAddress?: string;
    contactInfo?: string;
    clinicalSummary?: string;
    treatmentProvided?: string;
    dischargeCondition?: string;
    prescribedMedications?: Array<{
      name?: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
    }>;
    followUpInstructions?:
      | {
          recommendedFollowUp?: string;
          nextFollowUpDate?: string;
          lifestyleDietaryInstructions?: string;
        }
      | string;
    physician?: {
      name?: string;
      qualification?: string;
      regNo?: string;
      contact?: string;
    };
    [key: string]: any;
  } | null = null;

  if (ticket.discharge_report_text) {
    if (typeof ticket.discharge_report_text === "object") {
      parsedDischarge = ticket.discharge_report_text as any;
    } else if (typeof ticket.discharge_report_text === "string") {
      const trimmed = ticket.discharge_report_text.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          parsedDischarge = JSON.parse(trimmed);
        } catch {
          parsedDischarge = null;
        }
      }
    }
  }

  const getNameFromProfile = (p: any) => {
    if (!p) return null;
    if (Array.isArray(p)) return p[0]?.full_name || null;
    if (typeof p === "object") return p.full_name || null;
    return null;
  };

  const treatedDoctorName =
    getNameFromProfile(ticket.doctor_profile) ||
    ticket.assigned_doctor_name ||
    parsedDischarge?.physician?.name ||
    (ticket.doctor_id ? "Assigned Medical Officer" : null);

  const treatedNurseName =
    getNameFromProfile(ticket.nurse_profile) ||
    ticket.assigned_nurse_name ||
    (ticket.nurse_id ? "Assigned Clinical Nurse" : null);

  const treatedFacilityName =
    getNameFromProfile(ticket.facility_profile) ||
    (ticket.present_address as any)?.facility_name ||
    parsedDischarge?.hospitalName ||
    (ticket.facility_id ? "Assigned Healthcare Facility" : null);

  // 10. Citizen Patient & Family Demographics
  const isFamily = Boolean(ticket.is_family_member);
  const profileRaw = ticket.profiles;
  const profile = Array.isArray(profileRaw) ? profileRaw[0] || {} : profileRaw || {};

  // Match dependent from user profile if available
  const matchingDependent = isFamily && user?.dependents
    ? user.dependents.find((d: any) =>
        (ticket.family_member_name && d.fullName?.toLowerCase() === ticket.family_member_name.toLowerCase()) ||
        (ticket.family_member_uhid && d.patientUhid === ticket.family_member_uhid)
      )
    : null;

  const patientDisplayName = isFamily
    ? valOrDash(ticket.family_member_name)
    : valOrDash(profile.full_name || ticket.patient_name || user?.fullName);

  const patientAgeVal = isFamily
    ? (ticket.family_member_age ?? ticket.symptoms_data?.family_member_age ?? ticket.symptoms_data?.patient_age ?? matchingDependent?.age)
    : (profile.age || ticket.patient_age || ticket.symptoms_data?.patient_age || user?.age);
  const patientDisplayAge = patientAgeVal ? `${patientAgeVal} yrs` : "-";

  const patientDisplayGender = isFamily
    ? valOrDash(ticket.family_member_gender || ticket.symptoms_data?.family_member_gender || ticket.symptoms_data?.patient_gender || matchingDependent?.gender)
    : valOrDash(profile.gender || ticket.patient_gender || ticket.symptoms_data?.patient_gender || user?.gender);

  const patientDisplayPhone = isFamily
    ? valOrDash(ticket.family_member_phone || ticket.symptoms_data?.family_member_phone || matchingDependent?.phone || profile.phone || user?.phone)
    : valOrDash(profile.phone || ticket.phone || user?.phone);

  const rawUhid = isFamily
    ? ticket.family_member_uhid
    : profile.user_id || user?.userId || (ticket.patient_id ? `PT-${ticket.patient_id.slice(0, 8).toUpperCase()}` : null);
  const patientDisplayUhid = valOrDash(rawUhid);

  // Encounter Case Number
  const shortId = ticket.case_number
    ? ticket.case_number.replace(/^#/, "")
    : ticket.id.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Back Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/citizen/timeline"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-800 transition-colors w-fit group"
        >
          <div className="p-1 rounded-lg bg-white border border-slate-200 group-hover:border-teal-400">
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-700" />
          </div>
          <span>Back to Case Registry</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Copied ID" : "Copy ID"}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Case Sheet</span>
          </button>

          {uploadedReportUrl && (
            <a
              href={uploadedReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Uploaded Report PDF</span>
            </a>
          )}

          {dischargeReportUrl && (
            <a
              href={dischargeReportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Discharge Summary PDF</span>
            </a>
          )}

          {normalizeStatus(ticket.status) === "Draft" ? (
            <Link
              href={`/citizen/symptoms?draft_id=${ticket.id}${
                ticket.symptoms_data?.current_step ? `&step=${ticket.symptoms_data.current_step}` : ""
              }`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition-colors shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open &amp; Submit Draft</span>
            </Link>
          ) : (
            <Link
              href="/citizen/symptoms"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white transition-colors shadow-xs"
            >
              <span>New Symptom</span>
            </Link>
          )}
        </div>
      </div>

      {/* Draft Notification & Direct Action Banner */}
      {normalizeStatus(ticket.status) === "Draft" && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">This Case is Saved as a Draft</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                This intake is unsubmitted. Open it in the symptom reporter to edit from where you left off, or submit directly now for medical triage.
              </p>
            </div>
          </div>
          {(() => {
            const savedStep = ticket.symptoms_data?.current_step || (ticket as any).current_step;
            const stepQuery = savedStep ? `&step=${savedStep}` : "";
            return (
              <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                <Link
                  href={`/citizen/symptoms?draft_id=${ticket.id}${stepQuery}`}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                  <span>Open &amp; Edit {savedStep ? `(Step ${savedStep})` : ""}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleSubmitDraft}
                  disabled={isSubmittingDraft}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingDraft ? "Submitting..." : "Submit Case Now"}</span>
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Referral Consent & Direct Action Banner */}
      {normalizeStatus(ticket.status) === "Referred" && (
        <div className="space-y-3">
          {ticket.patient_referral_status === "Accepted" ? (
            <div className="bg-purple-50/80 border border-purple-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 border border-purple-200">
                  <CheckCircle2 className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-purple-950">Referral Accepted by You</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {ticket.facility_referral_status === "Accepted"
                        ? "Under Review at Facility"
                        : "Sent to Hospital Referrals Roster"}
                    </span>
                  </div>
                  <p className="text-xs text-purple-900 mt-0.5">
                    Destination Hospital: <strong className="text-purple-950 font-bold">{ticket.referal_facility || "Specialist Hospital"}</strong>
                  </p>
                  {ticket.transfer_reason && (
                    <p className="text-xs text-purple-700 mt-0.5">
                      Clinical reason: {ticket.transfer_reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : ticket.patient_referral_status === "Declined" ? (
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-3 text-xs text-slate-700 shadow-2xs">
              <div>
                <strong>Referral Declined:</strong> You opted not to transfer to {ticket.referal_facility || "the destination facility"}.
              </div>
              <button
                type="button"
                onClick={() => handlePatientReferralAction("Accepted")}
                disabled={isUpdatingReferral}
                className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Change Mind &amp; Accept
              </button>
            </div>
          ) : (
            <div className="bg-linear-to-r from-purple-50 via-indigo-50/40 to-white border-2 border-purple-400 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-200 text-purple-900 border border-purple-300">
                      Action Required &bull; Referral Consent
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    Transfer Recommended to {ticket.referal_facility || "Higher Facility"}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    The attending medical officer has referred your case for higher-level diagnostic review and care. Please accept this referral so the destination hospital can review your case and initiate care.
                  </p>
                  {ticket.transfer_reason && (
                    <div className="mt-2 p-2.5 bg-white/90 rounded-xl border border-purple-200 text-xs text-purple-900">
                      <strong>Clinical Transfer Reason:</strong> {ticket.transfer_reason}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => handlePatientReferralAction("Declined")}
                  disabled={isUpdatingReferral}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => handlePatientReferralAction("Accepted")}
                  disabled={isUpdatingReferral}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isUpdatingReferral ? "Saving..." : "Accept Referral & Transfer"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md border border-slate-200">
                #{shortId}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Clinical Encounter Details
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Recorded on {formatDate(ticket.created_at)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const norm = normalizeStatus(ticket.status);
              switch (norm) {
                case "Draft":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                      Draft
                    </span>
                  );
                case "Under Review":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-300">
                      <Activity className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                      Under Review
                    </span>
                  );
                case "Scheduled":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-300">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Scheduled
                    </span>
                  );
                case "Referred":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      Referred
                    </span>
                  );
                case "Reverted":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Reverted
                    </span>
                  );
                case "Completed":
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Completed
                    </span>
                  );
              }
            })()}
          </div>
        </div>

        {/* Patient-Friendly Recommended Action Banner */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${action.bannerBg} ${action.border} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
        >
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl ${action.iconBg} shrink-0 mt-0.5 sm:mt-0`}>
              {action.icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                  Recommended Action
                </span>
                <h4 className="font-bold text-sm text-slate-900">{action.title}</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">{action.desc}</p>
            </div>
          </div>

          {action.isEmergency && (
            <a
              href="tel:108"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 self-start sm:self-center"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 108 Emergency</span>
            </a>
          )}
        </div>
      </div>

      {/* Reverted Questions Card - For Patient to Fill the Answer */}
      {(() => {
        const displayRevertedQs = normalizeRevertedQuestions(ticket?.reverted_questions);
        if (displayRevertedQs.length === 0) return null;

        const isAlreadySubmitted =
          isSubmitted ||
          answersSubmittedSuccess ||
          (displayRevertedQs.length > 0 &&
            displayRevertedQs.every((q: any) => Boolean(q.answer && q.answer.trim().length > 0)) &&
            normalizeStatus(ticket?.status) !== "Reverted");

        return (
          <div
            id="nurse-questions"
            className="p-5 sm:p-6 rounded-2xl border bg-gradient-to-br from-amber-50/90 to-orange-50/50 border-amber-200 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Clinical Nurse Follow-up Questions</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                      {displayRevertedQs.length} {displayRevertedQs.length === 1 ? "Question" : "Questions"}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600">
                    The healthcare staff requested additional details to finalize your clinical review. Please fill out your answers below.
                  </p>
                </div>
              </div>

              {normalizeStatus(ticket.status) === "Reverted" && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 self-start sm:self-center">
                  Status: Awaiting Your Answers
                </span>
              )}
            </div>

            {answersSubmittedSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Thank you! Your answers have been submitted to the nursing station. Your case is now marked as &ldquo;Under Review&rdquo;.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitPatientAnswers} className="space-y-3.5">
              {displayRevertedQs.map((q: any, idx: number) => {
                const currentVal = patientAnswers[q.id] ?? (q.answer || "");
                const isAnswered = Boolean(q.answer);

                return (
                  <div
                    key={q.id || idx}
                    className="p-4 bg-white rounded-xl border border-amber-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{q.question}</span>
                      </label>
                      {isAnswered && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 flex items-center gap-1">
                          <CheckCheck className="w-3 h-3 text-emerald-600" /> Answered
                        </span>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      disabled={isAlreadySubmitted || submittingAnswers}
                      value={currentVal}
                      onChange={(e) =>
                        setPatientAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder={isAlreadySubmitted ? "Your answer has been submitted." : "Type your answer here..."}
                      className={`w-full p-2.5 rounded-lg text-xs shadow-2xs transition-all ${
                        isAlreadySubmitted
                          ? "bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed"
                          : "bg-slate-50 border border-slate-200 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      }`}
                    />
                  </div>
                );
              })}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingAnswers || isAlreadySubmitted}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isAlreadySubmitted
                      ? "bg-slate-200 text-slate-500 border border-slate-300 shadow-none cursor-not-allowed select-none"
                      : "bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {submittingAnswers ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Answers...</span>
                    </>
                  ) : isAlreadySubmitted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Answers Submitted</span>
                    </>
                  ) : (
                    <span>Submit Answers to Nurse</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* Grid: 2 Columns - Clinical Information & Patient Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Column 1: Clinical Symptoms & Observations */}
        <div className="space-y-5">
          {/* Card 1: Chief Complaint & Reported Symptoms */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Chief Complaint &amp; Reported Symptoms
              </h2>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Primary Complaint
              </span>
              <p className="text-base font-bold text-slate-900">{primaryComplaint}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Identified Symptoms ({normalizedSymptoms.length})
              </span>
              {normalizedSymptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {normalizedSymptoms.map((s, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs"
                    >
                      <div className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                      <span className="font-bold text-slate-800">{s.name}</span>
                      {s.duration && (
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                          {s.duration}
                        </span>
                      )}
                      {s.severity && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            s.severity.toLowerCase().includes("severe")
                              ? "bg-rose-100 text-rose-800"
                              : s.severity.toLowerCase().includes("mod")
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {s.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-semibold text-slate-600">-</p>
              )}
            </div>


          </div>

          {/* Card 2: Chronological Symptom Timeline */}
          {timelineEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Clock className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Symptom Progression Timeline
                </h3>
              </div>
              <div className="space-y-2.5">
                {timelineEvents.map((tItem, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {tItem.date}
                      </span>
                      <p className="font-semibold text-slate-800 pt-1">{tItem.event}</p>
                    </div>
                    {tItem.duration && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shrink-0">
                        {tItem.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card 3: Reported Vitals & Observations */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Thermometer className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Reported Vitals &amp; Observations
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">
                    Body Temperature
                  </span>
                  <span className="text-base font-black text-slate-900">{bodyTemperature}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                  <Thermometer className="w-5 h-5" />
                </div>
              </div>

              {extraVitals.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {extraVitals.map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        {k.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-slate-800 block mt-0.5">{valOrDash(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dynamic Follow-up Questionnaire Answers */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Follow-up Clinical Questionnaire
                </span>
                {followUpEntries.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {followUpEntries.map(([k, v]) => {
                      const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                      return (
                        <div
                          key={k}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5"
                        >
                          <span className="text-[10px] text-slate-400 font-medium block">{label}</span>
                          <span className="font-bold text-slate-800 block">{valOrDash(v)}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-slate-600">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Uploaded Diagnostic Lab Report (External Lab Scans) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Uploaded Diagnostic Report
                </h3>
              </div>
              {uploadedReportUrl && (
                <a
                  href={uploadedReportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Lab File</span>
                </a>
              )}
            </div>

            {hasUploadedReport ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Test: <strong>{valOrDash(uploadedReportData?.test_name || uploadedReportData?.file_name)}</strong>
                  </span>
                  {uploadedReportData?.report_date && <span>Date: {uploadedReportData.report_date}</span>}
                </div>

                {ocrParameters.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                        <tr>
                          <th className="py-2.5 px-3">Test Parameter</th>
                          <th className="py-2.5 px-3">Result</th>
                          <th className="py-2.5 px-3">Reference Range</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ocrParameters.map((p: any, idx: number) => {
                          const statusUpper = String(p.status || "").toUpperCase();
                          const isHigh = statusUpper === "HIGH" || statusUpper === "CRITICAL";
                          const isLow = statusUpper === "LOW";
                          const badgeColor = isHigh
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : isLow
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-900">{p.parameter || p.name || "-"}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {p.value || "-"} {p.unit || ""}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{p.reference_range || "-"}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                                  {statusUpper || "NORMAL"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">Uploaded file linked above.</p>
                )}

                {ocrFlags.length > 0 && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-bold text-amber-900 block">Identified Clinical Flags:</span>
                    <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                      {ocrFlags.map((flag, fIdx) => (
                        <li key={fIdx}>{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-600">-</p>
            )}
          </div>
        </div>

        {/* Column 2: Patient Info & Clinical Administration */}
        <div className="space-y-5">
          {/* Card 1: Citizen Patient & Family Demographics */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Citizen Patient Info
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  {isFamily ? "Family Dependent Name" : "Full Name"}
                </span>
                <p className="font-bold text-slate-900 text-base">{patientDisplayName}</p>
                {isFamily && ticket.family_member_relationship && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    Relationship: {ticket.family_member_relationship}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Age</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{patientDisplayAge}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gender</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5 capitalize">{patientDisplayGender}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    {isFamily ? "Family Member UHID" : "Citizen ID / UHID"}
                  </span>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{patientDisplayUhid}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Phone</span>
                  <p className="font-mono font-bold text-slate-800 text-xs mt-0.5">{patientDisplayPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Preferred Language</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{valOrDash(ticket.preferred_language || "English")}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Digital Consent</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5">{valOrDash(ticket.consent_status || "Given")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Local Jurisdiction & Present Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Local Jurisdiction &amp; Present Location
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Present State</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(ticket.present_address?.state || ticket.ai_recommendation?.present_location?.state)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Present District</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(ticket.present_address?.district || ticket.ai_recommendation?.present_location?.district)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Block / Sub-District</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(ticket.present_address?.block || ticket.ai_recommendation?.present_location?.block)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Street / Village / Landmark</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(ticket.present_address?.landmark)}
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Clinical Care Administration & Assigned Duty Staff */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ClipboardList className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Clinical Care &amp; Duty Team
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Consultation Mode</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {ticket.consultation_mode === "offline"
                    ? "In-Person Clinic Visit (PHC)"
                    : ticket.consultation_mode === "online"
                    ? "Online Teleconsultation"
                    : valOrDash(ticket.consultation_mode)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Intake Channel</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">{valOrDash(ticket.submitted_via || "Mobile App")}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Doctor</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(treatedDoctorName)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Nurse</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(treatedNurseName)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 col-span-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Facility / Dispensary</span>
                <p className="font-bold text-slate-800 text-xs mt-0.5">
                  {valOrDash(treatedFacilityName || ((ticket.facility_id || ticket.medical_id) ? "Assigned Facility Pharmacy" : null))}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Doctor Consultation Notes
              </span>
              <p className="p-3 rounded-xl bg-slate-50 border border-slate-100 font-semibold text-slate-800">
                {valOrDash(ticket.resolve_notes || ticket.doctor_notes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width: Physician Consultation & Discharge Summary */}
      {(parsedDischarge || (dischargeReportText && dischargeReportText !== "-") || dischargeReportUrl) && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Discharge Summary &amp; Physician Advice
              </h3>
            </div>
            {dischargeReportUrl && (
              <a
                href={dischargeReportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            )}
          </div>

          {parsedDischarge ? (
            <div className="space-y-4">
              {/* Condition at Discharge */}
              {parsedDischarge.dischargeCondition && (
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Condition at Discharge</span>
                  </div>
                  <p className="text-emerald-950 font-medium text-xs leading-relaxed pl-6">
                    {parsedDischarge.dischargeCondition}
                  </p>
                </div>
              )}

              {/* Clinical Summary & Treatment Provided (Side-by-Side in 2 columns on md+) */}
              {(parsedDischarge.clinicalSummary || parsedDischarge.treatmentProvided) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parsedDischarge.clinicalSummary && (
                    <div className="space-y-1.5 flex flex-col">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span>Clinical Summary</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium flex-1">
                        {parsedDischarge.clinicalSummary}
                      </div>
                    </div>
                  )}

                  {parsedDischarge.treatmentProvided && (
                    <div className="space-y-1.5 flex flex-col">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Treatment Provided &amp; In-Clinic Interventions</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium flex-1">
                        {parsedDischarge.treatmentProvided}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Prescribed Medications at Discharge */}
              {Array.isArray(parsedDischarge.prescribedMedications) && parsedDischarge.prescribedMedications.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prescribed Medications at Discharge</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Medication Name</th>
                          <th className="py-2.5 px-3">Dosage</th>
                          <th className="py-2.5 px-3">Frequency / Timing</th>
                          <th className="py-2.5 px-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {parsedDischarge.prescribedMedications.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{med.name || "-"}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                                {med.dosage || "-"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{med.frequency || "-"}</td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-800">{med.duration || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Follow-Up Instructions */}
              {parsedDischarge.followUpInstructions && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    <CalendarCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span>Follow-Up Instructions &amp; Advice</span>
                  </div>

                  {typeof parsedDischarge.followUpInstructions === "object" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Recommended Follow-Up</span>
                        <p className="font-semibold text-slate-800 text-xs">
                          {parsedDischarge.followUpInstructions.recommendedFollowUp || "-"}
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Next Follow-Up Timeline</span>
                        <p className="font-semibold text-teal-800 text-xs">
                          {parsedDischarge.followUpInstructions.nextFollowUpDate || "-"}
                        </p>
                      </div>
                      {parsedDischarge.followUpInstructions.lifestyleDietaryInstructions && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-1 md:col-span-2 space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Lifestyle &amp; Dietary Advice</span>
                          <p className="font-medium text-slate-800 text-xs leading-relaxed">
                            {parsedDischarge.followUpInstructions.lifestyleDietaryInstructions}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-medium">
                      {String(parsedDischarge.followUpInstructions)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : dischargeReportText && dischargeReportText !== "-" ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 font-medium text-slate-800 leading-relaxed">
              {dischargeReportText}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-center font-medium">
              No physician discharge advice recorded for this case yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
