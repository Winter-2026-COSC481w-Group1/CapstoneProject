from fastapi import APIRouter
from app.api.v1.endpoints import documents, user, dev, query

api_router = APIRouter()

api_router.include_router(query.router, prefix="/query", tags=["Search & Retrieval"])

api_router.include_router(user.router, prefix="/api/users", tags=["User Management"])

api_router.include_router(
    dev.router,
    prefix="/dev",
    tags=["Development"],
)


api_router.include_router(
    documents.router, prefix="/documents", tags=["Document Management"]
)

# 3. Assessment Engine (Coming soon)
# api_router.include_router(
#     exams.router,
#     prefix="/assessments",
#     tags=["Exam Generation"]
# )
