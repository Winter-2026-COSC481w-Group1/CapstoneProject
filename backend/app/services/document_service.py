from fastapi import HTTPException

from supabase import Client
from app.services.vector_db_service import VectorDBService


class DocumentService:
    def __init__(
        self,
        db: Client,
        vector_service: VectorDBService,
    ):
        self.db = db
        self.vector_service = vector_service

    async def get_documents(self, user_id: str) -> list:
        response = (
            self.db.table("user_library")
            .select("documents(*)")
            .eq("user_id", user_id)
            .execute()
        )

        documents = []

        for row in response.data:
            doc = row.get("documents")
            if doc:
                documents.append(
                    {
                        "id": doc.get("id"),
                        "name": doc.get("file_name"),  # Rename for frontend
                        "status": doc.get("status"),
                        "size": doc.get("file_size"),  # Standardize key
                        "pageCount": doc.get("page_count", 0),
                        "uploadedAt": doc.get("created_at"),  # Rename for frontend
                    }
                )

        return documents

    async def delete_document(self, document_id: str, user_id: str):
        """
        Delete a document for the current user. If no other users reference
        the document, also remove the document row, vectors, and storage file.

        Args:
            document_id: The ID of the document to delete
            user_id: The ID of the user deleting the document
        """
        # Remove the user -> document link
        delete_link = (
            self.db.table("user_library")
            .delete()
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .execute()
        )

        # If nothing was deleted, the user didn't have that document
        if not delete_link.data:
            raise HTTPException(status_code=404, detail="Document not found for user")

        # Check if other users still reference this document
        remaining = (
            self.db.table("user_library")
            .select("*")
            .eq("document_id", document_id)
            .execute()
        )

        fully_deleted = False
        remaining_user_links = len(remaining.data) if remaining.data else 0

        # If no remaining links, remove document row, vectors, and storage object
        if not remaining.data:
            fully_deleted = True
            # Delete vector embeddings
            await self.vector_service.delete_document_vectors(document_id)

            # Fetch document to get storage path
            doc_response = (
                self.db.table("documents")
                .select("*")
                .eq("id", document_id)
                .maybe_single()
                .execute()
            )

            file_path = None
            if doc_response and doc_response.data:
                file_path = doc_response.data.get("file_path")

            # Delete storage object (ignore failures)
            try:
                if file_path:
                    self.db.storage.from_("pdfs").remove([file_path])
            except Exception as e:
                print(f"Storage delete warning: {e}")

            # Delete the document row
            try:
                self.db.table("documents").delete().eq("id", document_id).execute()
            except Exception as e:
                print(f"DB delete warning: {e}")

        return {
            "document": {
                "document_id": document_id,
                "fully_deleted": fully_deleted,
                "remaining_user_links": remaining_user_links,
            },
            "message": "Document deleted.",
        }

    async def view_document(self, document_id: str, user_id: str):
        result = (
            self.db.table("user_library")
            .select("document_id, user_id, documents(file_name, file_path)")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=403,
                detail="Unauthorized: Document not found in your library.",
            )

        file_path = result.data["documents"]["file_path"]
        display_name = result.data["documents"]["file_name"]
        is_pdf = file_path.lower().endswith(".pdf")

        # If it's a PDF, we want 'inline' (preview).
        # If it's PPTX, we want 'attachment' (download), since browsers can't natively show .pptx
        if is_pdf:
            # no 'download' option = browser tries to view it inline
            signed_url_res = self.db.storage.from_("pdfs").create_signed_url(
                file_path, expires_in=60
            )
        else:
            # include 'download' option = browser forces a download
            signed_url_res = self.db.storage.from_("pdfs").create_signed_url(
                file_path, expires_in=60, options={"download": display_name}
            )

        return {
            "url": signed_url_res["signedUrl"],
            "name": display_name,
            "is_pdf": is_pdf,
        }
