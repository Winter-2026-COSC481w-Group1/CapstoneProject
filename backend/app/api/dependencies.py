from fastapi import Request

from app.services.document_service import DocumentService
from app.services.embedding_service import EmbeddingService
from app.services.upload_service import UploadService
from app.services.vector_db_service import VectorDBService


def get_upload_service(request: Request) -> UploadService:
    return request.app.state.upload_service


def get_document_service(request: Request) -> DocumentService:
    return request.app.state.document_service


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service


def get_vector_service(request: Request) -> VectorDBService:
    return request.app.state.vector_service
