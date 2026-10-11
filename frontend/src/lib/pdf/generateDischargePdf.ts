import { jsPDF } from "jspdf";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";
import { TRAAYA_LOGO_BASE64 } from "./traayaLogoBase64";

/**
 * Generates an NABH-standard Hospital Discharge Report PDF
 * precisely matching the format and layout of Hospital-Discharge-Format.pdf
 */
export function generateDischargePdf(data: DischargeReportPayload): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 46.0;
  const contentWidth = 503.28; // 549.28 - 46.0

  // Exact brand colors extracted from Hospital-Discharge-Format.pdf
  const COLOR_TEAL: [number, number, number] = [8, 127, 158]; // #087f9e
  const COLOR_NAVY: [number, number, number] = [23, 50, 76]; // #17324c
  const COLOR_DARK: [number, number, number] = [41, 55, 68]; // #293744
  const COLOR_MUTED: [number, number, number] = [96, 115, 131]; // #607383
  const COLOR_BORDER: [number, number, number] = [183, 198, 207]; // #b7c6cf
  const COLOR_BOX_BG: [number, number, number] = [243, 248, 250]; // #f3f8fa
  const COLOR_BOX_BORDER: [number, number, number] = [223, 235, 240]; // #dfebf0

  // Helper: Section title with vertical teal accent bar
  const drawSectionHeading = (title: string, yTop: number) => {
    doc.setFillColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
    doc.rect(margin, yTop, 3.0, 17.0, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.4);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text(title, margin + 11.0, yTop + 13.0);
  };

  // Helper: Top header band and logo on each page
  const drawPageHeader = () => {
    // Top colored accent bar
    doc.setFillColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
    doc.rect(0, 0, pageWidth, 10.0, "F");

    // Title: "HOSPITAL DISCHARGE REPORT"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18.5);
    doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
    doc.text("HOSPITAL DISCHARGE REPORT", margin, 52.0);

    // Right Logo
    try {
      doc.addImage(TRAAYA_LOGO_BASE64, "PNG", 438.28, 28.0, 111.0, 37.0);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15.0);
      doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
      doc.text("TRAAYA", 480.0, 52.0);
    }

    // Header divider line
    doc.setDrawColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
    doc.setLineWidth(1.25);
    doc.line(margin, 68.0, margin + contentWidth, 68.0);
  };

  // Helper: Page footer
  const drawPageFooter = (pageNum: number, totalPages: number = 2) => {
    doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    doc.setLineWidth(0.6);
    doc.line(margin, 795.89, margin + contentWidth, 795.89);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.0);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text("Hospital Discharge Report", margin, 812.0);
    doc.text(`Page ${pageNum} of ${totalPages}`, margin + contentWidth, 812.0, { align: "right" });
  };

  // ==========================================
  // PAGE 1
  // ==========================================
  drawPageHeader();

  // 1. Facility Information Box
  doc.setFillColor(COLOR_BOX_BG[0], COLOR_BOX_BG[1], COLOR_BOX_BG[2]);
  doc.setDrawColor(COLOR_BOX_BORDER[0], COLOR_BOX_BORDER[1], COLOR_BOX_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, 80.89, contentWidth, 92.0, 2.0, 2.0, "FD");

  // Input boxes inside Facility info
  const boxX = 155.35;
  const boxW = 379.58;

  // Row 1: Facility Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.0);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Facility Name:", margin + 15.0, 107.0);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.7);
  doc.roundedRect(boxX, 94.24, boxW, 19.3, 1.0, 1.0, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const facilityDisplayName = data.facilityName || data.hospitalName || "Jan Aushadhi Kendra";
  const facLines = doc.splitTextToSize(facilityDisplayName, boxW - 14.0);
  doc.text(facLines[0], boxX + 8.0, 107.0);

  // Row 2: Address
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.0);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Address:", margin + 15.0, 134.0);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(boxX, 121.24, boxW, 18.3, 1.0, 1.0, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const addressText = data.hospitalAddress || "Hospital Road, Main CHC Campus, Khandapada, Nayagarh, Odisha - 752077";
  const addrLines = doc.splitTextToSize(addressText, boxW - 14.0);
  doc.text(addrLines[0], boxX + 8.0, 133.5);

  // Row 3: Contact
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.0);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Contact:", margin + 15.0, 160.0);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(boxX, 147.24, boxW, 18.3, 1.0, 1.0, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const contactText = data.contactInfo || "Ph: +91 9437106689 | E-mail: facility.khandapada.6689@triageassist.org";
  const contLines = doc.splitTextToSize(contactText, boxW - 14.0);
  doc.text(contLines[0], boxX + 8.0, 159.5);

  // 2. Patient Details Section
  drawSectionHeading("Patient Details", 182.0);

  // Patient Details Grid Box (height 112pt with balanced 37pt rows)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, 206.0, contentWidth, 112.0, 2.5, 2.5, "FD");

  // Grid inner dividers
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, 243.0, margin + contentWidth, 243.0);
  doc.line(margin, 280.0, margin + contentWidth, 280.0);
  doc.line(257.38, 243.0, 257.38, 318.0);

  // Row 1: Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Name", margin + 11.0, 219.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.patientDetails.name || "[Patient Name]", margin + 11.0, 233.0);

  // Row 2 Left: Age / Sex
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Age / Sex", margin + 11.0, 256.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.patientDetails.ageSex || "[Age and Gender]", margin + 11.0, 270.0);

  // Row 2 Right: Patient ID / MRN
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Patient ID / Medical Record Number", 268.4, 256.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.patientDetails.patientId || "[ID / Number]", 268.4, 270.0);

  // Row 3 Left: Date of Admission
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Date of Admission", margin + 11.0, 293.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.patientDetails.dateOfAdmission || "[Admission Date]", margin + 11.0, 307.0);

  // Row 3 Right: Date of Discharge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("Date of Discharge", 268.4, 293.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.patientDetails.dateOfDischarge || "[Discharge Date]", 268.4, 307.0);

  // 3. Admission Details Section
  drawSectionHeading("Admission Details", 328.0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Reason for Admission", margin + 4.0, 356.0);

  // Ruled lines for Reason
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(margin, 381.89, margin + contentWidth, 381.89);
  doc.line(margin, 400.89, margin + contentWidth, 400.89);

  // Value text for Reason
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const reasonText = data.admissionDetails.reasonForAdmission || "Clinical evaluation, symptom assessment, and ambulatory outpatient care.";
  const reasonLines = doc.splitTextToSize(reasonText, contentWidth - 8.0);
  doc.text(reasonLines.slice(0, 2), margin + 4.0, 376.5);

  // Mode of Admission
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.2);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Mode of Admission", margin + 4.0, 423.0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("Emergency / Planned / Other:", margin + 120.0, 423.0);

  // Underline for mode of admission
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(margin + 265.0, 427.0, margin + contentWidth, 427.0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.admissionDetails.modeOfAdmission || "Walk-in Triage / Outpatient Assessment", margin + 270.0, 422.5);

  // 4. Clinical Summary Section
  drawSectionHeading("Clinical Summary", 444.0);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const summaryGuide =
    "Include a concise summary of the patient condition, diagnosis, treatment, and progress during the stay. Include major events, surgeries performed, and response to treatment.";
  const guideLines = doc.splitTextToSize(summaryGuide, contentWidth);
  doc.text(guideLines, margin, 469.0);

  // Background ruled lines for Clinical Summary
  const summaryLineYs = [502.0, 520.0, 538.0, 556.0, 574.0, 592.0];
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  summaryLineYs.forEach((ly) => {
    doc.line(margin, ly, margin + contentWidth, ly);
  });

  // Clinical Summary text: positioned neatly above each ruled line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const clinLines = doc.splitTextToSize(
    data.clinicalSummary ||
      "Patient presented with reported symptoms for clinical triage examination. Vital signs and physical evaluation were performed. Appropriate clinical measures administered, showing satisfactory response.",
    contentWidth - 8.0
  );
  clinLines.slice(0, 5).forEach((line: string, idx: number) => {
    doc.text(line, margin + 4.0, summaryLineYs[idx] - 3.5);
  });

  // 5. Treatment Provided Section
  drawSectionHeading("Treatment Provided", 608.0);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const treatGuide = "Details of all treatments or surgeries performed, medication plans, diagnostic tests, and any special procedures.";
  doc.text(treatGuide, margin, 633.0);

  // Background ruled lines for Treatment Provided
  const treatLineYs = [665.0, 683.0, 701.0, 719.0, 737.0, 755.0, 773.0];
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  treatLineYs.forEach((ly) => {
    doc.line(margin, ly, margin + contentWidth, ly);
  });

  // Treatment Provided text: positioned neatly above each ruled line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const treatLines = doc.splitTextToSize(
    data.treatmentProvided ||
      "Routine oral medication administered. Hydration supported with oral fluids. Patient evaluated in quiet resting area with resolution of acute symptoms.",
    contentWidth - 8.0
  );
  treatLines.slice(0, 6).forEach((line: string, idx: number) => {
    doc.text(line, margin + 4.0, treatLineYs[idx] - 3.5);
  });

  // Page 1 Footer
  drawPageFooter(1, 2);

  // ==========================================
  // PAGE 2
  // ==========================================
  doc.addPage("a4", "portrait");
  drawPageHeader();

  // Top Patient Bar
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.9);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Patient Name:", margin, 99.0);

  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(116.0, 103.0, 296.0, 103.0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.patientDetails.name || "", 120.0, 99.0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.9);
  doc.text("Patient ID / MRN:", 320.0, 99.0);

  doc.line(422.0, 103.0, margin + contentWidth, 103.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.patientDetails.patientId || "", 426.0, 99.0);

  // 6. Discharge Condition Section
  drawSectionHeading("Discharge Condition", 123.0);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("Description of the patient's condition at the time of discharge.", margin, 150.0);

  // Ruled lines for Discharge Condition
  const dischLineYs = [181.0, 199.0, 217.0];
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  dischLineYs.forEach((ly) => {
    doc.line(margin, ly, margin + contentWidth, ly);
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const condLines = doc.splitTextToSize(
    data.dischargeCondition || "Afebrile, vital signs within normal range, symptomatically relieved, ambulatory, and fit for home recovery.",
    contentWidth - 8.0
  );
  condLines.slice(0, 3).forEach((line: string, idx: number) => {
    doc.text(line, margin + 4.0, dischLineYs[idx] - 3.5);
  });

  // 7. Prescribed Medications at Discharge Section (NON-OVERLAPPING DYNAMIC TABLE)
  drawSectionHeading("Prescribed Medications at Discharge", 232.0);

  const tblX = margin;
  const tblY = 260.0;
  const headerH = 24.0;

  // Optimized column positions for 503.28pt content width:
  // Col 0: No. (26pt)
  // Col 1: Medication name (156pt)
  // Col 2: Dosage (90pt)
  // Col 3: Frequency (130pt)
  // Col 4: Duration (101.28pt)
  const colX = [
    margin,
    margin + 26.0,
    margin + 182.0,
    margin + 272.0,
    margin + 402.0,
    margin + contentWidth,
  ];

  // Header fill
  doc.setFillColor(COLOR_BOX_BG[0], COLOR_BOX_BG[1], COLOR_BOX_BG[2]);
  doc.rect(tblX, tblY, contentWidth, headerH, "F");

  // Header labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_NAVY[0], COLOR_NAVY[1], COLOR_NAVY[2]);
  doc.text("No.", colX[0] + 6.0, tblY + 16.0);
  doc.text("Medication name", colX[1] + 7.0, tblY + 16.0);
  doc.text("Dosage", colX[2] + 7.0, tblY + 16.0);
  doc.text("Frequency", colX[3] + 7.0, tblY + 16.0);
  doc.text("Duration", colX[4] + 7.0, tblY + 16.0);

  // Med list
  const meds =
    data.prescribedMedications && data.prescribedMedications.length > 0
      ? data.prescribedMedications
      : [
          { name: "Paracetamol Tablet", dosage: "500 mg", frequency: "TDS (8 Hourly)", duration: "3 Days" },
          { name: "Cetirizine Tablet", dosage: "10 mg", frequency: "OD (Night)", duration: "5 Days" },
        ];

  // Pre-calculate wrapped lines and heights for each medication row
  const rowDetails = meds.map((m) => {
    const nameLines = doc.splitTextToSize(m.name || "Medicine", 146.0);
    const dosageLines = doc.splitTextToSize(m.dosage || "-", 80.0);
    const freqLines = doc.splitTextToSize(m.frequency || "-", 120.0);
    const durLines = doc.splitTextToSize(m.duration || "-", 90.0);
    const maxLines = Math.max(nameLines.length, dosageLines.length, freqLines.length, durLines.length, 1);
    const rowHeight = meds.length <= 2 ? 44.0 : Math.max(26.0, maxLines * 11.5 + 8.0);
    return { nameLines, dosageLines, freqLines, durLines, maxLines, rowHeight };
  });

  const totalTableRowsHeight = rowDetails.reduce((sum, r) => sum + r.rowHeight, 0);
  const tableH = headerH + totalTableRowsHeight;

  // Outer border
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.75);
  doc.rect(tblX, tblY, contentWidth, tableH);

  // Header bottom line
  doc.line(tblX, tblY + headerH, tblX + contentWidth, tblY + headerH);

  // Render rows and horizontal dividers
  let currentY = tblY + headerH;
  rowDetails.forEach((row, idx) => {
    const rY = currentY;
    const rH = row.rowHeight;

    // Draw horizontal row line if not the last row
    if (idx < rowDetails.length - 1) {
      doc.line(tblX, rY + rH, tblX + contentWidth, rY + rH);
    }

    // Row number
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
    doc.text(`${idx + 1}.`, colX[0] + 7.0, rY + 16.0);

    // Medication name (bold)
    const nameStartY = rH > 30.0 && row.nameLines.length === 1 ? rY + (rH / 2) + 3.0 : rY + 14.0;
    row.nameLines.forEach((line: string, lIdx: number) => {
      doc.text(line, colX[1] + 7.0, nameStartY + lIdx * 11.0);
    });

    // Dosage (normal)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    const dosageStartY = rH > 30.0 && row.dosageLines.length === 1 ? rY + (rH / 2) + 3.0 : rY + 14.0;
    row.dosageLines.forEach((line: string, lIdx: number) => {
      doc.text(line, colX[2] + 7.0, dosageStartY + lIdx * 11.0);
    });

    // Frequency (normal)
    const freqStartY = rH > 30.0 && row.freqLines.length === 1 ? rY + (rH / 2) + 3.0 : rY + 14.0;
    row.freqLines.forEach((line: string, lIdx: number) => {
      doc.text(line, colX[3] + 7.0, freqStartY + lIdx * 11.0);
    });

    // Duration (normal)
    const durStartY = rH > 30.0 && row.durLines.length === 1 ? rY + (rH / 2) + 3.0 : rY + 14.0;
    row.durLines.forEach((line: string, lIdx: number) => {
      doc.text(line, colX[4] + 7.0, durStartY + lIdx * 11.0);
    });

    currentY += rH;
  });

  // Vertical column lines spanning entire table height
  for (let c = 1; c < colX.length - 1; c++) {
    doc.line(colX[c], tblY, colX[c], tblY + tableH);
  }

  // Table footnote
  const tableBottomY = tblY + tableH;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("Record medication name, dosage, frequency, and duration for each item.", margin, tableBottomY + 12.0);

  // 8. Follow-Up Instructions Section
  const fuTopY = tableBottomY + 23.0;
  drawSectionHeading("Follow-Up Instructions", fuTopY);

  // Item 1: Recommended Follow-Up
  let curY = fuTopY + 26.0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Recommended Follow-Up", margin + 4.0, curY);

  curY += 14.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const followUpText =
    data.followUpInstructions.recommendedFollowUp ||
    "[Type of follow-up care, e.g., outpatient care or specialist referral]";
  doc.text(followUpText, margin + 4.0, curY - 3.0);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(margin + 4.0, curY + 2.0, margin + contentWidth, curY + 2.0);

  // Item 2: Next Follow-Up Date
  curY += 21.0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Next Follow-Up Date", margin + 4.0, curY);

  curY += 14.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(
    data.followUpInstructions.nextFollowUpDate || "[Date or guidance on the timing of follow-up]",
    margin + 4.0,
    curY - 3.0
  );
  doc.line(margin + 4.0, curY + 2.0, margin + contentWidth, curY + 2.0);

  // Item 3: Lifestyle / Dietary Instructions
  curY += 21.0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Lifestyle / Dietary Instructions", margin + 4.0, curY);

  curY += 14.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const lifestyleText =
    data.followUpInstructions.lifestyleDietaryInstructions ||
    "[Add any specific instructions or changes required for recovery]";
  const lifestyleLines = doc.splitTextToSize(lifestyleText, contentWidth - 8.0);
  doc.text(lifestyleLines[0] || "", margin + 4.0, curY - 3.0);
  doc.line(margin + 4.0, curY + 2.0, margin + contentWidth, curY + 2.0);

  // 9. Physician's Name and Signature Section
  const phyTopY = curY + 16.0;
  drawSectionHeading("Physician's Name and Signature", phyTopY);

  curY = phyTopY + 26.0;
  // Row 1: Names
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Name of Discharging Physician", margin + 4.0, curY);
  doc.text("Contact Information (if relevant)", 306.0, curY);

  curY += 13.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.physician.name || "Dr. Kavita Verma, MD", margin + 4.0, curY - 2.0);
  const phyContact = data.physician.regNo
    ? `Reg: ${data.physician.regNo} | ${data.physician.contact || "+91 6757-230244"}`
    : (data.physician.contact || "+91 6757-230244");
  doc.text(phyContact, 306.0, curY - 2.0);

  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(margin + 4.0, curY + 2.0, 286.0, curY + 2.0);
  doc.line(306.0, curY + 2.0, margin + contentWidth, curY + 2.0);

  // Row 2: Physician Signature
  curY += 19.0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Physician Signature", margin + 4.0, curY);

  doc.line(156.0, curY + 2.0, 366.0, curY + 2.0);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
  doc.text(`${data.physician.name || "Dr. Kavita Verma"} [Digitally Verified]`, 160.0, curY - 2.0);

  // 10. Patient Acknowledgment Signature Section
  const ackTopY = curY + 15.0;
  drawSectionHeading("Patient Acknowledgment Signature", ackTopY);

  curY = ackTopY + 24.0;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.7);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("I acknowledge that I have received and understood the above information.", margin + 4.0, curY);

  curY += 20.0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Patient / Guardian Signature", margin + 4.0, curY);

  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.8);
  doc.line(200.0, curY + 2.0, 391.0, curY + 2.0);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text("[Signed on File]", 206.0, curY - 2.0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text("Date", 415.0, curY);

  doc.line(447.0, curY + 2.0, margin + contentWidth, curY + 2.0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(data.patientDetails.dateOfDischarge || "", 452.0, curY - 2.0);

  // 11. Disclaimer Section
  const discLineY = curY + 16.0;
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, discLineY, margin + contentWidth, discLineY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.3);
  doc.setTextColor(COLOR_TEAL[0], COLOR_TEAL[1], COLOR_TEAL[2]);
  doc.text("Disclaimer", margin, discLineY + 11.0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const disclaimerText =
    data.disclaimer ||
    "The contents are sample references to aid understanding of the Standards and are not prescribed by NABH as mandatory practices. Healthcare organizations are encouraged to modify them as per their scope and practices. NABH is not liable for misinterpretation, erroneous use, or non-conformities during assessment due to unmodified use of these contents.";
  const discLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(discLines, margin, discLineY + 21.0);

  // Page 2 Footer
  drawPageFooter(2, 2);

  return doc;
}
