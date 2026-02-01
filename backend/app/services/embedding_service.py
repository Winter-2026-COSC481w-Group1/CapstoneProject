import ollama


class EmbeddingService:
    def __init__(self, model: str = "nomic-embed-text"):
        """
        Initializes the EmbeddingService.
        It's a good practice to ensure the model is available locally.
        """
        self._model = model
        # You might want to add logic here to pull the model if it doesn't exist
        # For example, using ollama.list() and checking if the model is present.
        print(f"EmbeddingService initialized with model: {self._model}")

    def create_embeddings(self, chunks: list[str]) -> list[list[float]]:
        print(f"Creating embeddings for {len(chunks)} chunks in batch...")

        try:
            response = ollama.embed(model=self._model, input=chunks)
            return response["embeddings"]
        except AttributeError:
            return [
                ollama.embeddings(model=self._model, prompt=chunk)["embedding"]
                for chunk in chunks
            ]
