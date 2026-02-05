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
        self.collection.create_index()  # creates an index to optimize for queries

    async def upsert_chunks(
        self,
        chunks: list[str],
        embeddings: list[list[float]],
        file_hash: str,
        user_id: str,
        document_id: str,
    ):
        """
        Formats and uploads chunks and their embeddings to Supabase pgvector.
        Every chunk gets the file_hash and user_id in its metadata for filtering.
        """
        records = [
            (
                f"{file_hash}_{i}",  # unique id for the chunk
                embeddings[i],
                {
                    "document_id": document_id,
                    "file_hash": file_hash,
                    "user_id": user_id,
                    "text": chunks[i],
                    "chunk_index": i,
                },
            )
            for i in range(len(chunks))
        ]

        # batch upload
        self.collection.upsert(records=records)

        # creates an index on the vectors in the db
        self.collection.create_index()
