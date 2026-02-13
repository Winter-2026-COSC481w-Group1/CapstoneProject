from pydantic import BaseModel


class AssessmentRequest(BaseModel):
    document_id: str
    topic: str
    num_questions: int = 5
    difficulty: str = "medium"
    question_types: list[str] = ["multiple_choice"]
