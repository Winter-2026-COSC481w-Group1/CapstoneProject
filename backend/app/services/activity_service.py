from fastapi import HTTPException
from app.schemas.activity import Activity
from typing import List


class ActivityService:
    def __init__(self, db_client: Client):
        self.db_client = db_client

    async def get_recentActivity(self, user_id: str) -> List[Activity]:
        #get 5 most recent assessments created
        assessment_activity = (
            self.db_client.table("assessments")
                .select("id," "title", "created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(5).execute()
        )

        #get 5 most recent document uploads
        upload_activity = (
            self.db_client.table("documents")
                .select("id", "file_name", "created_at")
                .eq("user_id", user_id)
                .order("created_at", desc = True)
                .limit(5).execute
        )

        #merge the results
        combined = []

        #add assessments
        for a in assessment_activity:
            combined.append(
                Activity(
                    id=a["id"],
                    type="assessment",
                    name=a["title"],
                    timeStamp=a["created_at"]
                )
        )
            
        #add uploads
        for u in upload_activity:
            combined.append(
                Activity(
                    id = u["id"],
                    type = "upload",
                    name = u["file_name"],
                    timeStamp = u["created_at"]
            )
        )
            
        #sort list
        combined.sort(key = lambda x: x.timeStamp, reverse = True)

        return combined[:5]
