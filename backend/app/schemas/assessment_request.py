from pydantic import BaseModel


class AssessmentRequest(BaseModel):
    document_id: str
    query: str #the topic of the exam. unable to rename because of db schema
    num_questions: int = 5
    difficulty: str = "medium"
    question_types: list[str] = ["multiple_choice"]
