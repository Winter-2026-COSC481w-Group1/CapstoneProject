from pydantic import BaseModel
from typing import List, Optional

class Activity(BaseModel):
    id: str
    type: str
    name: str
    timeStamp: str