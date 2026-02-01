import os
import hashlib
from typing import Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "pdfs")

# Use anon client only to validate tokens / fetch user identity
supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
# Use service role client for storage + DB writes (bypasses RLS)
supabase_service: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app = FastAPI(title="Capstone Backend")

# If your frontend is on Vercel, allow it (you can tighten later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://capstone-project-teal-delta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _get_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    return parts[1].strip()

def get_authed_user_id(authorization: Optional[str]) -> str:
    """
    Validates the user's access token against Supabase Auth and returns auth user id (uuid string).
    """
    token = _get_bearer_token(authorization)
    try:
        user_resp = supabase_anon.auth.get_user(token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token validation failed: {e}")

    user = getattr(user_resp, "user", None)
    if not user or not getattr(user, "id", None):
        raise HTTPException(status_code=401, detail="Invalid token (no user)")
    return user.id  # uuid string


# -------------------------
# DEV ONLY: token helper
# -------------------------
class LoginBody(BaseModel):
    email: str
    password: str

@app.post("/dev/login")
def dev_login(body: LoginBody):
    """
    DEV ONLY: returns an access token for testing backend endpoints without a frontend.
    REMOVE before deployment.
    """
    try:
        res = supabase_anon.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login failed: {e}")

    session = getattr(res, "session", None)
    user = getattr(res, "user", None)

    if not session or not getattr(session, "access_token", None) or not user:
        raise HTTPException(status_code=401, detail="Login failed (no session)")

    return {"access_token": session.access_token, "user_id": user.id}


# -------------------------
# Routes
# -------------------------
@app.get("/health")
def health():
    return {"ok": True}

@app.get("/me")
def me(authorization: Optional[str] = Header(default=None)):
    user_id = get_authed_user_id(authorization)
    return {"user_id": user_id}

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(default=None),
):
    """
    Upload a PDF, deduplicate by sha256, create documents row if needed,
    and link it to the user in user_library.
    """
    user_id = get_authed_user_id(authorization)

    # Basic validation
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail=f"Expected PDF, got {file.content_type}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    sha256 = hashlib.sha256(contents).hexdigest()
    original_filename = file.filename or "upload.pdf"
    file_size = len(contents)

    # 1) Dedup: check if a document already exists with this hash
    existing = (
        supabase_service
        .table("documents")
        .select("id, sha256, original_filename, storage_bucket, storage_path, status, created_at")
        .eq("sha256", sha256)
        .maybe_single()
        .execute()
    )

    if existing.data:
        document = existing.data
        document_id = document["id"]
    else:
        # 2) Create a new document row (we’ll upload to storage using doc_id)
        document_id = str(uuid4())
        storage_path = f"user-uploads/{user_id}/{document_id}.pdf"

        insert_doc = (
            supabase_service
            .table("documents")
            .insert({
                "id": document_id,
                "sha256": sha256,
                "original_filename": original_filename,
                "storage_bucket": BUCKET,
                "storage_path": storage_path,
                "mime_type": "application/pdf",
                "file_size_bytes": file_size,
                "status": "uploaded",
            })
            .execute()
        )

        if not insert_doc.data:
            raise HTTPException(status_code=500, detail="Failed to insert documents row")

        # 3) Upload file bytes to storage
        try:
            supabase_service.storage.from_(BUCKET).upload(
                path=storage_path,
                file=contents,
                file_options={
                    "content-type": "application/pdf",
                    "upsert": True,  # safe if retried
                },
            )
        except Exception as e:
            # If storage upload fails, mark document failed
            supabase_service.table("documents").update({"status": "failed"}).eq("id", document_id).execute()
            raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

        document = insert_doc.data[0]

    # 4) Link user -> document in user_library (ignore if already exists)
    link = (
        supabase_service
        .table("user_library")
        .upsert(
            {"user_id": user_id, "document_id": document_id},
            on_conflict="user_id,document_id",
        )
        .execute()
    )

    if link.data is None:
        raise HTTPException(status_code=500, detail="Failed to link document to user")

    return {"document": document, "linked": True}

@app.get("/library")
def get_library(authorization: Optional[str] = Header(default=None)):
    """
    Returns documents the user has access to (via user_library).
    Uses service client, but still filters by the authenticated user's id.
    """
    user_id = get_authed_user_id(authorization)

    res = (
        supabase_service
        .table("user_library")
        .select("added_at, pinned, title, documents(*)")
        .eq("user_id", user_id)
        .execute()
    )

    return {"items": res.data or []}
