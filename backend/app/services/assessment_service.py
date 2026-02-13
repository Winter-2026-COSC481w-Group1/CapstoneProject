from typing import List, Dict, Any
from uuid import uuid4

from fastapi import HTTPException

from app.schemas.assessment_request import AssessmentRequest

from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService


from supabase import Client


class AssessmentService:
    def __init__(
        self,
        document_service: DocumentService,
        embedding_service: EmbeddingService,
        vector_service: VectorDBService,
        db_client: Client,
    ):
        self.document_service = document_service
        self.embedding_service = embedding_service
        self.vector_service = vector_service
        self.db_client = db_client
        self.llm = None  # import llm here

    # creates a pending record for the assessment generating in the db, and returns assessment id
    async def create_pending_record(
        self, request: AssessmentRequest, user_id: str
    ) -> str:
        """Creates the initial row in Supabase and returns the ID."""

        # convert Pydantic model to dict
        # this automatically includes query, document_ids, num_questions, etc.
        insert_data = request.model_dump()

        assessment_id = str(uuid4())

        # 2. add backend-managed metadata
        insert_data.update(
            {
                "id": assessment_id,
                "user_id": user_id,
                "status": "pending",
                "title": f"Assessment: {request.query}",
                "error_message": None,
            }
        )

        # execute the insert
        # result.data will contain the newly created row, including its UUID 'id'
        result = self.db_client.table("assessments").insert(insert_data).execute()

        if not result.data:
            raise ValueError("Failed to initialize assessment record in Supabase.")

        # return the ID so the Router can pass it to the background task
        return result.data[0]["id"]

    async def update_assessment_status(
        self, assessment_id: str, status: str, error_message: str = None
    ):
        update_data = {"status": status}
        if error_message:
            update_data["error_message"] = error_message

        self.db_client.table("assessments").update(update_data).eq(
            "id", assessment_id
        ).execute()

    async def get_context_for_assessment(
        self, topic: str, document_id: str, limit: int, user_id: str
    ) -> str:
        """
        SPECIALIST: Just handles the RAG retrieval and formatting.
        """
        # get embeddings
        embedding = await self.embedding_service.embed_query(topic)
        if not embedding:
            return ""

        #  query Vector DB ensure only documents that the user owns
        filters = {
            "$and": [
                {"document_id": {"$eq": document_id}},
                {"user_id": {"$eq": user_id}},
            ]
        }

        retrieved_chunks = await self.vector_service.query(
            embedding,
            limit=limit,
            filters=filters,
            include_value=False,
            include_metadata=True,
        )

        # format the context for the LLM
        formatted_context = []
        for i, chunk in enumerate(retrieved_chunks):
            metadata = chunk[1]
            text = metadata.get("text", "")

            if text:
                # Adding 'Source' headers helps LLM cite its answers???
                formatted_context.append(f"--- SOURCE {i + 1} ---\n{text.strip()}")

        return "\n\n".join(formatted_context)

    async def generate_assessment(
        self,
        assessment_id: str,
        document_id: list[str],
        topic: str,
        user_id: str,
        num_questions: int,
    ):
        """
        MANAGER: Orchestrates the entire background task.
        """
        try:
            # update status to processing
            await self.update_assessment_status(assessment_id, "processing")

            if not document_id:
                raise ValueError("At least one document must be selected.")

            context = await self.get_context_for_assessment(
                topic=topic, document_id=document_id, limit=5, user_id=user_id
            )

            print(context)

            if not context:
                raise ValueError(f"No relevant content found for: {topic}")

            # --- HAND OFF TO TEAMMATE (LLM) ---
            # This is where your teammate's code will eventually go
            # result = await self.llm_service.generate_questions(context, num_questions)

            # mark as completed if the above is successful. so do a try catch?
            # await self.update_assessment_status(assessment_id, "completed")
            return context

        except Exception as e:
            print(f"Error in generate_assessment {assessment_id}: {e}")
            await self.update_assessment_status(assessment_id, "failed", str(e))
