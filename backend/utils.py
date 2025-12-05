"""
Utility functions and models for the backend.
"""

import copy
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class QueryParameters(BaseModel):
    """Structured parameters extracted from natural language real estate queries.
    
    This model represents the parameters that an agent extracts from user queries.
    Note: The `q` (user's exact input) and `page` parameters are handled separately
    and are NOT included in this model.
    """
    
    title: Optional[str] = Field(
        default=None,
        description="Search term for property title. Only includes text NOT mapped to structured parameters. Use title case."
    )
    
    description: Optional[str] = Field(
        default=None,
        description="Search term for property description. Only includes text NOT mapped to structured parameters. Use lowercase."
    )
    
    property_type: Optional[List[str]] = Field(
        default=None,
        description="Comma-separated property types. Valid values: 'house', 'condo', 'apartment', 'townhouse'"
    )
    
    bedrooms: Optional[List[str]] = Field(
        default=None,
        description="Comma-separated bedroom counts. Valid values: '0', '1', '2', '3', '4', '5' (as strings)"
    )
    
    min_price: Optional[int] = Field(
        default=None,
        ge=0,
        description="Minimum price in dollars"
    )
    
    max_price: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum price in dollars"
    )
    
    min_sqft: Optional[int] = Field(
        default=None,
        ge=0,
        description="Minimum square footage"
    )
    
    max_sqft: Optional[int] = Field(
        default=None,
        ge=0,
        description="Maximum square footage"
    )
    
    sort: Optional[str] = Field(
        default="relevance",
        description="Sort order. Valid values: 'relevance', 'price_asc', 'price_desc', 'newest'"
    )
    
    @field_validator('property_type')
    @classmethod
    def validate_property_type(cls, v):
        """Validate property_type values."""
        if v is None:
            return v
        valid_types = {'house', 'condo', 'apartment', 'townhouse'}
        invalid = [pt for pt in v if pt not in valid_types]
        if invalid:
            raise ValueError(f"Invalid property_type values: {invalid}. Must be one of {valid_types}")
        return v
    
    @field_validator('bedrooms')
    @classmethod
    def validate_bedrooms(cls, v):
        """Validate bedroom values."""
        if v is None:
            return v
        valid_bedrooms = {'0', '1', '2', '3', '4', '5'}
        invalid = [b for b in v if b not in valid_bedrooms]
        if invalid:
            raise ValueError(f"Invalid bedroom values: {invalid}. Must be one of {valid_bedrooms}")
        return v
    
    @field_validator('sort')
    @classmethod
    def validate_sort(cls, v):
        """Validate sort value."""
        valid_sorts = {'relevance', 'price_asc', 'price_desc', 'newest'}
        if v not in valid_sorts:
            raise ValueError(f"Invalid sort value: {v}. Must be one of {valid_sorts}")
        return v
    
    @model_validator(mode='after')
    def validate_ranges(self):
        """Validate that min_price <= max_price and min_sqft <= max_sqft if both are provided."""
        if self.min_price is not None and self.max_price is not None:
            if self.min_price > self.max_price:
                raise ValueError(f"min_price ({self.min_price}) cannot be greater than max_price ({self.max_price})")
        
        if self.min_sqft is not None and self.max_sqft is not None:
            if self.min_sqft > self.max_sqft:
                raise ValueError(f"min_sqft ({self.min_sqft}) cannot be greater than max_sqft ({self.max_sqft})")
        
        return self
    
    def to_url_params(self) -> dict:
        """Convert to URL parameter format (for FastAPI Query parameters)."""
        params = {}
        
        if self.title:
            params['title'] = self.title
        if self.description:
            params['description'] = self.description
        if self.property_type:
            params['property_type'] = ','.join(self.property_type)
        if self.bedrooms:
            params['bedrooms'] = ','.join(self.bedrooms)
        if self.min_price is not None:
            params['min_price'] = self.min_price
        if self.max_price is not None:
            params['max_price'] = self.max_price
        if self.min_sqft is not None:
            params['min_sqft'] = self.min_sqft
        if self.max_sqft is not None:
            params['max_sqft'] = self.max_sqft
        if self.sort:
            params['sort'] = self.sort
        
        return params


def score_title_and_description(
    properties: List[Dict[str, Any]],
    title: Optional[str] = None,
    description: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Score properties based on title and description matches.
    
    Returns a deep copy of properties with score fields added.
    Score is 0 if no matches, or sum of matching words from title and description.
    """
    scored = copy.deepcopy(properties)
    
    # Initialize scores to 0
    for prop in scored:
        prop["score"] = 0
    
    # Calculate relevance scores based on title matches
    if title:
        title_words = [word.lower() for word in title.split() if word.strip()]
        for prop in scored:
            prop_title_words = [word.lower() for word in prop["title"].split() if word.strip()]
            # Count how many title words match property title words
            matching_words = sum(1 for word in title_words if word in prop_title_words)
            prop["score"] += matching_words
    
    # Calculate relevance scores based on description matches
    if description:
        desc_words = [word.lower() for word in description.split() if word.strip()]
        for prop in scored:
            prop_desc_words = [word.lower() for word in prop["description"].split() if word.strip()]
            # Count how many description words match property description words
            matching_words = sum(1 for word in desc_words if word in prop_desc_words)
            prop["score"] += matching_words
    
    return scored


def filter_properties(
    properties: List[Dict[str, Any]],
    title: Optional[str] = None,
    description: Optional[str] = None,
    property_type: Optional[List[str]] = None,
    bedrooms: Optional[List[str]] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_sqft: Optional[int] = None,
    max_sqft: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Filter properties based on query parameters.
    
    Properties should already be scored via score_title_and_description().
    This function filters based on score (if title/description provided) and other filters.
    """
    filtered = copy.deepcopy(properties)
    initial_count = len(filtered)
    
    # Filter out properties with score of 0 (no relevance matches)
    # Only apply this filter if there is a text query (title or description)
    # If neither is present, all properties will have score 0, so we shouldn't filter them out
    if title or description:
        before_score = len(filtered)
        filtered = [p for p in filtered if p.get("score", 0) > 0]
        # If score filtering removed all items, fall back to showing all properties
        if len(filtered) == 0:
            filtered = copy.deepcopy(properties)
    
    # Property type filter
    if property_type:
        before = len(filtered)
        filtered = [p for p in filtered if p["property_type"] in property_type]
    
    # Bedrooms filter
    if bedrooms:
        bedroom_nums = [int(b) for b in bedrooms if b.isdigit()]
        before = len(filtered)
        filtered = [p for p in filtered if p["bedrooms"] in bedroom_nums]
    
    # Price filters
    if min_price is not None:
        before = len(filtered)
        filtered = [p for p in filtered if p["price"] >= min_price]
    if max_price is not None:
        before = len(filtered)
        filtered = [p for p in filtered if p["price"] <= max_price]
    
    # Square feet filters
    if min_sqft is not None:
        before = len(filtered)
        filtered = [p for p in filtered if p["square_feet"] >= min_sqft]
    if max_sqft is not None:
        before = len(filtered)
        filtered = [p for p in filtered if p["square_feet"] <= max_sqft]
    
    return filtered


def calculate_facets(properties: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate facet counts from properties."""
    facets = {
        "property_type": {},
        "bedrooms": {},
        "price_ranges": {
            "0-500000": 0,
            "500000-750000": 0,
            "750000-1000000": 0,
            "1000000-1500000": 0,
            "1500000-999999999": 0,
        },
        "square_feet_ranges": {
            "0-800": 0,
            "800-1200": 0,
            "1200-1800": 0,
            "1800-2500": 0,
            "2500-999999": 0,
        },
    }
    
    for prop in properties:
        # Property type
        pt = prop["property_type"]
        facets["property_type"][pt] = facets["property_type"].get(pt, 0) + 1
        
        # Bedrooms
        br = str(prop["bedrooms"])
        facets["bedrooms"][br] = facets["bedrooms"].get(br, 0) + 1
        
        # Price ranges
        price = prop["price"]
        if price < 500000:
            facets["price_ranges"]["0-500000"] += 1
        elif price < 750000:
            facets["price_ranges"]["500000-750000"] += 1
        elif price < 1000000:
            facets["price_ranges"]["750000-1000000"] += 1
        elif price < 1500000:
            facets["price_ranges"]["1000000-1500000"] += 1
        else:
            facets["price_ranges"]["1500000-999999999"] += 1
        
        # Square feet ranges
        sqft = prop["square_feet"]
        if sqft < 800:
            facets["square_feet_ranges"]["0-800"] += 1
        elif sqft < 1200:
            facets["square_feet_ranges"]["800-1200"] += 1
        elif sqft < 1800:
            facets["square_feet_ranges"]["1200-1800"] += 1
        elif sqft < 2500:
            facets["square_feet_ranges"]["1800-2500"] += 1
        else:
            facets["square_feet_ranges"]["2500-999999"] += 1
    
    return facets


def calculate_facets_excluding_filter(
    properties: List[Dict[str, Any]],
    exclude_property_type: bool = False,
    exclude_bedrooms: bool = False,
    exclude_price: bool = False,
    exclude_sqft: bool = False,
    title: Optional[str] = None,
    description: Optional[str] = None,
    property_type: Optional[List[str]] = None,
    bedrooms: Optional[List[str]] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_sqft: Optional[int] = None,
    max_sqft: Optional[int] = None,
) -> Dict[str, Any]:
    """Calculate facets from properties, excluding specified filters.
    
    Properties should already be scored via score_title_and_description().
    This allows showing all facet options even when some are selected.
    For example, if property_type filter is applied, we calculate facets
    from properties matching all other filters but not the property_type filter.
    """
    # Filter properties excluding the specified filter groups
    filtered = copy.deepcopy(properties)
    
    # Filter out properties with score of 0 (no relevance matches)
    # Only apply this filter if there is a text query (title or description)
    if title or description:
        filtered = [p for p in filtered if p.get("score", 0) > 0]
        # If score filtering removed all items, fall back to showing all properties
        if len(filtered) == 0:
            filtered = copy.deepcopy(properties)
    
    # Apply filters, excluding the ones specified
    if property_type and not exclude_property_type:
        filtered = [p for p in filtered if p["property_type"] in property_type]
    
    if bedrooms and not exclude_bedrooms:
        bedroom_nums = [int(b) for b in bedrooms if b.isdigit()]
        filtered = [p for p in filtered if p["bedrooms"] in bedroom_nums]
    
    if min_price is not None and not exclude_price:
        filtered = [p for p in filtered if p["price"] >= min_price]
    if max_price is not None and not exclude_price:
        filtered = [p for p in filtered if p["price"] <= max_price]
    
    if min_sqft is not None and not exclude_sqft:
        filtered = [p for p in filtered if p["square_feet"] >= min_sqft]
    if max_sqft is not None and not exclude_sqft:
        filtered = [p for p in filtered if p["square_feet"] <= max_sqft]
    
    # Calculate facets from the filtered properties
    return calculate_facets(filtered)


def sort_properties(properties: List[Dict[str, Any]], sort_by: str) -> List[Dict[str, Any]]:
    """Sort properties based on sort parameter."""
    if sort_by == "price_asc":
        return sorted(properties, key=lambda x: x["price"])
    elif sort_by == "price_desc":
        return sorted(properties, key=lambda x: x["price"], reverse=True)
    elif sort_by == "newest":
        return sorted(properties, key=lambda x: x["listing_date"], reverse=True)
    else:  # relevance (default) - sort by score descending (highest score first)
        properties = sorted(properties, key=lambda x: x.get("score", 0), reverse=True)
        return properties


async def search_properties(
    q: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    property_type: Optional[str] = None,
    bedrooms: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_sqft: Optional[int] = None,
    max_sqft: Optional[int] = None,
    sort: Optional[str] = "relevance",
    page: int = 1,
    per_page: int = 10,
    api_path: str = "/api/search",
    logger_instance: Optional[Any] = None,
    mock_properties: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Shared search implementation for properties.
    
    This function implements the search logic that is shared between
    traditional and beginner_ai search endpoints.
    
    Args:
        api_path: The API path prefix for logging (e.g., "/api/search" or "/api/beginner_ai/search")
        logger_instance: Logger instance to use for logging
        mock_properties: List of properties to search (defaults to importing from mock_data)
    """
    import logging
    from mock_data import MOCK_PROPERTIES
    
    if logger_instance is None:
        logger_instance = logging.getLogger(__name__)
    
    if mock_properties is None:
        mock_properties = MOCK_PROPERTIES
    
    logger_instance.info("=" * 60)
    logger_instance.info(f"GET {api_path} - Search request received")
    logger_instance.info(f"  Query (user input): {q}")
    logger_instance.info(f"  Title search: {title}")
    logger_instance.info(f"  Description search: {description}")
    logger_instance.info(f"  Property types: {property_type}")
    logger_instance.info(f"  Bedrooms: {bedrooms}")
    logger_instance.info(f"  Price range: ${min_price} - ${max_price}")
    logger_instance.info(f"  Square feet: {min_sqft} - {max_sqft}")
    logger_instance.info(f"  Sort: {sort}")
    logger_instance.info(f"  Page: {page}, Per page: {per_page}")
    
    # For now, if q is provided but title/description are not, mimic q
    # This allows backward compatibility while transitioning to separate title/description
    effective_title = title if title is not None else q
    effective_description = description if description is not None else q
    
    # Parse comma-separated values
    property_types = property_type.split(",") if property_type else None
    bedroom_list = bedrooms.split(",") if bedrooms else None
    
    logger_instance.info(f"  Parsed property types: {property_types}")
    logger_instance.info(f"  Parsed bedrooms: {bedroom_list}")
    logger_instance.info(f"  Effective title: {effective_title}")
    logger_instance.info(f"  Effective description: {effective_description}")
    
    # Score properties based on title/description (do this once)
    logger_instance.info(f"  Starting with {len(mock_properties)} total properties")
    scored_properties = score_title_and_description(
        mock_properties,
        title=effective_title,
        description=effective_description,
    )
    
    # Filter properties (using pre-scored properties)
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
    logger_instance.info(f"  After filtering: {len(filtered)} properties")
    
    # Sort
    sorted_props = sort_properties(filtered, sort)
    logger_instance.info(f"  After sorting by '{sort}': {len(sorted_props)} properties")
    
    # Paginate
    total = len(sorted_props)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = sorted_props[start:end]
    logger_instance.info(f"  Pagination: showing {len(paginated)} of {total} (page {page})")
    
    # Calculate facets from filtered results, excluding each facet group's own filter
    # This allows showing all facet options even when some are selected
    # Each facet group is calculated separately, excluding only its own filter
    # but including all other filters, so when one facet changes, others update accordingly
    
    # Calculate property_type facets (exclude property_type filter if applied, include all others)
    property_type_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=bool(property_types),  # Only exclude if filter is applied
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
    
    # Calculate bedrooms facets (exclude bedrooms filter if applied, include all others)
    bedrooms_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=bool(bedroom_list),  # Only exclude if filter is applied
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
    
    # Calculate price_ranges facets (exclude price filter if applied, include all others)
    has_price_filter = min_price is not None or max_price is not None
    price_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=False,
        exclude_price=has_price_filter,  # Only exclude if filter is applied
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
    
    # Calculate square_feet_ranges facets (exclude sqft filter if applied, include all others)
    has_sqft_filter = min_sqft is not None or max_sqft is not None
    sqft_facets = calculate_facets_excluding_filter(
        scored_properties,
        exclude_property_type=False,
        exclude_bedrooms=False,
        exclude_price=False,
        exclude_sqft=has_sqft_filter,  # Only exclude if filter is applied
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
    logger_instance.info(f"  Facets calculated: {len(facets)} facet groups")
    
    logger_instance.info(f"  Returning {len(paginated)} results")
    logger_instance.info("=" * 60)
    
    return {
        "results": paginated,
        "total": total,
        "page": page,
        "per_page": per_page,
        "facets": facets,
    }
