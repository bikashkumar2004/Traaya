import React from "react";
import { PatientShell } from "@/components/patient/PatientShell";

export const metadata = {
  title: "Citizen Health Portal | TriageAssist",
  description: "ABDM Connected Primary Healthcare & Triage Assistive Portal for Citizens",
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PatientShell>{children}</PatientShell>;
}
