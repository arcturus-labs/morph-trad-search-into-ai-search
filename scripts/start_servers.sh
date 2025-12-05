#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory (parent of scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOGS_DIR="$PROJECT_ROOT/logs"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Delete existing log files
echo -e "${YELLOW}Clearing old log files...${NC}"
rm -f "$LOGS_DIR/backend.txt" "$LOGS_DIR/frontend.txt"
echo -e "${GREEN}Log files cleared${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if servers are already running
echo -e "${YELLOW}Checking if servers are already running...${NC}"
if check_port 3000; then
    echo -e "${RED}Error: Frontend server is already running on port 3000${NC}"
    exit 1
fi

if check_port 8000; then
    echo -e "${RED}Error: Backend server is already running on port 8000${NC}"
    exit 1
fi

echo -e "${GREEN}Ports 3000 and 8000 are free${NC}"

# Check if UV is installed
if ! command -v uv &> /dev/null; then
    echo -e "${RED}Error: UV is not installed. Please install it first:${NC}"
    echo -e "${YELLOW}curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
    exit 1
fi

# Check and install backend dependencies with UV
echo -e "${YELLOW}Checking backend dependencies...${NC}"
cd "$BACKEND_DIR"

# Create virtual environment with UV if it doesn't exist
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment with UV...${NC}"
    uv venv
fi

# Install dependencies with UV from requirements.txt
echo -e "${YELLOW}Installing backend dependencies with UV...${NC}"
uv pip install -r requirements.txt

# Check and install frontend dependencies
echo -e "${YELLOW}Checking frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/next" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
else
    echo -e "${GREEN}Frontend dependencies are installed${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}Frontend server stopped${NC}"
    fi
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend server with UV
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$BACKEND_DIR"
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000 > "$LOGS_DIR/backend.txt" 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$FRONTEND_DIR"
npm run dev > "$LOGS_DIR/frontend.txt" 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

# Check if processes are still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Error: Backend server failed to start. Check logs/backend.txt${NC}"
    cleanup
    exit 1
fi

if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}Error: Frontend server failed to start. Check logs/frontend.txt${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID) - http://localhost:8000${NC}"
echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID) - http://localhost:3000${NC}"
echo -e "${GREEN}✓ Logs are being written to logs/backend.txt and logs/frontend.txt${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

