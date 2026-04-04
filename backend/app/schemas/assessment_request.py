from pydantic import BaseModel, Field


class AssessmentRequest(BaseModel):
    document_ids: list[str]
    query: str  # the topic of the exam. unable to rename because of db schema
    title: str | None = None
    num_questions: int = Field(ge=1, le=50)
    difficulty: str = "medium"
    question_types: list[str] = ["multiple_choice"]
