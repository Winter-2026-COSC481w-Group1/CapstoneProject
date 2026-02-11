import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.services.embedding_service import EmbeddingService
from app.services.upload_service import UploadService
from app.services.vector_db_service import VectorDBService
from app.services.document_service import DocumentService
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from supabase import create_client

from app.api.v1.api import api_router


load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):

    db_url = os.getenv("DATABASE_URL")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_KEY")

    # Initialize the Supabase client for service role (for database interactions requiring elevated privileges)
    supabase_service_client = create_client(supabase_url, supabase_service_role_key)

    # Initialize the Supabase client for anonymous access (for user authentication)
    # Both clients now point to the same remote Supabase URL
    supabase_anon_client = create_client(supabase_url, supabase_anon_key)

    # initialize the services once for the entire application lifecycle.
    vector_service = VectorDBService(db_url=db_url)
    embedding_service = EmbeddingService()
    upload_service = UploadService(
        vector_service=vector_service,
        db_client=supabase_service_client,  # Use the service role client for UploadService DB interactions
        embedding_service=embedding_service,
    )
    document_service = DocumentService(supabase_service_client)

    # store the service instances and Supabase clients in the application state.
    # this makes them accessible from anywhere in the app, including dependencies.
    app.state.vector_service = vector_service
    app.state.upload_service = upload_service
    app.state.embedding_service = embedding_service  # Make embedding service available
    app.state.document_service = document_service
    app.state.supabase_service_client = (
        supabase_service_client  # Store the service role client
    )
    app.state.supabase_anon = supabase_anon_client  # Store the anonymous client
    yield

    # --- Shutdown ---
    # Clean up the resources (e.g., close database connections).
    print("Shutdown complete. Resources cleaned up.")


# Pass the lifespan manager to the FastAPI constructor
app = FastAPI(title="AI Assessment Platform API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace "*" with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")
