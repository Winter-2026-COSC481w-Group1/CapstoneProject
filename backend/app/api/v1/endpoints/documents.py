from typing import Annotated
from app.services.upload_service import UploadService
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    BackgroundTasks,
)
from app.auth import get_current_user
from app.services.document_service import DocumentService
from app.api.dependencies import get_document_service, get_upload_service

router = APIRouter()


@router.post("")
async def upload_pdf(
    current_user: Annotated[dict, Depends(get_current_user)],
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    upload_service: UploadService = Depends(get_upload_service),
):
    """
    Endpoint to handle PDF uploads.
    - user_id: Extracted from authenticated user.
    - file: The actual PDF binary.
    - upload_service: Injected dependency providing the upload logic.
    """
    try:
        user_id = current_user["user_id"]
        result = await upload_service.execute(
            file=file,
            user_id=user_id,
            background_tasks=background_tasks,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during upload."
        ) from e


@router.get("")
async def get_documents(
    current_user: Annotated[dict, Depends(get_current_user)],
    document_service: DocumentService = Depends(get_document_service),
):
    try:
        user_id = current_user["user_id"]
        result = await document_service.get_documents(
            user_id=user_id,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error getting documents for user{e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during getting documents"
        ) from e


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: Annotated[dict, Depends(get_current_user)],
    document_service: DocumentService = Depends(get_document_service),
):
    """
    Delete a document for the current user by its id. If no other users reference
    the document it will also remove the document row and storage file.
    """
    try:
        user_id = current_user["user_id"]
        result = await document_service.delete_document(
            document_id,
            user_id,
        )
        return result

    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error deleting document: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during document deletion"
        ) from e

