#!/bin/bash

# FamilyToDo Docker Management Script
# Usage: ./manage.sh [start|stop|restart|status|logs|backup]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/home/melvin/projects/FamilyToDo"
BACKUP_DIR="/home/melvin/backups"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
    exit 1
}

case "$1" in
    start)
        echo -e "${GREEN}🚀 Starting FamilyToDo...${NC}"
        docker compose up -d
        sleep 5
        docker compose ps
        ;;
    
    stop)
        echo -e "${YELLOW}🛑 Stopping FamilyToDo...${NC}"
        docker compose down
        ;;
    
    restart)
        echo -e "${YELLOW}🔄 Restarting FamilyToDo...${NC}"
        docker compose restart
        sleep 5
        docker compose ps
        ;;
    
    status)
        echo -e "${GREEN}📊 FamilyToDo Status:${NC}"
        docker compose ps
        echo -e "\n${GREEN}Health Check:${NC}"
        curl -s http://localhost:4000/api/health | jq '.' || echo "Health check failed"
        ;;
    
    logs)
        echo -e "${GREEN}📜 FamilyToDo Logs:${NC}"
        docker compose logs --tail="${2:-50}" -f
        ;;
    
    backup)
        echo -e "${GREEN}💾 Backing up database...${NC}"
        if [ -f "data/familytodo.db" ]; then
            mkdir -p "$BACKUP_DIR"
            BACKUP_FILE="$BACKUP_DIR/familytodo_$(date +%Y%m%d_%H%M%S).db"
            cp data/familytodo.db "$BACKUP_FILE"
            echo -e "${GREEN}✓ Database backed up to $BACKUP_FILE${NC}"
            
            # Keep only last 10 backups
            ls -t "$BACKUP_DIR"/familytodo_*.db 2>/dev/null | tail -n +11 | xargs -r rm
            echo -e "${GREEN}✓ Old backups cleaned up${NC}"
        else
            echo -e "${RED}No database found to backup${NC}"
        fi
        ;;
    
    update)
        echo -e "${GREEN}🔄 Updating FamilyToDo...${NC}"
        
        # Backup first
        "$0" backup
        
        # Pull latest changes
        echo -e "${YELLOW}Pulling latest changes...${NC}"
        git pull
        
        # Rebuild and restart
        echo -e "${YELLOW}Rebuilding Docker image...${NC}"
        docker compose build
        docker compose up -d
        
        sleep 5
        "$0" status
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backup|update}"
        echo "  start   - Start FamilyToDo container"
        echo "  stop    - Stop FamilyToDo container"
        echo "  restart - Restart FamilyToDo container"
        echo "  status  - Show container status and health"
        echo "  logs    - Show container logs (optional: logs 100 for last 100 lines)"
        echo "  backup  - Backup the database"
        echo "  update  - Pull latest code and rebuild"
        exit 1
        ;;
esac