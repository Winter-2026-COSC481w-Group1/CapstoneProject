from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService
from app.utils.hash import generate_file_hash
from app.utils.pdf_processor import pdf_process_to_chunks

from supabase import Client


class UploadService:
    def __init__(
        self,
        vector_service: VectorDBService,
        db_client: Client,
        embedding_service: EmbeddingService,
    ):
        self.vector_service = vector_service
        self.db = db_client

    async def execute(
        self, file_bytes: bytes, filename: str, user_id: str, content_type: str
    ):
        file_hash = generate_file_hash(file_bytes)
        file_path = f"uploads/{file_hash}.pdf"

        try:
            # We don't even need to list them; just try to create it.
            # If it exists, Supabase returns an error we can ignore.
            self.db.storage.create_bucket("pdfs", options={"public": True})
            print("✅ Bucket 'pdfs' verified/created.")
        except Exception:
            pass  # bucket likely already exists

        try:
            self.db.storage.from_("pdfs").upload(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": content_type, "x-upsert": "true"},
            )
        except Exception as e:
            if "409" not in str(e):
                print(f"Storage upload warning (likely exists): {e}")

        # insert into db
        doc_response = (
            self.db.table("documents")
            .insert(
                {
                    "file_hash": file_hash,
                    "file_name": filename,
                    "file_path": "test",
                }
            )
            .execute()
        )
        if not doc_response.data:
            raise Exception("Failed to insert document into database.")

        doc_id = doc_response.data[0]["id"]

        # process PDF to chunks containing text and metadata
        chunks = pdf_process_to_chunks(file_bytes, file_hash)
        # extract all texts from the chunks
        all_texts = [chunk["text"] for chunk in chunks]
        batch_size = 128
        all_embeddings = []

        print(f"Total chunks to process: {len(all_texts)}")

        for i in range(0, len(all_texts), batch_size):
            batch = all_texts[i : i + batch_size]
            print(f"Processing batch {i // batch_size + 1} ({len(batch)} chunks)...")

            # send batch to Ollama to embed
            batch_embeddings = self.embedding_service.create_embeddings(batch)

            all_embeddings.extend(batch_embeddings)

        print(f"Successfully generated {len(all_embeddings)} total vectors.")

        # upsert chunks and their embeddings into the vector DB
        await self.vector_service.upsert_chunks(
            chunks=chunks,
            embeddings=all_embeddings,
            file_hash=file_hash,
            user_id=user_id,
        )

        existing_link = (
            self.db.table("user_documents")
            .upsert({"user_id": user_id, "document_id": doc_id})
            .execute()
        )

        if not existing_link.data:
            # Link the user so they "own" a copy in their dashboard
            self.db.table("user_documents").insert(
                {"user_id": user_id, "document_id": doc_id}
            ).execute()

        return {"status": "success", "message": "Document processed", "doc_id": doc_id}
