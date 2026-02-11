from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def read_current_user(current_user: Annotated[dict, Depends(get_current_user)]):
    return current_user
