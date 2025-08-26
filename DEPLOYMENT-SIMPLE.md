# Simple Deployment Guide for FamilyToDo

## Overview
This project uses a **pull-based deployment** strategy. GitHub Actions runs tests and builds, then you manually deploy when ready.

## How It Works

1. **Push code** to GitHub → Tests run automatically
2. **Get notified** when tests pass and build succeeds  
3. **SSH into VPS** and run deployment script when you're ready
4. **Script handles everything**: backup, pull, build, restart

## Deployment Steps

### Quick Deploy (After Initial Setup)
```bash
# SSH into your VPS
ssh melvin@sbvps

# Run deployment script
cd /home/melvin/projects/FamilyToDo
./scripts/deploy-on-vps.sh
```

That's it! The script will:
- ✅ Backup your database
- ✅ Pull latest code from GitHub
- ✅ Update dependencies if needed
- ✅ Rebuild frontend
- ✅ Run migrations
- ✅ Restart application
- ✅ Run health checks

### Initial Setup (First Time Only)

1. **Clone repository on VPS**:
```bash
cd /home/melvin/projects
git clone https://github.com/vivesm/FamilyToDo.git
cd FamilyToDo
```

2. **Setup environment**:
```bash
cd backend
cp .env.production .env
nano .env  # Edit with your settings
```

3. **Install dependencies**:
```bash
# Backend
cd backend
npm install

# Frontend  
cd ../frontend
npm install
npm run build

# Copy build to backend
cd ..
cp -r frontend/dist/* backend/public/
```

4. **Start application**:
```bash
cd backend

# Using PM2 (recommended)
npm install -g pm2
pm2 start npm --name familytodo -- start
pm2 save
pm2 startup  # Follow instructions

# Or using Docker
docker-compose up -d
```

5. **Make deployment script executable**:
```bash
chmod +x scripts/deploy-on-vps.sh
```

## GitHub Actions Workflow

The GitHub Actions workflow (`notify.yml`) will:
1. Run tests on every push to main
2. Build the frontend to verify it compiles
3. Show you a summary of what changed
4. Notify you that it's ready to deploy

**No SSH keys needed!** No complex CI/CD setup. Just:
- GitHub runs tests
- You deploy when ready

## Manual Commands (If Needed)

If you prefer to run commands manually instead of the script:

```bash
# Pull latest code
git pull origin main

# Update backend dependencies (if package.json changed)
cd backend && npm install

# Rebuild frontend
cd ../frontend
npm run build
cp -r dist/* ../backend/public/

# Restart application
pm2 restart familytodo
# or
docker-compose restart
```

## Monitoring

Check application status:
```bash
# If using PM2
pm2 status
pm2 logs familytodo

# If using Docker
docker-compose ps
docker-compose logs

# Health check
curl http://localhost:4000/api/health
```

## Rollback

If something goes wrong:

```bash
# Restore database from backup
cp ~/backups/familytodo_[timestamp].db backend/data/familytodo.db

# Revert to previous commit
git reset --hard HEAD~1

# Restart
pm2 restart familytodo
```

## Benefits of This Approach

✅ **Simple**: Just run one script on the VPS  
✅ **Secure**: No SSH keys in GitHub, no open ports  
✅ **Controlled**: Deploy when YOU want  
✅ **Safe**: Automatic backups before each deployment  
✅ **Fast**: Only rebuilds what's necessary  
✅ **Reliable**: Health checks ensure deployment worked  

## Tips

1. **Watch the logs** during deployment to see what's happening
2. **Check the GitHub Actions** tab to ensure tests passed before deploying
3. **Keep backups** - the script does this automatically
4. **Test locally** before pushing to GitHub

## Common Issues

**Frontend not updating?**
- The script automatically rebuilds the frontend
- Check that files are copied to `backend/public/`

**Database migrations failing?**
- Check `backend/src/db/migrations/` for migration scripts
- Run manually: `cd backend && npm run db:migrate`

**Application not restarting?**
- Check which process manager you're using: `pm2 list` or `docker ps`
- Restart manually if needed

**Port already in use?**
- Find process: `lsof -i :4000`
- Kill if needed: `kill -9 [PID]`

## That's It!

No complex CI/CD. No SSH key management. Just:
1. Push your code
2. Wait for tests to pass
3. Run the deployment script when ready

Simple, secure, and under your control! 🚀