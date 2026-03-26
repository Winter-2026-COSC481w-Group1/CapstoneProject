from pydantic import BaseModel, Field
from typing import Optional, Union, List
from datetime import datetime


class Answer(BaseModel):
    questionId: str
    answer: Union[int, bool, str, None] = None
    shortAnswerIsCorrect: Optional[bool] = None


class AssessmentAttemptRequest(BaseModel):
    answers: List[Answer]


class AssessmentAttempt(BaseModel):
    attempts: int
    time_submitted: Union[datetime, str] = Field(..., description="Submission timestamp")
    answers: List[Answer]