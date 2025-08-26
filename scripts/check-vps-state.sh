#!/bin/bash

# Quick VPS state check script
# Run this ON THE VPS to check what's deployed

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_DIR="/home/melvin/projects/FamilyToDo"

echo -e "${GREEN}🔍 VPS State Check${NC}"
echo ""

cd "$PROJECT_DIR" || exit 1

# Check git commit
echo -e "${YELLOW}Current Git Commit:${NC}"
git log --oneline -1
echo ""

# Check if comments table exists
echo -e "${YELLOW}Database Tables:${NC}"
sqlite3 backend/data/familytodo.db ".tables" | grep -o '\w\+' | sort
echo ""

# Check if comments routes are in backend
echo -e "${YELLOW}Backend Routes:${NC}"
grep -q "app.use('/api/comments'" backend/src/index.js && echo "✓ Comments route registered" || echo "✗ Comments route not found"
grep -q "app.use('/api/upload'" backend/src/index.js && echo "✓ Upload route registered" || echo "✗ Upload route not found"
echo ""

# Check frontend assets
echo -e "${YELLOW}Frontend Asset Hash:${NC}"
ls backend/public/assets/index-*.js | xargs -n1 basename
echo ""

# Check which asset is in index.html
echo -e "${YELLOW}Asset in index.html:${NC}"
grep -o 'index-[^"]*\.js' backend/public/index.html
echo ""

# Check if CommentsSection exists in the JS
echo -e "${YELLOW}CommentsSection in JS:${NC}"
if grep -q "CommentsSection" backend/public/assets/index-*.js; then
    echo "✓ CommentsSection found in built JS"
else
    echo "✗ CommentsSection not found in built JS"
fi
echo ""

echo -e "${GREEN}If everything looks good but features don't work:${NC}"
echo "1. Clear browser cache completely (Cmd+Shift+Delete)"
echo "2. Try incognito/private mode"
echo "3. Check browser console for errors"