import logging
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from backend.utils import SearchRequestParams, Facets

logger = logging.getLogger(__name__)

# Create router for advanced_ai search API
router = APIRouter(prefix="/api/advanced_ai", tags=["advanced_ai"])

class ChatRequest(BaseModel):
    """Chat request with optional search context."""
    message: str = Field(description="User's chat message")
    search_params: Optional[SearchRequestParams] = Field(
        default=None,
        description="Current search parameters"
    )
    search_results: Optional[list] = Field(
        default=None,
        description="List of search result properties"
    )
    facets: Optional[Facets] = Field(
        default=None,
        description="Facet counts for filtering options"
    )
    total: Optional[int] = Field(
        default=None,
        ge=0,
        description="Total number of search results"
    )

@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that receives user messages with optional search context."""
    logger.info("=" * 60)
    logger.info("POST /api/advanced_ai/chat - Chat request received")
    logger.info(f"  Message: {request.message}")
    
    if request.search_params:
        logger.info(f"  Search params: {request.search_params}")
    if request.search_results:
        logger.info(f"  Search results: {len(request.search_results)} properties")
    if request.facets:
        logger.info(f"  Facets: {list(request.facets.keys())}")
    if request.total is not None:
        logger.info(f"  Total results: {request.total}")
    
    # Simulate thinking time (0.5 seconds)
    import asyncio
    await asyncio.sleep(0.5)
    
    # Echo back the message (for now - this will be replaced with actual AI logic)
    response = f'you said "{request.message}"'
    if request.search_results:
        response += f' (with {len(request.search_results)} search results)'
    logger.info(f"  Response: {response}")
    logger.info("=" * 60)
    
    return {"response": response}
