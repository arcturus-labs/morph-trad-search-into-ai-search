import logging
from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any, Annotated
from backend.query_interpreter import interpret_user_query
from backend.mock_data import MOCK_PROPERTIES
from backend.utils import (
    score_title_and_description,
    filter_properties,
    sort_properties,
    calculate_facets_excluding_filter,
    SearchRequestParams,
    SearchResponse,
    Facets,
    SummaryRequest,
)
from intermediate.logic import generate_search_summary

logger = logging.getLogger(__name__)

# Create router for intermediate_ai search API
router = APIRouter(prefix="/api/intermediate_ai", tags=["intermediate_ai"])

@router.get("/search", response_model=SearchResponse)
async def search(params: Annotated[SearchRequestParams, Query()]):
    """Search for properties with automatic query interpretation."""
    logger.info("=" * 60)
    logger.info("GET /api/intermediate_ai/search - Search request received")
    logger.info(f"  Query (user input): {params.q}")
    logger.info(f"  Title search: {params.title}")
    logger.info(f"  Description search: {params.description}")
    logger.info(f"  Property types: {params.property_type}")
    logger.info(f"  Bedrooms: {params.bedrooms}")
    logger.info(f"  Price range: ${params.min_price} - ${params.max_price}")
    logger.info(f"  Square feet: {params.min_sqft} - {params.max_sqft}")
    logger.info(f"  Sort: {params.sort}")
    
    interpreted_query = None
    
    # If q is provided, interpret it first
    # Note: Frontend routes to this endpoint only for new queries, not for facet changes
    if params.q:
        try:
            logger.info("  Interpreting user query...")
            interpreted_params = await interpret_user_query(q=params.q)
            
            if interpreted_params:
                interpreted_query = interpreted_params.model_dump(exclude_none=True)
                logger.info(f"  Interpretation successful: {interpreted_query}")
                
                # Merge interpreted parameters with provided parameters
                # Interpreted parameters take precedence for structured fields
                # But we preserve title/description from interpretation if they exist
                if interpreted_params.title:
                    params.title = interpreted_params.title
                elif interpreted_params.description:
                    params.title = interpreted_params.description
                
                if interpreted_params.description:
                    params.description = interpreted_params.description
                elif interpreted_params.title:
                    params.description = interpreted_params.title.lower()
                
                if interpreted_params.property_type:
                    params.property_type = ",".join(interpreted_params.property_type)
                
                if interpreted_params.bedrooms:
                    params.bedrooms = ",".join(interpreted_params.bedrooms)
                
                if interpreted_params.min_price is not None:
                    params.min_price = interpreted_params.min_price
                
                if interpreted_params.max_price is not None:
                    params.max_price = interpreted_params.max_price
                
                if interpreted_params.min_sqft is not None:
                    params.min_sqft = interpreted_params.min_sqft
                
                if interpreted_params.max_sqft is not None:
                    params.max_sqft = interpreted_params.max_sqft
                
                if interpreted_params.sort:
                    params.sort = interpreted_params.sort
                
                logger.info(f"  After merging interpretation:")
                logger.info(f"    Title: {params.title}")
                logger.info(f"    Description: {params.description}")
                logger.info(f"    Property types: {params.property_type}")
                logger.info(f"    Bedrooms: {params.bedrooms}")
                logger.info(f"    Price: ${params.min_price} - ${params.max_price}")
                logger.info(f"    Sqft: {params.min_sqft} - {params.max_sqft}")
                logger.info(f"    Sort: {params.sort}")
            else:
                logger.info("  Interpretation returned None (OpenAI API may not be configured)")
        except Exception as e:
            logger.warning(f"  Error interpreting query (non-blocking): {e}")
            # Continue with search even if interpretation fails
    
    # For now, if q is provided but title/description are not, use q
    effective_title = params.title if params.title is not None else params.q
    effective_description = params.description if params.description is not None else params.q
    
    # Parse comma-separated values
    property_types = params.property_type.split(",") if params.property_type else None
    bedroom_list = params.bedrooms.split(",") if params.bedrooms else None
    
    logger.info(f"  Parsed property types: {property_types}")
    logger.info(f"  Parsed bedrooms: {bedroom_list}")
    logger.info(f"  Effective title: {effective_title}")
    logger.info(f"  Effective description: {effective_description}")
    
    # Score properties based on title/description
    logger.info(f"  Starting with {len(MOCK_PROPERTIES)} total properties")
    scored_properties = score_title_and_description(
        MOCK_PROPERTIES,
        title=effective_title,
        description=effective_description,
    )
    
    # Filter properties
    filtered = filter_properties(
        scored_properties,
        title=effective_title,
        description=effective_description,
        property_type=property_types,
        bedrooms=bedroom_list,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
    )
    logger.info(f"  After filtering: {len(filtered)} properties")
    
    # Sort
    sorted_props = sort_properties(filtered, params.sort)
    logger.info(f"  After sorting by '{params.sort}': {len(sorted_props)} properties")
    
    # Limit to 10 results (but keep total count)
    total = len(sorted_props)
    limited_results = sorted_props[:10]
    logger.info(f"  Limiting results: showing {len(limited_results)} of {total} properties")
    
    # Calculate facets from filtered results, excluding each facet group's own filter
    property_type_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=bool(property_types),
        exclude_bedrooms=False,
        exclude_price=False,
        exclude_sqft=False,
        title=effective_title,
        description=effective_description,
        property_type=property_types,
        bedrooms=bedroom_list,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
    )
    
    bedrooms_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=bool(bedroom_list),
        exclude_price=False,
        exclude_sqft=False,
        title=effective_title,
        description=effective_description,
        property_type=property_types,
        bedrooms=bedroom_list,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
    )
    
    has_price_filter = params.min_price is not None or params.max_price is not None
    price_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=False,
        exclude_price=has_price_filter,
        exclude_sqft=False,
        title=effective_title,
        description=effective_description,
        property_type=property_types,
        bedrooms=bedroom_list,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
    )
    
    has_sqft_filter = params.min_sqft is not None or params.max_sqft is not None
    sqft_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=False,
        exclude_price=False,
        exclude_sqft=has_sqft_filter,
        title=effective_title,
        description=effective_description,
        property_type=property_types,
        bedrooms=bedroom_list,
        min_price=params.min_price,
        max_price=params.max_price,
        min_sqft=params.min_sqft,
        max_sqft=params.max_sqft,
    )
    
    # Combine all facets
    facets = {
        "property_type": property_type_facets["property_type"],
        "bedrooms": bedrooms_facets["bedrooms"],
        "price_ranges": price_facets["price_ranges"],
        "square_feet_ranges": sqft_facets["square_feet_ranges"],
    }
    logger.info(f"  Facets calculated: {len(facets)} facet groups")
    
    logger.info(f"  Returning {len(limited_results)} of {total} results")
    logger.info("=" * 60)
    
    # Build facets model
    facets_model = Facets(
        property_type=facets["property_type"],
        bedrooms=facets["bedrooms"],
        price_ranges=facets["price_ranges"],
        square_feet_ranges=facets["square_feet_ranges"],
    )
    
    # Return search results along with interpreted query
    # FastAPI will automatically serialize the Pydantic model to JSON
    return SearchResponse(
        results=limited_results,
        total=total,
        facets=facets_model,
        interpreted_query=interpreted_query,
    )

@router.post("/summary")
async def summary(request: SummaryRequest):
    """Generate an AI-powered summary of search results and suggest related search ideas."""
    logger.info("=" * 60)
    logger.info("POST /api/intermediate_ai/summary - Summary request received")
    logger.info(f"  Query: {request.q}")
    logger.info(f"  Title: {request.title}")
    logger.info(f"  Description: {request.description}")
    logger.info(f"  Property types: {request.property_type}")
    logger.info(f"  Bedrooms: {request.bedrooms}")
    logger.info(f"  Price range: ${request.min_price} - ${request.max_price}")
    logger.info(f"  Square feet: {request.min_sqft} - {request.max_sqft}")
    logger.info(f"  Total results: {request.total}")
    logger.info(f"  Results provided: {len(request.results) if request.results else 0} properties")
    
    try:
        summary_result = await generate_search_summary(
            q=request.q,
            title=request.title,
            description=request.description,
            property_type=request.property_type,
            bedrooms=request.bedrooms,
            min_price=request.min_price,
            max_price=request.max_price,
            min_sqft=request.min_sqft,
            max_sqft=request.max_sqft,
            total=request.total,
            results=request.results or [],
        )
        
        logger.info("  Summary generated successfully")
        logger.info("=" * 60)
        return summary_result
    except Exception as e:
        logger.error(f"  Error generating summary: {e}", exc_info=True)
        logger.info("=" * 60)
        # Return default summary on error
        return {
            "summary": "Searching for properties matching your criteria.",
            "search_ideas": []
        }
