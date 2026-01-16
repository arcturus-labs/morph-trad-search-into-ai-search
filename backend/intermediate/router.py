import logging
from fastapi import APIRouter, Query, Body
from typing import Optional, List, Dict, Any
from backend.query_interpreter import interpret_user_query
from backend.mock_data import MOCK_PROPERTIES
from backend.utils import (
    score_title_and_description,
    filter_properties,
    sort_properties,
    calculate_facets_excluding_filter,
)
from intermediate.logic import generate_search_summary

logger = logging.getLogger(__name__)

# Create router for intermediate_ai search API
router = APIRouter(prefix="/api/intermediate_ai", tags=["intermediate_ai"])

@router.get("/search")
async def search(
    q: Optional[str] = Query(None, description="User's search query (what they typed)"),
    title: Optional[str] = Query(None, description="Search term for property title"),
    description: Optional[str] = Query(None, description="Search term for property description"),
    property_type: Optional[str] = Query(None, description="Comma-separated property types"),
    bedrooms: Optional[str] = Query(None, description="Comma-separated bedroom counts"),
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    min_sqft: Optional[int] = Query(None),
    max_sqft: Optional[int] = Query(None),
    sort: Optional[str] = Query("relevance", description="Sort order: relevance, price_asc, price_desc, newest"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
):
    """Search for properties with automatic query interpretation."""
    logger.info("=" * 60)
    logger.info("GET /api/intermediate_ai/search - Search request received")
    logger.info(f"  Query (user input): {q}")
    logger.info(f"  Title search: {title}")
    logger.info(f"  Description search: {description}")
    logger.info(f"  Property types: {property_type}")
    logger.info(f"  Bedrooms: {bedrooms}")
    logger.info(f"  Price range: ${min_price} - ${max_price}")
    logger.info(f"  Square feet: {min_sqft} - {max_sqft}")
    logger.info(f"  Sort: {sort}")
    logger.info(f"  Page: {page}, Per page: {per_page}")
    
    interpreted_query = None
    
    # If q is provided, interpret it first
    if q:
        try:
            logger.info("  Interpreting user query...")
            interpreted_params = await interpret_user_query(q=q)
            
            if interpreted_params:
                interpreted_query = interpreted_params.model_dump(exclude_none=True)
                logger.info(f"  Interpretation successful: {interpreted_query}")
                
                # Merge interpreted parameters with provided parameters
                # Interpreted parameters take precedence for structured fields
                # But we preserve title/description from interpretation if they exist
                if interpreted_params.title:
                    title = interpreted_params.title
                elif interpreted_params.description:
                    title = interpreted_params.description
                
                if interpreted_params.description:
                    description = interpreted_params.description
                elif interpreted_params.title:
                    description = interpreted_params.title.lower()
                
                if interpreted_params.property_type:
                    property_type = ",".join(interpreted_params.property_type)
                
                if interpreted_params.bedrooms:
                    bedrooms = ",".join(interpreted_params.bedrooms)
                
                if interpreted_params.min_price is not None:
                    min_price = interpreted_params.min_price
                
                if interpreted_params.max_price is not None:
                    max_price = interpreted_params.max_price
                
                if interpreted_params.min_sqft is not None:
                    min_sqft = interpreted_params.min_sqft
                
                if interpreted_params.max_sqft is not None:
                    max_sqft = interpreted_params.max_sqft
                
                if interpreted_params.sort:
                    sort = interpreted_params.sort
                
                logger.info(f"  After merging interpretation:")
                logger.info(f"    Title: {title}")
                logger.info(f"    Description: {description}")
                logger.info(f"    Property types: {property_type}")
                logger.info(f"    Bedrooms: {bedrooms}")
                logger.info(f"    Price: ${min_price} - ${max_price}")
                logger.info(f"    Sqft: {min_sqft} - {max_sqft}")
                logger.info(f"    Sort: {sort}")
            else:
                logger.info("  Interpretation returned None (OpenAI API may not be configured)")
        except Exception as e:
            logger.warning(f"  Error interpreting query (non-blocking): {e}")
            # Continue with search even if interpretation fails
    
    # For now, if q is provided but title/description are not, use q
    effective_title = title if title is not None else q
    effective_description = description if description is not None else q
    
    # Parse comma-separated values
    property_types = property_type.split(",") if property_type else None
    bedroom_list = bedrooms.split(",") if bedrooms else None
    
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
        min_price=min_price,
        max_price=max_price,
        min_sqft=min_sqft,
        max_sqft=max_sqft,
    )
    logger.info(f"  After filtering: {len(filtered)} properties")
    
    # Sort
    sorted_props = sort_properties(filtered, sort)
    logger.info(f"  After sorting by '{sort}': {len(sorted_props)} properties")
    
    # Paginate
    total = len(sorted_props)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = sorted_props[start:end]
    logger.info(f"  Pagination: showing {len(paginated)} of {total} (page {page})")
    
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
        min_price=min_price,
        max_price=max_price,
        min_sqft=min_sqft,
        max_sqft=max_sqft,
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
        min_price=min_price,
        max_price=max_price,
        min_sqft=min_sqft,
        max_sqft=max_sqft,
    )
    
    has_price_filter = min_price is not None or max_price is not None
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
        min_price=min_price,
        max_price=max_price,
        min_sqft=min_sqft,
        max_sqft=max_sqft,
    )
    
    has_sqft_filter = min_sqft is not None or max_sqft is not None
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
        min_price=min_price,
        max_price=max_price,
        min_sqft=min_sqft,
        max_sqft=max_sqft,
    )
    
    # Combine all facets
    facets = {
        "property_type": property_type_facets["property_type"],
        "bedrooms": bedrooms_facets["bedrooms"],
        "price_ranges": price_facets["price_ranges"],
        "square_feet_ranges": sqft_facets["square_feet_ranges"],
    }
    logger.info(f"  Facets calculated: {len(facets)} facet groups")
    
    logger.info(f"  Returning {len(paginated)} results")
    logger.info("=" * 60)
    
    # Return search results along with interpreted query
    result = {
        "results": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "facets": facets,
    }
    
    # Include interpreted query in response if available
    if interpreted_query:
        result["interpreted_query"] = interpreted_query
    
    return result

@router.post("/summary")
async def summary(
    q: Optional[str] = Body(None, description="User's search query (what they typed)"),
    title: Optional[str] = Body(None, description="Search term for property title"),
    description: Optional[str] = Body(None, description="Search term for property description"),
    property_type: Optional[str] = Body(None, description="Comma-separated property types"),
    bedrooms: Optional[str] = Body(None, description="Comma-separated bedroom counts"),
    min_price: Optional[int] = Body(None),
    max_price: Optional[int] = Body(None),
    min_sqft: Optional[int] = Body(None),
    max_sqft: Optional[int] = Body(None),
    total: Optional[int] = Body(None, description="Total number of search results"),
    results: Optional[List[Dict[str, Any]]] = Body(None, description="Full list of search results"),
):
    """Generate an AI-powered summary of search results and suggest related search ideas."""
    logger.info("=" * 60)
    logger.info("POST /api/intermediate_ai/summary - Summary request received")
    logger.info(f"  Query: {q}")
    logger.info(f"  Title: {title}")
    logger.info(f"  Description: {description}")
    logger.info(f"  Property types: {property_type}")
    logger.info(f"  Bedrooms: {bedrooms}")
    logger.info(f"  Price range: ${min_price} - ${max_price}")
    logger.info(f"  Square feet: {min_sqft} - {max_sqft}")
    logger.info(f"  Total results: {total}")
    logger.info(f"  Results provided: {len(results) if results else 0} properties")
    
    try:
        summary_result = await generate_search_summary(
            q=q,
            title=title,
            description=description,
            property_type=property_type,
            bedrooms=bedrooms,
            min_price=min_price,
            max_price=max_price,
            min_sqft=min_sqft,
            max_sqft=max_sqft,
            total=total,
            results=results or [],
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
