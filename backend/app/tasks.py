from supabase import Client
from app.services.vector_db_service import VectorDBService
from app.services.embedding_service import EmbeddingService
from app.utils.pdf_processor import pdf_process_to_chunks


async def process_pdf_in_background(
    document_id: str,
    file_hash: str,
    file_path: str,
    user_id: str,
    db_client: Client,
    vector_service: VectorDBService,
    embedding_service: EmbeddingService,
):
    print(f"Starting background processing for document: {document_id}")
    try:
        # 1. Update document status to 'processing'
        db_client.table("documents").update({"status": "processing"}).eq(
            "id", document_id
        ).execute()

        # 2. Fetch the file from Supabase Storage
        storage_path = f"user-uploads/{user_id}/{document_id}.pdf"

        file_bytes = db_client.storage.from_("pdfs").download(storage_path)

        # 3. Process PDF to chunks
        chunks = pdf_process_to_chunks(file_bytes, file_hash)
        all_texts = [chunk["text"] for chunk in chunks]
        batch_size = 128
        all_embeddings = []

        print(f"Total chunks to process for doc {document_id}: {len(all_texts)}")

        for i in range(0, len(all_texts), batch_size):
            batch = all_texts[i : i + batch_size]
            print(
                f"Processing batch {i // batch_size + 1} for doc {document_id} ({len(batch)} chunks)..."
            )
            batch_embeddings = embedding_service.create_embeddings(batch)
            all_embeddings.extend(batch_embeddings)

        print(
            f"Successfully generated {len(all_embeddings)} total vectors for doc {document_id}."
        )

        # 4. Upsert chunks and their embeddings into the vector DB
        await vector_service.upsert_chunks(
            chunks=chunks,
            embeddings=all_embeddings,
            file_hash=file_hash,
            user_id=user_id,
        )

        # 5. Update document status to 'completed'
        db_client.table("documents").update({"status": "completed"}).eq(
            "id", document_id
        ).execute()
        print(f"Background processing completed for document: {document_id}")

    except Exception as e:
        print(f"Background processing failed for document {document_id}: {e}")
        # Update document status to 'failed' on error
        db_client.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).execute()
