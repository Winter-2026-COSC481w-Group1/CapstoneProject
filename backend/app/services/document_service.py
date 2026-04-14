from datetime import datetime, timezone
from dateutil import parser

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
            .is_("deleted_at", "null")
            .execute()
        )

        documents = []

        for row in response.data:
            doc = row.get("documents")
            if doc:
                documents.append(
                    {
                        "id": doc.get("id"),
                        "name": doc.get("file_name"),
                        "status": doc.get("status"),
                        "size": doc.get("file_size"),
                        "pageCount": doc.get("page_count", 0),
                        "uploadedAt": doc.get("created_at"),
                        "sections": doc.get("sections") or [],
                    }
                )

        return documents

    async def delete_document(self, document_id: str, user_id: str):
        """
        Soft-delete a document for the current user by setting deleted_at on
        the user_library row.  The file is NOT removed from storage until
        permanently deleted (either manually or by the 30-day auto-delete job).
        """
        deleted_at = datetime.now(timezone.utc).isoformat()

        result = (
            self.db.table("user_library")
            .update({"deleted_at": deleted_at})
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .is_("deleted_at", "null")
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Document not found for user")

        return {
            "document": {"document_id": document_id},
            "message": "Document moved to trash.",
        }

    async def get_trash_documents(self, user_id: str) -> list:
        """Return documents the user has soft-deleted (in the trash)."""
        response = (
            self.db.table("user_library")
            .select("deleted_at, documents(*)")
            .eq("user_id", user_id)
            .not_.is_("deleted_at", "null")
            .execute()
        )

        documents = []
        for row in response.data:
            doc = row.get("documents")
            if doc:
                deleted_at = row.get("deleted_at")
                # Calculate days remaining before auto-deletion (30 days)
                days_remaining = None
                if deleted_at:
                    deleted_dt = datetime.fromisoformat(parser.isoparse(deleted_at).isoformat())
                    elapsed = (datetime.now(timezone.utc) - deleted_dt).days
                    days_remaining = max(0, 30 - elapsed)

                documents.append(
                    {
                        "id": doc.get("id"),
                        "name": doc.get("file_name"),
                        "status": doc.get("status"),
                        "size": doc.get("file_size"),
                        "pageCount": doc.get("page_count", 0),
                        "uploadedAt": doc.get("created_at"),
                        "deletedAt": deleted_at,
                        "daysRemaining": days_remaining,
                    }
                )

        return documents

    async def restore_document(self, document_id: str, user_id: str):
        """Restore a soft-deleted document by clearing deleted_at."""
        result = (
            self.db.table("user_library")
            .update({"deleted_at": None})
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .not_.is_("deleted_at", "null")
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404, detail="Document not found in trash"
            )

        return {"message": "Document restored.", "document_id": document_id}

    async def permanent_delete_document(self, document_id: str, user_id: str):
        """
        Permanently delete a trashed document.  Removes the user_library row,
        and if no other users reference the document, also removes vectors,
        storage, and the document record.
        """
        # Confirm the document is in the user's trash
        check = (
            self.db.table("user_library")
            .select("document_id")
            .eq("user_id", user_id)
            .eq("document_id", document_id)
            .not_.is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not check.data:
            raise HTTPException(
                status_code=404, detail="Document not found in trash"
            )

        # Remove this user's link (trashed row)
        self.db.table("user_library").delete().eq("user_id", user_id).eq(
            "document_id", document_id
        ).execute()

        # Check if any OTHER users still reference this document (active or trashed)
        remaining = (
            self.db.table("user_library")
            .select("document_id")
            .eq("document_id", document_id)
            .execute()
        )

        fully_deleted = False
        if not remaining.data:
            fully_deleted = True
            await self.vector_service.delete_document_vectors(document_id)

            doc_response = (
                self.db.table("documents")
                .select("file_path")
                .eq("id", document_id)
                .maybe_single()
                .execute()
            )
            if doc_response and doc_response.data:
                file_path = doc_response.data.get("file_path")
                try:
                    if file_path:
                        self.db.storage.from_("pdfs").remove([file_path])
                except Exception as e:
                    print(f"Storage delete warning: {e}")

            try:
                self.db.table("documents").delete().eq("id", document_id).execute()
            except Exception as e:
                print(f"DB delete warning: {e}")

        return {
            "message": "Document permanently deleted.",
            "document_id": document_id,
            "fully_deleted": fully_deleted,
        }

    async def view_document(self, document_id: str, user_id: str):
        result = (
            self.db.table("user_library")
            .select("document_id, user_id, documents(file_name, file_path)")
            .eq("document_id", document_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
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

        if is_pdf:
            signed_url_res = self.db.storage.from_("pdfs").create_signed_url(
                file_path, expires_in=60
            )
        else:
            signed_url_res = self.db.storage.from_("pdfs").create_signed_url(
                file_path, expires_in=60, options={"download": display_name}
            )

        return {
            "url": signed_url_res["signedUrl"],
            "name": display_name,
            "is_pdf": is_pdf,
        }
