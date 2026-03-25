from pydantic import BaseModel
from typing import Optional, Union, List
from datetime import datetime


class Answer(BaseModel):
    questionId: str
    answer: Union[int, bool, str]
    shortAnswerIsCorrect: Optional[bool] = None


class AssessmentAttempt(BaseModel):
    #attempts: int
    #time_submitted: datetime
    answers: List[Answer]