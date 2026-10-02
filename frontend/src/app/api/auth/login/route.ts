import { NextResponse } from "next/server";

const ACCESS_TOKEN_LIFETIME = 3600; // 1 hour (short-lived)
const REFRESH_TOKEN_LIFETIME = 7 * 86400; // 7 days (long-lived)
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, email, fullName, role, phone, patientUhid } = body;

    const resolvedRole = role || "patient";
    const resolvedId = id || userId || patientUhid || `usr-${Date.now().toString().slice(-6)}`;
    const resolvedUserId = userId || patientUhid || id || resolvedId;
    const resolvedEmail = email || "";
    const resolvedName = fullName || `${resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1)} User`;
    const resolvedUhid = patientUhid || resolvedUserId;

    const userPayload = {
      id: resolvedId,
      userId: resolvedUserId,
      email: resolvedEmail,
      fullName: resolvedName,
      role: resolvedRole,
      phone: phone || "",
      patientUhid: resolvedUhid,
      facilityId: body.facilityId || "",
      facilityName: body.facilityName || "",
      gender: body.gender || "",
      age: body.age || "",
      bloodGroup: body.bloodGroup || "",
      dateOfBirth: body.dateOfBirth || "",
      addressLine1: body.addressLine1 || "",
      state: body.state || "",
      district: body.district || "",
      city: body.city || "",
      block: body.block || "",
      postalCode: body.postalCode || "",
    };

    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiresAt = nowSeconds + ACCESS_TOKEN_LIFETIME;

    // Simulate standard signed token (header.payload.signature)
    const tokenHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const accessClaims = Buffer.from(JSON.stringify({
      sub: resolvedUserId,
      user: userPayload,
      iat: nowSeconds,
      exp: expiresAt,
      typ: "access",
    })).toString("base64url");
    const accessToken = `${tokenHeader}.${accessClaims}.sig_${Date.now().toString(36)}`;

    // Generate sensitive long-lived refresh token
    const refreshClaims = Buffer.from(JSON.stringify({
      sub: resolvedUserId,
      user: userPayload,
      iat: nowSeconds,
      exp: nowSeconds + REFRESH_TOKEN_LIFETIME,
      typ: "refresh",
    })).toString("base64url");
    const refreshToken = `${tokenHeader}.${refreshClaims}.sig_rf_${Date.now().toString(36)}`;

    // Response body:
    // - access_token: short-lived (1 hr) -> stored IN-MEMORY in JS
    // - expires_at, expires_in, token_type -> stored IN-MEMORY alongside access token
    // - user -> stored IN-MEMORY / non-HttpOnly display
    const response = NextResponse.json({
      success: true,
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_LIFETIME,
      expires_at: expiresAt,
      user: userPayload,
      message: "Authenticated. Store access_token in-memory; refresh_token secured in HttpOnly cookie.",
    });

    // 1. refresh_token -> Stored in HttpOnly + Secure + SameSite cookie (set by server)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true, // Prevents JS/XSS from reading the cookie
      secure: IS_PRODUCTION, // Transmitted only over HTTPS in production
      sameSite: "lax", // Mitigates CSRF attacks
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    // 2. user role and id -> Non-HttpOnly / server cookies for routing & display metadata
    response.cookies.set("triage_role", resolvedRole, {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    response.cookies.set("triage_user_id", resolvedId, {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    // 3. Low-sensitivity user display cookie -> enables SSR to render real name/UHID immediately without flicker
    response.cookies.set("triage_user_display", encodeURIComponent(JSON.stringify(userPayload)), {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to authenticate." },
      { status: 500 }
    );
  }
}
