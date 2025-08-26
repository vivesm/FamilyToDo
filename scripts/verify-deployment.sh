#!/bin/bash

# FamilyToDo Deployment Verification Script
# Run this ON THE VPS to verify the deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/melvin/projects/FamilyToDo"

echo -e "${GREEN}🔍 FamilyToDo Deployment Verification${NC}"
echo ""

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
}

# Check current git status
echo -e "${YELLOW}1. Git Status:${NC}"
git log --oneline -1
echo ""

# Check if CommentsSection.vue exists
echo -e "${YELLOW}2. Checking for new components:${NC}"
if [ -f "frontend/src/components/CommentsSection.vue" ]; then
    echo -e "${GREEN}✓ CommentsSection.vue exists${NC}"
else
    echo -e "${RED}✗ CommentsSection.vue not found${NC}"
fi
echo ""

# Check frontend build
echo -e "${YELLOW}3. Frontend assets in dist:${NC}"
ls -la frontend/dist/assets/*.js 2>/dev/null | tail -3
echo ""

# Check backend public assets
echo -e "${YELLOW}4. Backend public assets:${NC}"
ls -la backend/public/assets/*.js 2>/dev/null | tail -3
echo ""

# Check which JS file is referenced in index.html
echo -e "${YELLOW}5. JS file referenced in index.html:${NC}"
grep -o 'index-[^"]*\.js' backend/public/index.html || echo "No index.js found"
echo ""

# Clean old assets
echo -e "${YELLOW}6. Cleaning old assets...${NC}"
find backend/public/assets -name "*.js" -o -name "*.css" | wc -l
echo "Total asset files found"

# Check PM2 status
echo -e "${YELLOW}7. PM2 Status:${NC}"
if [ -f "/home/melvin/.npm-global/bin/pm2" ]; then
    /home/melvin/.npm-global/bin/pm2 list | grep familytodo || echo "FamilyToDo not found in PM2"
else
    echo "PM2 not found at expected location"
fi
echo ""

# Suggestion
echo -e "${GREEN}📋 To fix if assets are mismatched:${NC}"
echo "1. cd $PROJECT_DIR"
echo "2. cd frontend && npm run build"
echo "3. cd .. && rm -rf backend/public/assets"
echo "4. cp -r frontend/dist/* backend/public/"
echo "5. /home/melvin/.npm-global/bin/pm2 restart familytodo"
echo ""
echo -e "${YELLOW}Then clear your browser cache and refresh!${NC}"