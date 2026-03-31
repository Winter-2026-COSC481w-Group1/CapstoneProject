from fastapi import APIRouter
from app.api.v1.endpoints import (
    documents,
    user,
    dev,
    assessments,
    notifications,
    activity,
    trash,
)

api_router = APIRouter()

api_router.include_router(user.router, prefix="/api/users", tags=["User Management"])

api_router.include_router(
    dev.router,
    prefix="/dev",
    tags=["Development"],
)

api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["Document Management"],
)

api_router.include_router(
    assessments.router,
    prefix="/assessments",
    tags=["Exam Generation"],
)

api_router.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"],
)

api_router.include_router(
    activity.router,
    prefix="/recent-activity",
    tags=["Activity"],
)

api_router.include_router(
    trash.router,
    prefix="/trash",
    tags=["Trash"],
)
