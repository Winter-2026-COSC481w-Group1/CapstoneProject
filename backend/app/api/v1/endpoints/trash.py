from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user
from app.api.dependencies import get_document_service, get_assessment_service
from app.services.document_service import DocumentService
from app.services.assessment_service import AssessmentService

router = APIRouter()


# ──────────────────────────────────────────────
# GET  /api/v1/trash
# Returns all trashed documents + assessments
# ──────────────────────────────────────────────
@router.get("")
async def get_trash(
    current_user: Annotated[dict, Depends(get_current_user)],
    document_service: DocumentService = Depends(get_document_service),
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        documents = await document_service.get_trash_documents(user_id)
        assessments = await assessment_service.get_trash_assessments(user_id)
        return {"documents": documents, "assessments": assessments}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error fetching trash: {e}")
        raise HTTPException(status_code=500, detail="Error fetching trash")


# ──────────────────────────────────────────────
# POST /api/v1/trash/documents/{id}/restore
# ──────────────────────────────────────────────
@router.post("/documents/{document_id}/restore")
async def restore_document(
    document_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        user_id = current_user["user_id"]
        return await document_service.restore_document(document_id, user_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error restoring document: {e}")
        raise HTTPException(status_code=500, detail="Error restoring document")


# ──────────────────────────────────────────────
# DELETE /api/v1/trash/documents/{id}
# Permanently delete a trashed document
# ──────────────────────────────────────────────
@router.delete("/documents/{document_id}")
async def permanent_delete_document(
    document_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        user_id = current_user["user_id"]
        return await document_service.permanent_delete_document(document_id, user_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error permanently deleting document: {e}")
        raise HTTPException(
            status_code=500, detail="Error permanently deleting document"
        )


# ──────────────────────────────────────────────
# POST /api/v1/trash/assessments/{id}/restore
# ──────────────────────────────────────────────
@router.post("/assessments/{assessment_id}/restore")
async def restore_assessment(
    assessment_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        return await assessment_service.restore_assessment(assessment_id, user_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error restoring assessment: {e}")
        raise HTTPException(status_code=500, detail="Error restoring assessment")


# ──────────────────────────────────────────────
# DELETE /api/v1/trash/assessments/{id}
# Permanently delete a trashed assessment
# ──────────────────────────────────────────────
@router.delete("/assessments/{assessment_id}")
async def permanent_delete_assessment(
    assessment_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    assessment_service: AssessmentService = Depends(get_assessment_service),
):
    try:
        user_id = current_user["user_id"]
        return await assessment_service.permanent_delete_assessment(
            assessment_id, user_id
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error permanently deleting assessment: {e}")
        raise HTTPException(
            status_code=500, detail="Error permanently deleting assessment"
        )
