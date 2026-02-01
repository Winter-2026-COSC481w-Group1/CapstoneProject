from app.services.upload_service import UploadService
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile

router = APIRouter()


def get_upload_service(request: Request) -> UploadService:
    return request.app.state.upload_service


@router.post("/upload")
async def upload_pdf(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    upload_service: UploadService = Depends(get_upload_service),
):
    """
    Endpoint to handle PDF uploads.
    - user_id: Passed as a form field from React.
    - file: The actual PDF binary.
    - upload_service: Injected dependency providing the upload logic.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    try:
        # read the file into memory
        file_bytes = await file.read()

        result = await upload_service.execute(
            file_bytes=file_bytes,
            filename=file.filename,
            user_id=user_id,
            content_type=file.content_type,
        )
        return result

    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error during upload."
        ) from e
