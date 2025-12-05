"""
Pydantic model for structured query parameters extracted from natural language queries.

This model represents the parameters that an agent extracts from user queries.
Note: The `q` (user's exact input) and `page` parameters are handled separately
and are NOT included in this model.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class QueryParameters(BaseModel):
    """Structured parameters extracted from natural language real estate queries."""
    
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
