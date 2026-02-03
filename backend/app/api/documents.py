from typing import Annotated
from app.services.upload_service import UploadService
from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
    BackgroundTasks,
)
from app.auth import get_current_user

router = APIRouter()


def get_upload_service(request: Request) -> UploadService:
    return request.app.state.upload_service


@router.post("/upload")
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
