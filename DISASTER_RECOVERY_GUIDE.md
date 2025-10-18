# Workout Tracking System - Disaster Recovery Guide

## 🚨 Disaster Recovery Overview

This guide provides comprehensive disaster recovery procedures for the Workout Tracking System, including system failures, data corruption, security breaches, and natural disasters.

## 🏗️ Recovery Architecture

### Recovery Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                  Recovery Strategy                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Immediate Response (0-15 minutes)                      │
│ 2. Assessment and Analysis (15-60 minutes)                │
│ 3. Recovery Execution (1-4 hours)                         │
│ 4. Validation and Testing (30-60 minutes)                 │
│ 5. Post-Recovery Monitoring (24-48 hours)                 │
└─────────────────────────────────────────────────────────────┘
```

### Recovery Levels
- **Level 1**: Service Degradation (Performance Issues)
- **Level 2**: Partial System Failure (Component Down)
- **Level 3**: Complete System Failure (Total Outage)
- **Level 4**: Data Corruption (Database Issues)
- **Level 5**: Security Breach (Compromised System)

## 🚨 Emergency Response Procedures

### Immediate Response (0-15 minutes)
```bash
#!/bin/bash
# Emergency response script

echo "=== EMERGENCY RESPONSE ACTIVATED ==="
echo "Timestamp: $(date)"
echo "Incident Level: $1"

# Set incident level
INCIDENT_LEVEL=${1:-"UNKNOWN"}

# Activate emergency contacts
echo "Activating emergency contacts..."
./scripts/emergency_contacts.sh $INCIDENT_LEVEL

# Check system status
echo "Checking system status..."
./scripts/system_status_check.sh

# Activate monitoring alerts
echo "Activating monitoring alerts..."
./scripts/activate_monitoring.sh

# Document incident
echo "Documenting incident..."
./scripts/log_incident.sh $INCIDENT_LEVEL

echo "Emergency response completed"
```

### System Status Check
```bash
#!/bin/bash
# System status check script

echo "=== SYSTEM STATUS CHECK ==="

# Check database connectivity
echo "Checking database connectivity..."
mysql -u workout_user -p -e "SELECT 1;" workout_tracker
if [ $? -eq 0 ]; then
    echo "✅ Database: ONLINE"
else
    echo "❌ Database: OFFLINE"
    DB_STATUS="OFFLINE"
fi

# Check application status
echo "Checking application status..."
curl -f http://localhost:8000/api/health/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Application: ONLINE"
else
    echo "❌ Application: OFFLINE"
    APP_STATUS="OFFLINE"
fi

# Check frontend status
echo "Checking frontend status..."
curl -f http://localhost:3000/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend: ONLINE"
else
    echo "❌ Frontend: OFFLINE"
    FRONTEND_STATUS="OFFLINE"
fi

# Check system resources
echo "Checking system resources..."
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"

# Check service status
echo "Checking service status..."
systemctl is-active workout-tracker
systemctl is-active nginx
systemctl is-active mysql

echo "System status check completed"
```

## 🔧 Recovery Procedures by Incident Level

### Level 1: Service Degradation
```bash
#!/bin/bash
# Level 1 recovery - Service degradation

echo "=== LEVEL 1 RECOVERY: SERVICE DEGRADATION ==="

# Restart services
echo "Restarting services..."
sudo systemctl restart workout-tracker
sudo systemctl restart nginx

# Clear caches
echo "Clearing caches..."
redis-cli FLUSHALL
sudo systemctl restart redis

# Optimize database
echo "Optimizing database..."
mysql -u workout_user -p workout_tracker -e "OPTIMIZE TABLE workouts, workout_logs, splits, split_days;"

# Check performance
echo "Checking performance..."
./scripts/performance_check.sh

echo "Level 1 recovery completed"
```

### Level 2: Partial System Failure
```bash
#!/bin/bash
# Level 2 recovery - Partial system failure

echo "=== LEVEL 2 RECOVERY: PARTIAL SYSTEM FAILURE ==="

# Identify failed components
echo "Identifying failed components..."
./scripts/identify_failures.sh

# Restart failed services
echo "Restarting failed services..."
sudo systemctl restart workout-tracker
sudo systemctl restart nginx
sudo systemctl restart mysql

# Verify service health
echo "Verifying service health..."
./scripts/verify_services.sh

# Activate load balancing
echo "Activating load balancing..."
./scripts/activate_load_balancing.sh

echo "Level 2 recovery completed"
```

### Level 3: Complete System Failure
```bash
#!/bin/bash
# Level 3 recovery - Complete system failure

echo "=== LEVEL 3 RECOVERY: COMPLETE SYSTEM FAILURE ==="

# Activate backup systems
echo "Activating backup systems..."
./scripts/activate_backup_systems.sh

# Restore from backup
echo "Restoring from backup..."
./scripts/restore_from_backup.sh

# Restart all services
echo "Restarting all services..."
sudo systemctl restart mysql
sudo systemctl restart redis
sudo systemctl restart workout-tracker
sudo systemctl restart nginx

# Verify system integrity
echo "Verifying system integrity..."
./scripts/verify_system_integrity.sh

echo "Level 3 recovery completed"
```

### Level 4: Data Corruption
```bash
#!/bin/bash
# Level 4 recovery - Data corruption

echo "=== LEVEL 4 RECOVERY: DATA CORRUPTION ==="

# Stop all services
echo "Stopping all services..."
sudo systemctl stop workout-tracker
sudo systemctl stop nginx

# Backup current state
echo "Backing up current state..."
./scripts/backup_corrupted_state.sh

# Restore from clean backup
echo "Restoring from clean backup..."
./scripts/restore_clean_backup.sh

# Verify data integrity
echo "Verifying data integrity..."
./scripts/verify_data_integrity.sh

# Restart services
echo "Restarting services..."
sudo systemctl start mysql
sudo systemctl start redis
sudo systemctl start workout-tracker
sudo systemctl start nginx

echo "Level 4 recovery completed"
```

### Level 5: Security Breach
```bash
#!/bin/bash
# Level 5 recovery - Security breach

echo "=== LEVEL 5 RECOVERY: SECURITY BREACH ==="

# Immediate isolation
echo "Isolating system..."
./scripts/isolate_system.sh

# Preserve evidence
echo "Preserving evidence..."
./scripts/preserve_evidence.sh

# Change all credentials
echo "Changing all credentials..."
./scripts/change_credentials.sh

# Restore from secure backup
echo "Restoring from secure backup..."
./scripts/restore_secure_backup.sh

# Security hardening
echo "Security hardening..."
./scripts/security_hardening.sh

# Restart services
echo "Restarting services..."
sudo systemctl start mysql
sudo systemctl start redis
sudo systemctl start workout-tracker
sudo systemctl start nginx

echo "Level 5 recovery completed"
```

## 📊 Data Recovery Procedures

### Database Recovery
```bash
#!/bin/bash
# Database recovery procedures

BACKUP_DIR="/opt/workout-tracker/backups"
RECOVERY_DATE=$1

if [ -z "$RECOVERY_DATE" ]; then
    echo "Usage: $0 <recovery_date>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/db_backup_*.sql.gz.enc
    exit 1
fi

echo "=== DATABASE RECOVERY ==="
echo "Recovery date: $RECOVERY_DATE"

# Stop application
echo "Stopping application..."
sudo systemctl stop workout-tracker

# Backup current database
echo "Backing up current database..."
mysqldump -u workout_user -p workout_tracker > $BACKUP_DIR/current_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Find backup file
BACKUP_FILE=$(find $BACKUP_DIR -name "db_backup_*$RECOVERY_DATE*" | head -1)
if [ -z "$BACKUP_FILE" ]; then
    echo "❌ No backup found for date: $RECOVERY_DATE"
    exit 1
fi

echo "Using backup file: $BACKUP_FILE"

# Restore database
echo "Restoring database..."
if [[ "$BACKUP_FILE" == *.enc ]]; then
    openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in $BACKUP_FILE | mysql -u workout_user -p workout_tracker
elif [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c $BACKUP_FILE | mysql -u workout_user -p workout_tracker
else
    mysql -u workout_user -p workout_tracker < $BACKUP_FILE
fi

# Verify restoration
echo "Verifying restoration..."
mysql -u workout_user -p workout_tracker -e "SELECT COUNT(*) FROM workouts;"
mysql -u workout_user -p workout_tracker -e "SELECT COUNT(*) FROM workout_logs;"
mysql -u workout_user -p workout_tracker -e "SELECT COUNT(*) FROM splits;"

# Start application
echo "Starting application..."
sudo systemctl start workout-tracker

# Verify application
echo "Verifying application..."
sleep 5
curl -f http://localhost:8000/api/health/

echo "Database recovery completed successfully"
```

### Application Recovery
```bash
#!/bin/bash
# Application recovery procedures

BACKUP_DIR="/opt/workout-tracker/backups"
RECOVERY_DATE=$1

if [ -z "$RECOVERY_DATE" ]; then
    echo "Usage: $0 <recovery_date>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/app_backup_*.tar.gz
    exit 1
fi

echo "=== APPLICATION RECOVERY ==="
echo "Recovery date: $RECOVERY_DATE"

# Stop all services
echo "Stopping all services..."
sudo systemctl stop workout-tracker
sudo systemctl stop nginx

# Backup current application
echo "Backing up current application..."
tar -czf $BACKUP_DIR/current_app_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    /opt/workout-tracker

# Find backup file
BACKUP_FILE=$(find $BACKUP_DIR -name "app_backup_*$RECOVERY_DATE*" | head -1)
if [ -z "$BACKUP_FILE" ]; then
    echo "❌ No backup found for date: $RECOVERY_DATE"
    exit 1
fi

echo "Using backup file: $BACKUP_FILE"

# Restore application
echo "Restoring application..."
tar -xzf $BACKUP_FILE -C /

# Restore configuration
echo "Restoring configuration..."
CONFIG_BACKUP=$(find $BACKUP_DIR -name "config_backup_*$RECOVERY_DATE*" | head -1)
if [ -n "$CONFIG_BACKUP" ]; then
    tar -xzf $CONFIG_BACKUP -C /
fi

# Restore media files
echo "Restoring media files..."
MEDIA_BACKUP=$(find $BACKUP_DIR -name "media_backup_*$RECOVERY_DATE*" | head -1)
if [ -n "$MEDIA_BACKUP" ]; then
    tar -xzf $MEDIA_BACKUP -C /
fi

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /opt/workout-tracker
sudo chmod -R 755 /opt/workout-tracker

# Start services
echo "Starting services..."
sudo systemctl start mysql
sudo systemctl start redis
sudo systemctl start workout-tracker
sudo systemctl start nginx

# Verify application
echo "Verifying application..."
sleep 10
curl -f http://localhost:8000/api/health/
curl -f http://localhost:3000/

echo "Application recovery completed successfully"
```

## 🔒 Security Recovery Procedures

### Credential Recovery
```bash
#!/bin/bash
# Credential recovery procedures

echo "=== CREDENTIAL RECOVERY ==="

# Generate new database password
echo "Generating new database password..."
NEW_DB_PASSWORD=$(openssl rand -base64 32)
echo "New database password: $NEW_DB_PASSWORD"

# Update database password
echo "Updating database password..."
mysql -u root -p -e "ALTER USER 'workout_user'@'localhost' IDENTIFIED BY '$NEW_DB_PASSWORD';"

# Update application configuration
echo "Updating application configuration..."
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASSWORD/" /opt/workout-tracker/backend/.env

# Generate new secret key
echo "Generating new secret key..."
NEW_SECRET_KEY=$(openssl rand -base64 64)
sed -i "s/SECRET_KEY=.*/SECRET_KEY=$NEW_SECRET_KEY/" /opt/workout-tracker/backend/.env

# Generate new JWT secret
echo "Generating new JWT secret..."
NEW_JWT_SECRET=$(openssl rand -base64 64)
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" /opt/workout-tracker/backend/.env

# Restart services
echo "Restarting services..."
sudo systemctl restart workout-tracker

echo "Credential recovery completed"
```

### Security Hardening
```bash
#!/bin/bash
# Security hardening procedures

echo "=== SECURITY HARDENING ==="

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Configure firewall
echo "Configuring firewall..."
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3306  # Block direct MySQL access
sudo ufw deny 6379  # Block direct Redis access

# Secure MySQL
echo "Securing MySQL..."
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='';"
mysql -u root -p -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -u root -p -e "DROP DATABASE IF EXISTS test;"
mysql -u root -p -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Secure Redis
echo "Securing Redis..."
echo "requirepass $(openssl rand -base64 32)" >> /etc/redis/redis.conf
sudo systemctl restart redis

# Set file permissions
echo "Setting file permissions..."
sudo chmod 600 /opt/workout-tracker/backend/.env
sudo chmod 600 /opt/workout-tracker/frontend/.env.production
sudo chmod 700 /opt/workout-tracker/backups

# Install security tools
echo "Installing security tools..."
sudo apt install -y fail2ban ufw

# Configure fail2ban
echo "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

echo "Security hardening completed"
```

## 📋 Recovery Checklist

### Pre-Recovery Checklist
- [ ] **Incident Assessment**: Determine incident level and scope
- [ ] **Backup Verification**: Verify backup integrity and availability
- [ ] **Resource Allocation**: Ensure adequate resources for recovery
- [ ] **Team Notification**: Notify recovery team and stakeholders
- [ ] **Documentation**: Document incident details and timeline
- [ ] **Communication Plan**: Prepare communication for users
- [ ] **Recovery Tools**: Verify all recovery tools and scripts
- [ ] **Access Control**: Ensure proper access to recovery systems

### During Recovery Checklist
- [ ] **Service Isolation**: Isolate affected services if necessary
- [ ] **Backup Restoration**: Restore from appropriate backup
- [ ] **Service Restart**: Restart services in correct order
- [ ] **Data Verification**: Verify data integrity and consistency
- [ ] **Functionality Testing**: Test all system functionality
- [ ] **Performance Monitoring**: Monitor system performance
- [ ] **User Communication**: Keep users informed of progress
- [ ] **Incident Documentation**: Document all recovery actions

### Post-Recovery Checklist
- [ ] **System Validation**: Validate complete system functionality
- [ ] **Performance Testing**: Run comprehensive performance tests
- [ ] **Security Audit**: Conduct security audit if breach occurred
- [ ] **Backup Update**: Update backup procedures if needed
- [ ] **Documentation Update**: Update recovery procedures
- [ ] **Team Debrief**: Conduct recovery team debrief
- [ ] **User Notification**: Notify users of system restoration
- [ ] **Monitoring Enhancement**: Enhance monitoring based on incident

## 🚨 Emergency Contacts

### Internal Contacts
- **System Administrator**: admin@company.com
- **Database Administrator**: dba@company.com
- **Security Team**: security@company.com
- **Development Team**: dev@company.com

### External Contacts
- **Hosting Provider**: support@hosting.com
- **Cloud Provider**: support@cloud.com
- **Security Consultant**: security@consultant.com
- **Backup Service**: backup@service.com

### Escalation Matrix
```
Level 1: System Admin (0-15 min)
Level 2: System Admin + DBA (15-30 min)
Level 3: Full Team (30-60 min)
Level 4: Full Team + External (60+ min)
Level 5: Full Team + Security + External (Immediate)
```

## 📊 Recovery Metrics

### Recovery Time Objectives (RTO)
- **Level 1**: 15 minutes
- **Level 2**: 30 minutes
- **Level 3**: 2 hours
- **Level 4**: 4 hours
- **Level 5**: 8 hours

### Recovery Point Objectives (RPO)
- **Database**: 15 minutes
- **Application**: 1 hour
- **Configuration**: 4 hours
- **Media Files**: 24 hours

### Recovery Success Criteria
- **System Availability**: 99.9%
- **Data Integrity**: 100%
- **Performance**: Within 10% of baseline
- **Security**: No vulnerabilities introduced

---

**Remember**: Regular testing of disaster recovery procedures is essential. Conduct recovery drills monthly and update procedures based on lessons learned.
