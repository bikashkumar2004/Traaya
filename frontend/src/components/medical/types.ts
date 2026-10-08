import React from "react";

export type MedicalNavTab =
  | "dashboard"
  | "patients"
  | "referrals"
  | "facility"
  | "inventory";

export type MedicalPatientStatus =
  | "Under Review"
  | "Reverted"
  | "Referred"
  | "Scheduled"
  | "Completed";

export interface BasicMedicalPatient {
  id: string;
  patientUhid: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  triagePriority: "Immediate" | "Urgent" | "Less Urgent" | "Routine / Fit";
  status: MedicalPatientStatus;
  admissionDate: string;
  unitOrWard?: string;
}

export interface HospitalReferral {
  id: string;
  uhid: string;
  patientName: string;
  age: number;
  gender: string;
  phone: string;
  referringDoctor: string;
  referringHospital: string;
  referredAt: string;
  priority: "Immediate" | "Urgent" | "Less Urgent" | "Routine";
  chiefComplaint: string;
  clinicalNotes: string;
  status: "Pending Assignment" | "Assigned" | "Scheduled" | "Completed";
  assignedDoctor?: string;
  assignedDepartment?: string;
  assignedBay?: string;
  assignedTimeline?: string;
  oldFacilityId?: string;
  referalFacilityId?: string;
  scheduleTime?: string;
  patientReferralStatus?: string;
}

export interface FacilityDoctorStaff {
  id: string;
  name: string;
  specialty: string;
  department: string;
  room: string;
  shift: string;
  status: "Available" | "On OPD Duty" | "In Emergency Bay" | "Off Duty";
  activeCases: number;
  phone: string;
}

export interface FacilityBeds {
  totalBeds: number;
  occupiedBeds: number;
  icuBeds: { total: number; occupied: number };
  oxygenBeds: { total: number; occupied: number };
  emergencyBays: { total: number; occupied: number };
}

export interface InventoryItem {
  id: string;
  drugCode: string;
  genericName: string;
  brandName: string;
  category: "Antibiotic" | "Analgesic" | "Cardiovascular" | "Antidiabetic" | "Respiratory" | "Electrolyte";
  currentStock: number;
  unit: string;
  threshold: number;
  batchNumber: string;
  expiryDate: string;
  status: "Adequate" | "Low Stock" | "Critical";
}

export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export function mapToStandardStatus(status?: string): MedicalPatientStatus {
  const s = (status || "").toLowerCase().trim();
  if (s.includes("revert")) return "Reverted";
  if (s.includes("refer")) return "Referred";
  if (s.includes("schedule")) return "Scheduled";
  if (s.includes("complet") || s.includes("discharg") || s.includes("dispens")) return "Completed";
  return "Under Review";
}

export function getPriorityBadgeClass(priority: string) {
  switch (priority) {
    case "Immediate":
      return "bg-rose-50 text-rose-800 border-rose-300 font-extrabold";
    case "Urgent":
      return "bg-amber-50 text-amber-800 border-amber-300 font-bold";
    case "Less Urgent":
      return "bg-teal-50 text-teal-800 border-teal-300 font-semibold";
    default:
      return "bg-slate-100 text-slate-700 border-slate-300 font-medium";
  }
}

export function getDoctorStatusBadge(status: string) {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "On OPD Duty":
      return "bg-teal-50 text-teal-800 border-teal-300";
    case "In Emergency Bay":
      return "bg-rose-50 text-rose-800 border-rose-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
}
