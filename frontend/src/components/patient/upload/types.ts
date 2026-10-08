export interface AnalyteParameter {
  name: string;
  value: string | number;
  unit: string;
  reference_range: string;
  status: "HIGH" | "LOW" | "NORMAL" | "BORDERLINE";
  alert_level?: string;
  clinical_significance?: string;
}

export interface AbnormalFinding {
  parameter: string;
  value: string;
  status: string;
  meaning: string;
  action: string;
  reference_range?: string;
}

export interface SummaryDetails {
  overview?: string;
  health_status?: "Normal" | "Needs Attention" | "Action Required";
  urgency?: string;
  abnormal_findings?: AbnormalFinding[];
  normal_findings?: string[];
  what_to_ask_doctor?: string[];
  lifestyle_tips?: string[];
  clinical_flags?: string[];
}

export interface StoredReport {
  id: string;
  patient_id?: string;
  report_type: string;
  file_url: string;
  file_type?: string;
  report_summary?: any;
  created_at: string;
  // Optional convenience fields for display
  file_name?: string;
  file_size?: string;
  lab_name?: string;
  test_date?: string;
  patient_summary?: string;
  summary_details?: SummaryDetails;
  ocr_extracted_metrics?: any;
  uploaded_at?: string;
  status?: string;
}

// Helper to determine LOINC code and SNOMED concept
export function getLoincSnomed(analyteName: string): { loinc: string; snomed: string } {
  const name = analyteName.toLowerCase();
  if (name.includes("hemoglobin") || name.includes("hb")) return { loinc: "718-7", snomed: "259595007" };
  if (name.includes("wbc") || name.includes("leukocyte") || name.includes("tlc")) return { loinc: "6690-2", snomed: "767002" };
  if (name.includes("platelet")) return { loinc: "777-3", snomed: "6690-2" };
  if (name.includes("cholesterol")) return { loinc: "2093-3", snomed: "259648008" };
  if (name.includes("triglyceride")) return { loinc: "2571-8", snomed: "14749-6" };
  if (name.includes("hdl")) return { loinc: "2085-9", snomed: "28036006" };
  if (name.includes("ldl")) return { loinc: "13457-7", snomed: "166832000" };
  if (name.includes("glucose") || name.includes("sugar") || name.includes("rbs")) return { loinc: "1558-6", snomed: "33747003" };
  if (name.includes("hba1c")) return { loinc: "4548-4", snomed: "43396009" };
  if (name.includes("bilirubin")) return { loinc: "1975-2", snomed: "302787001" };
  if (name.includes("creatinine")) return { loinc: "2160-0", snomed: "70901006" };
  if (name.includes("urea")) return { loinc: "3094-0", snomed: "271297003" };
  if (name.includes("sgpt") || name.includes("alt")) return { loinc: "1742-6", snomed: "274332005" };
  if (name.includes("sgot") || name.includes("ast")) return { loinc: "1920-8", snomed: "274333000" };
  return { loinc: "34565-2", snomed: "166312007" };
}
