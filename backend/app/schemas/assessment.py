from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import uuid4
from datetime import datetime

class QuestionSchema(BaseModel):
    type: str # 'multiple-choice' | 'true-false' | 'short-answer'
    question: str
    options: List[str]
    #TODO add number of options field
    #TODO change to index of options list
    correctAnswer: str
    # metadata for RAG traceability
    source_text: str
    page_number: int

    

class AssessmentSchema(BaseModel):
    title: str
    types: List[str] # true/false, multiple choice, short answer
    difficulty: str # 'easy' | 'medium' | 'hard'
    questions: List[QuestionSchema]