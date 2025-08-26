#!/bin/bash

# FamilyToDo VPS Deployment Script
# Run this script ON THE VPS to pull and deploy latest changes
# Usage: ./deploy-on-vps.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/melvin/projects/FamilyToDo"
BACKUP_DIR="/home/melvin/backups"

echo -e "${GREEN}🚀 Starting FamilyToDo deployment...${NC}"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
}

# Show current version
echo -e "${YELLOW}Current version:${NC}"
git log --oneline -1

# Backup database before deployment
if [ -f "backend/data/familytodo.db" ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/familytodo_$(date +%Y%m%d_%H%M%S).db"
    cp backend/data/familytodo.db "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to $BACKUP_FILE${NC}"
    
    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/familytodo_*.db 2>/dev/null | tail -n +11 | xargs -r rm
fi

# Pull latest changes from GitHub
echo -e "${YELLOW}Pulling latest changes...${NC}"
git fetch origin main
git reset --hard origin/main

# Show new version
echo -e "${GREEN}New version:${NC}"
git log --oneline -1

# Install/update dependencies if package.json changed
if git diff HEAD~1 HEAD --name-only | grep -q "package.json"; then
    echo -e "${YELLOW}Package.json changed, updating dependencies...${NC}"
    
    # Backend dependencies
    cd backend
    npm ci --production
    cd ..
    
    # Frontend build
    cd frontend
    npm ci
    npm run build
    cd ..
    
    # Copy frontend build to backend
    cp -r frontend/dist/* backend/public/
    echo -e "${GREEN}✓ Dependencies updated and frontend rebuilt${NC}"
else
    # Always rebuild frontend to ensure latest changes
    echo -e "${YELLOW}Rebuilding frontend...${NC}"
    cd frontend
    npm run build
    cd ..
    cp -r frontend/dist/* backend/public/
    echo -e "${GREEN}✓ Frontend rebuilt${NC}"
fi

# Run database migrations if any
if [ -d "backend/src/db/migrations" ]; then
    echo -e "${YELLOW}Checking for database migrations...${NC}"
    cd backend
    npm run db:migrate 2>/dev/null || echo "No migrations to run"
    cd ..
fi

# Restart application
echo -e "${YELLOW}Restarting application...${NC}"

# Check if using PM2
if command -v pm2 &> /dev/null; then
    # Check if familytodo is in PM2 list
    if pm2 list 2>/dev/null | grep -q "familytodo"; then
        pm2 restart familytodo
        echo -e "${GREEN}✓ Application restarted with PM2${NC}"
        pm2 status familytodo
    else
        # Try to start it if not running
        echo -e "${YELLOW}Starting application with PM2...${NC}"
        cd backend
        pm2 start npm --name familytodo -- start
        pm2 save
        cd ..
        echo -e "${GREEN}✓ Application started with PM2${NC}"
        pm2 status familytodo
    fi
    
# Check if using Docker Compose
elif command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.yml" ]; then
        docker-compose down
        docker-compose up -d
        echo -e "${GREEN}✓ Application restarted with Docker Compose${NC}"
        docker-compose ps
    else
        echo -e "${YELLOW}No docker-compose.yml found${NC}"
    fi
    
# Check if using systemd
elif [ -f "/etc/systemd/system/familytodo.service" ]; then
    sudo systemctl restart familytodo
    echo -e "${GREEN}✓ Application restarted with systemd${NC}"
    systemctl status familytodo --no-pager
    
# Try direct npm start as fallback
else
    echo -e "${YELLOW}No process manager detected, trying direct start...${NC}"
    cd backend
    
    # Kill any existing Node process on port 4000
    if lsof -i :4000 &> /dev/null; then
        echo -e "${YELLOW}Stopping existing process on port 4000...${NC}"
        kill $(lsof -t -i:4000) 2>/dev/null || true
        sleep 2
    fi
    
    # Start in background with nohup
    nohup npm start > ../familytodo.log 2>&1 &
    echo $! > ../familytodo.pid
    cd ..
    
    echo -e "${GREEN}✓ Application started in background${NC}"
    echo -e "${YELLOW}PID: $(cat familytodo.pid)${NC}"
    echo -e "${YELLOW}Logs: tail -f familytodo.log${NC}"
fi

# Health check
echo -e "${YELLOW}Performing health check...${NC}"
sleep 3

if curl -f http://localhost:4000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Show application URL
    echo -e "\n${GREEN}Application is running at:${NC}"
    echo "  - Public: https://todo.vives.io"
    echo "  - Tailscale: http://sbvps:4000"
    echo "  - Local: http://localhost:4000"
else
    echo -e "${RED}❌ Health check failed!${NC}"
    echo "Please check the application logs:"
    echo "  pm2 logs familytodo"
    echo "  docker-compose logs"
    exit 1
fi

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"