import { NextResponse } from "next/server";
import postgres from "postgres";

function normalizeDependents(raw: any): any[] {
  let list: any[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {}
  }

  return list.map((item, idx) => ({
    id: item.id || `dep-${idx + 1}`,
    fullName: item.fullName || item.full_name || item.name || "Family Member",
    relation: item.relation || item.relationship || "Dependent",
    age: item.age ? Number(item.age) : undefined,
    gender: item.gender || "",
    phone: item.phone || "",
    patientUhid: item.patientUhid || item.patient_uhid || item.uhid || `PAT-${1000 + idx}`,
  }));
}

export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL not configured.", dependents: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id") || searchParams.get("user_id") || searchParams.get("id");

  if (!patientId) {
    return NextResponse.json({
      success: true,
      dependents: [],
      count: 0,
    });
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    let profileUuid = patientId;

    // If patientId is not a UUID, find profile UUID from profiles table
    if (!/^[0-9a-fA-F-]{36}$/.test(patientId)) {
      const [profRow] = await sql`
        SELECT id FROM public.profiles 
        WHERE user_id = ${patientId}::text OR email = ${patientId}::text
        LIMIT 1
      `;
      if (profRow?.id) {
        profileUuid = profRow.id;
      } else {
        return NextResponse.json({
          success: true,
          dependents: [],
          count: 0,
        });
      }
    }

    // Query from patient_profiles (or patient_profile view)
    const [row] = await sql`
      SELECT dependent, dependents 
      FROM public.patient_profiles
      WHERE profile_id = ${profileUuid}::uuid OR id = ${profileUuid}::uuid
      LIMIT 1
    `;

    const rawList = row?.dependents || row?.dependent || [];
    const normalized = normalizeDependents(rawList);

    return NextResponse.json({
      success: true,
      dependents: normalized,
      count: normalized.length,
    });
  } catch (err: any) {
    console.error("Error in GET /api/patient/dependents:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch dependents.", dependents: [] },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export async function POST(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL not configured." },
      { status: 500 }
    );
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    const body = await req.json();
    const patientId = body.patient_id || body.user_id || body.profile_id;
    const singleDep = body.dependent;
    const bulkDeps = body.dependents;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patient_id." },
        { status: 400 }
      );
    }

    let profileUuid = patientId;
    if (!/^[0-9a-fA-F-]{36}$/.test(patientId)) {
      const [profRow] = await sql`
        SELECT id FROM public.profiles 
        WHERE user_id = ${patientId}::text OR email = ${patientId}::text
        LIMIT 1
      `;
      if (profRow?.id) {
        profileUuid = profRow.id;
      } else {
        return NextResponse.json(
          { success: false, error: "Profile not found." },
          { status: 404 }
        );
      }
    }

    // Read current dependents
    const [existing] = await sql`
      SELECT id, profile_id, dependent, dependents 
      FROM public.patient_profiles 
      WHERE profile_id = ${profileUuid}::uuid OR id = ${profileUuid}::uuid
      LIMIT 1
    `;

    let currentList = normalizeDependents(existing?.dependents || existing?.dependent || []);

    if (Array.isArray(bulkDeps)) {
      currentList = normalizeDependents(bulkDeps);
    } else if (singleDep) {
      const cleanSingle = {
        id: singleDep.id || `dep-${Date.now()}`,
        fullName: singleDep.fullName || singleDep.name || "Family Member",
        relation: singleDep.relation || singleDep.relationship || "Dependent",
        age: singleDep.age ? Number(singleDep.age) : undefined,
        gender: singleDep.gender || "",
        phone: singleDep.phone || "",
        patientUhid: singleDep.patientUhid || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      // Check if duplicate id, replace or append
      const existingIdx = currentList.findIndex((d) => d.id === cleanSingle.id);
      if (existingIdx >= 0) {
        currentList[existingIdx] = cleanSingle;
      } else {
        currentList.push(cleanSingle);
      }
    }

    const jsonString = JSON.stringify(currentList);

    if (existing?.id) {
      await sql`
        UPDATE public.patient_profiles 
        SET 
          dependents = ${jsonString}::jsonb,
          dependent = ${jsonString}::jsonb,
          updated_at = NOW()
        WHERE id = ${existing.id}::uuid
      `;
    } else {
      await sql`
        INSERT INTO public.patient_profiles (profile_id, dependents, dependent)
        VALUES (${profileUuid}::uuid, ${jsonString}::jsonb, ${jsonString}::jsonb)
        ON CONFLICT (profile_id) 
        DO UPDATE SET 
          dependents = ${jsonString}::jsonb,
          dependent = ${jsonString}::jsonb,
          updated_at = NOW()
      `;
    }

    return NextResponse.json({
      success: true,
      dependents: currentList,
      count: currentList.length,
    });
  } catch (err: any) {
    console.error("Error in POST /api/patient/dependents:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update dependents." },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}

export async function DELETE(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patient_id") || searchParams.get("user_id");
  const dependentId = searchParams.get("dependent_id") || searchParams.get("id");

  if (!patientId || !dependentId) {
    return NextResponse.json(
      { success: false, error: "Missing patient_id or dependent_id." },
      { status: 400 }
    );
  }

  const sql = postgres(dbUrl, { max: 3 });

  try {
    let profileUuid = patientId;
    if (!/^[0-9a-fA-F-]{36}$/.test(patientId)) {
      const [profRow] = await sql`
        SELECT id FROM public.profiles 
        WHERE user_id = ${patientId}::text OR email = ${patientId}::text
        LIMIT 1
      `;
      if (profRow?.id) {
        profileUuid = profRow.id;
      } else {
        return NextResponse.json(
          { success: false, error: "Profile not found." },
          { status: 404 }
        );
      }
    }

    const [existing] = await sql`
      SELECT id, dependents, dependent 
      FROM public.patient_profiles 
      WHERE profile_id = ${profileUuid}::uuid OR id = ${profileUuid}::uuid
      LIMIT 1
    `;

    if (!existing) {
      return NextResponse.json({ success: true, dependents: [], count: 0 });
    }

    const currentList = normalizeDependents(existing.dependents || existing.dependent || []);
    const updated = currentList.filter((d) => d.id !== dependentId);
    const jsonString = JSON.stringify(updated);

    await sql`
      UPDATE public.patient_profiles 
      SET 
        dependents = ${jsonString}::jsonb,
        dependent = ${jsonString}::jsonb,
        updated_at = NOW()
      WHERE id = ${existing.id}::uuid
    `;

    return NextResponse.json({
      success: true,
      dependents: updated,
      count: updated.length,
    });
  } catch (err: any) {
    console.error("Error in DELETE /api/patient/dependents:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to remove dependent." },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
