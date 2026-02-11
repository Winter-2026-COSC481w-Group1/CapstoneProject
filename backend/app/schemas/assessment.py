from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

class QuestionSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    type: str # 'multiple-choice' | 'true-false' | 'short-answer'
    question: str
    options: Optional[List[str]] = None
    correctAnswer: str
    # metadata for RAG traceability
    source_text: Optional[str] = None 
    page_number: Optional[int] = None

class AssessmentSchema(BaseModel):
    title: str
    types: List[str] # true/false, multiple choice, short answer
    difficulty: str # 'easy' | 'medium' | 'hard'
    questions: List[QuestionSchema]