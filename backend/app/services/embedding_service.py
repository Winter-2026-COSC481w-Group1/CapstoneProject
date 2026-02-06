import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings


class EmbeddingService:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
        )

    def create_embeddings(self, chunks: list[str]) -> list[list[float]]:
        return self.embeddings.embed_documents(chunks)
