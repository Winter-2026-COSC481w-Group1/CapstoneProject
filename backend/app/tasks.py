from supabase import Client
from app.services.vector_db_service import VectorDBService
from app.services.embedding_service import EmbeddingService
from app.utils.pdf_processor import pdf_process_to_chunks
from app.utils.pptx_processor import pptx_process_to_chunks
import os


async def process_document(
    document_id: str,
    file_hash: str,
    file_path: str,
    db_client: Client,
    vector_service: VectorDBService,
    embedding_service: EmbeddingService,
):
    try:
        # update document status to 'processing'
        db_client.table("documents").update({"status": "processing"}).eq(
            "id", document_id
        ).execute()

        # fetch the file from Supabase Storage
        file_bytes = db_client.storage.from_("pdfs").download(file_path)

        # Determine which processor to use based on extension
        file_ext = os.path.splitext(file_path)[1].lower()

        chunks = []
        sections = []

        if file_ext == ".pdf":
            result = pdf_process_to_chunks(file_bytes, file_hash)
            chunks = result["chunks"]
            sections = result["sections"]
        elif file_ext == ".pptx":
            # For now, pptx doesn't support sections, but we could add it later
            chunks = pptx_process_to_chunks(file_bytes, file_hash)
            sections = [{"title": "Full Presentation", "page_number": 1}]
        else:
            raise ValueError(f"Unsupported file extension: {file_ext}")

        # Update the document with detected sections
        db_client.table("documents").update({"sections": sections}).eq(
            "id", document_id
        ).execute()

        batch_size = 20
        total_chunks = len(chunks)
        total_indexed = 0

        print(f"Total chunks to index for doc {document_id}: {total_chunks}")
        db_client.table("documents").update({"status": "indexing"}).eq(
            "id", document_id
        ).execute()

        for i in range(0, total_chunks, batch_size):
            batch = chunks[i : i + batch_size]
            batch_texts = [chunk["text"] for chunk in batch]
            print(
                f"Indexing batch {i // batch_size + 1} for doc {document_id} ({len(batch)} chunks)..."
            )
            embeddings = await embedding_service.embed_chunks(batch_texts)
            await vector_service.upsert_chunks(
                chunks=batch,
                embeddings=embeddings,
                file_hash=file_hash,
                document_id=document_id,
                start_index=i,
            )
            total_indexed += len(batch_texts)

        print(
            f"Successfully embedded and upserted {total_indexed} vectors for doc {document_id}."
        )

        # 5. Update document status to 'ready'
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
