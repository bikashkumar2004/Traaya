import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ACCESS_TOKEN_LIFETIME = 3600; // 1 hour
const REFRESH_TOKEN_LIFETIME = 7 * 86400; // 7 days
const IS_PRODUCTION = process.env.NODE_ENV === "production";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "No active HttpOnly refresh token found. Please sign in." },
        { status: 401 }
      );
    }

    // Decode token payload
    const parts = refreshToken.split(".");
    if (parts.length < 2) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token format." },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    } catch {
      return NextResponse.json(
        { success: false, error: "Could not decode refresh token." },
        { status: 401 }
      );
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowSeconds) {
      return NextResponse.json(
        { success: false, error: "Refresh token has expired. Please sign in again." },
        { status: 401 }
      );
    }

    const userPayload = payload.user;
    if (!userPayload || !userPayload.id) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh session." },
        { status: 401 }
      );
    }

    const expiresAt = nowSeconds + ACCESS_TOKEN_LIFETIME;

    // Generate new short-lived in-memory access token
    const tokenHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const accessClaims = Buffer.from(JSON.stringify({
      sub: userPayload.id,
      user: userPayload,
      iat: nowSeconds,
      exp: expiresAt,
      typ: "access",
    })).toString("base64url");
    const newAccessToken = `${tokenHeader}.${accessClaims}.sig_${Date.now().toString(36)}`;

    // Rotate refresh token
    const refreshClaims = Buffer.from(JSON.stringify({
      sub: userPayload.id,
      user: userPayload,
      iat: nowSeconds,
      exp: nowSeconds + REFRESH_TOKEN_LIFETIME,
      typ: "refresh",
    })).toString("base64url");
    const newRefreshToken = `${tokenHeader}.${refreshClaims}.sig_rf_${Date.now().toString(36)}`;

    const response = NextResponse.json({
      success: true,
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: ACCESS_TOKEN_LIFETIME,
      expires_at: expiresAt,
      user: userPayload,
    });

    // Re-set rotated refresh_token in HttpOnly cookie
    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    response.cookies.set("triage_role", userPayload.role || "patient", {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    response.cookies.set("triage_user_id", userPayload.id, {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    response.cookies.set("triage_user_display", encodeURIComponent(JSON.stringify(userPayload)), {
      httpOnly: false,
      secure: IS_PRODUCTION,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_LIFETIME,
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Refresh API error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to refresh token." },
      { status: 500 }
    );
  }
}
