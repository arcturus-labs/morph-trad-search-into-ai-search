# Ping Application

A simple Next.js frontend communicating with a FastAPI backend.

## Quick Start

The easiest way to start both servers is using the provided script:

```bash
./scripts/start_servers.sh
```

This script will:
- Check if servers are already running (exits if they are)
- Install dependencies if needed (uses UV for Python packages, npm for frontend)
- Start both servers in development/watch mode
- Log backend output to `logs/backend.txt`
- Log frontend output to `logs/frontend.txt`
- Handle Ctrl+C to gracefully stop both servers

**Note:** The script requires [UV](https://github.com/astral-sh/uv) to be installed. Install it with:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Manual Setup

### Backend (FastAPI with UV)

The backend uses [UV](https://github.com/astral-sh/uv) for fast Python package management.

1. Install UV (if not already installed):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Create virtual environment and install dependencies:
   ```bash
   uv venv
   uv sync
   ```

4. Run the FastAPI server:
   ```bash
   uv run uvicorn main:app --reload
   ```

   The backend will be available at `http://localhost:8000`

### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Deployment to Fly.io

This application is configured for deployment to Fly.io.

### Quick Deploy

Use the deployment script which will automatically create the app if it doesn't exist:

```bash
./scripts/deploy_fly.sh
```

### Manual Deploy

1. Install the Fly.io CLI:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Login to Fly.io:
   ```bash
   fly auth login
   ```

3. Create the app (if it doesn't exist):
   ```bash
   fly apps create ping-app
   ```

4. Deploy the application:
   ```bash
   fly deploy
   ```

The application will be available at `https://ping-app.fly.dev` (or your custom domain).

**Note:** Make sure to set the `ALLOWED_ORIGINS` environment variable in Fly.io to include your production domain:
```bash
fly secrets set ALLOWED_ORIGINS=https://ping-app.fly.dev
```

## Usage

1. Make sure both servers are running (backend on port 8000, frontend on port 3000)
2. Open `http://localhost:3000` in your browser
3. Click the "ping" button
4. The text box will display "pong" from the FastAPI backend

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI application
│   ├── pyproject.toml    # Python project configuration (UV)
│   └── requirements.txt  # Python dependencies (legacy, pyproject.toml is primary)
├── frontend/
│   ├── app/
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Main page with ping button
│   ├── package.json      # Node.js dependencies
│   └── next.config.js    # Next.js configuration
├── scripts/
│   ├── start_servers.sh  # Script to start both servers (dev)
│   ├── start_prod.sh     # Production startup script
│   └── deploy_fly.sh     # Deploy script for Fly.io
├── Dockerfile            # Docker configuration for Fly.io
├── fly.toml              # Fly.io configuration
├── logs/                 # Server logs (gitignored)
│   ├── backend.txt       # Backend server logs
│   └── frontend.txt      # Frontend server logs
└── README.md

```

