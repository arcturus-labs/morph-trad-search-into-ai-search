#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the project root directory (parent of scripts)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Check if Fly.io CLI is installed
if ! command -v fly &> /dev/null; then
    echo -e "${RED}Error: Fly.io CLI is not installed.${NC}"
    echo -e "${YELLOW}Install it with: curl -L https://fly.io/install.sh | sh${NC}"
    exit 1
fi

# Check if user is logged in to Fly.io
if ! fly auth whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Fly.io. Please login:${NC}"
    fly auth login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to login to Fly.io${NC}"
        exit 1
    fi
fi

# Read app name from fly.toml
cd "$PROJECT_ROOT"
APP_NAME=$(grep '^app' fly.toml | awk -F'"' '{print $2}')

if [ -z "$APP_NAME" ]; then
    echo -e "${RED}Error: Could not find app name in fly.toml${NC}"
    exit 1
fi

echo -e "${YELLOW}App name: $APP_NAME${NC}"

# Check if app exists by trying to get its status
echo -e "${YELLOW}Checking if app exists on Fly.io...${NC}"
if fly status --app "$APP_NAME" &>/dev/null; then
    echo -e "${GREEN}App '$APP_NAME' already exists${NC}"
else
    echo -e "${YELLOW}App '$APP_NAME' does not exist. Creating it...${NC}"
    CREATE_OUTPUT=$(fly apps create "$APP_NAME" 2>&1)
    CREATE_EXIT=$?
    
    if [ $CREATE_EXIT -eq 0 ]; then
        echo -e "${GREEN}App '$APP_NAME' created successfully${NC}"
    elif echo "$CREATE_OUTPUT" | grep -q "already been taken"; then
        echo -e "${GREEN}App '$APP_NAME' already exists (created in a previous run)${NC}"
    else
        echo -e "${RED}Failed to create app:${NC}"
        echo "$CREATE_OUTPUT"
        exit 1
    fi
fi

# Deploy the application
echo -e "${YELLOW}Deploying application to Fly.io...${NC}"
fly deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful!${NC}"
    echo -e "${GREEN}Your app is available at: https://$APP_NAME.fly.dev${NC}"
else
    echo -e "${RED}Deployment failed${NC}"
    exit 1
fi

