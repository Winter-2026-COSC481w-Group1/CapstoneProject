from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.api.dependencies import get_vector_service, get_embedding_service
from app.auth import get_current_user

router = APIRouter()


class QueryRequest(BaseModel):
    prompt: str
    document_id: str
    top_k: int = 5


@router.post("")
async def get_exam_sources(
    request: QueryRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    vector_service=Depends(get_vector_service),
    embedding_service=Depends(get_embedding_service),
):
    user_id = current_user["user_id"]

    # generate the embedding for the search term
    query_vector = await embedding_service.embed_query(request.prompt)

    filters = {
        "$and": [
            {"user_id": {"$eq": user_id}},
            {"document_id": {"$eq": request.document_id}},
        ]
    }

    # query the Vector DB with a Metadata Filter
    # filtering by user_id AND document_id
    raw_results = await vector_service.query(
        data=query_vector,
        limit=request.top_k,
        filters=filters,
    )

    # raw_results is a list of objects or tuples; we map them to dicts
    formatted_results = []
    for item in raw_results:
        # vecs results usually follow: (id, metadata) if include_value=False
        formatted_results.append(
            {
                "id": item[0],
                "metadata": item[1],
            }
        )

    return {"results": formatted_results}
