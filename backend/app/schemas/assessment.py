from pydantic import BaseModel, Field
from typing import List, Optional


class QuestionSource(BaseModel):
    text: str
    page: int
    fileName: str


class QuestionDetail(BaseModel):
    id: str
    type: str  # 'multiple-choice' | 'true-false' | 'short-answer'
    question: str
    options: Optional[List[str]] = None
    correctAnswer: str
    userAnswer: Optional[str] = None
    source: Optional[QuestionSource] = None


class QuestionSchema(BaseModel):
    type: str  # 'multiple-choice' | 'true-false' | 'short-answer'
    question: str
    options: List[str]
    correctAnswer: str
    # metadata for RAG traceability
    source_text: str
    page_number: int


class AssessmentSchema(BaseModel):
    title: str
    types: List[str]  # true/false, multiple choice, short answer
    difficulty: str  # 'easy' | 'medium' | 'hard'
    questions: List[QuestionSchema]
