#!/bin/bash

# Fix VPS assets - ensure frontend is properly deployed
# Run this ON THE VPS

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/melvin/projects/FamilyToDo"

echo -e "${GREEN}🔧 Fixing VPS Assets${NC}"
echo ""

cd "$PROJECT_DIR" || exit 1

# Check current assets
echo -e "${YELLOW}Current backend assets:${NC}"
ls -la backend/public/assets/*.js | tail -3
echo ""

# Check frontend dist
echo -e "${YELLOW}Frontend dist assets:${NC}"
ls -la frontend/dist/assets/*.js 2>/dev/null | tail -3 || echo "No dist folder found"
echo ""

# Rebuild frontend
echo -e "${YELLOW}Rebuilding frontend...${NC}"
cd frontend
npm run build
cd ..
echo ""

# Clear old assets and copy new ones
echo -e "${YELLOW}Updating backend assets...${NC}"
rm -rf backend/public/assets
rm -f backend/public/*.js backend/public/*.html backend/public/*.webmanifest
cp -r frontend/dist/* backend/public/
echo ""

# Verify new assets
echo -e "${YELLOW}New backend assets:${NC}"
ls -la backend/public/assets/*.js | tail -3
echo ""

# Check which JS is in index.html
echo -e "${YELLOW}JS file in index.html:${NC}"
grep -o 'index-[^"]*\.js' backend/public/index.html
echo ""

# Restart PM2
echo -e "${YELLOW}Restarting application...${NC}"
if [ -f "/home/melvin/.npm-global/bin/pm2" ]; then
    /home/melvin/.npm-global/bin/pm2 restart familytodo
    echo -e "${GREEN}✓ Application restarted${NC}"
else
    echo -e "${RED}PM2 not found${NC}"
fi
echo ""

echo -e "${GREEN}✅ Assets fixed! Clear your browser cache and try again.${NC}"