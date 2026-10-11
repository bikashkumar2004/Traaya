import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database not configured.", latest: null, logs: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId) {
    return NextResponse.json({
      success: true,
      latest: null,
      logs: [],
      count: 0,
    });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    let resolvedUuid = patientId.trim();
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(resolvedUuid)) {
      const [pRow] = await sql`SELECT id FROM public.profiles WHERE user_id = ${resolvedUuid}::text LIMIT 1`;
      if (pRow?.id) {
        resolvedUuid = pRow.id;
      } else {
        return NextResponse.json({
          success: true,
          latest: null,
          logs: [],
          count: 0,
        });
      }
    }

    const logs = await sql`
      SELECT 
        id,
        patient_id,
        ticket_id,
        systolic,
        diastolic,
        pulse,
        spo2,
        blood_sugar,
        temperature,
        notes,
        logged_at
      FROM public.patient_vitals_logs
      WHERE patient_id = ${resolvedUuid}::uuid
      ORDER BY logged_at DESC
      LIMIT 10
    `;

    return NextResponse.json({
      success: true,
      latest: logs[0] || null,
      logs: logs || [],
      count: logs.length,
    });
  } catch (err: any) {
    console.error("Error in GET /api/patient/reminders/vitals:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch vitals.", latest: null, logs: [] },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export async function POST(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "Database not configured." }, { status: 500 });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    const body = await req.json();
    const {
      patient_id,
      ticket_id,
      systolic,
      diastolic,
      pulse,
      spo2,
      temperature,
      blood_sugar,
      notes,
    } = body;

    if (!patient_id) {
      return NextResponse.json({ success: false, error: "patient_id is required." }, { status: 400 });
    }

    let resolvedUuid = String(patient_id).trim();
    if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(resolvedUuid)) {
      const [pRow] = await sql`SELECT id FROM public.profiles WHERE user_id = ${resolvedUuid}::text LIMIT 1`;
      if (pRow?.id) {
        resolvedUuid = pRow.id;
      }
    }

    const [vitals] = await sql`
      INSERT INTO public.patient_vitals_logs (
        patient_id, ticket_id, systolic, diastolic, pulse, spo2, temperature, blood_sugar, notes, logged_at
      ) VALUES (
        ${resolvedUuid}::uuid,
        ${ticket_id ? sql`${ticket_id}::uuid` : null},
        ${systolic ? Number(systolic) : null},
        ${diastolic ? Number(diastolic) : null},
        ${pulse ? Number(pulse) : null},
        ${spo2 ? Number(spo2) : null},
        ${temperature ? Number(temperature) : null},
        ${blood_sugar ? Number(blood_sugar) : null},
        ${notes || "Self-logged vitals via patient portal"}::text,
        now()
      )
      RETURNING *
    `;

    // Also mark any vitals_log reminder for this patient as completed for today
    try {
      await sql`
        UPDATE public.patient_reminders
        SET is_completed = true, last_completed_at = now(), updated_at = now()
        WHERE patient_id = ${resolvedUuid}::uuid AND type = 'vitals_log'
      `;
    } catch {}

    return NextResponse.json({ success: true, vitals });
  } catch (err: any) {
    console.error("Error in POST /api/patient/reminders/vitals:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to log vitals." }, { status: 500 });
  } finally {
    await sql.end();
  }
}
