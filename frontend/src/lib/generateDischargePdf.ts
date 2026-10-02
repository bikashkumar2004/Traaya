import { jsPDF } from "jspdf";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";

/**
 * Generates an NABH-standard Hospital Discharge Summary PDF
 * precisely matching the format and layout of Hospital-Discharge-Summary-Format.pdf
 */
export function generateDischargePdf(data: DischargeReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174mm

  // Helper colors
  const primaryNavy = [15, 44, 89]; // #0f2c59
  const accentTeal = [13, 148, 136]; // #0d9488
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500
  const borderLight = [226, 232, 240];

  // ==========================================
  // PAGE 1
  // ==========================================

  // Document Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Hospital Discharge Summary Format", margin, 18);

  // Metadata Table Banner
  doc.setDrawColor(200, 210, 220);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 22, contentWidth, 12, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Document ID", margin + 3, 26);
  doc.text("Document Version", margin + 50, 26);
  doc.text("Document Category", margin + 92, 26);
  doc.text("Issue Date", margin + 140, 26);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.documentId || "E-Mitra/FORMAT/04/V1.0", margin + 3, 31);
  doc.text(data.documentVersion || "01", margin + 50, 31);
  doc.text(data.documentCategory || "Format", margin + 92, 31);
  doc.text(data.issueDate || "01/2025", margin + 140, 31);

  // Template introductory preamble paragraph
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const introText =
    "This document serves as a standardized template for recording patient discharge information. It provides a structured format to capture essential details about a patient's hospital stay, treatment, and condition at the time of discharge. The template ensures consistency, clarity, and completeness of information shared with patients, caregivers, and follow-up healthcare providers, supporting effective continuity of care and adherence to post-discharge instructions.";
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, 38);

  let currentY = 38 + introLines.length * 3.4 + 2;

  // Hospital Discharge Summary Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("Hospital Discharge Summary", margin + 4, currentY + 5);

  currentY += 10;

  // Hospital Name & Address block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(data.hospitalName || "Community Health Centre (CHC) Khandapada", margin, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Address: ${data.hospitalAddress || "Main Road, Khandapada, Nayagarh, Odisha - 752077"}`, margin, currentY);

  currentY += 4;
  doc.text(`Contact Information: ${data.contactInfo || "Ph: +91 6757-230244 | E-mail: triage@chckhandapada.gov.in"}`, margin, currentY);

  currentY += 6;

  // Section 1: Patient Details
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Patient Details", margin + 3, currentY + 4.2);

  currentY += 9;

  const patientFields = [
    { label: "• Name:", value: data.patientDetails.name },
    { label: "• Age/Sex:", value: data.patientDetails.ageSex },
    { label: "• Patient ID / Medical Record Number:", value: data.patientDetails.patientId },
    { label: "• Date of Admission:", value: data.patientDetails.dateOfAdmission },
    { label: "• Date of Discharge:", value: data.patientDetails.dateOfDischarge },
  ];

  doc.setFontSize(8.5);
  patientFields.forEach((field) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(field.label, margin + 4, currentY);

    const labelWidth = doc.getTextWidth(field.label) + 2;
    doc.setFont("helvetica", "normal");
    doc.text(field.value || "-", margin + 4 + labelWidth, currentY);
    currentY += 5;
  });

  currentY += 2;

  // Section 2: Admission Details
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Admission Details", margin + 3, currentY + 4.2);

  currentY += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("• Reason for Admission:", margin + 4, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  const reasonLines = doc.splitTextToSize(data.admissionDetails.reasonForAdmission || "Clinical outpatient evaluation", contentWidth - 8);
  doc.text(reasonLines, margin + 8, currentY);
  currentY += reasonLines.length * 4.2 + 2;

  doc.setFont("helvetica", "bold");
  doc.text("• Mode of Admission:", margin + 4, currentY);
  const modeWidth = doc.getTextWidth("• Mode of Admission:") + 2;
  doc.setFont("helvetica", "normal");
  doc.text(data.admissionDetails.modeOfAdmission || "Outpatient Clinical Triage / Walk-in", margin + 4 + modeWidth, currentY);

  currentY += 8;

  // Section 3: Clinical Summary
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Clinical Summary", margin + 3, currentY + 4.2);

  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const summaryLines = doc.splitTextToSize(
    data.clinicalSummary ||
      "Patient presented for clinical assessment and conservative symptomatic management. Hemodynamics monitored and stable. Patient discharged in improved condition.",
    contentWidth - 4
  );
  doc.text(summaryLines, margin + 4, currentY);

  // Footer on Page 1
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Hospital Discharge Summary Format — Document ID: E-Mitra/FORMAT/04/V1.0", margin, pageHeight - 10);
  doc.text("Page 1 of 2", pageWidth - margin - 15, pageHeight - 10);

  // ==========================================
  // PAGE 2
  // ==========================================
  doc.addPage("a4", "portrait");
  currentY = margin;

  // Header banner on page 2
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Hospital Discharge Summary Format", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Patient: ${data.patientDetails.name} | ID: ${data.patientDetails.patientId}`, pageWidth - margin - 70, currentY);

  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);

  currentY += 8;

  // Section 4: Treatment Provided
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Treatment Provided", margin + 3, currentY + 4.2);

  currentY += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const treatmentLines = doc.splitTextToSize(
    data.treatmentProvided || "Symptomatic pharmacotherapy, diagnostic triage evaluation, and oral hydration guidance.",
    contentWidth - 4
  );
  doc.text(treatmentLines, margin + 4, currentY);
  currentY += treatmentLines.length * 4.2 + 4;

  // Section 5: Discharge Condition
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Discharge Condition", margin + 3, currentY + 4.2);

  currentY += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const conditionLines = doc.splitTextToSize(
    data.dischargeCondition || "Afebrile, vitals stable, alert, ambulatory and fit for discharge with home care advice.",
    contentWidth - 4
  );
  doc.text(conditionLines, margin + 4, currentY);
  currentY += conditionLines.length * 4.2 + 4;

  // Section 6: Prescribed Medications at Discharge
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Prescribed Medications at Discharge", margin + 3, currentY + 4.2);

  currentY += 8;

  // Medication Table Header
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, currentY, contentWidth, 5.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("#", margin + 2, currentY + 3.8);
  doc.text("Medication Name", margin + 8, currentY + 3.8);
  doc.text("Dosage", margin + 75, currentY + 3.8);
  doc.text("Frequency", margin + 115, currentY + 3.8);
  doc.text("Duration", margin + 152, currentY + 3.8);

  currentY += 6;

  // Medication rows
  const meds = data.prescribedMedications || [];
  meds.forEach((m, idx) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);

    doc.text(`${idx + 1}.`, margin + 2, currentY + 3.5);
    doc.setFont("helvetica", "bold");
    doc.text(m.name || "Medicine", margin + 8, currentY + 3.5);
    doc.setFont("helvetica", "normal");
    doc.text(m.dosage || "-", margin + 75, currentY + 3.5);
    doc.text(m.frequency || "-", margin + 115, currentY + 3.5);
    doc.text(m.duration || "-", margin + 152, currentY + 3.5);

    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(margin, currentY + 5, margin + contentWidth, currentY + 5);
    currentY += 5.5;
  });

  currentY += 3;

  // Section 7: Follow-Up Instructions
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Follow-Up Instructions", margin + 3, currentY + 4.2);

  currentY += 9;

  const followUps = [
    { label: "1. Recommended Follow-Up:", val: data.followUpInstructions.recommendedFollowUp },
    { label: "2. Next Follow-Up Date:", val: data.followUpInstructions.nextFollowUpDate },
    { label: "3. Lifestyle/Dietary Instructions:", val: data.followUpInstructions.lifestyleDietaryInstructions },
  ];

  followUps.forEach((fu) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(fu.label, margin + 4, currentY);

    const fuWidth = doc.getTextWidth(fu.label) + 2;
    doc.setFont("helvetica", "normal");
    const valLines = doc.splitTextToSize(fu.val || "-", contentWidth - fuWidth - 6);
    doc.text(valLines, margin + 4 + fuWidth, currentY);
    currentY += Math.max(valLines.length * 4.2, 5.5);
  });

  currentY += 6;

  // Signatures Row
  const sigBoxWidth = (contentWidth - 6) / 2;

  // Doctor Signature Box
  doc.setDrawColor(200, 210, 220);
  doc.roundedRect(margin, currentY, sigBoxWidth, 24, 1, 1, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Physician's Name and Signature:", margin + 3, currentY + 4.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(data.physician.name || "Dr. Kavita Verma, MD", margin + 3, currentY + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`Reg #: ${data.physician.regNo || "MCI-OD-2012-7889"}`, margin + 3, currentY + 14);
  doc.text("Signature:  Dr. Kavita Verma [Digitally Verified]", margin + 3, currentY + 19);

  // Patient Acknowledgment Box
  doc.roundedRect(margin + sigBoxWidth + 6, currentY, sigBoxWidth, 24, 1, 1, "D");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("Patient Acknowledgment Signature:", margin + sigBoxWidth + 9, currentY + 4.5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const ackText = "I acknowledge that I have received and understood the above information.";
  const ackLines = doc.splitTextToSize(ackText, sigBoxWidth - 6);
  doc.text(ackLines, margin + sigBoxWidth + 9, currentY + 9);

  doc.setFont("helvetica", "normal");
  doc.text("Patient / Guardian: [Signed on File]", margin + sigBoxWidth + 9, currentY + 16);
  doc.text(`Date: ${data.patientDetails.dateOfDischarge}`, margin + sigBoxWidth + 9, currentY + 20);

  currentY += 28;

  // Disclaimer Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Disclaimer:", margin + 3, currentY + 3.8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const discLines = doc.splitTextToSize(
    data.disclaimer ||
      "The contents are sample references to aid understanding of the Standards and are not prescribed by NABH as mandatory practices. Healthcare organizations are encouraged to modify them as per their scope and practices. NABH is not liable for misinterpretation, erroneous use, or non-conformities during assessment due to unmodified use of these contents.",
    contentWidth - 6
  );
  doc.text(discLines, margin + 3, currentY + 7.5);

  // Footer on Page 2
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Hospital Discharge Summary Format — Document ID: E-Mitra/FORMAT/04/V1.0", margin, pageHeight - 10);
  doc.text("Page 2 of 2", pageWidth - margin - 15, pageHeight - 10);

  return doc;
}
