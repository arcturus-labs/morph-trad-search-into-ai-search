#!/bin/bash

# Production startup script for Fly.io
# Runs both FastAPI backend and Next.js frontend

set -e

# Start backend in background
cd /app/backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend (using standalone server)
cd /app/frontend
node server.js &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 2

# Function to cleanup on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

