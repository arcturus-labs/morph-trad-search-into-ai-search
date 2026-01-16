"""
Special AI logic for intermediate AI search features.
"""

import os
import json
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
    summary: str = Field(description="A contextualized summary of the search results, analyzing what was found in relation to what the user was searching for (2-3 sentences)")
    search_ideas: List[str] = Field(description="An array of 2-3 related search idea strings")


# Agent prompt for generating search summaries and ideas
SUMMARY_AGENT_PROMPT = """You are an AI assistant that helps users understand their real estate search results and discover new search ideas.

Your task is to:
1. Analyze the actual search results provided and provide a contextualized summary that ties together what the user was searching for with what was actually found
2. Suggest 2-3 related search ideas that might help them find what they're looking for

## Guidelines

### Summary
- Focus on analyzing the RESULTS, not restating the search query (the user already knows what they searched for)
- Look at the actual properties returned and identify patterns, commonalities, or notable characteristics
- Connect what they were searching for with what was actually found
- Mention specific details from the results (price ranges, neighborhoods, property types, sizes, etc.)
- Keep it concise (2-3 sentences)
- Examples of good summaries:
  - "Based on your search for 2-bedroom apartments, we found 12 properties ranging from $450k to $650k, mostly located in Mission District and SOMA. Many feature updated kitchens and modern amenities."
  - "Your search for family homes under $800k returned 8 properties, with 3-4 bedrooms averaging 1,800 sqft. Most are in Noe Valley and Pacific Heights, with several featuring yards and updated interiors."
  - "The spacious condos matching your criteria include 15 properties over 1,200 sqft, with prices from $600k to $950k. Many are in newer buildings with parking and modern finishes."

### Search Ideas
- Suggest 2-3 alternative or related searches based on the results and search intent
- Make them actionable and specific
- They should be natural language queries that users could type
- Consider what might complement or refine the current search based on what was found

## Output Format

Return a JSON object with:
- `summary`: A contextualized summary string analyzing the results (2-3 sentences)
- `search_ideas`: An array of 2-3 search idea strings

## Important Notes

- You will receive the full search results as JSON data
- Analyze the actual properties returned, not just the search parameters
- Look for patterns in price, location, size, features, etc.
- Connect the search intent with what was actually found
- Don't just restate what they searched for - tell them what they found
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
    results: Optional[List[Dict[str, Any]]] = None,
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
        results: Full list of search result properties (as dicts)
    
    Returns:
        Dict with 'summary' and 'search_ideas' keys
    """
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("OPENAI_API_KEY is not set, returning default summary")
        return {
            "summary": f"Found {total or 0} properties matching your search criteria.",
            "search_ideas": []
        }
    
    try:
        # Create the agent
        agent = _create_summary_agent()
        if agent is None:
            return {
                "summary": f"Found {total or 0} properties matching your search criteria.",
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
        
        # Add search results as JSON if provided
        if results:
            results_json = json.dumps(results, indent=2)
            context_message += "\n\nSearch results:\n" + results_json
        
        logger.info("Calling OpenAI Agents SDK to generate search summary...")
        logger.debug(f"Context: {context_message}")
        
        # Run the agent asynchronously
        result = await Runner.run(agent, context_message)
        
        # Extract the structured output
        summary_output = result.final_output
        
        # Convert to dict for JSON response
        output = summary_output.model_dump() if hasattr(summary_output, 'model_dump') else {
            "summary": f"Found {total or 0} properties matching your search criteria.",
            "search_ideas": []
        }
        
        logger.info("OpenAI Agents SDK summary generation completed successfully")
        logger.info(f"Summary: {output.get('summary', 'N/A')}")
        logger.info(f"Search ideas: {output.get('search_ideas', [])}")
        
        return output
        
    except Exception as e:
        logger.error(f"Error generating search summary with OpenAI Agents SDK: {e}", exc_info=True)
        return {
            "summary": f"Found {total or 0} properties matching your search criteria.",
            "search_ideas": []
        }
