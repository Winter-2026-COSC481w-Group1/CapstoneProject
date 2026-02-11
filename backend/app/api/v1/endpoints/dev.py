from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase import Client

router = APIRouter()


# -------------------------
# DEV ONLY: token helper
# -------------------------
class LoginBody(BaseModel):
    email: str
    password: str


@router.post("/login")
async def dev_login(body: LoginBody, request: Request):
    """
    DEV ONLY: Bypasses Supabase for rapid testing.
    Checks for a 'magic' dev credential or falls back to Supabase.
    """
    # 1. HARDCODED BYPASS: Allow 'admin/admin' for local testing without Supabase
    if body.email == "admin" and body.password == "admin":
        return {
            "access_token": "dev_mock_token_12345",
            "user_id": "00000000-0000-0000-0000-000000000000",  # Mock UUID
            "status": "dev_bypass_active",
        }

    # 2. STANDARD FLOW: Attempt Supabase if not using the bypass
    try:
        supabase_anon = request.app.state.supabase_anon
        res = supabase_anon.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )

        # Supabase Python SDK returns 'AuthResponse' object
        if res.session and res.user:
            return {"access_token": res.session.access_token, "user_id": res.user.id}

    except Exception as e:
        # Better logging for your team to see what's actually failing
        print(f"Supabase Connection Error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Login failed: Invalid credentials or Supabase unreachable.",
        )

    raise HTTPException(status_code=401, detail="Login failed (no session)")
