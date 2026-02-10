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

    async def create_embeddings(
        self, chunks: list[str], max_retries: int = 3
    ) -> list[list[float]]:
        """
        Asynchronously creates embeddings with exponential backoff retries
        """
        for attempt in range(max_retries):
            try:
                return await self.embeddings.aembed_documents(chunks)

            except Exception as e:
                wait_time = 2**attempt  # exponential backoff
                logger.warning(
                    f"Embedding attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s..."
                )

                if attempt == max_retries - 1:
                    logger.error("Max retries reached for embedding through API.")
                    raise e

                # use asyncio.sleep so we don't block the event loop while waiting
                await asyncio.sleep(wait_time)