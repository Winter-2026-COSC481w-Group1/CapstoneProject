from typing import List, Dict, Any
from uuid import uuid4

from fastapi import HTTPException

from app.schemas.assessment_request import AssessmentRequest
from app.schemas.assessment import AssessmentSchema

from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService
from app.services.llm_service import LLMService


from supabase import Client


class AssessmentService:
    def __init__(
        self,
        document_service: DocumentService,
        embedding_service: EmbeddingService,
        vector_service: VectorDBService,
        llm_service: LLMService,
        db_client: Client,
    ):
        self.document_service = document_service
        self.embedding_service = embedding_service
        self.vector_service = vector_service
        self.db_client = db_client
        self.llm_service = llm_service  # import llm here

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
        self, query: str, document_id: str, limit: int, user_id: str
    ) -> str:
        """
        SPECIALIST: Just handles the RAG retrieval and formatting.
        """
        # get embeddings
        embedding = await self.embedding_service.embed_query(query)
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
    
    async def _save_assessment_to_db(self, assessment_id: str, assessment_data: AssessmentSchema):
        """
        Maps AssessmentSchema to 'questions' and 'question_options' tables.
        """
        for q_data in assessment_data.questions:
            # 1. Insert into 'questions' table
            # Note: Map your frontend types to your DB check constraints (MCQ, TF, SA)
            q_type_map = {
                "multiple-choice": "MCQ",
                "true-false": "TF",
                "short-answer": "SA"
            }

            question_insert = {
                "assessment_id": assessment_id,
                "question_text": q_data.question,
                "question_type": q_type_map.get(q_data.type, "MCQ"),
                "explanation": f"Page: {q_data.page_number} Text: {q_data.source_text}" # Using source_text as explanation/context
            }

            q_result = self.db_client.table("questions").insert(question_insert).execute()

            if q_result.data:
                new_q_id = q_result.data[0]["id"]

                # 2. If it's MCQ or has options, insert into 'question_options'
                if q_data.options:
                    options_to_insert = []
                    for option in q_data.options:
                        options_to_insert.append({
                            "question_id": new_q_id,
                            "option_text": option,
                            "is_correct": option == q_data.correctAnswer
                        })

                    if options_to_insert:
                        self.db_client.table("question_options").insert(options_to_insert).execute()

    async def generate_assessment(
        self,
        assessment_id: str,
        document_id: list[str],
        query: str,
        user_id: str,
        num_questions: int,
        question_types: list[str],
        difficulty: str
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
                query=query, document_id=document_id, limit=5, user_id=user_id
            )

            print(context)

            if not context:
                raise ValueError(f"No relevant content found for: {query}")

            # --- HAND OFF TO TEAMMATE (LLM) ---
            # This is where your teammate's code will eventually go
            # result = await self.llm_service.generate_questions(context, num_questions)

            # mark as completed if the above is successful. so do a try catch?
            # await self.update_assessment_status(assessment_id, "completed")
            try:
                result = await self.llm_service.generate_assessment(context, num_questions, difficulty, question_types)

                await self._save_assessment_to_db(assessment_id, result)

                await self.update_assessment_status(assessment_id, "completed")

                return context
            except Exception as e:
                print(f"Error from LLM service {e}")
                await self.update_assessment_status(assessment_id, "failed", str(e))

        except Exception as e:
            print(f"Error in generate_assessment {assessment_id}: {e}")
            await self.update_assessment_status(assessment_id, "failed", str(e))


    #return assessment metadata for user
    async def get_assessments(self, user_id: str) -> list:
        response = (
            self.db.table("assessments")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )

        assessments = []

        for row in response.data:
            assessment = row.get("assessment")
            if assessment:
                assessments.append(
                    {
                        "id": assessment.get("id"),
                        "title": assessment.get("title"),  # Rename for frontend
                        "createdAt": assessment.get("createdAt")
                        "status": assessment.get("status"),
                        "size": doc.get("file_size"),  # Standardize key
                        "pageCount": doc.get("page_count", 0),
                        "uploadedAt": doc.get("created_at"),  # Rename for frontend
                    }
                )

        return documents
