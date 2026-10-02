import { NextResponse } from "next/server";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully. HttpOnly refresh token cleared.",
  });

  const cookieOptions = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  };

  response.cookies.set("refresh_token", "", cookieOptions);
  response.cookies.set("triage_auth_token", "", cookieOptions);
  response.cookies.set("triage_auth_session", "", cookieOptions);
  response.cookies.set("triage_role", "", { ...cookieOptions, httpOnly: false });
  response.cookies.set("triage_user_id", "", { ...cookieOptions, httpOnly: false });
  response.cookies.set("triage_user_display", "", { ...cookieOptions, httpOnly: false });

  return response;
}
