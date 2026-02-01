import os
from contextlib import asynccontextmanager

import jwt
from app.services.embedding_service import EmbeddingService
from app.services.upload_service import UploadService
from app.services.vector_db_service import VectorDBService
from dotenv import load_dotenv
from fastapi import FastAPI, Request

from supabase import create_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_dotenv()
    db_url = os.getenv("DATABASE_URL")
    supabase_url = os.getenv("SUPABASE_URL")

    # Generate a service role JWT
    jwt_secret = os.getenv("PGRST_JWT_SECRET")
    service_role_payload = {"role": "service_role"}
    supabase_key = jwt.encode(service_role_payload, jwt_secret, algorithm="HS256")

    # initialize the services once for the entire application lifecycle.
    vector_service = VectorDBService(db_url=db_url)
    embedding_service = EmbeddingService()
    supabase_client = create_client(supabase_url, supabase_key)
    supabase_client.postgrest_url = supabase_url.rstrip("/")
    upload_service = UploadService(
        vector_service=vector_service,
        db_client=supabase_client,
        embedding_service=embedding_service,
    )

    # store the service instances in the application state.
    # this makes them accessible from anywhere in the app, including dependencies.
    app.state.vector_service = vector_service
    app.state.upload_service = upload_service

    print("Startup complete. Services initialized.")

    # import and include the router after services are initialized
    from app.api import documents

    app.include_router(documents.router, prefix="/api/documents", tags=["documents"])

    yield

    # --- Shutdown ---
    # Clean up the resources (e.g., close database connections).
    # You would need to add a `close()` method to your service class.
    # app.state.vector_service.close()
    print("Shutdown complete. Resources cleaned up.")


# Pass the lifespan manager to the FastAPI constructor
app = FastAPI(title="AI Assessment Platform API", lifespan=lifespan)


# --- Dependency Provider Functions ---
# These functions make it easy and explicit to get the service instances in your routes.
def get_vector_service(request: Request) -> VectorDBService:
    return request.app.state.vector_service


def get_embedding_service(request: Request) -> EmbeddingService:
    return request.app.state.embedding_service
