import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id");

  if (!patientId || !/^[0-9a-fA-F-]{36}$/.test(patientId)) {
    return NextResponse.json({
      success: true,
      reminders: [],
      count: 0,
    });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    // Only return real, existing reminders stored in database for this patient
    const reminders = await sql`
      SELECT * FROM public.patient_reminders
      WHERE patient_id = ${patientId}::uuid
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      reminders: reminders || [],
      count: reminders.length,
    });
  } catch (err: any) {
    console.error("Error in GET /api/patient/reminders:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch reminders.", reminders: [] },
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
      type,
      title,
      description,
      dosage,
      frequency,
      scheduled_time,
      due_date,
      metadata,
    } = body;

    if (!patient_id || !title) {
      return NextResponse.json({ success: false, error: "patient_id and title are required." }, { status: 400 });
    }

    const [saved] = await sql`
      INSERT INTO public.patient_reminders (
        patient_id, ticket_id, type, title, description,
        dosage, frequency, scheduled_time, due_date, is_completed,
        metadata, created_at, updated_at
      ) VALUES (
        ${patient_id}::uuid,
        ${ticket_id ? sql`${ticket_id}::uuid` : null},
        ${type || "medication"}::text,
        ${title}::text,
        ${description || null}::text,
        ${dosage || null}::text,
        ${frequency || "Daily"}::text,
        ${scheduled_time || "08:00 AM"}::text,
        ${due_date ? sql`${due_date}::timestamptz` : null},
        false,
        ${JSON.stringify(metadata || {})}::jsonb,
        now(),
        now()
      )
      RETURNING *
    `;

    return NextResponse.json({ success: true, reminder: saved });
  } catch (err: any) {
    console.error("Error in POST /api/patient/reminders:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to save reminder." }, { status: 500 });
  } finally {
    await sql.end();
  }
}

export async function PATCH(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "Database not configured." }, { status: 500 });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    const body = await req.json();
    const { id, is_completed } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Reminder id required." }, { status: 400 });
    }

    const [updated] = await sql`
      UPDATE public.patient_reminders
      SET
        is_completed = ${Boolean(is_completed)},
        last_completed_at = ${is_completed ? sql`now()` : null},
        updated_at = now()
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    return NextResponse.json({ success: true, reminder: updated });
  } catch (err: any) {
    console.error("Error in PATCH /api/patient/reminders:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to update reminder." }, { status: 500 });
  } finally {
    await sql.end();
  }
}

export async function DELETE(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({ success: false, error: "Database not configured." }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Reminder id required." }, { status: 400 });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    await sql`
      DELETE FROM public.patient_reminders
      WHERE id = ${id}::uuid
    `;

    return NextResponse.json({ success: true, message: "Reminder deleted successfully." });
  } catch (err: any) {
    console.error("Error in DELETE /api/patient/reminders:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to delete reminder." }, { status: 500 });
  } finally {
    await sql.end();
  }
}
