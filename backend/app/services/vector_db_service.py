import vecs


class VectorDBService:
    def __init__(self, db_url: str):
        """
        Initializes the Vector Database client.

        Args:
            db_url: The connection string for the PostgreSQL database with pgvector.
        """
        self.client = vecs.create_client(db_url)
        self.collection = self.client.get_or_create_collection(
            name="document_chunks", dimension=768
        )

    async def upsert_chunks(
        self,
        chunks: list[dict],
        embeddings: list[list[float]],
        file_hash: str,
        user_id: str,
        document_id: str,
    ):
        """
        Formats and uploads chunks and their embeddings to Supabase pgvector.
        Every chunk gets the file_hash and user_id in its metadata for filtering.
        """
        records = []
        for i, chunk in enumerate(chunks):
            text = chunk.get("text", "")
            page_num = chunk.get("page_number", -1)

            records.append(
                (
                    f"{file_hash}_{i}",  # unique id for the chunk
                    embeddings[i],
                    {
                        "document_id": document_id,
                        "file_hash": file_hash,
                        "user_id": user_id,
                        "text": text,
                        "page_number": page_num,
                        "chunk_index": i,
                    },
                )
            )
        # batch upload
        self.collection.upsert(records=records)

    async def query(
        self,
        data: list[float],
        limit: int,
        filters: dict[str, any],
        include_value: bool = False,
        include_metadata: bool = True,
    ) -> list[tuple[str, float, dict[str, any]]]:
        """
        Queries the 'vecs' collection using pgvector.
        """
        try:
            results = self.collection.query(
                data=data,  # the single embedding
                limit=limit,
                filters=filters,  # metadata filtering
                include_value=include_value,  # this returns the distance/score
                include_metadata=include_metadata,  # this returns your metadata dict (with 'text')
            )

            # 'vecs' returns a list of result objects/tuples.
            # structure: [(id, score, metadata), (id, score, metadata)...]

            return results

        except Exception as e:
            print(f"Vecs Query Error: {e}")
            return []

    async def delete_document_vectors(self, document_id: str):
        """
        Deletes all vector chunks associated with a document by document_id.
        Uses metadata filtering to find and delete chunks in batches of 1000
        (database limit) since there may be more than 1000 chunks per document.
        """
        try:
            batch_size = 1000
            total_deleted = 0

            while True:
                # Query for chunks with this document_id (batch of 1000)
                chunks_to_delete = self.collection.query(
                    data=[0.0] * 768,  # dummy embedding (only used for filter)
                    limit=batch_size,
                    filters={"document_id": {"$eq": document_id}},
                    include_metadata=True,
                )

                # If no more chunks, we're done
                if not chunks_to_delete:
                    break

                # Extract chunk IDs and delete them
                chunk_ids = [chunk[0] for chunk in chunks_to_delete]
                self.collection.delete(ids=chunk_ids)
                total_deleted += len(chunk_ids)
                print(f"Deleted {len(chunk_ids)} vector chunks (total: {total_deleted}) for document {document_id}")

                # If we got fewer than batch_size, we've deleted all chunks
                if len(chunk_ids) < batch_size:
                    break

            print(f"Completed: Deleted {total_deleted} total vector chunks for document {document_id}")
        except Exception as e:
            print(f"Vector delete warning: {e}")
