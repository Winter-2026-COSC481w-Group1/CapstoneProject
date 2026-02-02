import os
import ollama


class EmbeddingService:
    def __init__(self, model: str = "nomic-embed-text"):
        self._model = model
        # Use host.docker.internal if running in Docker, else localhost
        self._host = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        self.client = ollama.Client(
            host=self._host, timeout=300.0
        )  # Long timeout for pulls

        # Just a quick check to see if Ollama is awake
        self._verify_connection()
        print(f"EmbeddingService initialized: {self._model}")

    def _verify_connection(self):
        """Minimal check to ensure Ollama is reachable."""
        try:
            self.client.list()
        except Exception as e:
            print(
                f"Warning: Ollama not reachable at {self._host}. Is the container starting? {e}"
            )

    def create_embeddings(self, chunks: list[str]) -> list[list[float]]:
        print(f"Creating embeddings for {len(chunks)} chunks in batch...")

        try:
            response = self.client.embed(model=self._model, input=chunks)
            return response["embeddings"]
        except AttributeError:
            return [
                ollama.embeddings(model=self._model, prompt=chunk)["embedding"]
                for chunk in chunks
            ]
