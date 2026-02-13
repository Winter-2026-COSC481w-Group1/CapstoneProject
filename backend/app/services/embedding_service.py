import asyncio
import logging
import os
from langchain_nomic import NomicEmbeddings


logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self.embeddings = NomicEmbeddings(
            model="nomic-embed-text-v1.5", nomic_api_key=os.getenv("NOMIC_API_KEY")
        )

    async def embed_chunks(self, chunks: list[str]) -> list[list[float]]:
        """Used for ingestion: handles multiple strings."""
        return await self._execute_with_retry(self.embeddings.aembed_documents, chunks)

    async def embed_query(self, text: str) -> list[float]:
        """Used for search: handles a single string."""
        return await self._execute_with_retry(self.embeddings.aembed_query, text)

    async def _execute_with_retry(self, func, data, max_retries=3):
        for attempt in range(max_retries):
            try:
                return await func(data)
            except Exception as e:
                wait_time = 2**attempt
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying...")
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(wait_time)
