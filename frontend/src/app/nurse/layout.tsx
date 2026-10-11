import React from "react";

export const metadata = {
  title: "Nurse Command Station | TRAAYA",
  description: "Clinical Triage & Patient Intake Command Portal for Primary Health Centres (PHC)",
};

export default function NurseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
