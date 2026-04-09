from pydantic import BaseModel


class AssessmentRequest(BaseModel):
    document_ids: list[str]
    sections: list[str] | None = None # Filter by specific document sections/chapters
    query: str  # the topic of the exam. unable to rename because of db schema
    title: str | None = None
    num_questions: int
    difficulty: str = "medium"
    question_types: list[str] = ["multiple_choice"]
