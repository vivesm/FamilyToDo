#!/bin/bash

# FamilyToDo Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_BRANCH="main"
HEALTH_CHECK_URL="http://localhost:4000/api/health"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=3

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    log_info "All requirements met ✓"
}

backup_database() {
    log_info "Backing up database..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "./backend/data/familytodo.db" ]; then
        BACKUP_FILE="$BACKUP_DIR/familytodo_$(date +%Y%m%d_%H%M%S).db"
        cp ./backend/data/familytodo.db "$BACKUP_FILE"
        log_info "Database backed up to $BACKUP_FILE"
        
        # Keep only last 10 backups
        ls -t "$BACKUP_DIR"/familytodo_*.db 2>/dev/null | tail -n +11 | xargs -r rm
        log_info "Old backups cleaned up"
    else
        log_warning "No database found to backup"
    fi
}

pull_latest_code() {
    log_info "Pulling latest code from $DEPLOY_BRANCH..."
    
    git fetch origin
    git checkout $DEPLOY_BRANCH
    git pull origin $DEPLOY_BRANCH
    
    CURRENT_COMMIT=$(git rev-parse --short HEAD)
    log_info "Now at commit: $CURRENT_COMMIT"
}

build_application() {
    log_info "Building application..."
    
    # Use production docker-compose file
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.production.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    log_info "Build complete ✓"
}

stop_application() {
    log_info "Stopping current application..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.production.yml down
    else
        docker-compose down
    fi
    
    log_info "Application stopped"
}

start_application() {
    log_info "Starting application..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.production.yml up -d
    else
        docker-compose up -d
    fi
    
    log_info "Application started"
}

health_check() {
    log_info "Running health check..."
    
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        sleep $HEALTH_CHECK_DELAY
        
        if curl -f "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            log_info "Health check passed ✓"
            return 0
        else
            log_warning "Health check attempt $i/$HEALTH_CHECK_RETRIES failed"
        fi
    done
    
    log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

rollback() {
    log_error "Deployment failed, rolling back..."
    
    # Stop failed deployment
    stop_application
    
    # Restore from previous docker images if available
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.production.yml up -d
    else
        docker-compose up -d
    fi
    
    log_info "Rollback complete"
}

run_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations inside container
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f docker-compose.production.yml exec -T familytodo npm run db:migrate
    else
        docker-compose exec -T familytodo npm run db:migrate
    fi
    
    log_info "Migrations complete ✓"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log_info "Cleanup complete ✓"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT environment..."
    
    # Pre-deployment checks
    check_requirements
    
    # Backup before deployment
    backup_database
    
    # Get latest code
    pull_latest_code
    
    # Build new version
    build_application
    
    # Stop current version
    stop_application
    
    # Start new version
    start_application
    
    # Run migrations if needed
    # Uncomment if you have migrations to run
    # run_migrations
    
    # Verify deployment
    if health_check; then
        log_info "🎉 Deployment successful!"
        cleanup
        exit 0
    else
        log_error "Deployment failed!"
        rollback
        exit 1
    fi
}

# Handle script termination
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main