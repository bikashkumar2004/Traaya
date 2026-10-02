import os
import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response, Depends, status
from pydantic import BaseModel
import jwt
from config import DATABASE_URL, ENVIRONMENT, CORS_ORIGINS

router = APIRouter(prefix="/api/auth", tags=["Authentication & Security"])

# Security Configurations
JWT_SECRET = os.getenv("JWT_SECRET", "triageassist_secure_jwt_secret_key_2026_super_secure_key_32bytes")
JWT_ALGORITHM = "HS256"

# Token Lifetimes (as specified in standard architecture)
ACCESS_TOKEN_LIFETIME = 3600  # 1 hour (short-lived, stored in-memory)
REFRESH_TOKEN_LIFETIME = 7 * 86400  # 7 days (long-lived, stored in HttpOnly cookie)

# Secure flag: True in HTTPS environments, False on local development
IS_SECURE_COOKIE = os.getenv("SECURE_COOKIES", "false").lower() == "true" or ENVIRONMENT == "production"

# SameSite policy: Lax or Strict to guard against CSRF attacks
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()
if COOKIE_SAMESITE not in ["strict", "lax", "none"]:
    COOKIE_SAMESITE = "lax"

COOKIE_REFRESH_TOKEN = "refresh_token"
COOKIE_ROLE_NAME = "triage_role"
COOKIE_USER_ID_NAME = "triage_user_id"


class LoginRequest(BaseModel):
    id: Optional[str] = None
    userId: Optional[str] = None
    user_id: Optional[str] = None
    patientUhid: Optional[str] = None
    role: str = "patient"
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    fullName: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "Bearer"
    expires_in: int = ACCESS_TOKEN_LIFETIME
    expires_at: int
    user: Dict[str, Any]
    message: Optional[str] = None


def create_token(data: dict, expires_in_seconds: int, token_type: str = "access") -> str:
    """Generate signed JWT token with designated lifetime and token type"""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(seconds=expires_in_seconds)
    to_encode.update({
        "exp": expire,
        "iat": now,
        "typ": token_type
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    """Verify and decode a signed JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if expected_type and payload.get("typ") != expected_type:
            return None
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def set_refresh_cookie(response: Response, refresh_token: str, role: str, user_id: str):
    """
    Sets the refresh_token in an HttpOnly + Secure + SameSite cookie.
    JavaScript cannot read this cookie (mitigating XSS token theft).
    Also sets low-sensitivity non-HttpOnly / server cookies for routing.
    """
    # 1. Long-lived refresh_token in HttpOnly cookie
    response.set_cookie(
        key=COOKIE_REFRESH_TOKEN,
        value=refresh_token,
        httponly=True,  # JS cannot read it (XSS protection)
        secure=IS_SECURE_COOKIE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_LIFETIME,
        path="/",
    )

    # 2. Non-sensitive display / routing cookies
    response.set_cookie(
        key=COOKIE_ROLE_NAME,
        value=role,
        httponly=False,  # Accessible for client display / Next.js middleware
        secure=IS_SECURE_COOKIE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_LIFETIME,
        path="/",
    )
    response.set_cookie(
        key=COOKIE_USER_ID_NAME,
        value=user_id,
        httponly=False,
        secure=IS_SECURE_COOKIE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_LIFETIME,
        path="/",
    )


def clear_auth_cookies(response: Response):
    """Purge refresh_token and auth cookies"""
    for cookie_name in [COOKIE_REFRESH_TOKEN, COOKIE_ROLE_NAME, COOKIE_USER_ID_NAME, "triage_auth_token", "triage_auth_session"]:
        response.delete_cookie(
            key=cookie_name,
            path="/",
            httponly=True if cookie_name in [COOKIE_REFRESH_TOKEN, "triage_auth_token", "triage_auth_session"] else False,
            secure=IS_SECURE_COOKIE,
            samesite=COOKIE_SAMESITE,
        )


async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    FastAPI dependency: verifies in-memory access_token sent via Authorization: Bearer <access_token>.
    Falls back to HttpOnly refresh_token cookie if Authorization header is absent.
    """
    token: Optional[str] = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_token(token, expected_type="access")
        if payload and "user" in payload:
            return payload["user"]

    # Fallback to refresh cookie
    refresh_cookie = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if refresh_cookie:
        payload = verify_token(refresh_cookie, expected_type="refresh")
        if payload and "user" in payload:
            return payload["user"]

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid in-memory access token or active refresh session.",
    )


@router.post("/login", response_model=AuthResponse)
def login(login_req: LoginRequest, response: Response):
    """
    Issue:
    - access_token: short-lived (1 hr) in response body -> stored IN-MEMORY in JS
    - expires_in, expires_at, token_type in response body -> stored IN-MEMORY
    - refresh_token: long-lived (7 days) in HttpOnly + Secure + SameSite cookie
    - user: in response body -> stored IN-MEMORY (with role cookie for route protection)
    """
    clean_email = login_req.email.strip().lower() if login_req.email else None
    clean_phone = login_req.phone.strip() if login_req.phone else None
    role = login_req.role or "patient"

    if login_req.id:
        user_id = login_req.id
    elif login_req.user_id:
        user_id = login_req.user_id
    elif login_req.userId:
        user_id = login_req.userId
    elif login_req.patientUhid:
        user_id = login_req.patientUhid
    elif clean_phone:
        digits = "".join(filter(str.isdigit, clean_phone))
        user_id = f"usr-{digits[-6:] if len(digits) >= 6 else '000001'}"
    elif clean_email:
        user_id = f"usr-{clean_email.split('@')[0][:8]}"
    else:
        user_id = f"usr-{int(datetime.datetime.now().timestamp())}"

    prefix_map = {
        "doctor": "DOC",
        "nurse": "STF",
        "patient": "PAT",
        "admin": "ADM",
        "organization": "ORG",
        "healthcamp": "CMP",
        "facility": "FAC",
        "medical": "MED",
    }
    prefix = prefix_map.get(role, "PAT")
    patient_uhid = f"{prefix}-{user_id[-4:]}"

    display_name = login_req.full_name or (
        clean_email.split('@')[0].replace(".", " ").title() if clean_email
        else f"{role.capitalize()} User"
    )

    user_payload = {
        "id": user_id,
        "userId": patient_uhid,
        "patientUhid": patient_uhid,
        "email": clean_email or f"{user_id}@triageassist.live",
        "fullName": display_name,
        "role": role,
        "phone": clean_phone or "+91 98765 43210",
    }

    now_ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    expires_at = now_ts + ACCESS_TOKEN_LIFETIME

    # 1. Short-lived Access Token (1 hour)
    access_token = create_token(
        {"sub": user_id, "user": user_payload},
        expires_in_seconds=ACCESS_TOKEN_LIFETIME,
        token_type="access"
    )

    # 2. Long-lived Refresh Token (7 days)
    refresh_token = create_token(
        {"sub": user_id, "user": user_payload},
        expires_in_seconds=REFRESH_TOKEN_LIFETIME,
        token_type="refresh"
    )

    # 3. Store refresh_token in HttpOnly cookie (JS cannot access)
    set_refresh_cookie(response, refresh_token, role=role, user_id=user_id)

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "Bearer",
        "expires_in": ACCESS_TOKEN_LIFETIME,
        "expires_at": expires_at,
        "user": user_payload,
        "message": "Authenticated. Store access_token in-memory; refresh_token secured in HttpOnly cookie.",
    }


@router.post("/refresh", response_model=AuthResponse)
def refresh_token_endpoint(request: Request, response: Response):
    """
    Silent token refresh:
    Reads HttpOnly refresh_token cookie and returns a new in-memory access_token.
    """
    refresh_cookie = request.cookies.get(COOKIE_REFRESH_TOKEN)
    if not refresh_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No HttpOnly refresh token present. Please sign in.",
        )

    payload = verify_token(refresh_cookie, expected_type="refresh")
    if not payload or "user" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or invalid. Please sign in again.",
        )

    user_payload = payload["user"]
    user_id = user_payload.get("id") or payload.get("sub")
    role = user_payload.get("role", "patient")

    now_ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
    expires_at = now_ts + ACCESS_TOKEN_LIFETIME

    # Generate new in-memory access_token (1 hour)
    new_access_token = create_token(
        {"sub": user_id, "user": user_payload},
        expires_in_seconds=ACCESS_TOKEN_LIFETIME,
        token_type="access"
    )

    # Rotate refresh token
    new_refresh_token = create_token(
        {"sub": user_id, "user": user_payload},
        expires_in_seconds=REFRESH_TOKEN_LIFETIME,
        token_type="refresh"
    )
    set_refresh_cookie(response, new_refresh_token, role=role, user_id=user_id)

    return {
        "success": True,
        "access_token": new_access_token,
        "token_type": "Bearer",
        "expires_in": ACCESS_TOKEN_LIFETIME,
        "expires_at": expires_at,
        "user": user_payload,
        "message": "Token refreshed. New access_token issued for in-memory storage.",
    }


@router.post("/logout")
def logout(response: Response):
    """
    Sign out: clears HttpOnly refresh_token cookie
    """
    clear_auth_cookies(response)
    return {"success": True, "message": "Logged out successfully. HttpOnly refresh token cleared."}


@router.get("/me")
def get_authenticated_session(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get profile using in-memory access_token Bearer header or refresh cookie
    """
    return {"authenticated": True, "user": user}
