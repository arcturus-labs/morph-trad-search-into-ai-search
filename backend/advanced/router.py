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
    total: Optional[int] = Field(
        default=None,
        ge=0,
        description="Total number of search results"
    )

class ChatResponse(BaseModel):
    """Chat response with optional search parameter updates."""
    message: str = Field(description="Assistant's response message")
    search_params: Optional[SearchRequestParams] = Field(
        default=None,
        description="Optional search parameters to update the search"
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
    if request.total is not None:
        logger.info(f"  Total results: {request.total}")
    
    # Check if this is a search update (empty message with search context)
    if (not request.message or request.message.strip() == "") and \
       request.search_params is not None and \
       request.search_results is not None and \
       request.total is not None:
        # This is a search update notification
        response_message = f"I see that the results are updated with {request.total} results."
        logger.info(f"  Response: {response_message}")
        logger.info("=" * 60)
        return ChatResponse(message=response_message)
    
    # Simple test: if message contains "house", filter by property type house
    message_lower = request.message.lower()
    if "house" in message_lower:
        response_message = "I'll show you a house"
        search_params = SearchRequestParams(property_type="house")
        logger.info(f"  Response: {response_message}")
        logger.info(f"  Search params: {search_params}")
        logger.info("=" * 60)
        return ChatResponse(message=response_message, search_params=search_params)
    
    # Simulate thinking time (0.5 seconds)
    import asyncio
    await asyncio.sleep(0.5)
    
    # Echo back the message (for now - this will be replaced with actual AI logic)
    response_message = f'you said "{request.message}"'
    if request.search_results:
        response_message += f' (with {len(request.search_results)} search results)'
    logger.info(f"  Response: {response_message}")
    logger.info("=" * 60)
    
    return ChatResponse(message=response_message)
