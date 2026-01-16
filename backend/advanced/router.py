import os
import logging
import uuid
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv
from agents import Agent, Runner, SQLiteSession
from backend.utils import SearchRequestParams, Facets, QueryParameters

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Create router for advanced_ai search API
router = APIRouter(prefix="/api/advanced_ai", tags=["advanced_ai"])

# In-memory session store: maps session_id to SQLiteSession instances
# Using in-memory SQLite sessions (no db_path specified)
_sessions: dict[str, SQLiteSession] = {}

# Agent prompt for chat endpoint
CHAT_AGENT_PROMPT = """You are a helpful real estate search assistant. Your job is to understand user messages and determine if they are asking for a property search or just having a conversation.

## Your Responsibilities

1. **Determine Intent**: Is the user asking to search for properties, or are they just chatting/asking questions?
   - Search requests: "show me houses", "find 2 bedroom apartments", "I want something under 500k", "search for condos"
   - Chat/Questions: "hello", "how are you", "what can you do", "tell me about this property", general questions

2. **If it's a search request**: Extract structured search parameters using the following guidelines:
   - Property type: "house", "condo", "apartment", "townhouse"
   - Bedrooms: extract explicit counts or infer from context (e.g., "family" → 3-5 bedrooms)
   - Price: extract constraints like "under 500k", "over 1 million", "between 300k and 600k"
   - Square footage: extract explicit values or infer from "spacious", "small", etc.
   - Sort: "newest", "price_asc", "price_desc", or "relevance"
   - Title/Description: only include text NOT mapped to structured parameters

   Be mindful of the ongoing conversation and the existing search request and search results in order to understand context.

3. **Always provide a helpful message** explaining what you're doing:
   - If searching, something natural and friendlylike "Let's take a look at that. <and then go on to summarize the search request>" 
   - If chatting: Respond naturally and helpfully and be brief and to the point.
   - Be conversational and friendly

## Important Rules

- **DO NOT** return query_params if the user is just chatting - this would trigger an unwanted search
- **DO** return query_params if the user is clearly asking for a search
- **Always** include a message that explains your actions

## Examples

User: "Show me 3 bedroom houses"
→ message: "I'll search for 3 bedroom houses for you."
→ query_params: {bedrooms: ["3"], property_type: ["house"]}

User: "Hello, how are you?"
→ message: "Hello! I'm doing well, thank you. I'm here to help you find your perfect property. What are you looking for?"
→ query_params: null

User: "Find me a spacious apartment under 400k"
→ message: "Sure, let me search for spacious apartments under $400,000."
→ query_params: {property_type: ["apartment"], max_price: 400000, min_sqft: 1000}

User: "I'm looking for a house."
→ message: "I'd be happy to help! Could you tell me what type of property you're interested in?"
→ query_params: null (no search triggered)
"""


class ChatAgentOutput(BaseModel):
    """Output from the chat agent."""
    message: str = Field(description="Assistant's response message explaining what it's doing")
    query_params: Optional[QueryParameters] = Field(
        default=None,
        description="Extracted search parameters if the user is asking for a search. Leave null if just chatting."
    )


def _create_chat_agent() -> Optional[Agent]:
    """Create and configure the OpenAI agent for chat."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        logger.warning("OPENAI_API_KEY not set, chat agent will not be available")
        return None
    
    try:
        agent = Agent(
            name="Chat Assistant",
            instructions=CHAT_AGENT_PROMPT,
            output_type=ChatAgentOutput,
            model="gpt-4.1"
        )
        return agent
    except Exception as e:
        logger.error(f"Error creating chat agent: {e}", exc_info=True)
        return None


class ChatRequest(BaseModel):
    """Chat request with optional search context."""
    message: str = Field(description="User's chat message")
    session_id: Optional[str] = Field(
        default=None,
        description="Session ID for maintaining conversation context. If null, a new session will be created."
    )
    search_params: Optional[SearchRequestParams] = Field(
        default=None,
        description="Current search parameters"
    )
    search_results: Optional[list] = Field(
        default=None,
        description="List of search result properties"
    )
    total: Optional[int] = Field(
        default=None,
        ge=0,
        description="Total number of search results"
    )
    facets: Optional[Facets] = Field(
        default=None,
        description="Facet counts for filtering options"
    )

class ChatResponse(BaseModel):
    """Chat response with optional search parameter updates."""
    message: str = Field(description="Assistant's response message")
    session_id: str = Field(description="Session ID for maintaining conversation context")
    search_params: Optional[SearchRequestParams] = Field(
        default=None,
        description="Optional search parameters to update the search"
    )

@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat endpoint that receives user messages with optional search context."""
    logger.info("=" * 60)
    logger.info("POST /api/advanced_ai/chat - Chat request received")
    logger.info(f"  Message: {request.message}")
    logger.info(f"  Session ID: {request.session_id}")
    
    if request.search_params:
        logger.info(f"  Search params: {request.search_params}")
    if request.search_results:
        logger.info(f"  Search results: {len(request.search_results)} properties")
    if request.total is not None:
        logger.info(f"  Total results: {request.total}")
    if request.facets:
        logger.info(f"  Facets: {request.facets}")
    
    # If no message and no search params, don't respond
    if (not request.message or request.message.strip() == ""):
        logger.info("  No message and no search params - skipping response")
        logger.info("=" * 60)
        # Return early with existing session_id if provided, otherwise create minimal response
        return ChatResponse(
            message="",
            session_id=request.session_id or str(uuid.uuid4())
        )
    
    # Get or create session
    session_id = request.session_id
    if session_id is None:
        # Create new session with unique ID
        session_id = str(uuid.uuid4())
        session = SQLiteSession(session_id)  # In-memory session
        _sessions[session_id] = session
        logger.info(f"  Created new session: {session_id}")
    else:
        # Retrieve existing session or create if not found
        if session_id not in _sessions:
            logger.warning(f"  Session {session_id} not found, creating new session")
            session = SQLiteSession(session_id)
            _sessions[session_id] = session
        else:
            session = _sessions[session_id]
            logger.info(f"  Using existing session: {session_id}")
    
    # Check if this is a search update (empty message with search context)
    if (not request.message or request.message.strip() == "") and \
        request.search_params is not None and \
        request.search_results is not None and \
        request.total is not None and \
        request.total == 503:

        return ChatResponse(session_id=session_id)
    
    # Use AI agent to process the message
    try:
        agent = _create_chat_agent()
        if agent is None:
            # Fallback if agent is not available
            logger.warning("Chat agent not available, using fallback response")
            response_message = f"I received your message: '{request.message}'. However, the AI agent is not configured. Please set OPENAI_API_KEY to enable AI-powered chat."
            logger.info(f"  Response: {response_message}")
            logger.info("=" * 60)
            return ChatResponse(message=response_message, session_id=session_id)
        
        # Build context for the agent
        context_parts = [f'User message: "{request.message}"']
        
        if request.search_params:
            context_parts.append(f"\nCurrent search parameters: {request.search_params.model_dump_json(indent=2)}")
        
        if request.facets:
            context_parts.append(f"\nAvailable filter options (facets):")
            facets_dict = request.facets.model_dump()
            if facets_dict.get('property_type'):
                context_parts.append(f"  Property types: {facets_dict['property_type']}")
            if facets_dict.get('bedrooms'):
                context_parts.append(f"  Bedrooms: {facets_dict['bedrooms']}")
            if facets_dict.get('price_ranges'):
                context_parts.append(f"  Price ranges: {facets_dict['price_ranges']}")
            if facets_dict.get('square_feet_ranges'):
                context_parts.append(f"  Square feet ranges: {facets_dict['square_feet_ranges']}")
        
        if request.search_results:
            context_parts.append(f"\nCurrent search results: {len(request.search_results)} properties")
            if request.total is not None:
                context_parts.append(f"Total results: {request.total}")
            
            # Include actual search results so agent has visibility
            context_parts.append("\nSearch results details:")
            for i, prop in enumerate(request.search_results[:10], 1):  # Limit to first 10 for context
                prop_info = [
                    f"  {i}. {prop.get('title', 'N/A')}",
                    f"     Type: {prop.get('property_type', 'N/A')}, Bedrooms: {prop.get('bedrooms', 'N/A')}, Price: ${prop.get('price', 0):,}",
                    f"     Square feet: {prop.get('square_feet', 'N/A')}, Location: {prop.get('city', 'N/A')}, {prop.get('neighborhood', 'N/A')}",
                ]
                if prop.get('description'):
                    # Truncate description if too long
                    desc = prop['description']
                    if len(desc) > 200:
                        desc = desc[:200] + "..."
                    prop_info.append(f"     Description: {desc}")
                context_parts.append("\n".join(prop_info))
        
        user_message_with_context = "\n".join(context_parts)
        
        logger.info("Calling OpenAI Agents SDK for chat...")
        logger.debug(f"Context: {user_message_with_context}")
        
        # Run the agent with session for conversation memory
        result = await Runner.run(agent, user_message_with_context, session=session)
        agent_output = result.final_output
        
        logger.info("Chat agent response received")
        logger.info(f"  Message: {agent_output.message}")
        if agent_output.query_params:
            logger.info(f"  Query params: {agent_output.query_params.model_dump_json(indent=2)}")
        
        # Convert QueryParameters to SearchRequestParams if present
        search_params = None
        if agent_output.query_params:
            search_params = agent_output.query_params.to_search_request_params(
                merge_with=request.search_params
            )
            logger.info(f"  Converted search params: {search_params.model_dump_json(indent=2)}")
        
        logger.info("=" * 60)
        return ChatResponse(
            message=agent_output.message,
            session_id=session_id,
            search_params=search_params
        )
        
    except Exception as e:
        logger.error(f"Error processing chat with AI agent: {e}", exc_info=True)
        # Fallback response
        response_message = f"I encountered an error processing your message. Please try again."
        logger.info(f"  Response: {response_message}")
        logger.info("=" * 60)
        return ChatResponse(message=response_message, session_id=session_id)
