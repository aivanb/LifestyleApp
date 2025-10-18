# Workout Tracking System - Deployment Guide

## 🚀 Deployment Overview

This guide covers deploying the Workout Tracking System to production environments. The system consists of a Django REST API backend and a React frontend, both requiring proper configuration for production use.

## 🏗️ Architecture

### Production Architecture
```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Frontend  │────▶│   Backend    │────▶│  Database  │
│   (React)   │◀────│  (Django)    │◀────│  (MySQL)   │
└─────────────┘     └──────────────┘     └────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   Web Server │
                    │   (Nginx)    │
                    └──────────────┘
```

### Components
- **Frontend**: React application served by Nginx
- **Backend**: Django REST API with Gunicorn
- **Database**: MySQL 8.0+
- **Web Server**: Nginx for static files and reverse proxy
- **Process Manager**: Systemd or PM2 for process management

## 🔧 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+
- **Python**: 3.9+
- **Node.js**: 16+
- **MySQL**: 8.0+
- **Nginx**: 1.18+
- **Memory**: 2GB+ RAM
- **Storage**: 20GB+ disk space

### Software Installation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.9
sudo apt install python3.9 python3.9-venv python3.9-dev -y

# Install Node.js 16
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install nodejs -y

# Install MySQL 8.0
sudo apt install mysql-server -y

# Install Nginx
sudo apt install nginx -y

# Install additional tools
sudo apt install git curl wget build-essential -y
```

## 🗄️ Database Setup

### MySQL Configuration
```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE workout_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'workout_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON workout_tracker.* TO 'workout_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### Database Configuration
```bash
# Edit MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# Basic settings
bind-address = 127.0.0.1
port = 3306

# Performance settings
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT

# Connection settings
max_connections = 200
max_connect_errors = 1000

# Query cache
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# Logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

```bash
# Restart MySQL
sudo systemctl restart mysql
sudo systemctl enable mysql
```

## 🐍 Backend Deployment

### Environment Setup
```bash
# Create application directory
sudo mkdir -p /opt/workout-tracker
sudo chown $USER:$USER /opt/workout-tracker
cd /opt/workout-tracker

# Clone repository
git clone <repository-url> .

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### Environment Configuration
```bash
# Create production environment file
nano backend/.env
```

```env
# Django settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,localhost

# Database settings
DATABASE_URL=mysql://workout_user:secure_password@localhost:3306/workout_tracker

# Security settings
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SECURE_CONTENT_TYPE_NOSNIFF=True
SECURE_BROWSER_XSS_FILTER=True
X_FRAME_OPTIONS=DENY

# CORS settings
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# JWT settings
JWT_ACCESS_TOKEN_LIFETIME=3600
JWT_REFRESH_TOKEN_LIFETIME=604800

# Email settings (optional)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Django Configuration
```bash
# Run migrations
cd backend
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Test configuration
python manage.py check --deploy
```

### Gunicorn Configuration
```bash
# Install Gunicorn
pip install gunicorn

# Create Gunicorn configuration
nano gunicorn.conf.py
```

```python
# Gunicorn configuration
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 100
preload_app = True
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
```

### Systemd Service
```bash
# Create systemd service file
sudo nano /etc/systemd/system/workout-tracker.service
```

```ini
[Unit]
Description=Workout Tracker Django Application
After=network.target

[Service]
Type=exec
User=www-data
Group=www-data
WorkingDirectory=/opt/workout-tracker/backend
Environment=PATH=/opt/workout-tracker/venv/bin
ExecStart=/opt/workout-tracker/venv/bin/gunicorn --config gunicorn.conf.py backend.wsgi:application
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable workout-tracker
sudo systemctl start workout-tracker
sudo systemctl status workout-tracker
```

## ⚛️ Frontend Deployment

### Build Configuration
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create production build
npm run build
```

### Environment Configuration
```bash
# Create production environment file
nano .env.production
```

```env
REACT_APP_API_URL=https://yourdomain.com/api
REACT_APP_ENVIRONMENT=production
```

### Build Script
```bash
# Update package.json build script
nano package.json
```

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:prod": "REACT_APP_ENVIRONMENT=production npm run build"
  }
}
```

```bash
# Build for production
npm run build:prod
```

## 🌐 Nginx Configuration

### Nginx Setup
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/workout-tracker
```

```nginx
# Upstream backend
upstream workout_backend {
    server 127.0.0.1:8000;
}

# Main server block
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend static files
    location / {
        root /opt/workout-tracker/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API backend
    location /api/ {
        proxy_pass http://workout_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }
    
    # Django admin
    location /admin/ {
        proxy_pass http://workout_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        alias /opt/workout-tracker/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files
    location /media/ {
        alias /opt/workout-tracker/backend/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
```

### Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/workout-tracker /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔒 SSL Certificate

### Let's Encrypt SSL
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### Manual SSL Certificate
```bash
# Generate private key
sudo openssl genrsa -out /etc/ssl/private/yourdomain.com.key 2048

# Generate certificate signing request
sudo openssl req -new -key /etc/ssl/private/yourdomain.com.key -out /etc/ssl/certs/yourdomain.com.csr

# Generate self-signed certificate (for testing)
sudo openssl x509 -req -days 365 -in /etc/ssl/certs/yourdomain.com.csr -signkey /etc/ssl/private/yourdomain.com.key -out /etc/ssl/certs/yourdomain.com.crt
```

## 📊 Monitoring and Logging

### Log Configuration
```bash
# Create log directories
sudo mkdir -p /var/log/gunicorn
sudo chown www-data:www-data /var/log/gunicorn

# Create log rotation
sudo nano /etc/logrotate.d/workout-tracker
```

```
/var/log/gunicorn/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload workout-tracker
    endscript
}
```

### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Create monitoring script
nano /opt/workout-tracker/monitor.sh
```

```bash
#!/bin/bash
# Monitoring script for Workout Tracker

echo "=== System Status ==="
systemctl status workout-tracker --no-pager
systemctl status nginx --no-pager
systemctl status mysql --no-pager

echo "=== Disk Usage ==="
df -h

echo "=== Memory Usage ==="
free -h

echo "=== Process Status ==="
ps aux | grep -E "(gunicorn|nginx|mysql)" | grep -v grep

echo "=== Recent Logs ==="
tail -n 20 /var/log/gunicorn/error.log
```

```bash
# Make executable
chmod +x /opt/workout-tracker/monitor.sh
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup script
nano /opt/workout-tracker/backup.sh
```

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x /opt/workout-tracker/backup.sh

# Add to crontab
crontab -e
```

```
# Daily backup at 2 AM
0 2 * * * /opt/workout-tracker/backup.sh
```

### Application Backup
```bash
# Create application backup script
nano /opt/workout-tracker/app_backup.sh
```

```bash
#!/bin/bash
# Application backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create application backup
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    /opt/workout-tracker/

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

## 🚀 Deployment Script

### Automated Deployment
```bash
# Create deployment script
nano /opt/workout-tracker/deploy.sh
```

```bash
#!/bin/bash
# Automated deployment script

set -e

echo "Starting deployment..."

# Backup current version
echo "Creating backup..."
./app_backup.sh

# Pull latest changes
echo "Pulling latest changes..."
git pull origin main

# Backend deployment
echo "Deploying backend..."
cd backend
source ../venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check --deploy

# Frontend deployment
echo "Deploying frontend..."
cd ../frontend
npm install
npm run build:prod

# Restart services
echo "Restarting services..."
sudo systemctl restart workout-tracker
sudo systemctl restart nginx

# Health check
echo "Performing health check..."
sleep 5
curl -f http://localhost:8000/api/health/ || exit 1

echo "Deployment completed successfully!"
```

```bash
# Make executable
chmod +x /opt/workout-tracker/deploy.sh
```

## 🔧 Maintenance

### Regular Maintenance Tasks
```bash
# Create maintenance script
nano /opt/workout-tracker/maintenance.sh
```

```bash
#!/bin/bash
# Regular maintenance script

echo "Starting maintenance..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean package cache
sudo apt autoremove -y
sudo apt autoclean

# Restart services
sudo systemctl restart workout-tracker
sudo systemctl restart nginx
sudo systemctl restart mysql

# Check disk space
df -h

# Check log sizes
du -sh /var/log/gunicorn/*
du -sh /var/log/nginx/*

echo "Maintenance completed!"
```

### Performance Optimization
```bash
# Database optimization
mysql -u workout_user -p workout_tracker
```

```sql
-- Optimize tables
OPTIMIZE TABLE workouts;
OPTIMIZE TABLE workout_muscle;
OPTIMIZE TABLE splits;
OPTIMIZE TABLE split_days;
OPTIMIZE TABLE workout_logs;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'workout_tracker'
ORDER BY (data_length + index_length) DESC;
```

## 🚨 Troubleshooting

### Common Issues

**Service Won't Start**
```bash
# Check service status
sudo systemctl status workout-tracker

# Check logs
sudo journalctl -u workout-tracker -f

# Check configuration
sudo nginx -t
```

**Database Connection Issues**
```bash
# Test database connection
mysql -u workout_user -p workout_tracker

# Check MySQL status
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

**SSL Certificate Issues**
```bash
# Check certificate
sudo openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout

# Test SSL
openssl s_client -connect yourdomain.com:443
```

**Performance Issues**
```bash
# Check system resources
htop
iotop
nethogs

# Check database performance
mysql -u workout_user -p workout_tracker
SHOW PROCESSLIST;
```

## 📈 Scaling

### Horizontal Scaling
- **Load Balancer**: Use Nginx or HAProxy
- **Multiple Backend Instances**: Run multiple Gunicorn workers
- **Database Replication**: Master-slave MySQL setup
- **CDN**: Use CloudFlare or AWS CloudFront

### Vertical Scaling
- **Increase RAM**: Add more memory for caching
- **SSD Storage**: Use SSD for better I/O performance
- **CPU Cores**: Add more CPU cores for parallel processing
- **Database Optimization**: Tune MySQL configuration

## 🔐 Security Hardening

### Firewall Configuration
```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Security Headers
```bash
# Add security headers to Nginx
sudo nano /etc/nginx/sites-available/workout-tracker
```

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;
```

---

**Note**: This deployment guide provides a comprehensive setup for production environments. Always test in a staging environment first and ensure you have proper backups before deploying to production.
