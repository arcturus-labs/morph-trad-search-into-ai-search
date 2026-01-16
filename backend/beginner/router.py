import logging
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from backend.query_interpreter import interpret_user_query

logger = logging.getLogger(__name__)

# Create router for beginner_ai search API
router = APIRouter(prefix="/api/beginner_ai", tags=["beginner_ai"])

@router.get("/interpret")
async def interpret_query(
    q: Optional[str] = Query(None, description="User's search query (what they typed)"),
):
    """Interpret user query using OpenAI agent and return structured parameters."""
    logger.info("=" * 60)
    logger.info("GET /api/beginner_ai/interpret - Interpret query request")
    logger.info(f"  Query (user input): {q}")
    
    if not q:
        logger.info("  No query provided, returning None")
        logger.info("=" * 60)
        return None
    
    try:
        interpreted_params = await interpret_user_query(q=q)
        
        if interpreted_params:
            # Convert to dict for JSON response
            result = interpreted_params.model_dump(exclude_none=True)
            logger.info(f"  Interpretation successful: {result}")
            logger.info("=" * 60)
            return result
        else:
            logger.info("  Interpretation returned None (OpenAI API may not be configured)")
            logger.info("=" * 60)
            return None
    except Exception as e:
        logger.error(f"  Error interpreting query: {e}", exc_info=True)
        logger.info("=" * 60)
        raise HTTPException(status_code=500, detail=f"Error interpreting query: {str(e)}")
