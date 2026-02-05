from supabase import Client


class DocumentService:
    def __init__(self, db: Client):
        self.db = db

    async def get_documents(self, user_id: str) -> list:
        response = (
            self.db.table("user_library")
            .select("documents(*)")
            .eq("user_id", user_id)
            .execute()
        )

        # extract the document part from each row
        return [row["documents"] for row in response.data if row.get("documents")]
