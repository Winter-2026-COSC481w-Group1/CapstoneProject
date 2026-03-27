from typing import Annotated, List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from app.auth import get_current_user
from app.schemas.assessment_request import AssessmentRequest
from app.schemas.assessment import AssessmentSchema, AssessmentDetails
from app.schemas.assessment_attempt import AssessmentAttemptRequest

from app.api.dependencies import get_assessment_service
from app.services.assessment_service import AssessmentService

router = APIRouter()


@router.post("", response_model=str)
async def generate_assessment(
    request: AssessmentRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):

    user_id = current_user["user_id"]

    # create the record in Supabase immediately
    assessment_id = await assessment_service.create_pending_record(request, user_id)

    # await the heavy task directly (Google Cloud Run request-based billing)
    await assessment_service.generate_assessment(
        assessment_id=assessment_id,
        document_ids=request.document_ids,
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


@router.get("/{assessment_id}", response_model=AssessmentDetails)
async def get_assessment_details(
    assessment_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        return await assessment_service.get_assessment_details(assessment_id, user_id)
    except PermissionError:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.put("/{assessment_id}")
async def update_assessment(
    assessment_id: str,
    assessment_data: AssessmentSchema,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        result = await assessment_service.update_assessment(
            assessment_id, assessment_data, user_id
        )
        return result
    except ValueError as e:
        # Catch specific validation errors if your service throws them
        raise HTTPException(status_code=400, detail=str(e))
    except PermissionError as e:
        # Catch ownership/access errors
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        print(f"Error updating assessment: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server error during assessment update"
        )


@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        result = await assessment_service.delete_assessment(assessment_id, user_id)
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting assessment: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server error during assessment deletion"
        )


@router.patch("/{assessment_id}/attempt", response_model=dict)
async def submit_assessment_attempt(
    assessment_id: str,
    attempt: AssessmentAttemptRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        result = await assessment_service.record_assessment_attempt(
            assessment_id=assessment_id,
            user_id=user_id,
            attempt_data=attempt.model_dump(),
        )
        return {
            "message": "Attempt saved",
            "assessment_id": assessment_id,
            "attempt": result.get("attempt"),
        }
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error saving attempt: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during attempt submission"
        )
