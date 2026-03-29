from app.services.activity_service import ActivityService
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from app.auth import get_current_user
from app.api.dependencies import get_activity_service
from typing import Annotated

router = APIRouter()

@router.get("")
async def get_activity(
    current_user: Annotated[dict, Depends(get_current_user)],
    activity_service: ActivityService = Depends(get_activity_service)
):
    try:
        user_id = current_user["user_id"]
        result = await activity_service.get_recentActivity(user_id = user_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e: 
        print(f"Error getting activity for user{e}")
        raise HTTPException(
            status_code = 500, detail = "Internal server error during getting activity"
        ) from e