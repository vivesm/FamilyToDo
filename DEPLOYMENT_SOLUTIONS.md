# FamilyToDo CI/CD Deployment Solutions

## Problem Summary
GitHub Actions cannot connect to the VPS due to strict IP-based firewall rules that only allow connections from specific IPs (Tailscale network, home IP, and server IP).

## Solution Options

### Option 1: Tailscale Integration (Recommended)
**Security Level: ⭐⭐⭐⭐⭐ (Highest)**

The workflow now supports Tailscale connection. To enable it:

1. **Generate Tailscale Auth Key**:
   - Go to https://login.tailscale.com/admin/settings/keys
   - Create a new auth key (reusable, with expiration)
   - Tag it with `tag:ci` for identification

2. **Add GitHub Secrets**:
   ```
   TAILSCALE_AUTH_KEY=tskey-auth-xxxxx
   TAILSCALE_OAUTH_CLIENT_ID=your-oauth-client-id (optional)
   TAILSCALE_OAUTH_SECRET=your-oauth-secret (optional)
   VPS_TAILSCALE_NAME=your-vps-name (machine name in Tailscale)
   ```

3. **Update VPS_HOST Secret**:
   - Change from public IP to Tailscale IP (100.x.x.x)
   - Or keep public IP as fallback

**Pros**: Zero firewall changes, most secure, works with existing setup
**Cons**: Requires Tailscale auth key management

---

### Option 2: GitHub Actions IP Allowlist
**Security Level: ⭐⭐⭐ (Moderate)**

Allow GitHub's IP ranges in your firewall:

```bash
# On your VPS, add GitHub Actions IPs
# Get current GitHub IPs
curl -s https://api.github.com/meta | jq -r '.actions[]' | while read ip; do
  sudo ufw allow from $ip to any port 22 comment "GitHub Actions"
done

# Note: These IPs change, so automate updates
```

**Script to automate** (save as `/usr/local/bin/update-github-ips.sh`):
```bash
#!/bin/bash
# Remove old GitHub rules
sudo ufw status numbered | grep "GitHub Actions" | cut -d']' -f1 | cut -d'[' -f2 | sort -rn | while read n; do
  sudo ufw --force delete $n
done

# Add new GitHub IPs
curl -s https://api.github.com/meta | jq -r '.actions[]' | while read ip; do
  sudo ufw allow from $ip to any port 22 comment "GitHub Actions"
done
```

Add to crontab: `0 0 * * * /usr/local/bin/update-github-ips.sh`

**Pros**: Works with current workflow, no additional services
**Cons**: Opens SSH to broader IP range, requires maintenance

---

### Option 3: Webhook-Based Pull Deployment
**Security Level: ⭐⭐⭐⭐ (High)**

Instead of push deployment, use webhooks:

1. **On VPS, create webhook listener** (`/home/melvin/webhook-deploy.js`):
```javascript
const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');

const app = express();
const SECRET = process.env.WEBHOOK_SECRET;

app.post('/deploy', express.json(), (req, res) => {
  // Verify GitHub signature
  const signature = req.headers['x-hub-signature-256'];
  const hash = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== hash) {
    return res.status(401).send('Invalid signature');
  }
  
  // Only deploy on push to main
  if (req.body.ref === 'refs/heads/main') {
    exec('cd /home/melvin/projects/FamilyToDo && git pull && ./scripts/deploy.sh', (error, stdout) => {
      if (error) {
        console.error('Deployment failed:', error);
        return res.status(500).send('Deployment failed');
      }
      console.log('Deployment successful:', stdout);
      res.send('Deployment triggered');
    });
  } else {
    res.send('Not main branch, skipping');
  }
});

app.listen(9000, '127.0.0.1');
```

2. **Setup webhook in GitHub**:
   - Go to Settings → Webhooks → Add webhook
   - URL: `https://your-domain.com/deploy`
   - Secret: Generate with `openssl rand -hex 32`
   - Events: Just push events

3. **Add Nginx proxy**:
```nginx
location /deploy {
    proxy_pass http://127.0.0.1:9000/deploy;
    proxy_set_header X-Hub-Signature-256 $http_x_hub_signature_256;
}
```

**Pros**: No inbound SSH needed, server initiates pull
**Cons**: Requires webhook service setup

---

### Option 4: Self-Hosted Runner
**Security Level: ⭐⭐⭐⭐ (High)**

Run GitHub Actions runner on your Tailscale network:

1. **On a machine with Tailscale** (can be the VPS itself):
```bash
# Download runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.319.1.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.319.1/actions-runner-linux-x64-2.319.1.tar.gz
tar xzf ./actions-runner-linux-x64-2.319.1.tar.gz

# Configure
./config.sh --url https://github.com/vivesm/FamilyToDo \
  --token YOUR_RUNNER_TOKEN

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

2. **Update workflow** to use self-hosted runner:
```yaml
jobs:
  deploy:
    runs-on: self-hosted  # Instead of ubuntu-latest
```

**Pros**: Full control, works with existing firewall
**Cons**: Requires runner maintenance, uses VPS resources

---

### Option 5: Deployment-Specific SSH Port
**Security Level: ⭐⭐⭐ (Moderate)**

Open a separate SSH port with rate limiting:

```bash
# On VPS
# 1. Add SSH on port 2222
echo "Port 2222" | sudo tee -a /etc/ssh/sshd_config
sudo systemctl restart sshd

# 2. Open port with rate limiting
sudo ufw limit 2222/tcp comment "Deployment SSH"

# 3. Install fail2ban for extra protection
sudo apt install fail2ban
```

Update GitHub secret:
```
VPS_HOST=147.93.3.63:2222
```

**Pros**: Simple setup, separate from main SSH
**Cons**: Another port to maintain, still publicly exposed

---

## Quick Implementation Guide

### For Immediate Fix (Option 1 - Tailscale):

1. **Generate Tailscale auth key**:
   ```bash
   # On https://login.tailscale.com/admin/settings/keys
   # Create reusable key with 90-day expiration
   ```

2. **Add to GitHub Secrets**:
   - `TAILSCALE_AUTH_KEY`: Your auth key
   - `VPS_TAILSCALE_NAME`: Your VPS machine name in Tailscale

3. **Push the updated workflow**:
   ```bash
   git push origin main
   ```

The workflow will automatically use Tailscale if the auth key is present, or fall back to direct connection.

---

## Decision Matrix

| Solution | Security | Setup Time | Maintenance | Cost |
|----------|----------|------------|-------------|------|
| Tailscale | ⭐⭐⭐⭐⭐ | 5 min | Low | Free |
| GitHub IPs | ⭐⭐⭐ | 15 min | Medium | Free |
| Webhook | ⭐⭐⭐⭐ | 30 min | Low | Free |
| Self-hosted | ⭐⭐⭐⭐ | 20 min | High | Free |
| SSH Port | ⭐⭐⭐ | 10 min | Medium | Free |

## Recommendation

**Use Option 1 (Tailscale)** because:
- No firewall changes needed
- Works with your existing security model
- Already integrated in the workflow
- Most secure option
- Easiest to implement

The workflow is already updated to support it - you just need to add the Tailscale secrets!