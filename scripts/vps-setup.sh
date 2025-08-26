#!/bin/bash

# FamilyToDo VPS Initial Setup Script
# Run this on a fresh Ubuntu/Debian VPS to set up the environment
# Usage: curl -sSL https://raw.githubusercontent.com/vivesm/FamilyToDo/main/scripts/vps-setup.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_USER=${APP_USER:-familytodo}
APP_DIR="/home/$APP_USER/familytodo"
NODE_VERSION="18"

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

log_section() {
    echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# Update system
update_system() {
    log_section "Updating System"
    apt-get update
    apt-get upgrade -y
    apt-get install -y curl wget git vim htop ufw fail2ban software-properties-common
    log_info "System updated ✓"
}

# Create application user
create_app_user() {
    log_section "Creating Application User"
    
    if id "$APP_USER" &>/dev/null; then
        log_warning "User $APP_USER already exists"
    else
        useradd -m -s /bin/bash "$APP_USER"
        usermod -aG sudo "$APP_USER"
        log_info "User $APP_USER created ✓"
    fi
    
    # Create app directory
    mkdir -p "$APP_DIR"
    chown -R "$APP_USER:$APP_USER" "$APP_DIR"
}

# Install Docker
install_docker() {
    log_section "Installing Docker"
    
    if command -v docker &> /dev/null; then
        log_warning "Docker already installed"
        return
    fi
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Add app user to docker group
    usermod -aG docker "$APP_USER"
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start Docker
    systemctl enable docker
    systemctl start docker
    
    log_info "Docker installed ✓"
}

# Install Node.js and PM2
install_nodejs() {
    log_section "Installing Node.js"
    
    if command -v node &> /dev/null; then
        log_warning "Node.js already installed"
        return
    fi
    
    # Install Node.js via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Setup PM2 to run as app user
    su - "$APP_USER" -c "pm2 startup systemd -u $APP_USER --hp /home/$APP_USER"
    
    log_info "Node.js and PM2 installed ✓"
}

# Install and configure Nginx
install_nginx() {
    log_section "Installing Nginx"
    
    apt-get install -y nginx certbot python3-certbot-nginx
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/familytodo << 'EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
    
    location /socket.io {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/familytodo /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and restart Nginx
    nginx -t
    systemctl restart nginx
    systemctl enable nginx
    
    log_info "Nginx installed and configured ✓"
}

# Configure firewall
configure_firewall() {
    log_section "Configuring Firewall"
    
    # Allow SSH (preserve current SSH connection)
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow app port (for direct access during testing)
    ufw allow 4000/tcp
    
    # Enable firewall
    echo "y" | ufw enable
    
    log_info "Firewall configured ✓"
}

# Install Tailscale (optional)
install_tailscale() {
    log_section "Installing Tailscale (Optional)"
    
    read -p "Do you want to install Tailscale for secure access? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Skipping Tailscale installation"
        return
    fi
    
    # Install Tailscale
    curl -fsSL https://tailscale.com/install.sh | sh
    
    log_info "Tailscale installed ✓"
    log_warning "Run 'tailscale up' to connect to your Tailscale network"
}

# Setup automatic backups
setup_backups() {
    log_section "Setting up Automatic Backups"
    
    # Create backup directory
    BACKUP_DIR="/home/$APP_USER/backups"
    mkdir -p "$BACKUP_DIR"
    chown "$APP_USER:$APP_USER" "$BACKUP_DIR"
    
    # Create backup script
    cat > /home/$APP_USER/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/familytodo/backups"
DB_PATH="/home/familytodo/familytodo/backend/data/familytodo.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup database
if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_DIR/familytodo_$TIMESTAMP.db"
    # Keep only last 30 days of backups
    find "$BACKUP_DIR" -name "familytodo_*.db" -mtime +30 -delete
fi
EOF
    
    chmod +x /home/$APP_USER/backup.sh
    chown "$APP_USER:$APP_USER" /home/$APP_USER/backup.sh
    
    # Add to crontab (daily at 2 AM)
    (crontab -u "$APP_USER" -l 2>/dev/null; echo "0 2 * * * /home/$APP_USER/backup.sh") | crontab -u "$APP_USER" -
    
    log_info "Automatic backups configured ✓"
}

# Clone repository
clone_repository() {
    log_section "Cloning FamilyToDo Repository"
    
    su - "$APP_USER" -c "cd ~ && git clone https://github.com/vivesm/FamilyToDo.git familytodo"
    
    # Create initial .env file
    su - "$APP_USER" -c "cp $APP_DIR/backend/.env.production $APP_DIR/backend/.env"
    
    log_info "Repository cloned ✓"
    log_warning "Please edit $APP_DIR/backend/.env with your configuration"
}

# Setup monitoring
setup_monitoring() {
    log_section "Setting up Monitoring"
    
    # Install monitoring tools
    apt-get install -y netdata
    
    # Configure Netdata to bind only to localhost
    sed -i 's/bind to = \*/bind to = 127.0.0.1/g' /etc/netdata/netdata.conf
    systemctl restart netdata
    
    # Add Nginx proxy for Netdata (optional)
    cat >> /etc/nginx/sites-available/familytodo << 'EOF'

# Netdata monitoring (optional - uncomment to enable)
# location /netdata/ {
#     proxy_pass http://127.0.0.1:19999/;
#     proxy_set_header Host $host;
#     auth_basic "Netdata Monitoring";
#     auth_basic_user_file /etc/nginx/.htpasswd;
# }
EOF
    
    log_info "Monitoring tools installed ✓"
}

# Print summary
print_summary() {
    log_section "Setup Complete!"
    
    echo -e "${GREEN}FamilyToDo VPS setup is complete!${NC}\n"
    echo "Next steps:"
    echo "1. Edit configuration: sudo nano $APP_DIR/backend/.env"
    echo "2. Deploy the application: cd $APP_DIR && ./scripts/deploy.sh"
    echo "3. Access the application: http://$(curl -s ifconfig.me):4000"
    echo ""
    echo "Optional:"
    echo "- Setup SSL: sudo certbot --nginx -d yourdomain.com"
    echo "- Connect Tailscale: sudo tailscale up"
    echo "- View monitoring: http://localhost:19999 (Netdata)"
    echo ""
    echo "Security notes:"
    echo "- Firewall is enabled (ports 22, 80, 443, 4000)"
    echo "- Fail2ban is installed for SSH protection"
    echo "- Automatic backups run daily at 2 AM"
    echo ""
    echo "Default credentials:"
    echo "- App user: $APP_USER"
    echo "- App directory: $APP_DIR"
}

# Main execution
main() {
    check_root
    update_system
    create_app_user
    install_docker
    install_nodejs
    install_nginx
    configure_firewall
    install_tailscale
    setup_backups
    clone_repository
    setup_monitoring
    print_summary
}

# Run main function
main