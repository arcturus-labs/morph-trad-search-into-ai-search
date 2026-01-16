# This file is kept for backward compatibility but all endpoints have been moved to main.py
# The router is still included in main.py but it no longer defines any endpoints
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)

# Create router for traditional search API (empty - endpoints moved to main.py)
router = APIRouter(prefix="/api/traditional", tags=["traditional"])
