from pydantic import BaseModel
from typing import List, Optional
from .assessment_attempt import AssessmentAttempt


class QuestionSource(BaseModel):
    text: str
    page: int
    document_id: str
    document_name: Optional[str] = None


class QuestionDetail(BaseModel):
    id: str
    type: str  # 'multiple_choice' | 'true_false' | 'short_answer'
    question: str
    options: Optional[List[str]] = None
    correctAnswer: int
    source: Optional[QuestionSource] = None


class QuestionSchema(BaseModel):
    type: str  # 'multiple_choice' | 'true_false' | 'short_answer'
    question: str
    numOptions: int  # this will be used later when we add the option to choose number of multiple choice questions
    options: List[str]
    correctAnswer: int  # index of correct option in list
    # metadata for RAG traceability
    source_text: str
    page_number: int
    document_id: str


class AssessmentSchema(BaseModel):
    title: str
    types: List[str]  # true/false, multiple choice, short answer
    difficulty: str  # 'easy' | 'medium' | 'hard'
    questions: List[QuestionSchema]
    topic: str  # either the original query or one entered when edited


class AssessmentDetails(BaseModel):
    questions: List[QuestionDetail]
    attempt: Optional[AssessmentAttempt] = None
