import { NextResponse } from "next/server";
import postgres from "postgres";

export async function GET(req: Request) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { success: false, error: "Database URL is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("query") || searchParams.get("search") || "").trim();

  const sql = postgres(dbUrl, { max: 3 });

  try {
    // 1. Fetch all registered facilities from profiles
    const rows = await sql`
      SELECT 
        p.id,
        p.user_id,
        p.full_name AS facility_name,
        p.role,
        p.city,
        p.district,
        p.state,
        p.address_line1,
        fp.department,
        fp.hpr_id
      FROM public.profiles p
      LEFT JOIN public.facility_profiles fp ON fp.profile_id = p.id OR fp.id = p.id
      WHERE p.role IN ('facility', 'medical')
      ORDER BY p.full_name ASC
    `;

    if (!query) {
      return NextResponse.json({
        success: true,
        facilities: rows,
        verified: false,
        facility: null
      });
    }

    const cleanQuery = query.toLowerCase();

    // Check exact or partial match
    // 1. Exact match by user_id (e.g. "FAC-357")
    // 2. Exact match by UUID
    // 3. Exact match by full_name
    // 4. StartsWith or ILIKE match
    let matchedFacility = rows.find(
      (r) =>
        (r.user_id && r.user_id.toLowerCase() === cleanQuery) ||
        (r.id && r.id.toLowerCase() === cleanQuery) ||
        (r.facility_name && r.facility_name.toLowerCase() === cleanQuery)
    );

    if (!matchedFacility) {
      matchedFacility = rows.find(
        (r) =>
          r.facility_name &&
          (r.facility_name.toLowerCase().includes(cleanQuery) ||
           cleanQuery.includes(r.facility_name.toLowerCase()))
      );
    }

    const filtered = rows.filter(
      (r) =>
        (r.user_id && r.user_id.toLowerCase().includes(cleanQuery)) ||
        (r.facility_name && r.facility_name.toLowerCase().includes(cleanQuery)) ||
        (r.city && r.city.toLowerCase().includes(cleanQuery)) ||
        (r.district && r.district.toLowerCase().includes(cleanQuery))
    );

    return NextResponse.json({
      success: true,
      verified: Boolean(matchedFacility),
      facility: matchedFacility || null,
      facilities: filtered.length > 0 ? filtered : rows
    });
  } catch (error: any) {
    console.error("Error in GET /api/admin/facilities:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify facility." },
      { status: 500 }
    );
  } finally {
    await sql.end();
  }
}
