from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends
from app.auth import get_current_user
from app.schemas.assessment_request import AssessmentRequest

# from app.schemas.assessment_generation import AssessmentContent # Commented out
from app.api.dependencies import get_assessment_service
from app.services.assessment_service import AssessmentService

router = APIRouter()


@router.post("", response_model=str)
async def generate_assessment(
    request: AssessmentRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
    assessment_service: AssessmentService = Depends(get_assessment_service),
):

    user_id = current_user["user_id"]

    # create the record in Supabase immediately
    assessment_id = await assessment_service.create_pending_record(request, user_id)

    # hand off the heavy task to the background
    background_tasks.add_task(
        assessment_service.generate_assessment,
        assessment_id=assessment_id,
        document_id=request.document_id,
        topic=request.query,
        user_id=user_id,
        num_questions=request.num_questions,
    )

    # return the ID
    return assessment_id
