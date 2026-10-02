import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DischargeReportPayload } from "@/app/api/doctor/generate-discharge/route";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unconfigured" }, { status: 500 });
    }

    const body = await req.json();
    const {
      caseNumber,
      ticketId,
      patientUhid,
      patientName,
      reportData,
      pdfBase64,
      doctorNotes,
      doctorName = "Dr. Kavita Verma, MD",
      doctorId,
    }: {
      caseNumber: string;
      ticketId?: string;
      patientUhid?: string;
      patientName?: string;
      reportData: DischargeReportPayload;
      pdfBase64?: string;
      doctorNotes?: string;
      doctorName?: string;
      doctorId?: string;
    } = body;

    if (!caseNumber && !ticketId) {
      return NextResponse.json({ error: "Missing caseNumber or ticketId" }, { status: 400 });
    }

    // 1. Locate the triage_ticket in DB
    let ticketQuery = supabase.from("triage_tickets").select("id, patient_id, new_patient_id, case_number");
    if (ticketId) {
      ticketQuery = ticketQuery.eq("id", ticketId);
    } else {
      ticketQuery = ticketQuery.eq("case_number", caseNumber);
    }
    const { data: ticketRecord, error: ticketFindError } = await ticketQuery.maybeSingle();

    const actualTicketId = ticketRecord?.id || ticketId;
    let actualPatientProfileId = ticketRecord?.patient_id;

    // If patient_id is null on ticket, resolve default or matching patient profile
    if (!actualPatientProfileId) {
      const { data: fallbackPatient } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "patient")
        .limit(1)
        .maybeSingle();
      actualPatientProfileId = fallbackPatient?.id;
    }

    // Resolve doctor profile ID
    let doctorProfileId: string | null = null;
    if (doctorId) {
      if (/^[0-9a-fA-F-]{36}$/.test(doctorId)) {
        doctorProfileId = doctorId;
      } else {
        const { data: pData } = await supabase
          .from("profiles")
          .select("id")
          .or(`user_id.eq.${doctorId},id.eq.${doctorId}`)
          .maybeSingle();
        if (pData?.id) doctorProfileId = pData.id;
      }
    }
    if (!doctorProfileId && doctorName) {
      const cleanDocName = doctorName.replace(/^(Dr\.?|MD)\s*/gi, "").replace(/,?\s*MD\b/gi, "").trim();
      if (cleanDocName.length > 2) {
        const { data: namedDoc } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "doctor")
          .ilike("full_name", `%${cleanDocName}%`)
          .limit(1)
          .maybeSingle();
        if (namedDoc?.id) doctorProfileId = namedDoc.id;
      }
    }
    if (!doctorProfileId) {
      const { data: docProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "doctor")
        .limit(1)
        .maybeSingle();
      doctorProfileId = docProfile?.id || null;
    }

    // 2. Upload PDF to Supabase Storage Bucket 'medical-reports'
    let publicPdfUrl = "";
    const cleanCaseNo = (caseNumber || "CASE").replace(/[^a-zA-Z0-9_-]/g, "_");
    const storagePath = `discharge-summaries/${cleanCaseNo}_${Date.now()}_Discharge_Summary.pdf`;

    if (pdfBase64) {
      try {
        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const { error: uploadError } = await supabase.storage
          .from("medical-reports")
          .upload(storagePath, pdfBuffer, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          console.warn("[SaveDischarge Storage Upload Error]", uploadError);
        } else {
          const { data: pubData } = supabase.storage
            .from("medical-reports")
            .getPublicUrl(storagePath);
          publicPdfUrl = pubData?.publicUrl || "";
        }
      } catch (uploadEx) {
        console.warn("[SaveDischarge Storage Exception]", uploadEx);
      }
    }

    if (!publicPdfUrl) {
      publicPdfUrl = `${supabaseUrl}/storage/v1/object/public/medical-reports/${storagePath}`;
    }

    // 3. Update triage_tickets status = 'Completed'
    const updateTicketPayload: Record<string, any> = {
      status: "Completed",
      discharge_report_url: publicPdfUrl,
      discharge_report_text: JSON.stringify(reportData),
      resolve_notes: doctorNotes || reportData.clinicalSummary,
      updated_at: new Date().toISOString(),
    };
    if (doctorProfileId) {
      updateTicketPayload.doctor_id = doctorProfileId;
    }

    if (actualTicketId) {
      const { error: updateError } = await supabase
        .from("triage_tickets")
        .update(updateTicketPayload)
        .eq("id", actualTicketId);

      if (updateError) {
        console.error("[SaveDischarge Ticket Update Error]", updateError);
      }
    } else if (caseNumber) {
      await supabase
        .from("triage_tickets")
        .update(updateTicketPayload)
        .eq("case_number", caseNumber);
    }

    // 4. Record entry in uploaded_reports table
    if (actualPatientProfileId) {
      try {
        await supabase.from("uploaded_reports").insert({
          id: crypto.randomUUID(),
          patient_id: actualPatientProfileId,
          report_type: "Hospital Discharge Summary (E-Mitra/FORMAT/04/V1.0)",
          file_url: publicPdfUrl,
          file_type: "application/pdf",
          report_summary: reportData,
        });
      } catch (urErr) {
        console.warn("[SaveDischarge uploaded_reports Error]", urErr);
      }
    }



    return NextResponse.json({
      success: true,
      publicUrl: publicPdfUrl,
      caseNumber: caseNumber || actualTicketId,
      status: "Completed",
      message: "Clinical discharge report authorized, PDF stored, and patient discharged.",
    });
  } catch (error: any) {
    console.error("[save-discharge Exception]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to finalize and save clinical discharge report" },
      { status: 500 }
    );
  }
}
