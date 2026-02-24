from typing import Annotated
from fastapi import APIRouter, BackgroundTasks, Depends
from app.auth import get_current_user
from app.schemas.assessment_request import AssessmentRequest
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    BackgroundTasks,
)

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
        query=request.query,
        user_id=user_id,
        num_questions=request.num_questions,
        question_types=request.question_types,
        difficulty=request.difficulty,
    )

    # return the ID
    return assessment_id

@router.get("")
async def get_assessments(
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        result = await assessment_service.get_assessments(
            user_id=user_id,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error getting assessments for user{e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during getting assessments"
        ) from e
    
#get all questions for an assessment based on the id
@router.get("/{assessment_id}")
async def get_questions(
    assessment_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service)
):
    try:
        user_id = current_user["user_id"]
        result = await assessment_service.get_questions(
            assessment_id,
            user_id
        )
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error getting assessment for user{e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during getting assessment"
        ) from e