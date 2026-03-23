import tiktoken
import os
import hashlib
from uuid import uuid4

from fastapi import BackgroundTasks, HTTPException, UploadFile
import fitz
import tiktoken
from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService
from app.tasks import process_pdf_in_background

from supabase import Client

BUCKET = "pdfs"  # Define the storage bucket name


class UploadService:
    def __init__(
        self,
        vector_service: VectorDBService,
        db_client: Client,
        embedding_service: EmbeddingService,
    ):
        self.vector_service = vector_service
        self.db = db_client
        self.embedding_service = embedding_service

    async def execute(
        self,
        file: UploadFile,
        user_id: str,
    ):
        # 1) Basic validation
        if file.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(
                status_code=400, detail=f"Expected PDF, got {file.content_type}"
            )

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        # Check file size limit (50MB)
        MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
        file_size = len(contents)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds 50MB limit. File size: {len(contents) / (1024 * 1024):.2f}MB",
            )

        with fitz.open(stream=contents, filetype="pdf") as doc:
            page_count = len(doc)
            
            full_text = ""
            for page_num in range(page_count):
                page = doc.load_page(page_num)
                full_text += page.get_text("text") + "\n"

            encoding = tiktoken.get_encoding("cl100k_base")
            token_count = len(encoding.encode(full_text))

        # Check page count limit
        MAX_PAGES = int(os.getenv("MAX_PDF_PAGES", "2000"))
        if page_count > MAX_PAGES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {MAX_PAGES}-page limit. It has {page_count} pages.",
            )

        # Check token count limit
        MAX_DOCUMENT_TOKENS = int(os.getenv("MAX_DOCUMENT_TOKENS", "1000000"))
        if token_count > MAX_DOCUMENT_TOKENS:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {MAX_DOCUMENT_TOKENS}-token limit. It contains {token_count} tokens.",
            )

        sha256 = hashlib.sha256(contents).hexdigest()
        file_name = file.filename or "upload.pdf"

        existing = (
            self.db.table("documents")
            .select("*")
            .eq("file_hash", sha256)
            .maybe_single()
            .execute()
        )

        document = None
        message = ""
        if existing and existing.data:
            document = existing.data
            document_id = document["id"]
            message = "Document already exists."
        else:
            # 3) Create a new document row
            document_id = str(uuid4())
            storage_path = f"user-uploads/{user_id}/{document_id}.pdf"

            insert_doc_data = {
                "id": document_id,
                "file_hash": sha256,
                "file_name": file_name,
                "file_path": storage_path,
                "file_size": file_size,
                "page_count": page_count,
                "token_count": token_count, # Add token_count here
                "status": "pending",
            }

            insert_doc = self.db.table("documents").insert(insert_doc_data).execute()

            if not insert_doc.data:
                raise HTTPException(
                    status_code=500, detail="Failed to insert documents row"
                )

            # 4) Upload file bytes to storage
            try:
                # Use a clean dictionary. If 'upsert' fails, use just content-type.
                res = self.db.storage.from_(BUCKET).upload(
                    path=storage_path,
                    file=contents,
                    file_options={
                        "content-type": "application/pdf",
                        "x-upsert": "true",
                    },
                )

                # Check if 'res' contains an error (Supabase-py quirk)
                if hasattr(res, "error") and res.error is not None:
                    raise Exception(f"Supabase Storage Error: {res.error}")

                print(f"Successfully uploaded to: {storage_path}")

            except Exception as e:
                print(f"UPLOAD CRASHED: {e}")
                self.db.table("documents").update({"status": "failed"}).eq(
                    "id", document_id
                ).execute()
                raise HTTPException(
                    status_code=500, detail=f"Storage upload failed: {e}"
                )

            document = insert_doc.data[0]
            message = "Upload successful."

        # 5) Link user -> document in user_library (ignore if already exists)
        link = (
            self.db.table("user_library")
            .upsert(
                {"user_id": user_id, "document_id": document_id},
                on_conflict="user_id,document_id",
            )
            .execute()
        )

        if link.data is None:
            raise HTTPException(
                status_code=500, detail="Failed to link document to user"
            )

        # 6) Enqueue background task for further processing (e.g., chunking, embedding)
        # only process/index if the document isn't already 'ready' OR 'processing' or 'indexing'
        if document.get("status") not in ["ready", "processing", "indexing"]:
            await process_pdf_in_background(
                document_id,
                sha256,
                document["file_path"],
                user_id,
                self.db,
                self.vector_service,
                self.embedding_service,
            )

        return {
            "document": {
                "id": document["id"],
                "name": document["file_name"],
                "status": document["status"],
                "size": document["file_size"],
                "pageCount": document["page_count"],
                "uploadedAt": document.get("created_at"),
            },
            "message": message,
        }
