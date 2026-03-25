from pydantic import BaseModel
from typing import Optional, Union, List
from datetime import datetime


class Answer(BaseModel):
    questionId: str
    answer: Union[int, bool, str]
    shortAnswerIsCorrect: Optional[bool] = None


class AssessmentAttempt(BaseModel):
    answers: List[Answer]