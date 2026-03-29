from fastapi import HTTPException
from app.schemas.activity import Activity
from typing import List
from supabase import Client

class ActivityService:
    def __init__(self, db_client: Client):
        self.db_client = db_client

    async def get_recentActivity(self, user_id: str) -> List[Activity]:
        #get 5 most recent assessments created
        assessment_response = (
            self.db_client.table("assessments")
                .select("id, title, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(5).execute()
        )
        assessment_activity = assessment_response.data

        #get 5 most recent document uploads
        upload_response = (
            self.db_client.table("user_library")
                .select("document_id, uploaded_at, documents(file_name)")
                .eq("user_id", user_id)
                .order("uploaded_at", desc = True)
                .limit(5).execute()
        )
        upload_activity = upload_response.data

        #merge the results
        combined = []

        #add assessments
        for a in assessment_activity:
            combined.append(
                Activity(
                    id=a["id"],
                    type="exam-created",
                    name=a["title"],
                    timeStamp=a["created_at"]
                )
        )
            
        #add uploads
        for u in upload_activity:
            combined.append(
                Activity(
                    id = u["document_id"],
                    type = "file-uploaded",
                    name = u.get("documents", {}).get("file_name", "Unkown Document"),
                    timeStamp = u["uploaded_at"]
            )
        )
            
        #sort list
        combined.sort(key = lambda x: x.timeStamp, reverse = True)

        return combined[:5]
