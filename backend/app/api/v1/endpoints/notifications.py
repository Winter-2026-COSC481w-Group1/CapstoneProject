from typing import Annotated
from fastapi import APIRouter, Depends, Request, HTTPException

from app.auth import get_current_user

router = APIRouter()


def _supabase(request: Request):
    # Uses the service role client created in main.py
    return request.app.state.supabase_service_client


@router.get("")
async def list_notifications(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
    limit: int = 50,
    unread_only: bool = False,
):
    user_id = current_user["user_id"]
    sb = _supabase(request)

    query = (
        sb.table("notifications")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    if unread_only:
        query = query.eq("is_read", False)

    response = query.execute()

    error = getattr(response, "error", None)
    if error:
        raise HTTPException(status_code=500, detail=str(error))

    data = getattr(response, "data", None) or []
    return {"notifications": data}


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    user_id = current_user["user_id"]
    sb = _supabase(request)

    response = (
        sb.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .execute()
    )

    error = getattr(response, "error", None)
    if error:
        raise HTTPException(status_code=500, detail=str(error))

    data = getattr(response, "data", None) or []
    if not data:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"updated": data[0]}


@router.patch("/read-all")
async def mark_all_notifications_as_read(
    request: Request,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    user_id = current_user["user_id"]
    sb = _supabase(request)

    response = (
        sb.table("notifications")
        .update({"is_read": True})
        .eq("user_id", user_id)
        .eq("is_read", False)
        .execute()
    )

    error = getattr(response, "error", None)
    if error:
        raise HTTPException(status_code=500, detail=str(error))

    data = getattr(response, "data", None) or []
    return {"count_marked_read": len(data)}