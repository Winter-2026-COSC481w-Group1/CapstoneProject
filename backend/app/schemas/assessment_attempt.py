from pydantic import BaseModel
from typing import Optional, Union, List


class Answer(BaseModel):
    value: Union[int, bool, str, None]
    isCorrect: Optional[bool]
    similarity: Optional[float] = None  # 0.0-1.0, only set for short-answer questions


class AssessmentAttemptRequest(BaseModel):
    answers: List[Union[int, bool, str, None]]


class AssessmentAttempt(BaseModel):
    numAttempts: int
    answers: List[Answer]
    numCorrect: int
    time_submitted: str