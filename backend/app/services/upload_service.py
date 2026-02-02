import hashlib
from uuid import uuid4

from fastapi import BackgroundTasks, HTTPException, UploadFile
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
        background_tasks: BackgroundTasks,
    ):
        # 1) Basic validation
        if file.content_type not in ("application/pdf", "application/octet-stream"):
            raise HTTPException(
                status_code=400, detail=f"Expected PDF, got {file.content_type}"
            )

        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")

        sha256 = hashlib.sha256(contents).hexdigest()
        filename = file.filename or "upload.pdf"

        existing = (
            self.db.table("documents")
            .select("*")
            .eq("file_hash", sha256)
            .maybe_single()
            .execute()
        )

        document = None
        if existing and existing.data:
            document = existing.data
            document_id = document["id"]
        else:
            # 3) Create a new document row
            document_id = str(uuid4())
            storage_path = f"user-uploads/{user_id}/{document_id}.pdf"

            insert_doc_data = {
                "id": document_id,
                "file_hash": sha256,
                "filename": filename,
                "file_path": storage_path,
                "status": "uploaded",
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

        # mark as pending before adding it to the task queue of processing
        self.db.table("documents").update({"status": "pending"}).eq(
            "id", document_id
        ).execute()

        # 6) Enqueue background task for further processing (e.g., chunking, embedding)
        # The background task will update the document status to 'processing' and then 'completed'/'failed'
        background_tasks.add_task(
            process_pdf_in_background,
            document_id,
            sha256,
            document["file_path"],
            user_id,
            self.db,
            self.vector_service,
            self.embedding_service,
        )

        return {
            "document": {**document, "status": "pending"},
            "status": "processing_started",
            "message": "File uploaded successfully. Embedding task running in the background.",
            "linked": True,
        }
