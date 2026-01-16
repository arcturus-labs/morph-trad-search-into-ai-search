"""
Chat agent for advanced AI search features.
"""

import os
import json
import logging
from typing import Dict, Any, List, Literal, Union
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from agents import Agent, Runner, function_tool
from backend.ai_query_interpreter import interpret_query

# Export for backwards compatibility
__all__ = ["process_chat_message", "ChatResponse"]
from backend.utils import QueryParameters

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""
    response_text: str = Field(description="Text response to display to the user")
    payload: Any = Field(description="Structured payload data")
    type: Literal["SearchSummaryOutput", "QueryParameters"] = Field(
        description="Type of payload data"
    )


@function_tool
async def interpret_search_query(q: str) -> Dict[str, Any]:
    """
    Interpret a user's natural language search query into structured search parameters.
    
    Use this tool when the user wants to search for properties. This will convert their
    natural language query (e.g., "2 bedroom apartments under 800k") into structured
    search parameters that can be used for searching.
    
    Args:
        q: The user's search query in natural language
    
    Returns:
        A dictionary containing the interpreted search parameters, or None if interpretation failed
    """
    logger.info(f"🔍 interpret_search_query tool called with query: {q}")
    interpreted = await interpret_query(q=q)
    if interpreted:
        result = interpreted.model_dump(exclude_none=True)
        result["q"] = q  # Include original query
        return result
    return {"error": "Could not interpret query"}


# Create chat agent prompt
CHAT_AGENT_PROMPT = """You are a helpful real estate search assistant. Your job is to help users search for properties.

When a user sends a message that looks like a property search query, you MUST use the interpret_search_query tool to interpret their query. After you receive the interpretation results, you MUST present the interpretation as a terse bulleted list showing each filter parameter and its value. Format it like this:
 
- Property type: [values]
- Bedrooms: [values]
- Price range: $[min] - $[max]
- Square footage: [min] - [max] sqft
- Title search: [text]
- Description search: [text]
- Sort: [value]

Only include filters that have values. Keep it concise and clear.

If the user's message is NOT a search query (e.g., "hello", "how does this work?", general questions), respond conversationally without using tools.

Always be helpful and friendly in your responses.
"""


def _create_chat_agent() -> Agent:
    """Create and configure the chat agent."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY is not set")
    
    # Create agent with instructions and tools
    agent = Agent(
        name="Real Estate Search Assistant",
        instructions=CHAT_AGENT_PROMPT,
        model="gpt-4.1",
        tools=[interpret_search_query],
    )
    
    return agent


async def process_chat_message(message: str) -> ChatResponse:
    """
    Process a chat message and return a structured response.
    
    Args:
        message: User's chat message
    
    Returns:
        ChatResponse with response_text, payload, and type
    """
    # Create the agent (will raise ValueError if OPENAI_API_KEY is not set)
    agent = _create_chat_agent()
    
    logger.info(f"💬 Processing chat message: {message}")
    
    try:
        # Let the agent handle the message and decide whether to use tools
        result = await Runner.run(agent, message)
        response_text = result.final_output if isinstance(result.final_output, str) else str(result.final_output)
        
        # Check if tools were used and extract payload if it's a search interpretation
        payload = None
        response_type = "QueryParameters"
        
        # Look through new_items to find tool call outputs
        if hasattr(result, 'new_items') and result.new_items:
            for item in reversed(result.new_items):  # Check in reverse to get the last tool call
                # Check if this item looks like a tool call output
                item_type = type(item).__name__ if hasattr(type(item), '__name__') else str(type(item))
                if 'ToolCallOutput' in item_type or (hasattr(item, 'tool_name') and hasattr(item, 'output')):
                    # Check if this is the interpret_search_query tool output
                    if hasattr(item, 'tool_name') and item.tool_name == 'interpret_search_query':
                        if hasattr(item, 'output') and item.output:
                            # The output might be a dict or a JSON string
                            output = item.output
                            if isinstance(output, str):
                                try:
                                    output = json.loads(output)
                                except json.JSONDecodeError:
                                    continue
                            if isinstance(output, dict) and 'q' in output:
                                # Extract the interpreted parameters as payload
                                payload = output
                                response_type = "QueryParameters"
                                break
        
        return ChatResponse(
            response_text=response_text,
            payload=payload,
            type=response_type,
        )
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}", exc_info=True)
        return ChatResponse(
            response_text="I'm sorry, I encountered an error processing your message. Please try again.",
            payload=None,
            type="QueryParameters",
        )
