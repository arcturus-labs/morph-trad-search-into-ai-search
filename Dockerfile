# Multi-stage build for Next.js frontend and FastAPI backend

# Stage 1: Build Next.js frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Create public directory if it doesn't exist (Next.js may not create it)
RUN mkdir -p public
RUN npm run build

# Stage 2: Python backend with UV
FROM python:3.12-slim AS backend-setup
WORKDIR /app/backend

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy requirements first for better layer caching
COPY backend/pyproject.toml backend/requirements.txt ./

# Create venv and install dependencies
RUN uv venv && uv pip install -r requirements.txt

# Copy all backend source files (including subdirectories)
COPY backend/ ./

# Stage 3: Runtime
FROM python:3.12-slim
WORKDIR /app

# Install UV
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Node.js for running Next.js
RUN apt-get update && apt-get install -y nodejs npm && rm -rf /var/lib/apt/lists/*

# Copy entire backend directory from backend-setup (includes venv and all source files)
COPY --from=backend-setup /app/backend /app/backend

# Copy frontend standalone build
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
# Copy public directory (created in build stage if it didn't exist)
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Copy production startup script
COPY scripts/start_prod.sh /app/start_prod.sh
RUN chmod +x /app/start_prod.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_URL=http://localhost:8000
ENV ALLOWED_ORIGINS=http://localhost:3000

EXPOSE 3000 8000

CMD ["/app/start_prod.sh"]

