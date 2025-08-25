# FamilyToDo Deployment Guide

This guide covers various deployment options for FamilyToDo, from local network setup for iPad access to production deployment with Docker and cloud providers.

## Table of Contents
- [Local Network Deployment](#local-network-deployment)
- [Docker Deployment](#docker-deployment)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)
- [Backup & Recovery](#backup--recovery)
- [Monitoring & Maintenance](#monitoring--maintenance)

## Local Network Deployment

### iPad & Mobile Access on Same Network

FamilyToDo supports access from iPads and other devices on your local network without requiring cloud deployment.

#### 1. Configure Network Settings

Update `backend/.env`:
```env
# Allow connections from local network
CORS_ORIGIN=http://localhost:5173,http://192.168.1.*:5173,http://10.*:5173
ALLOWED_HOSTS=localhost,192.168.*,10.*,*.local

# Enable mDNS for easy discovery
MDNS_ENABLED=true
MDNS_NAME=familytodo
```

#### 2. Start Servers with Network Binding

```bash
# Backend - bind to all interfaces
cd backend
npm run dev -- --host 0.0.0.0

# Frontend - bind to all interfaces
cd frontend
npm run dev -- --host 0.0.0.0
```

#### 3. Access from iPad/Mobile

Find your computer's IP address:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I

# Windows
ipconfig
```

Access the app:
- Direct IP: `http://192.168.1.100:5173`
- mDNS (if enabled): `http://familytodo.local:5173`

#### 4. Firewall Configuration

Ensure ports are open:
```bash
# macOS
sudo pfctl -d  # Temporarily disable firewall (not recommended)

# Linux
sudo ufw allow 5173/tcp
sudo ufw allow 4000/tcp

# Windows
netsh advfirewall firewall add rule name="FamilyToDo Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="FamilyToDo Backend" dir=in action=allow protocol=TCP localport=4000
```

## Docker Deployment

### Quick Start with Docker Compose

1. **Create docker-compose.yml**:
```yaml
version: '3.8'

services:
  familytodo:
    build: .
    ports:
      - "3001:3001"
      - "5173:5173"
    volumes:
      - ./data:/app/backend/data
      - ./uploads:/app/backend/uploads
    environment:
      - NODE_ENV=production
      - CORS_ORIGIN=http://localhost:5173,http://192.168.1.*:5173
      - ALLOWED_HOSTS=localhost,192.168.*,10.*,*.local
    restart: unless-stopped
```

2. **Build and Run**:
```bash
docker-compose up -d
```

### Production Docker Build

1. **Multi-stage Dockerfile** (already included):
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
RUN apk add --no-cache sqlite
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001 5173
CMD ["npm", "start"]
```

2. **Build for production**:
```bash
docker build -t familytodo:latest .
docker tag familytodo:latest your-registry/familytodo:1.2.0
docker push your-registry/familytodo:1.2.0
```

### Docker with Persistent Storage

```yaml
version: '3.8'

services:
  familytodo:
    image: familytodo:latest
    ports:
      - "80:3001"
    volumes:
      - familytodo-data:/app/backend/data
      - familytodo-uploads:/app/backend/uploads
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/backend/data/familytodo.db
      - UPLOAD_DIR=/app/backend/uploads
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  familytodo-data:
  familytodo-uploads:
```

## Production Deployment

### Option 1: VPS Deployment (DigitalOcean, Linode, etc.)

1. **Server Setup**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Install Caddy for HTTPS
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

2. **Configure Caddy** (`/etc/caddy/Caddyfile`):
```
familytodo.yourdomain.com {
    reverse_proxy localhost:3001
    
    # WebSocket support
    @websockets {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websockets localhost:3001
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        Referrer-Policy strict-origin-when-cross-origin
    }
    
    # File upload size
    request_body {
        max_size 10MB
    }
}
```

3. **Deploy Application**:
```bash
# Clone repository
git clone https://github.com/yourusername/FamilyToDo.git
cd FamilyToDo

# Create production .env
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Enable Caddy
sudo systemctl reload caddy
```

### Option 2: Kubernetes Deployment

1. **Create Kubernetes manifests**:

`k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: familytodo
spec:
  replicas: 2
  selector:
    matchLabels:
      app: familytodo
  template:
    metadata:
      labels:
        app: familytodo
    spec:
      containers:
      - name: familytodo
        image: your-registry/familytodo:1.2.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        volumeMounts:
        - name: data
          mountPath: /app/backend/data
        - name: uploads
          mountPath: /app/backend/uploads
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: familytodo-data
      - name: uploads
        persistentVolumeClaim:
          claimName: familytodo-uploads
```

2. **Deploy to Kubernetes**:
```bash
kubectl apply -f k8s/
```

### Option 3: Platform-as-a-Service (Railway, Render, Fly.io)

#### Railway Deployment

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Deploy**:
```bash
railway login
railway init
railway up
```

3. **Configure environment variables in Railway dashboard**

#### Fly.io Deployment

1. **Create fly.toml**:
```toml
app = "familytodo"

[build]
  dockerfile = "Dockerfile"

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[mounts]
  source = "familytodo_data"
  destination = "/app/backend/data"
```

2. **Deploy**:
```bash
flyctl launch
flyctl deploy
```

## Security Considerations

### Environment Variables

Never commit `.env` files. Use secrets management:

```bash
# Docker Swarm secrets
echo "your-secret" | docker secret create db_password -

# Kubernetes secrets
kubectl create secret generic familytodo-secrets \
  --from-literal=db-password='your-secret'
```

### HTTPS Configuration

Always use HTTPS in production:

1. **Let's Encrypt with Caddy** (automatic):
   - Caddy automatically obtains and renews certificates

2. **Manual Certificate**:
```bash
# Generate self-signed for testing
openssl req -x509 -newkey rsa:4096 -nodes \
  -out cert.pem -keyout key.pem -days 365
```

### Rate Limiting

Configure in `backend/.env`:
```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
UPLOAD_RATE_LIMIT_MAX=10
```

### Content Security Policy

Add CSP headers in production:
```javascript
// backend/src/middleware/security.js
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

## Backup & Recovery

### Automated Backups

1. **SQLite Database Backup Script**:
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_PATH="/app/backend/data/familytodo.db"

# Create backup
sqlite3 $DB_PATH ".backup $BACKUP_DIR/familytodo_$DATE.db"

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/familytodo_$DATE.db s3://your-bucket/backups/

# Keep only last 30 days
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
```

2. **Cron Job**:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Docker Volume Backup

```bash
# Backup volumes
docker run --rm -v familytodo_data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
docker run --rm -v familytodo_uploads:/uploads -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz /uploads

# Restore volumes
docker run --rm -v familytodo_data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /
docker run --rm -v familytodo_uploads:/uploads -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /
```

## Monitoring & Maintenance

### Health Checks

1. **Add health endpoint** (`backend/src/server.js`):
```javascript
app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    database: checkDatabase(),
  };
  res.json(health);
});
```

2. **Monitor with uptime services**:
   - UptimeRobot
   - Pingdom
   - StatusCake

### Logging

1. **Configure logging**:
```javascript
// Use Winston for production logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

2. **Log aggregation** (optional):
   - ELK Stack (Elasticsearch, Logstash, Kibana)
   - Datadog
   - New Relic

### Performance Monitoring

1. **Database optimization**:
```sql
-- Add indexes for common queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_person ON task_assignments(person_id);
CREATE INDEX idx_comments_task ON task_comments(task_id);

-- Vacuum periodically
VACUUM;
ANALYZE;
```

2. **Resource monitoring**:
```bash
# Docker stats
docker stats familytodo

# System resources
htop
iotop
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**:
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

2. **Database Locked**:
```bash
# Check for lock
fuser data/familytodo.db
# Remove stale lock
rm data/familytodo.db-wal data/familytodo.db-shm
```

3. **Permission Issues**:
```bash
# Fix permissions
chmod 755 -R backend/
chown -R node:node backend/data backend/uploads
```

4. **WebSocket Connection Failed**:
   - Check CORS configuration
   - Ensure proxy passes WebSocket headers
   - Verify firewall rules

### Debug Mode

Enable debug logging:
```env
# .env
DEBUG=true
LOG_LEVEL=debug
```

## Updates & Maintenance

### Zero-Downtime Updates

1. **Using Docker**:
```bash
# Build new image
docker build -t familytodo:new .

# Start new container
docker run -d --name familytodo-new familytodo:new

# Switch traffic (update proxy)
# Stop old container
docker stop familytodo-old
docker rm familytodo-old
```

2. **Database Migrations**:
```bash
# Always backup before migrations
./backup.sh

# Run migrations
npm run migrate

# Verify
sqlite3 data/familytodo.db ".schema"
```

### Rollback Procedure

```bash
# Restore from backup
sqlite3 data/familytodo.db ".restore /backups/familytodo_backup.db"

# Revert Docker image
docker tag familytodo:previous familytodo:latest
docker-compose up -d
```

## Support

For deployment issues:
1. Check logs: `docker logs familytodo`
2. Review environment variables
3. Verify network connectivity
4. Open an issue on GitHub

---

Remember to always test deployments in a staging environment before production!