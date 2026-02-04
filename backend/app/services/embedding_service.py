import os
from langchain_nomic import NomicEmbeddings


class EmbeddingService:
    def __init__(self):
        self.embeddings = NomicEmbeddings(
            model="nomic-embed-text-v1.5", nomic_api_key=os.getenv("NOMIC_API_KEY")
        )

    def create_embeddings(self, chunks: list[str]) -> list[list[float]]:
        return self.embeddings.embed_documents(chunks)
