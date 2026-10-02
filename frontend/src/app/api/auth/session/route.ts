import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;
    const roleCookie = cookieStore.get("triage_role")?.value;
    const userIdCookie = cookieStore.get("triage_user_id")?.value;

    if (refreshToken) {
      try {
        const parts = refreshToken.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
          if (payload && payload.user) {
            return NextResponse.json({
              authenticated: true,
              user: payload.user,
            });
          }
        }
      } catch {
        // Fall through
      }
    }

    const userDisplayCookie = cookieStore.get("triage_user_display")?.value;
    if (userDisplayCookie) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userDisplayCookie));
        if (parsed && (parsed.id || parsed.userId)) {
          return NextResponse.json({
            authenticated: true,
            user: parsed,
          });
        }
      } catch {
        // Fall through
      }
    }

    if (roleCookie && userIdCookie) {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: userIdCookie,
          userId: userIdCookie,
          role: roleCookie,
          patientUhid: userIdCookie,
          fullName: "",
        },
      });
    }

    return NextResponse.json({ authenticated: false, user: null });
  } catch (err: any) {
    return NextResponse.json(
      { authenticated: false, error: err?.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
