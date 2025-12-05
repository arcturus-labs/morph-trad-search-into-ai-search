"""
OpenAI agent for interpreting user queries into structured search parameters.
"""

import os
import logging
import time
from typing import Optional
from dotenv import load_dotenv
from agents import Agent, ModelSettings, Runner
from openai.types.shared import Reasoning
from utils import QueryParameters

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


# Agent prompt for interpreting user queries into structured parameters
AGENT_PROMPT = """You are an agent that converts natural language real estate search queries into structured search parameters. Your task is to extract structured data from user queries and determine what text should remain in the `title` and `description` fields for text-based search.

The output schema defines the structure and valid values. Your job is to interpret natural language and map it to these structured fields.

## Core Principle

You will receive the user's search text. Your job is to extract structured parameters from this text and determine what (if any) text should go in `title` and `description` fields. Only include text in `title`/`description` that is NOT already captured by structured parameters.

## Parameter Extraction Rules

### Property Type
- Map synonyms:
  - "home", "homes" → "house"
  - "studio" → "apartment" (with bedrooms=1)
  - "residence", "property", "dwelling" → infer from context or omit
- Can be multiple values: ["house", "townhouse"]

### Bedrooms
- Extract explicit bedroom counts: "1 bedroom", "2 bedroom", "3 bedroom", etc.
- Map semantic concepts:
  - "family", "family home" → [3, 4, 5] (family typically needs 3+ bedrooms)
  - "big family", "large family" → [4, 5]
  - "studio", "cozy" → [1]
  - "small" → [1, 2]
- Can be multiple values: ["3", "4", "5"]

### Price
- Extract price constraints:
  - "under X", "below X", "less than X" → `max_price=X`
  - "over X", "above X", "more than X", "at least X" → `min_price=X`
  - "X to Y", "X-Y", "between X and Y" → `min_price=X`, `max_price=Y`
- Convert abbreviations:
  - "800k" → 800000
  - "1 million" → 1000000
  - "1.5M" → 1500000
- Map semantic concepts:
  - "affordable" → `max_price=500000`
  - "luxury", "expensive" → `min_price=1000000` (or higher)

### Square Footage
- Extract explicit square footage: "1200 sqft", "1500 square feet"
- Map semantic concepts:
  - "spacious", "large", "big" → `min_sqft=1000` (or higher for "large")
  - "compact", "small", "cozy" → `max_sqft=1200` (or lower)
  - "very spacious", "huge" → `min_sqft=2500`
- Constraints:
  - "under X sqft" → `max_sqft=X`
  - "over X sqft" → `min_sqft=X`
  - "X to Y sqft" → `min_sqft=X`, `max_sqft=Y`

### Sort
- Map to sort options:
  - "new", "new listing", "just listed", "recent", "fresh", "hot" → `sort=newest`
  - "most expensive", "highest price", "luxury" → `sort=price_desc`
  - "cheapest", "lowest price", "affordable" → `sort=price_asc`
  - Default if no sort indication → `sort=relevance`

### Title and Description
- **CRITICAL**: Only include text that is NOT mapped to structured parameters
- If ALL information is mapped to parameters, leave `title` and `description` empty
- **When queries are primarily descriptive** (e.g., "renovated family home with tasteful updates"), include ALL descriptive text in title/description, even if some parts can map to structured parameters
- Keep descriptive terms that don't map to structured data:
  - Features: "parking", "HOA", "granite countertops", "hardwood floors", "bay views", "energy efficient windows", "natural light", "renovated", "updates", "improvements"
  - Locations: "downtown", "near parks", "close to grocery stores"
  - Qualities: "beautiful", "modern", "sunny", "bright", "comfortable", "move-in ready", "tasteful", "quality"
- Use minimal text: "parking" not "with parking", "bay views" not "with bay views"
- `title` should be title case, `description` should be lowercase
- If keeping text, preserve the key descriptive words but remove words that were mapped to parameters
- **Exception**: When a query is entirely descriptive with no clear structured parameters, include the full descriptive text in title/description

## Examples

### Example 1: "Family home under 800k"
- `bedrooms`: ["3", "4", "5"] (family → 3+ bedrooms)
- `property_type`: ["house", "townhouse"] (home → house types)
- `max_price`: 800000 (under 800k)
- `title`: "Family" (not mapped to parameters)
- `description`: "family" (not mapped to parameters)
- `sort`: "relevance" (default)

### Example 2: "Spacious 2 bedroom with parking"
- `bedrooms`: ["2"] (explicit)
- `min_sqft`: 1000 (spacious → min square footage)
- `title`: "Parking" (not mapped to parameters)
- `description`: "parking" (not mapped to parameters)
- `sort`: "relevance" (default)

### Example 3: "Affordable apartment"
- `property_type`: ["apartment"] (explicit)
- `max_price`: 500000 (affordable → price constraint)
- `title`: "" (all information mapped)
- `description`: "" (all information mapped)
- `sort`: "price_asc" (affordable implies sorting by price ascending)

### Example 4: "Small 1 or 2 bedroom apartments and condos"
- `bedrooms`: ["1", "2"] (explicit range)
- `property_type`: ["apartment", "condo"] (explicit)
- `title`: "Small" (not mapped to parameters)
- `description`: "small" (not mapped to parameters)
- `sort`: "relevance" (default)

### Example 5: "Beautiful 5 bedroom townhouse with HOA"
- `bedrooms`: ["5"] (explicit)
- `property_type`: ["townhouse"] (explicit)
- `title`: "Beautiful HOA" (not mapped to parameters)
- `description`: "beautiful HOA" (not mapped to parameters)
- `sort`: "relevance" (default)

### Example 6: "New listing downtown condo"
- `property_type`: ["condo"] (explicit)
- `sort`: "newest" (new listing → recency)
- `title`: "Downtown" (not mapped to parameters)
- `description`: "downtown" (not mapped to parameters)

### Example 7: "Sunny 2 bedroom house with bay views"
- `bedrooms`: ["2"] (explicit)
- `property_type`: ["house"] (explicit)
- `title`: "Sunny bay views" (not mapped to parameters)
- `description`: "sunny bay views" (not mapped to parameters)
- `sort`: "relevance" (default)

### Example 8: "Renovated family home with tasteful updates and quality improvements"
- `bedrooms`: ["3", "4", "5"] (family → 3+ bedrooms)
- `property_type`: ["house", "townhouse"] (home → house types)
- `title`: "Renovated Tasteful Updates Quality Improvements" (all descriptive terms preserved)
- `description`: "renovated tasteful updates quality improvements" (all descriptive terms preserved)
- `sort`: "relevance" (default)
- **Note**: Even though "family home" maps to structured parameters, the query is primarily descriptive, so all descriptive text goes in title/description

## Important Notes

1. **Be conservative with title/description** - only include text that truly isn't mapped
2. **Use null for optional fields** - don't include fields that aren't applicable
3. **Follow the output schema** - the schema defines valid values and structure"""


def _create_agent() -> Optional[Agent]:
    """Create and configure the OpenAI agent."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        return None
    
    try:
        # Create agent with instructions and structured output type
        agent = Agent(
            name="Query Interpreter",
            instructions=AGENT_PROMPT,
            output_type=QueryParameters,
            # unfortuntely there is not setting for "no reasoning" in the OpenAI Agents SDK, so we are using gpt-4.1 instead
            # this setting exists on the 5.1 models if we are using the model API, but I don't want to add all the boilerplate code for that here
            model="gpt-4.1" # "gpt-5-nano-2025-08-07", # "gpt-5.1-2025-11-13", "gpt-5-mini-2025-08-07", 
            # model_settings=ModelSettings(reasoning=Reasoning(effort=None))
        )
        
        return agent
    except Exception as e:
        logger.error(f"Error creating agent: {e}", exc_info=True)
        return None


async def interpret_query(q: Optional[str] = None) -> Optional[QueryParameters]:
    """
    Interpret user query using OpenAI Agents SDK.
    
    Takes the user's search query and uses an OpenAI agent to extract structured
    parameters according to the agent prompt.
    
    Args:
        q: User's search query (what they typed)
    
    Returns:
        QueryParameters object with interpreted parameters, or None if OpenAI API is not configured
    """
    if not q:
        logger.warning("No query provided. Skipping interpretation.")
        return None
        
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY is not set")
    
    try:
        # Create the agent
        agent = _create_agent()
        if agent is None:
            return None
        
        # Build the user message with just the search query
        query_text = f'User search query: "{q}"'
        
        logger.info("Calling OpenAI Agents SDK to interpret user query...")
        logger.debug(f"Query: {q}")
        
        # Run the agent asynchronously
        result = await Runner.run(agent, query_text)
        
        # Extract the structured output
        interpreted_params = result.final_output
        
        logger.info("OpenAI Agents SDK interpretation completed successfully")
        logger.info(f"Interpreted parameters: {interpreted_params.model_dump_json(indent=2)}")
        
        return interpreted_params
        
    except Exception as e:
        logger.error(f"Error interpreting user query with OpenAI Agents SDK: {e}", exc_info=True)
        return None
