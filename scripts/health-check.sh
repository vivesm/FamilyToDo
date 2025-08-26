#!/bin/bash

# FamilyToDo Health Check Script
# Performs comprehensive health checks on the application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:4000"}
TIMEOUT=5
VERBOSE=${VERBOSE:-false}

# Health check results
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_TOTAL=0

# Functions
log_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
}

log_failure() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
    ((CHECKS_TOTAL++))
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}ℹ${NC} $1"
    fi
}

log_section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

# Check if service is reachable
check_service_reachable() {
    log_section "Service Availability"
    
    if curl -sf --max-time $TIMEOUT "$BASE_URL" > /dev/null 2>&1; then
        log_success "Service is reachable at $BASE_URL"
    else
        log_failure "Service is not reachable at $BASE_URL"
        return 1
    fi
}

# Check API health endpoint
check_api_health() {
    log_section "API Health"
    
    RESPONSE=$(curl -sf --max-time $TIMEOUT "$BASE_URL/api/health" 2>/dev/null || echo "FAILED")
    
    if [ "$RESPONSE" != "FAILED" ]; then
        log_success "API health endpoint responding"
        
        if [ "$VERBOSE" = true ]; then
            echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        fi
        
        # Check database connection in health response
        if echo "$RESPONSE" | grep -q '"database".*"connected"'; then
            log_success "Database connection healthy"
        elif echo "$RESPONSE" | grep -q "database"; then
            log_warning "Database status unclear"
        fi
    else
        log_failure "API health endpoint not responding"
        return 1
    fi
}

# Check critical API endpoints
check_api_endpoints() {
    log_section "API Endpoints"
    
    # Define critical endpoints to check
    ENDPOINTS=(
        "/api/people"
        "/api/categories"
        "/api/tasks"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        if curl -sf --max-time $TIMEOUT "$BASE_URL$endpoint" > /dev/null 2>&1; then
            log_success "Endpoint $endpoint is accessible"
        else
            log_failure "Endpoint $endpoint is not accessible"
        fi
    done
}

# Check WebSocket connectivity
check_websocket() {
    log_section "WebSocket Connection"
    
    # Check if socket.io endpoint responds
    if curl -sf --max-time $TIMEOUT "$BASE_URL/socket.io/?EIO=4&transport=polling" > /dev/null 2>&1; then
        log_success "Socket.io endpoint is accessible"
    else
        log_warning "Socket.io endpoint not accessible (may be normal if not in use)"
    fi
}

# Check static assets
check_static_assets() {
    log_section "Static Assets"
    
    # Check if frontend assets are being served
    if curl -sf --max-time $TIMEOUT "$BASE_URL/assets/" > /dev/null 2>&1 || \
       curl -sf --max-time $TIMEOUT "$BASE_URL/index.html" > /dev/null 2>&1 || \
       curl -sf --max-time $TIMEOUT "$BASE_URL/" | grep -q "<!DOCTYPE html>" 2>/dev/null; then
        log_success "Frontend assets are being served"
    else
        log_warning "Frontend assets may not be properly configured"
    fi
    
    # Check uploads directory
    if curl -sf --max-time $TIMEOUT "$BASE_URL/uploads/" > /dev/null 2>&1; then
        log_info "Uploads directory is accessible"
    else
        log_info "Uploads directory is protected (expected)"
    fi
}

# Check Docker containers (if using Docker)
check_docker() {
    log_section "Docker Status"
    
    if command -v docker &> /dev/null; then
        if docker ps | grep -q "familytodo"; then
            log_success "FamilyToDo Docker container is running"
            
            # Check container health
            HEALTH=$(docker inspect familytodo --format='{{.State.Health.Status}}' 2>/dev/null || echo "none")
            if [ "$HEALTH" = "healthy" ]; then
                log_success "Docker container is healthy"
            elif [ "$HEALTH" = "none" ]; then
                log_info "No health check configured for container"
            else
                log_warning "Docker container health: $HEALTH"
            fi
        else
            log_warning "FamilyToDo Docker container not found"
        fi
    else
        log_info "Docker not installed (checking PM2 instead)"
        check_pm2
    fi
}

# Check PM2 process (if using PM2)
check_pm2() {
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "familytodo"; then
            log_success "FamilyToDo PM2 process is running"
            
            # Get process status
            STATUS=$(pm2 describe familytodo | grep "status" | awk '{print $4}')
            if [ "$STATUS" = "online" ]; then
                log_success "PM2 process is online"
            else
                log_warning "PM2 process status: $STATUS"
            fi
        else
            log_warning "FamilyToDo PM2 process not found"
        fi
    else
        log_info "PM2 not installed"
    fi
}

# Check system resources
check_system_resources() {
    log_section "System Resources"
    
    # Check disk space
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        log_success "Disk usage is healthy ($DISK_USAGE%)"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        log_warning "Disk usage is high ($DISK_USAGE%)"
    else
        log_failure "Disk usage is critical ($DISK_USAGE%)"
    fi
    
    # Check memory
    if command -v free &> /dev/null; then
        MEM_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
        if [ "$MEM_USAGE" -lt 80 ]; then
            log_success "Memory usage is healthy ($MEM_USAGE%)"
        elif [ "$MEM_USAGE" -lt 90 ]; then
            log_warning "Memory usage is high ($MEM_USAGE%)"
        else
            log_failure "Memory usage is critical ($MEM_USAGE%)"
        fi
    fi
    
    # Check load average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    CPU_CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "1")
    
    if (( $(echo "$LOAD_AVG < $CPU_CORES" | bc -l) )); then
        log_success "System load is healthy ($LOAD_AVG)"
    else
        log_warning "System load is high ($LOAD_AVG)"
    fi
}

# Check database
check_database() {
    log_section "Database"
    
    DB_PATH="./backend/data/familytodo.db"
    
    if [ -f "$DB_PATH" ]; then
        log_success "Database file exists"
        
        # Check database size
        DB_SIZE=$(du -h "$DB_PATH" | cut -f1)
        log_info "Database size: $DB_SIZE"
        
        # Check if database is locked
        if command -v sqlite3 &> /dev/null; then
            if sqlite3 "$DB_PATH" "SELECT 1;" &> /dev/null; then
                log_success "Database is accessible"
            else
                log_failure "Database appears to be locked or corrupted"
            fi
        fi
    else
        log_warning "Database file not found at expected location"
    fi
}

# Check SSL certificate (if configured)
check_ssl() {
    log_section "SSL Certificate"
    
    # Try HTTPS endpoint
    HTTPS_URL=$(echo "$BASE_URL" | sed 's/http:/https:/')
    
    if curl -sf --max-time $TIMEOUT "$HTTPS_URL" > /dev/null 2>&1; then
        log_success "HTTPS is configured and working"
        
        # Check certificate expiry
        if command -v openssl &> /dev/null; then
            EXPIRY=$(echo | openssl s_client -connect "${HTTPS_URL#https://}:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep notAfter | cut -d= -f2)
            if [ -n "$EXPIRY" ]; then
                log_info "Certificate expires: $EXPIRY"
            fi
        fi
    else
        log_info "HTTPS not configured (using HTTP)"
    fi
}

# Generate summary
generate_summary() {
    log_section "Health Check Summary"
    
    echo -e "\n${BLUE}═══════════════════════════════${NC}"
    echo -e "Total Checks: ${CHECKS_TOTAL}"
    echo -e "Passed: ${GREEN}${CHECKS_PASSED}${NC}"
    echo -e "Failed: ${RED}${CHECKS_FAILED}${NC}"
    
    if [ "$CHECKS_FAILED" -eq 0 ]; then
        echo -e "\n${GREEN}✓ All health checks passed!${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}⚠ Some health checks failed${NC}"
        exit 1
    fi
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--url)
                BASE_URL="$2"
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  -u, --url URL     Base URL to check (default: http://localhost:4000)"
                echo "  -v, --verbose     Enable verbose output"
                echo "  -h, --help        Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main execution
main() {
    parse_args "$@"
    
    echo -e "${BLUE}FamilyToDo Health Check${NC}"
    echo -e "Checking: $BASE_URL"
    echo -e "${BLUE}═══════════════════════════════${NC}"
    
    # Run health checks
    check_service_reachable
    check_api_health
    check_api_endpoints
    check_websocket
    check_static_assets
    check_docker
    check_system_resources
    check_database
    check_ssl
    
    # Generate summary
    generate_summary
}

# Run main function
main "$@"