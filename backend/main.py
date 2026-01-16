import os
import logging
from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Annotated
from beginner.router import router as beginner_ai_router
from intermediate.router import router as intermediate_ai_router
from advanced.router import router as advanced_ai_router
from backend.mock_data import MOCK_PROPERTIES
from backend.utils import (
    calculate_facets,
    search_properties,
    SearchRequestParams,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI()

logger.info("=" * 60)
logger.info("Starting Property Search Backend")
logger.info("=" * 60)

# Get allowed origins from environment or default to localhost
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000"
).split(",")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared search endpoint - handles /api/search
# Note: /api/intermediate_ai/search is handled by its own router
@app.get("/api/search")
async def search(
    request: Request,
    params: Annotated[SearchRequestParams, Query()],
):
    """Search for properties with filters and sorting."""
    # Determine API path from the request URL
    api_path = request.url.path
    return await search_properties(
        q=params.q,
        title=params.title,
        description=params.description,
        property_type=params.property_type,
        bedrooms=params.bedrooms,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
        sort=params.sort,
        api_path=api_path,
        logger_instance=logger,
        mock_properties=MOCK_PROPERTIES,
    )

# Shared properties endpoint - handles /api/properties/{property_id}
@app.get("/api/properties/{property_id}")
async def get_property(property_id: str):
    """Get a single property by ID."""
    logger.info(f"GET /api/properties/{property_id} - Property detail request")
    for prop in MOCK_PROPERTIES:
        if prop["id"] == property_id:
            logger.info(f"  Found property: {prop['title']}")
            return prop
    logger.warning(f"  Property not found: {property_id}")
    raise HTTPException(status_code=404, detail="Property not found")

# Shared facets endpoint - handles /api/facets
@app.get("/api/facets")
async def get_facets():
    """Get available facets for all properties."""
    logger.info("GET /api/facets - Facets request")
    facets = calculate_facets(MOCK_PROPERTIES)
    logger.info(f"  Returning facets for {len(MOCK_PROPERTIES)} properties")
    return facets

# Include beginner_ai router for /interpret endpoint only
app.include_router(beginner_ai_router)
# Include intermediate_ai router for /interpret and /summary endpoints
app.include_router(intermediate_ai_router)
# Include advanced_ai router for /search and /summary endpoints
app.include_router(advanced_ai_router)

@app.get("/ping")
async def ping():
    logger.info("GET /ping - Health check requested")
    return {"message": "pong"}
