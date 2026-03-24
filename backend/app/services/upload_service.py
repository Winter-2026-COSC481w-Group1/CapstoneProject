import tiktoken
import os
import hashlib
import io
from uuid import uuid4

from fastapi import HTTPException, UploadFile
import fitz
from pptx import Presentation
from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService
from app.tasks import process_document

from supabase import Client

BUCKET = "pdfs"  # Define the storage bucket name

# Supported formats mapping: MIME type -> extension
SUPPORTED_FORMATS = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
}


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
        # 1) Determine file extension from MIME type or filename
        file_ext = SUPPORTED_FORMATS.get(file.content_type)
        if not file_ext:
            # Fallback to filename extension (useful for generic MIME types like octet-stream)
            name_ext = os.path.splitext(file.filename or "")[1].lower()
            if name_ext in SUPPORTED_FORMATS.values():
                file_ext = name_ext
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file.content_type}. Please upload PDF or PPTX.",
                )

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        # Check file size limit (50MB)
        MAX_FILE_SIZE = 50 * 1024 * 1024
        file_size = len(contents)
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File size exceeds 50MB limit. File size: {len(contents) / (1024 * 1024):.2f}MB",
            )

        page_count = 0
        full_text = ""

        try:
            if file_ext == ".pdf":
                with fitz.open(stream=contents, filetype="pdf") as doc:
                    page_count = len(doc)
                    for page_num in range(page_count):
                        page = doc.load_page(page_num)
                        full_text += page.get_text("text") + "\n"
            elif file_ext == ".pptx":
                prs = Presentation(io.BytesIO(contents))
                page_count = len(prs.slides)
                for slide in prs.slides:
                    for shape in slide.shapes:
                        if hasattr(shape, "text"):
                            full_text += shape.text + " "
                    full_text += "\n"
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Failed to parse {file_ext} content: {str(e)}"
            )

        encoding = tiktoken.get_encoding("cl100k_base")
        token_count = len(encoding.encode(full_text))

        # Check limits
        MAX_PAGES = int(os.getenv("MAX_PDF_PAGES", "2000"))
        if page_count > MAX_PAGES:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {MAX_PAGES}-page limit. It has {page_count} pages.",
            )

        MAX_DOCUMENT_TOKENS = int(os.getenv("MAX_DOCUMENT_TOKENS", "1000000"))
        if token_count > MAX_DOCUMENT_TOKENS:
            raise HTTPException(
                status_code=413,
                detail=f"File exceeds the {MAX_DOCUMENT_TOKENS}-token limit. It contains {token_count} tokens.",
            )

        sha256 = hashlib.sha256(contents).hexdigest()
        file_name = file.filename or f"upload{file_ext}"

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
            document_id = str(uuid4())
            storage_path = f"{document_id}{file_ext}/"

            insert_doc_data = {
                "id": document_id,
                "file_hash": sha256,
                "file_name": file_name,
                "file_path": storage_path,
                "file_size": file_size,
                "page_count": page_count,
                "token_count": token_count,
                "status": "pending",
            }

            insert_doc = self.db.table("documents").insert(insert_doc_data).execute()

            if not insert_doc.data:
                raise HTTPException(
                    status_code=500, detail="Failed to insert document row"
                )

            try:
                # Get correct MIME type for storage upload from our mapping
                content_type = file.content_type
                if content_type not in SUPPORTED_FORMATS:
                    # If we fell back to extension, find the corresponding MIME type
                    content_type = next(
                        k for k, v in SUPPORTED_FORMATS.items() if v == file_ext
                    )

                res = self.db.storage.from_(BUCKET).upload(
                    path=storage_path,
                    file=contents,
                    file_options={
                        "content-type": content_type,
                        "x-upsert": "true",
                    },
                )

                if hasattr(res, "error") and res.error is not None:
                    raise Exception(f"Supabase Storage Error: {res.error}")

            except Exception as e:
                self.db.table("documents").update({"status": "failed"}).eq(
                    "id", document_id
                ).execute()
                raise HTTPException(
                    status_code=500, detail=f"Storage upload failed: {e}"
                )

            document = insert_doc.data[0]
            message = "Upload successful."

        # Link user -> document
        self.db.table("user_library").upsert(
            {"user_id": user_id, "document_id": document_id},
            on_conflict="user_id,document_id",
        ).execute()

        # Enqueue background task
        if document.get("status") not in ["ready", "processing", "indexing"]:
            await process_document(
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
