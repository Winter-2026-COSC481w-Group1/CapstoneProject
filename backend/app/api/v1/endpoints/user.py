import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from supabase import create_client, Client
from app.auth import get_current_user

router = APIRouter()


@router.get("/me")
async def read_current_user(current_user: Annotated[dict, Depends(get_current_user)]):
    return current_user

@router.delete("")
async def delete_current_user(
    current_user: Annotated[dict, Depends(get_current_user)]
):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

    supabase_admin: Client = create_client(supabase_url, supabase_service_key)

    user_id = current_user.get("user_id")

    if not user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID not found in token.")
    
    try:
        supabase_admin.auth.admin.delete_user(user_id)
        return{"message": "Account successfully deleted"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delte user: {str(e)}"
        )