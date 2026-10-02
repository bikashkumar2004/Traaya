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
  const state = searchParams.get("state")?.trim() || "";
  const district = searchParams.get("district")?.trim() || "";
  const block = searchParams.get("block")?.trim() || "";

  const sql = postgres(dbUrl, { max: 3 });

  try {
    // 1. Fetch registered facilities from profiles
    const registered = await sql`
      SELECT 
        p.id,
        p.user_id,
        p.full_name AS facility_name,
        p.role,
        p.state,
        p.district,
        p.block,
        p.city,
        p.address_line1,
        fp.department,
        fp.hpr_id
      FROM public.profiles p
      LEFT JOIN public.facility_profiles fp ON fp.profile_id = p.id OR fp.id = p.id
      WHERE p.role IN ('facility', 'medical')
      ORDER BY p.full_name ASC
    `;

    return NextResponse.json({
      success: true,
      facilities: registered,
    });
  } catch (err: any) {
    console.error("Error in GET /api/facilities:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    await sql.end();
  }
}
