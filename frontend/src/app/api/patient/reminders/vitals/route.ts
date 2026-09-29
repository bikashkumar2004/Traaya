import { NextResponse } from "next/server";
import postgres from "postgres";

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
      temperature,
      blood_sugar,
      notes,
    } = body;

    if (!patient_id) {
      return NextResponse.json({ success: false, error: "patient_id is required." }, { status: 400 });
    }

    const [vitals] = await sql`
      INSERT INTO public.patient_vitals_logs (
        patient_id, ticket_id, systolic, diastolic, pulse, temperature, blood_sugar, notes, logged_at
      ) VALUES (
        ${patient_id}::uuid,
        ${ticket_id ? sql`${ticket_id}::uuid` : null},
        ${systolic ? Number(systolic) : null},
        ${diastolic ? Number(diastolic) : null},
        ${pulse ? Number(pulse) : null},
        ${temperature ? Number(temperature) : null},
        ${blood_sugar ? Number(blood_sugar) : null},
        ${notes || "Self-logged vitals via patient portal"}::text,
        now()
      )
      RETURNING *
    `;

    // Also mark any vitals_log reminder for this patient as completed for today
    await sql`
      UPDATE public.patient_reminders
      SET is_completed = true, last_completed_at = now(), updated_at = now()
      WHERE patient_id = ${patient_id}::uuid AND type = 'vitals_log'
    `;

    return NextResponse.json({ success: true, vitals });
  } catch (err: any) {
    console.error("Error in POST /api/patient/reminders/vitals:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to log vitals." }, { status: 500 });
  } finally {
    await sql.end();
  }
}
