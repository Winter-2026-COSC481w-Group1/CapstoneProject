from typing import Dict, Any
from uuid import uuid4
from datetime import datetime, timezone
from dateutil import parser
import re
import asyncio
import random
import logging
import numpy as np

from fastapi import HTTPException

from app.schemas.assessment import (
    QuestionSource,
    QuestionDetail,
    AssessmentSchema,
    AssessmentDetails,
)
from app.schemas.assessment_attempt import Answer, AssessmentAttempt
from app.schemas.assessment_request import AssessmentRequest

from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.vector_db_service import VectorDBService
from app.services.llm_service import LLMService


from supabase import Client

logger = logging.getLogger(__name__)

# Similarity thresholds per difficulty level for short-answer grading
SIMILARITY_THRESHOLDS = {
    "easy": 0.75,
    "medium": 0.85,
    "hard": 0.92,
}


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors."""
    a, b = np.array(vec_a), np.array(vec_b)
    norm_a, norm_b = np.linalg.norm(a), np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


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

    async def get_assessment_details(
        self, assessment_id: str, user_id: str
    ) -> AssessmentDetails:
        # ownership check
        assessment_response = (
            self.db_client.table("assessments")
            .select("*")
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not assessment_response.data:
            raise PermissionError("Assessment not found or user does not have access.")

        data = assessment_response.data
        all_ids = []
        if data.get("document_ids"):
            all_ids.extend(data["document_ids"])

        unique_doc_ids = list(set(all_ids))
        default_doc_id = (data.get("document_ids") or [None])[0]

        doc_names_map = {}
        if unique_doc_ids:
            doc_res = (
                self.db_client.table("documents")
                .select("id, file_name")
                .in_("id", unique_doc_ids)
                .execute()
            )
            doc_names_map = {doc["id"]: doc["file_name"] for doc in doc_res.data}

        # fetch questions
        questions_response = (
            self.db_client.table("questions")
            .select("*")
            .eq("assessment_id", assessment_id)
            .execute()
        )

        # fetch attempts data
        last_attempt = None
        if data.get("attempt"):
            try:
                attempt_data = data["attempt"]
                answers = []
                for ans in attempt_data.get("answers", []):
                    answers.append(Answer(**ans))
                last_attempt = AssessmentAttempt(
                    numAttempts=attempt_data.get("numAttempts"),
                    answers=answers,
                    numCorrect=attempt_data.get("numCorrect"),
                    time_submitted=attempt_data.get("time_submitted"),
                )
            except Exception as e:
                print(f"Error parsing attempt data: {e}")
                last_attempt = None

        if not questions_response.data:
            return AssessmentDetails(
                id=data.get("id"),
                title=data.get("title"),
                topic=data.get("query") or "",
                createdAt=data.get("created_at"),
                status=data.get("status"),
                sourceFiles=unique_doc_ids,
                questionCount=data.get("num_questions") or 0,
                difficulty=data.get("difficulty") or "none",
                questions=[],
                attempt=last_attempt,
            )

        # fetch all options for all questions in the assessment
        question_ids = [q["id"] for q in questions_response.data]
        options_response = (
            self.db_client.table("question_options")
            .select("*")
            .in_("question_id", question_ids)
            .execute()
        )
        options_by_question_id = {}
        for option in options_response.data:
            qid = option["question_id"]
            if qid not in options_by_question_id:
                options_by_question_id[qid] = []
            options_by_question_id[qid].append(option)

        # construct QuestionDetail list
        detailed_questions = []
        type_mapping = {
            "MCQ": "multiple-choice",
            "TF": "true-false",
            "SA": "short-answer",
        }

        for q in questions_response.data:
            question_id = q["id"]
            options_data = options_by_question_id.get(question_id, [])

            options = [opt["option_text"] for opt in options_data]
            # Updated retrieval logic to return an index (int)
            correct_answer_index = -1
            for index, opt in enumerate(options_data):
                if opt["is_correct"]:
                    correct_answer_index = index
                    break

            # parse source
            source = None
            explanation = q.get("explanation", "")
            if explanation:
                match = re.search(r"Page: (\d+) Text: (.*)", explanation)
                if match:
                    page, text = match.groups()
                    q_doc_id = q.get("document_id") or default_doc_id
                    if q_doc_id:
                        source = QuestionSource(
                            text=text.strip(),
                            page=int(page),
                            document_id=q_doc_id,
                            document_name=doc_names_map.get(q_doc_id, "Unknown"),
                        )

            detailed_questions.append(
                QuestionDetail(
                    id=str(question_id),
                    type=type_mapping.get(q["question_type"], "multiple-choice"),
                    question=q["question_text"],
                    options=options,
                    correctAnswer=correct_answer_index,
                    source=source,
                )
            )

        return AssessmentDetails(
            id=data.get("id"),
            title=data.get("title"),
            topic=data.get("query") or "",
            createdAt=data.get("created_at"),
            status=data.get("status"),
            sourceFiles=unique_doc_ids,
            questionCount=data.get("num_questions") or 0,
            difficulty=data.get("difficulty") or "none",
            questions=detailed_questions,
            attempt=last_attempt,
        )

    # creates a pending record for the assessment generating in the db, and returns assessment id
    async def create_pending_record(
        self, request: AssessmentRequest, user_id: str
    ) -> str:
        """Creates the initial row in Supabase and returns the ID."""

        check_ownership = (
            self.db_client.table("user_library")
            .select("document_id")
            .eq("user_id", user_id)
            .in_("document_id", request.document_ids)
            .is_("deleted_at", "null")
            .execute()
        )

        if not check_ownership.data:
            raise PermissionError(
                f"User {user_id} does not have access to document {request.document_id}"
            )

        owned_ids = [row["document_id"] for row in check_ownership.data]
        if len(owned_ids) != len(request.document_ids):
            missing = set(request.document_ids) - set(owned_ids)
            raise PermissionError(
                f"User {user_id} does not have access to documents: {missing}"
            )

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
                "title": request.title or f"Assessment: {request.query}",
                "error_message": None,
            }
        )

        # execute the insert
        # result.data will contain the newly created row
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
        self, query: str, document_ids: list[str], chunks: int, user_id: str
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
                {"document_id": {"$in": document_ids}},
            ]
        }

        retrieved_chunks = await self.vector_service.query(
            embedding,
            chunks=chunks,
            filters=filters,
            include_value=True,
            include_metadata=True,
        )

        valid_chunks = []
        for item in retrieved_chunks:
            distance = item[1]
            similarity = 1 - distance

            valid_chunks.append(
                {"id": item[0], "score": similarity, "metadata": item[2]}
            )

        valid_chunks.sort(key=lambda x: x["score"], reverse=True)

        # format the context for the LLM
        formatted_context = []
        for i, chunk in enumerate(valid_chunks):
            metadata = chunk["metadata"]
            text = metadata.get("text", "")
            doc_id = metadata.get("document_id", "unknown")  # Get the ID from metadata
            page_num = metadata.get("page_number")

            if text:
                # Adding 'Source' headers helps LLM cite its answers???
                formatted_context.append(
                    f"--- SOURCE {i + 1} (ID: {doc_id} | PAGE: {page_num}) ---\n{text.strip()}"
                )

        return "\n\n".join(formatted_context)

    async def _save_assessment_to_db(
        self, assessment_id: str, assessment_data: AssessmentSchema
    ):
        """
        Maps AssessmentSchema to 'questions' and 'question_options' tables.
        """
        for q_data in assessment_data.questions:
            # Handle both hyphenated and underscored formats from frontend/LLM
            q_type_map = {
                "multiple_choice": "MCQ",
                "multiple-choice": "MCQ",
                "true_false": "TF",
                "true-false": "TF",
                "short_answer": "SA",
                "short-answer": "SA",
            }

            question_insert = {
                "assessment_id": assessment_id,
                "question_text": q_data.question,
                "question_type": q_type_map.get(q_data.type, "MCQ"),
                "explanation": f"Page: {q_data.page_number} Text: {q_data.source_text}",  # Using source_text as explanation/context
                "document_id": q_data.document_id or None, # There may be no source
            }

            q_result = (
                self.db_client.table("questions").insert(question_insert).execute()
            )

            if q_result.data:
                new_q_id = q_result.data[0]["id"]

                if q_data.options:
                    # Pair each option with its correctness flag
                    options_data = [(opt, i == q_data.correctAnswer) for i, opt in enumerate(q_data.options)]
                    
                    # Randomize the display order for multiple choice to prevent LLM answer bias (Issue #132)
                    if q_type_map.get(q_data.type, "MCQ") == "MCQ":
                        random.shuffle(options_data)

                    options_to_insert = []
                    for option_text, is_correct in options_data:
                        options_to_insert.append(
                            {
                                "question_id": new_q_id,
                                "option_text": option_text,
                                "is_correct": is_correct,
                            }
                        )

                    if options_to_insert:
                        self.db_client.table("question_options").insert(
                            options_to_insert
                        ).execute()

    async def generate_assessment(
        self,
        assessment_id: str,
        document_ids: list[str],
        query: str,
        user_id: str,
        num_questions: int,
        question_types: list[str],
        difficulty: str,
    ):
        """
        MANAGER: Orchestrates the task of generating an assessment
        """
        try:
            # update status to processing
            await self.update_assessment_status(assessment_id, "processing")

            if not document_ids:
                raise ValueError("At least one document must be selected.")

            total_chunks_limit = 35

            # split topics by comma
            topics = [t.strip() for t in query.split(",") if t.strip()]
            num_topics = len(topics)
            chunks_needed = num_questions * 3
            min_floor = num_topics * 5
            total_chunks = min(total_chunks_limit, max(min_floor, chunks_needed))
            chunks_per_topic = total_chunks // num_topics

            tasks = [
                self.get_context_for_assessment(
                    topic, document_ids, chunks_per_topic, user_id
                )
                for topic in topics
            ]

            contexts = await asyncio.gather(*tasks)

            for i, ctx in enumerate(contexts):
                if (
                    not ctx.strip()
                ):  # won't raise an error, since this isn't a dealbreaker
                    print(f"Warning: No context found for topic: {topics[i]}")

            combined_context = "\n\n".join(
                [
                    f"=== TOPIC: {topics[i].upper()} ===\n{ctx}"
                    for i, ctx in enumerate(contexts)
                    if ctx.strip()
                ]
            )

            try:
                result = await self.llm_service.generate_assessment(
                    query, combined_context, num_questions, difficulty, question_types
                )

                await self._save_assessment_to_db(assessment_id, result)

                await self.update_assessment_status(assessment_id, "ready")

                return combined_context
            except Exception as e:
                print(f"Error from LLM service {e}")
                await self.update_assessment_status(assessment_id, "failed", str(e))

        except Exception as e:
            print(f"Error in generate_assessment {assessment_id}: {e}")
            await self.update_assessment_status(assessment_id, "failed", str(e))

    # return assessment metadata for user
    async def get_assessments(self, user_id: str) -> list:
        response = (
            self.db_client.table("assessments")
            .select("*")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )

        assessments = []

        for row in response.data:
            # Handle source files
            source_files = []
            if row.get("document_ids"):
                source_files.extend(row["document_ids"])

            # Ensure unique IDs and convert to list if it was a set
            unique_source_files = list(set(source_files))

            # Get superficial attempt information
            numAttempts = 0
            numCorrect = 0
            if row.get("attempt"):
                numAttempts = row.get("attempt")["numAttempts"]
                numCorrect = row.get("attempt")["numCorrect"]

            assessments.append(
                {
                    "id": row.get("id"),
                    "title": row.get("title"),  # Rename for frontend
                    "topic": row.get("query") or "",  # Frontend expects topic
                    "createdAt": row.get("created_at"),
                    "status": row.get("status"),
                    "sourceFiles": unique_source_files,  # Return list of IDs
                    "questionCount": row.get("num_questions"),
                    "difficulty": row.get("difficulty"),  # Rename for frontend
                    "numAttempts": numAttempts,
                    "numCorrect": numCorrect,
                }
            )

        return assessments

    async def record_assessment_attempt(
        self,
        assessment_id: str,
        user_id: str,
        attempt_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Stores the latest attempt in the assessments.attempt column."""
        # ownership check + existence
        existing = (
            self.db_client.table("assessments")
            .select("id, attempt")
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not existing.data:
            raise PermissionError("Assessment not found or user does not have access.")

        # Update attempts count
        current_attempts = 1
        if existing.data.get("attempt"):
            current_attempts = existing.data.get("attempt")["numAttempts"] + 1

        # Calculate number of questions correct
        numCorrect = 0

        # Fetch questions
        questions_response = (
            self.db_client.table("questions")
            .select("*")
            .eq("assessment_id", assessment_id)
            .execute()
        )

        # Fetch all options for all questions in the assessment
        question_ids = [q["id"] for q in questions_response.data]
        options_response = (
            self.db_client.table("question_options")
            .select("*")
            .in_("question_id", question_ids)
            .execute()
        )

        # Associate options with questions
        options_by_question_id = {}
        for option in options_response.data:
            qid = option["question_id"]
            if qid not in options_by_question_id:
                options_by_question_id[qid] = []
            options_by_question_id[qid].append(option)

        # Retrieve correct answer
        correct_answers = []
        for q in questions_response.data:
            question_id = q["id"]
            options_data = options_by_question_id.get(question_id, [])
            correct_answer_index = -1
            for index, opt in enumerate(options_data):
                if opt["is_correct"]:
                    correct_answer_index = index
                    break
            if q["question_type"] == "MCQ":
                correct_answers.append(correct_answer_index)
            elif (
                q["question_type"] == "TF"
            ):  # temp fix for now? should probably change DB structure for T/F
                correct_answers.append(correct_answer_index == 0)
            elif q["question_type"] == "SA":
                correct_answers.append(options_data[0]["option_text"])

        # --- Fetch assessment difficulty for SA threshold ---
        assessment_row = (
            self.db_client.table("assessments")
            .select("difficulty")
            .eq("id", assessment_id)
            .maybe_single()
            .execute()
        )
        difficulty = (assessment_row.data or {}).get("difficulty", "medium").lower()
        sa_threshold = SIMILARITY_THRESHOLDS.get(difficulty, 0.85)

        # --- First pass: grade MCQ/TF immediately, collect SA pairs ---
        answers = []
        sa_pairs = []  # (answer_index, user_text, correct_text)
        question_types = []  # track type for each question

        for i in range(len(correct_answers)):
            q_type = questions_response.data[i]["question_type"] if i < len(questions_response.data) else "MCQ"
            question_types.append(q_type)

            if i >= len(attempt_data["answers"]):
                answers.append(Answer(value=None, isCorrect=False))
                continue

            user_value = attempt_data["answers"][i]

            if q_type == "SA":
                # Defer SA grading — we'll batch-embed below
                ans = Answer(value=user_value, isCorrect=False)
                answers.append(ans)
                if isinstance(user_value, str) and user_value.strip():
                    sa_pairs.append((i, user_value.strip(), str(correct_answers[i]).strip()))
            else:
                # MCQ / TF: exact match
                ans = Answer(value=user_value, isCorrect=False)
                if user_value == correct_answers[i]:
                    ans.isCorrect = True
                    numCorrect += 1
                answers.append(ans)

        # --- Second pass: semantic grading for short-answer questions ---
        if sa_pairs:
            try:
                user_texts = [p[1] for p in sa_pairs]
                correct_texts = [p[2] for p in sa_pairs]
                all_texts = user_texts + correct_texts

                # Single batch API call for all SA texts
                embeddings = await self.embedding_service.embed_chunks(all_texts)

                n = len(sa_pairs)
                for j, (idx, _, _) in enumerate(sa_pairs):
                    user_vec = embeddings[j]
                    correct_vec = embeddings[n + j]
                    sim = cosine_similarity(user_vec, correct_vec)

                    answers[idx].similarity = round(sim, 4)
                    if sim >= sa_threshold:
                        answers[idx].isCorrect = True
                        numCorrect += 1

                    logger.info(
                        f"SA Q{idx}: similarity={sim:.4f}, threshold={sa_threshold}, correct={sim >= sa_threshold}"
                    )
            except Exception as e:
                logger.error(f"Embedding-based SA grading failed, falling back to exact match: {e}")
                # Fallback: exact string match for SA questions
                for idx, user_text, correct_text in sa_pairs:
                    if user_text.lower() == correct_text.lower():
                        answers[idx].isCorrect = True
                        numCorrect += 1

        # Prepare complete attempt data
        complete_attempt_data = AssessmentAttempt(
            numAttempts=current_attempts,
            answers=answers,
            numCorrect=numCorrect,
            time_submitted=datetime.now(timezone.utc).isoformat(),
        )

        update_payload = {
            "attempt": complete_attempt_data.model_dump(),
        }

        response = (
            self.db_client.table("assessments")
            .update(update_payload)
            .eq("id", assessment_id)
            .eq("user_id", user_id)
            .execute()
        )

        if not response.data:
            raise ValueError("Failed to save assessment attempt")

        # Update assessment status to completed
        await self.update_assessment_status(assessment_id, "completed")

        return response.data[0]

    async def update_assessment(
        self, assessment_id: str, assessment_data: AssessmentSchema, user_id: str
    ):
        metadata_update = {
            "title": assessment_data.title,
            "num_questions": len(
                assessment_data.questions
            ),  # Automatically sync the count
            "difficulty": assessment_data.difficulty,
            "query": assessment_data.topic,
            "status": "ready",
        }
        
        update_result = (
            self.db_client.table("assessments")
            .update(metadata_update)
            .eq("user_id", user_id)
            .eq("id", assessment_id)
            .execute()
        )
        
        # Check if assessment exists in database
        if not update_result.data:
          # add in the uuid and user_id the client presented
          metadata_update.update(
              {
                  "id": assessment_id,
                  "user_id": user_id
              }
          )
          
          # add the blank assessment to the table
          result = self.db_client.table("assessments").insert(metadata_update).execute()
  
          if not result.data:
              raise ValueError("Failed to initialize assessment record in Supabase.")
          
        # delete existing questions (if any)
        _ = (
            self.db_client.table("questions")
            .delete()
            .eq("assessment_id", assessment_id)
            .execute()
        )

        # write questions (if any)
        await self._save_assessment_to_db(assessment_id, assessment_data)

        return {"message": "Assessment updated successfully"}

    async def delete_assessment(self, assessment_id: str, user_id: str):
        """Soft-delete an assessment (move to trash)."""
        deleted_at = datetime.now(timezone.utc).isoformat()

        result = (
            self.db_client.table("assessments")
            .update({"deleted_at": deleted_at})
            .eq("user_id", user_id)
            .eq("id", assessment_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Assessment not found")

        return {
            "message": "Assessment moved to trash.",
            "assessment_id": assessment_id,
        }

    async def get_trash_assessments(self, user_id: str) -> list:
        """Return assessments the user has soft-deleted (in the trash)."""
        response = (
            self.db_client.table("assessments")
            .select("*")
            .eq("user_id", user_id)
            .not_.is_("deleted_at", "null")
            .execute()
        )

        assessments = []
        for row in response.data:
            deleted_at = row.get("deleted_at")
            days_remaining = None
            if deleted_at:
                deleted_dt = datetime.fromisoformat(parser.isoparse(deleted_at).isoformat())
                elapsed = (datetime.now(timezone.utc) - deleted_dt).days
                days_remaining = max(0, 30 - elapsed)

            source_files = list(set(row.get("document_ids") or []))
            assessments.append(
                {
                    "id": row.get("id"),
                    "title": row.get("title"),
                    "topic": row.get("query") or "",
                    "createdAt": row.get("created_at"),
                    "status": row.get("status"),
                    "sourceFiles": source_files,
                    "questionCount": row.get("num_questions"),
                    "difficulty": row.get("difficulty"),
                    "deletedAt": deleted_at,
                    "daysRemaining": days_remaining,
                }
            )

        return assessments

    async def restore_assessment(self, assessment_id: str, user_id: str):
        """Restore a soft-deleted assessment by clearing deleted_at."""
        result = (
            self.db_client.table("assessments")
            .update({"deleted_at": None})
            .eq("user_id", user_id)
            .eq("id", assessment_id)
            .not_.is_("deleted_at", "null")
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404, detail="Assessment not found in trash"
            )

        return {"message": "Assessment restored.", "assessment_id": assessment_id}

    async def permanent_delete_assessment(self, assessment_id: str, user_id: str):
        """Permanently delete a trashed assessment (removes questions/options via CASCADE)."""
        result = (
            self.db_client.table("assessments")
            .delete()
            .eq("user_id", user_id)
            .eq("id", assessment_id)
            .not_.is_("deleted_at", "null")
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404, detail="Assessment not found in trash"
            )

        return {
            "message": "Assessment permanently deleted.",
            "assessment_id": assessment_id,
        }
