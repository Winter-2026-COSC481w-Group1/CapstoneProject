import logging
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
        # update document status to 'processing'
        db_client.table("documents").update({"status": "processing"}).eq(
            "id", document_id
        ).execute()

        # fetch the file from Supabase Storage
        storage_path = f"user-uploads/{user_id}/{document_id}.pdf"

        file_bytes = db_client.storage.from_("pdfs").download(storage_path)

        # process PDF to chunks
        chunks = pdf_process_to_chunks(file_bytes, file_hash)

        batch_size = 20
        total_chunks = len(chunks)
        total_indexed = 0

        print(f"Total chunks to index for doc {document_id}: {total_chunks}")
        db_client.table("documents").update({"status": "indexing"}).eq(
            "id", document_id
        ).execute()

        for i in range(0, total_chunks, batch_size):
            batch = chunks[i : i + batch_size]
            batch_texts = [chunk["text"] for chunk in chunks]
            print(
                f"Indexing batch {i // batch_size + 1} for doc {document_id} ({len(batch)} chunks)..."
            )
            embeddings = await embedding_service.create_embeddings(batch_texts)
            await vector_service.upsert_chunks(
                chunks=chunks,
                embeddings=embeddings,
                file_hash=file_hash,
                user_id=user_id,
                document_id=document_id,
            )
            total_indexed += len(embeddings)

        print(
            f"Successfully embedded and upserted {total_indexed} vectors for doc {document_id}."
        )

        # 5. Update document status to 'completed'
        db_client.table("documents").update({"status": "ready"}).eq(
            "id", document_id
        ).execute()
        print(f"Background processing completed for document: {document_id}")

    except Exception as e:
        print(f"Background processing failed for document {document_id}: {e}")
        # Update document status to 'failed' on error
        db_client.table("documents").update({"status": "failed"}).eq(
            "id", document_id
        ).execute()
