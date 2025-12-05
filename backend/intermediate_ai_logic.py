"""
Special AI logic for intermediate AI search features.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from agents import Agent, Runner

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class SearchSummaryOutput(BaseModel):
    """Structured output for search summary and ideas."""
    summary: str = Field(description="A brief summary of what the user is searching for (1-2 sentences)")
    search_ideas: List[str] = Field(description="An array of 2-3 related search idea strings")


# Agent prompt for generating search summaries and ideas
SUMMARY_AGENT_PROMPT = """You are an AI assistant that helps users understand their real estate search results and discover new search ideas.

Your task is to:
1. Provide a brief, helpful summary of what the user is searching for based on their current filters and query
2. Suggest 2-3 related search ideas that might help them find what they're looking for

## Guidelines

### Summary
- Keep it concise (1-2 sentences)
- Describe what they're searching for in natural language
- Mention key filters if relevant (e.g., "affordable 2-bedroom apartments" or "family homes under $800k")

### Search Ideas
- Suggest 2-3 alternative or related searches
- Make them actionable and specific
- They should be natural language queries that users could type
- Examples:
  - If searching "2 bedroom apartments", suggest "2 bedroom condos" or "1-2 bedroom apartments with parking"
  - If searching "family home under 800k", suggest "3-4 bedroom houses" or "family homes with yard"
  - If searching "spacious condos", suggest "large condos with parking" or "2+ bedroom condos"

## Output Format

Return a JSON object with:
- `summary`: A brief summary string (1-2 sentences)
- `search_ideas`: An array of 2-3 search idea strings

## Examples

### Example 1
Input: Query="2 bedroom apartments", property_type=["apartment"], bedrooms=["2"]
Output:
{
  "summary": "You're searching for 2-bedroom apartments. These properties offer a good balance of space and affordability.",
  "search_ideas": [
    "2 bedroom condos",
    "1-2 bedroom apartments with parking",
    "2 bedroom apartments under $600k"
  ]
}

### Example 2
Input: Query="family home", bedrooms=["3", "4", "5"], max_price=800000
Output:
{
  "summary": "You're looking for family homes with 3-5 bedrooms under $800,000. These properties are ideal for families needing space and affordability.",
  "search_ideas": [
    "3-4 bedroom houses with yard",
    "family homes near schools",
    "4 bedroom houses under $750k"
  ]
}

### Example 3
Input: Query="spacious condos", min_sqft=1200, property_type=["condo"]
Output:
{
  "summary": "You're searching for spacious condos with at least 1,200 square feet. These properties offer comfortable living space in a condo setting.",
  "search_ideas": [
    "large condos with parking",
    "2+ bedroom condos over 1500 sqft",
    "spacious condos with modern amenities"
  ]
}
"""


def _create_summary_agent() -> Optional[Agent]:
    """Create and configure the summary agent."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        return None
    
    try:
        # Create agent with instructions and structured output type
        agent = Agent(
            name="Search Summary Generator",
            instructions=SUMMARY_AGENT_PROMPT,
            output_type=SearchSummaryOutput,
            model="gpt-4.1",
        )
        
        return agent
    except Exception as e:
        logger.error(f"Error creating summary agent: {e}", exc_info=True)
        return None


async def generate_search_summary(
    q: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    property_type: Optional[str] = None,
    bedrooms: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_sqft: Optional[int] = None,
    max_sqft: Optional[int] = None,
    total: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Generate a search summary and related search ideas using AI.
    
    Args:
        q: User's search query
        title: Search term for property title
        description: Search term for property description
        property_type: Comma-separated property types
        bedrooms: Comma-separated bedroom counts
        min_price: Minimum price
        max_price: Maximum price
        min_sqft: Minimum square feet
        max_sqft: Maximum square feet
        total: Total number of results
    
    Returns:
        Dict with 'summary' and 'search_ideas' keys
    """
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY is not set, returning default summary")
        return {
            "summary": "Searching for properties matching your criteria.",
            "search_ideas": []
        }
    
    try:
        # Create the agent
        agent = _create_summary_agent()
        if agent is None:
            return {
                "summary": "Searching for properties matching your criteria.",
                "search_ideas": []
            }
        
        # Build the context message
        context_parts = []
        if q:
            context_parts.append(f'Query: "{q}"')
        if title:
            context_parts.append(f'Title search: "{title}"')
        if description:
            context_parts.append(f'Description search: "{description}"')
        if property_type:
            context_parts.append(f'Property types: {property_type}')
        if bedrooms:
            context_parts.append(f'Bedrooms: {bedrooms}')
        if min_price is not None:
            context_parts.append(f'Min price: ${min_price:,}')
        if max_price is not None:
            context_parts.append(f'Max price: ${max_price:,}')
        if min_sqft is not None:
            context_parts.append(f'Min square feet: {min_sqft:,}')
        if max_sqft is not None:
            context_parts.append(f'Max square feet: {max_sqft:,}')
        if total is not None:
            context_parts.append(f'Total results: {total}')
        
        context_message = "Current search parameters:\n" + "\n".join(context_parts)
        
        logger.info("Calling OpenAI Agents SDK to generate search summary...")
        logger.debug(f"Context: {context_message}")
        
        # Run the agent asynchronously
        result = await Runner.run(agent, context_message)
        
        # Extract the structured output
        summary_output = result.final_output
        
        # Convert to dict for JSON response
        output = summary_output.model_dump() if hasattr(summary_output, 'model_dump') else {
            "summary": "Searching for properties matching your criteria.",
            "search_ideas": []
        }
        
        logger.info("OpenAI Agents SDK summary generation completed successfully")
        logger.info(f"Summary: {output.get('summary', 'N/A')}")
        logger.info(f"Search ideas: {output.get('search_ideas', [])}")
        
        return output
        
    except Exception as e:
        logger.error(f"Error generating search summary with OpenAI Agents SDK: {e}", exc_info=True)
        return {
            "summary": "Searching for properties matching your criteria.",
            "search_ideas": []
        }
