# FamilyToDo Docker Deployment

## Overview
FamilyToDo is now deployed using Docker for better isolation and easier management.

## Quick Start

### Managing the Application
Use the `manage.sh` script for all operations:

```bash
# Start the application
./manage.sh start

# Stop the application
./manage.sh stop

# Restart the application
./manage.sh restart

# Check status and health
./manage.sh status

# View logs
./manage.sh logs
./manage.sh logs 100  # Last 100 lines

# Backup database
./manage.sh backup

# Update and rebuild
./manage.sh update
```

### Access Points
- **Public URL**: https://todo.vives.io (IP restricted)
- **Local**: http://localhost:4000
- **Tailscale**: http://100.112.235.46:4000

### IP Restrictions
Access is restricted to:
- Tailscale network (100.64.0.0/10)
- Home IP (69.112.2.237)
- Server local (127.0.0.1)

## Architecture

### Docker Setup
- **Image**: Multi-stage build (frontend + backend)
- **Container**: `familytodo`
- **Network**: `familytodo-network`
- **Volumes**: 
  - `./data:/app/data` (database)
  - `./uploads:/app/uploads` (user uploads)

### Ports
- **4000**: Application (HTTP)

### Health Check
- Endpoint: `/api/health`
- Interval: 30s
- Timeout: 3s

## Maintenance

### Database Backups
Automatic backups are stored in `/home/melvin/backups/`:
```bash
# Manual backup
./manage.sh backup

# Backups are kept for 10 versions
```

### Updating
```bash
# Pull latest changes and rebuild
./manage.sh update
```

### Logs
```bash
# View real-time logs
./manage.sh logs

# Check specific container logs
docker logs familytodo --tail=50 -f
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs familytodo

# Check port availability
lsof -i :4000

# Rebuild image
docker compose build --no-cache
docker compose up -d
```

### Health Check Failing
```bash
# Test health endpoint
curl http://localhost:4000/api/health

# Check container health
docker inspect familytodo --format='{{json .State.Health}}'
```

### Database Issues
```bash
# Restore from backup
cp /home/melvin/backups/familytodo_YYYYMMDD_HHMMSS.db ./data/familytodo.db
./manage.sh restart
```

## Previous Deployment (Deprecated)
- PM2 process has been removed
- Cron job for auto-deployment has been disabled
- Old PM2 logs have been cleaned up