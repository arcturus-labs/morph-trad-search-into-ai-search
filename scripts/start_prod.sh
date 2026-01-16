#!/bin/bash

# Production startup script for Fly.io
# Runs both FastAPI backend and Next.js frontend

set -e

# Function to check if a port is listening using Python
check_port() {
    local port=$1
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Use Python to check if port is listening
        if /app/backend/.venv/bin/python -c "import socket; s = socket.socket(); s.settimeout(1); result = s.connect_ex(('localhost', $port)); s.close(); exit(0 if result == 0 else 1)" 2>/dev/null; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Start backend in background
echo "Starting backend server..."
cd /app/backend

# Use the virtual environment's Python directly
/app/backend/.venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start and verify it's listening
echo "Waiting for backend to start..."
if check_port 8000; then
    echo "Backend started successfully on port 8000"
else
    echo "ERROR: Backend failed to start on port 8000"
    echo "Backend logs:"
    cat /tmp/backend.log
    exit 1
fi

# Start frontend (using standalone server)
echo "Starting frontend server..."
cd /app/frontend
node server.js > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start and verify it's listening
echo "Waiting for frontend to start..."
if check_port 3000; then
    echo "Frontend started successfully on port 3000"
else
    echo "ERROR: Frontend failed to start on port 3000"
    echo "Frontend logs:"
    cat /tmp/frontend.log
    cleanup
    exit 1
fi

echo "Both servers are running. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

