# Workout Tracking System - Backup and Recovery Guide

## 💾 Backup Overview

This guide covers comprehensive backup and recovery strategies for the Workout Tracking System, including database backups, application backups, and disaster recovery procedures.

## 🏗️ Backup Architecture

### Backup Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    Backup Strategy                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Database Backups (Daily, Weekly, Monthly)              │
│ 2. Application Backups (Code, Configuration)              │
│ 3. File System Backups (Logs, Media, Static Files)       │
│ 4. Configuration Backups (Environment, Service Configs)    │
│ 5. Disaster Recovery (Complete System Restoration)        │
└─────────────────────────────────────────────────────────────┘
```

### Backup Types
- **Full Backup**: Complete system backup
- **Incremental Backup**: Only changed files since last backup
- **Differential Backup**: All changes since last full backup
- **Snapshot Backup**: Point-in-time system state
- **Continuous Backup**: Real-time data replication

## 🗄️ Database Backup

### Automated Database Backup
```bash
#!/bin/bash
# Automated database backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"
ENCRYPTION_KEY="your-encryption-key"

echo "=== Starting Database Backup ==="
echo "Date: $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
echo "Creating database backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
echo "Compressing backup..."
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Encrypt backup
echo "Encrypting backup..."
openssl enc -aes-256-cbc -salt -k $ENCRYPTION_KEY -in $BACKUP_DIR/db_backup_$DATE.sql.gz -out $BACKUP_DIR/db_backup_$DATE.sql.gz.enc

# Remove unencrypted backup
rm $BACKUP_DIR/db_backup_$DATE.sql.gz

# Verify backup
echo "Verifying backup..."
openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in $BACKUP_DIR/db_backup_$DATE.sql.gz.enc | gunzip | head -10

# Remove old backups (keep last 7 days)
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "db_backup_*.sql.gz.enc" -mtime +7 -delete

# Upload to remote storage (optional)
if [ -n "$REMOTE_BACKUP_URL" ]; then
    echo "Uploading to remote storage..."
    rsync -avz $BACKUP_DIR/db_backup_$DATE.sql.gz.enc $REMOTE_BACKUP_URL/
fi

echo "Database backup completed: db_backup_$DATE.sql.gz.enc"
```

### Database Backup with Compression
```bash
#!/bin/bash
# Database backup with compression and verification

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"

echo "=== Database Backup with Compression ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Create compressed backup
echo "Creating compressed database backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Create backup with parallel compression
echo "Creating parallel compressed backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | pigz -9 > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Create backup with custom compression
echo "Creating custom compressed backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | 7z a -si $BACKUP_DIR/db_backup_$DATE.sql.7z

# Verify backup integrity
echo "Verifying backup integrity..."
if gzip -t $BACKUP_DIR/db_backup_$DATE.sql.gz; then
    echo "✅ Backup integrity verified"
else
    echo "❌ Backup integrity check failed"
    exit 1
fi

# Calculate backup size
backup_size=$(du -h $BACKUP_DIR/db_backup_$DATE.sql.gz | cut -f1)
echo "Backup size: $backup_size"

# Create backup metadata
cat > $BACKUP_DIR/db_backup_$DATE.metadata << EOF
{
    "backup_date": "$DATE",
    "backup_type": "database",
    "backup_size": "$backup_size",
    "database_name": "$DB_NAME",
    "compression": "gzip",
    "encryption": "none",
    "verification": "passed"
}
EOF

echo "Database backup completed successfully"
```

### Database Backup with Encryption
```bash
#!/bin/bash
# Database backup with encryption

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"
ENCRYPTION_KEY="your-encryption-key"

echo "=== Database Backup with Encryption ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Create encrypted backup
echo "Creating encrypted database backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | \
openssl enc -aes-256-cbc -salt -k $ENCRYPTION_KEY > $BACKUP_DIR/db_backup_$DATE.sql.enc

# Create compressed and encrypted backup
echo "Creating compressed and encrypted backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | \
gzip | \
openssl enc -aes-256-cbc -salt -k $ENCRYPTION_KEY > $BACKUP_DIR/db_backup_$DATE.sql.gz.enc

# Verify encrypted backup
echo "Verifying encrypted backup..."
openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in $BACKUP_DIR/db_backup_$DATE.sql.enc | head -10

# Create backup with GPG encryption
echo "Creating GPG encrypted backup..."
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | \
gpg --symmetric --cipher-algo AES256 --passphrase $ENCRYPTION_KEY > $BACKUP_DIR/db_backup_$DATE.sql.gpg

# Verify GPG encrypted backup
echo "Verifying GPG encrypted backup..."
gpg --decrypt --passphrase $ENCRYPTION_KEY $BACKUP_DIR/db_backup_$DATE.sql.gpg | head -10

echo "Encrypted database backup completed successfully"
```

## 📁 Application Backup

### Complete Application Backup
```bash
#!/bin/bash
# Complete application backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/workout-tracker"

echo "=== Complete Application Backup ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Create application backup
echo "Creating application backup..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='*.log' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    $APP_DIR

# Create configuration backup
echo "Creating configuration backup..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    /etc/nginx/sites-available/workout-tracker \
    /etc/systemd/system/workout-tracker.service \
    /opt/workout-tracker/backend/.env \
    /opt/workout-tracker/frontend/.env.production

# Create log backup
echo "Creating log backup..."
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz \
    /var/log/gunicorn/ \
    /var/log/nginx/ \
    /var/log/mysql/

# Create media backup
echo "Creating media backup..."
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz \
    /opt/workout-tracker/backend/media/

# Create static files backup
echo "Creating static files backup..."
tar -czf $BACKUP_DIR/static_backup_$DATE.tar.gz \
    /opt/workout-tracker/backend/staticfiles/

# Verify backups
echo "Verifying backups..."
for backup in $BACKUP_DIR/*_backup_$DATE.tar.gz; do
    if tar -tzf "$backup" > /dev/null; then
        echo "✅ $(basename $backup): OK"
    else
        echo "❌ $(basename $backup): FAILED"
    fi
done

# Calculate backup sizes
echo "Backup sizes:"
du -h $BACKUP_DIR/*_backup_$DATE.tar.gz

# Create backup metadata
cat > $BACKUP_DIR/app_backup_$DATE.metadata << EOF
{
    "backup_date": "$DATE",
    "backup_type": "application",
    "app_version": "$(git rev-parse HEAD)",
    "backup_files": [
        "app_backup_$DATE.tar.gz",
        "config_backup_$DATE.tar.gz",
        "logs_backup_$DATE.tar.gz",
        "media_backup_$DATE.tar.gz",
        "static_backup_$DATE.tar.gz"
    ],
    "backup_size": "$(du -sh $BACKUP_DIR/*_backup_$DATE.tar.gz | awk '{sum+=$1} END {print sum}')"
}
EOF

echo "Application backup completed successfully"
```

### Incremental Application Backup
```bash
#!/bin/bash
# Incremental application backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/workout-tracker"
LAST_BACKUP_FILE="$BACKUP_DIR/last_backup_timestamp"

echo "=== Incremental Application Backup ==="

# Create backup directory
mkdir -p $BACKUP_DIR

# Get last backup timestamp
if [ -f "$LAST_BACKUP_FILE" ]; then
    LAST_BACKUP=$(cat $LAST_BACKUP_FILE)
    echo "Last backup: $LAST_BACKUP"
else
    LAST_BACKUP="1970-01-01"
    echo "No previous backup found, creating full backup"
fi

# Create incremental backup
echo "Creating incremental backup..."
tar -czf $BACKUP_DIR/incremental_backup_$DATE.tar.gz \
    --newer="$LAST_BACKUP" \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    --exclude='*.log' \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    $APP_DIR

# Update last backup timestamp
echo "$(date)" > $LAST_BACKUP_FILE

# Verify incremental backup
echo "Verifying incremental backup..."
if tar -tzf $BACKUP_DIR/incremental_backup_$DATE.tar.gz > /dev/null; then
    echo "✅ Incremental backup: OK"
else
    echo "❌ Incremental backup: FAILED"
fi

# Calculate backup size
backup_size=$(du -h $BACKUP_DIR/incremental_backup_$DATE.tar.gz | cut -f1)
echo "Incremental backup size: $backup_size"

echo "Incremental application backup completed successfully"
```

## 🔄 Recovery Procedures

### Database Recovery
```bash
#!/bin/bash
# Database recovery script

BACKUP_DIR="/opt/workout-tracker/backups"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/db_backup_*.sql.gz.enc
    exit 1
fi

echo "=== Database Recovery ==="
echo "Backup file: $BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Stop application
echo "Stopping application..."
sudo systemctl stop workout-tracker

# Backup current database
echo "Backing up current database..."
mysqldump -u workout_user -p workout_tracker > $BACKUP_DIR/current_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Determine backup type and restore
if [[ "$BACKUP_FILE" == *.enc ]]; then
    echo "Restoring encrypted backup..."
    openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in $BACKUP_FILE | mysql -u workout_user -p workout_tracker
elif [[ "$BACKUP_FILE" == *.gpg ]]; then
    echo "Restoring GPG encrypted backup..."
    gpg --decrypt --passphrase $ENCRYPTION_KEY $BACKUP_FILE | mysql -u workout_user -p workout_tracker
elif [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Restoring compressed backup..."
    gunzip -c $BACKUP_FILE | mysql -u workout_user -p workout_tracker
else
    echo "Restoring plain backup..."
    mysql -u workout_user -p workout_tracker < $BACKUP_FILE
fi

# Verify restoration
echo "Verifying restoration..."
mysql -u workout_user -p workout_tracker -e "SELECT COUNT(*) FROM workouts;"

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
# Application recovery script

BACKUP_DIR="/opt/workout-tracker/backups"
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/app_backup_*.tar.gz
    exit 1
fi

echo "=== Application Recovery ==="
echo "Backup file: $BACKUP_FILE"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Stop services
echo "Stopping services..."
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

# Restore application
echo "Restoring application..."
tar -xzf $BACKUP_FILE -C /

# Restore configuration
echo "Restoring configuration..."
tar -xzf $BACKUP_DIR/config_backup_$(basename $BACKUP_FILE .tar.gz | sed 's/app_backup_/config_backup_/') -C /

# Restore media files
echo "Restoring media files..."
tar -xzf $BACKUP_DIR/media_backup_$(basename $BACKUP_FILE .tar.gz | sed 's/app_backup_/media_backup_/') -C /

# Restore static files
echo "Restoring static files..."
tar -xzf $BACKUP_DIR/static_backup_$(basename $BACKUP_FILE .tar.gz | sed 's/app_backup_/static_backup_/') -C /

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data /opt/workout-tracker
sudo chmod -R 755 /opt/workout-tracker

# Start services
echo "Starting services..."
sudo systemctl start workout-tracker
sudo systemctl start nginx

# Verify application
echo "Verifying application..."
sleep 10
curl -f http://localhost:8000/api/health/

echo "Application recovery completed successfully"
```

## 🌐 Remote Backup

### Cloud Storage Backup
```bash
#!/bin/bash
# Cloud storage backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CLOUD_STORAGE_URL="s3://your-backup-bucket/workout-tracker"

echo "=== Cloud Storage Backup ==="

# Create local backup
echo "Creating local backup..."
./database_backup.sh
./application_backup.sh

# Upload to cloud storage
echo "Uploading to cloud storage..."
aws s3 sync $BACKUP_DIR $CLOUD_STORAGE_URL/ --exclude "*.metadata"

# Verify upload
echo "Verifying upload..."
aws s3 ls $CLOUD_STORAGE_URL/ --recursive

# Set backup retention policy
echo "Setting backup retention policy..."
aws s3api put-bucket-lifecycle-configuration \
    --bucket your-backup-bucket \
    --lifecycle-configuration '{
        "Rules": [
            {
                "ID": "DeleteOldBackups",
                "Status": "Enabled",
                "Filter": {
                    "Prefix": "workout-tracker/"
                },
                "Expiration": {
                    "Days": 30
                }
            }
        ]
    }'

echo "Cloud storage backup completed successfully"
```

### Cross-Region Backup
```bash
#!/bin/bash
# Cross-region backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
PRIMARY_REGION="us-east-1"
SECONDARY_REGION="us-west-2"

echo "=== Cross-Region Backup ==="

# Create local backup
echo "Creating local backup..."
./database_backup.sh
./application_backup.sh

# Upload to primary region
echo "Uploading to primary region..."
aws s3 sync $BACKUP_DIR s3://your-backup-bucket-primary/workout-tracker/ \
    --region $PRIMARY_REGION

# Upload to secondary region
echo "Uploading to secondary region..."
aws s3 sync $BACKUP_DIR s3://your-backup-bucket-secondary/workout-tracker/ \
    --region $SECONDARY_REGION

# Set up cross-region replication
echo "Setting up cross-region replication..."
aws s3api put-bucket-replication \
    --bucket your-backup-bucket-primary \
    --replication-configuration '{
        "Role": "arn:aws:iam::account:role/replication-role",
        "Rules": [
            {
                "ID": "ReplicateToSecondary",
                "Status": "Enabled",
                "Prefix": "workout-tracker/",
                "Destination": {
                    "Bucket": "arn:aws:s3:::your-backup-bucket-secondary",
                    "StorageClass": "STANDARD_IA"
                }
            }
        ]
    }'

echo "Cross-region backup completed successfully"
```

## 🔒 Backup Security

### Backup Encryption
```bash
#!/bin/bash
# Backup encryption script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ENCRYPTION_KEY="your-encryption-key"
GPG_KEY_ID="your-gpg-key-id"

echo "=== Backup Encryption ==="

# Create backup
echo "Creating backup..."
./database_backup.sh

# Encrypt with OpenSSL
echo "Encrypting with OpenSSL..."
for backup in $BACKUP_DIR/*_backup_$DATE.*; do
    if [[ "$backup" != *.enc ]]; then
        openssl enc -aes-256-cbc -salt -k $ENCRYPTION_KEY -in "$backup" -out "${backup}.enc"
        rm "$backup"
    fi
done

# Encrypt with GPG
echo "Encrypting with GPG..."
for backup in $BACKUP_DIR/*_backup_$DATE.*.enc; do
    gpg --symmetric --cipher-algo AES256 --passphrase $ENCRYPTION_KEY "$backup"
done

# Sign with GPG
echo "Signing with GPG..."
for backup in $BACKUP_DIR/*_backup_$DATE.*.gpg; do
    gpg --sign --default-key $GPG_KEY_ID "$backup"
done

# Verify encryption
echo "Verifying encryption..."
for backup in $BACKUP_DIR/*_backup_$DATE.*.enc; do
    if openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in "$backup" | head -10; then
        echo "✅ $(basename $backup): Encryption verified"
    else
        echo "❌ $(basename $backup): Encryption verification failed"
    fi
done

echo "Backup encryption completed successfully"
```

### Backup Integrity Verification
```bash
#!/bin/bash
# Backup integrity verification script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=== Backup Integrity Verification ==="

# Create checksums
echo "Creating checksums..."
for backup in $BACKUP_DIR/*_backup_$DATE.*; do
    if [[ "$backup" != *.md5 ]]; then
        md5sum "$backup" > "${backup}.md5"
        sha256sum "$backup" > "${backup}.sha256"
    fi
done

# Verify checksums
echo "Verifying checksums..."
for backup in $BACKUP_DIR/*_backup_$DATE.*; do
    if [[ "$backup" != *.md5 && "$backup" != *.sha256 ]]; then
        if md5sum -c "${backup}.md5" > /dev/null 2>&1; then
            echo "✅ $(basename $backup): MD5 checksum verified"
        else
            echo "❌ $(basename $backup): MD5 checksum verification failed"
        fi
        
        if sha256sum -c "${backup}.sha256" > /dev/null 2>&1; then
            echo "✅ $(basename $backup): SHA256 checksum verified"
        else
            echo "❌ $(basename $backup): SHA256 checksum verification failed"
        fi
    fi
done

# Test backup restoration
echo "Testing backup restoration..."
for backup in $BACKUP_DIR/db_backup_$DATE.*; do
    if [[ "$backup" == *.sql.gz.enc ]]; then
        echo "Testing database backup restoration..."
        openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in "$backup" | gunzip | head -10
    fi
done

echo "Backup integrity verification completed successfully"
```

## 📊 Backup Monitoring

### Backup Status Monitoring
```python
# Backup status monitoring
import os
import time
from datetime import datetime, timedelta

class BackupMonitor:
    def __init__(self):
        self.backup_dir = "/opt/workout-tracker/backups"
        self.monitoring_log = []
    
    def check_backup_status(self):
        """Check backup status"""
        status = {
            'database_backups': self.check_database_backups(),
            'application_backups': self.check_application_backups(),
            'backup_sizes': self.check_backup_sizes(),
            'backup_age': self.check_backup_age(),
            'backup_integrity': self.check_backup_integrity(),
        }
        
        return status
    
    def check_database_backups(self):
        """Check database backup status"""
        db_backups = []
        for file in os.listdir(self.backup_dir):
            if file.startswith('db_backup_') and file.endswith('.sql.gz.enc'):
                file_path = os.path.join(self.backup_dir, file)
                stat = os.stat(file_path)
                db_backups.append({
                    'filename': file,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime),
                    'modified': datetime.fromtimestamp(stat.st_mtime),
                })
        
        return sorted(db_backups, key=lambda x: x['created'], reverse=True)
    
    def check_application_backups(self):
        """Check application backup status"""
        app_backups = []
        for file in os.listdir(self.backup_dir):
            if file.startswith('app_backup_') and file.endswith('.tar.gz'):
                file_path = os.path.join(self.backup_dir, file)
                stat = os.stat(file_path)
                app_backups.append({
                    'filename': file,
                    'size': stat.st_size,
                    'created': datetime.fromtimestamp(stat.st_ctime),
                    'modified': datetime.fromtimestamp(stat.st_mtime),
                })
        
        return sorted(app_backups, key=lambda x: x['created'], reverse=True)
    
    def check_backup_sizes(self):
        """Check backup sizes"""
        total_size = 0
        backup_count = 0
        
        for file in os.listdir(self.backup_dir):
            if file.endswith(('.sql.gz.enc', '.tar.gz')):
                file_path = os.path.join(self.backup_dir, file)
                stat = os.stat(file_path)
                total_size += stat.st_size
                backup_count += 1
        
        return {
            'total_size': total_size,
            'backup_count': backup_count,
            'average_size': total_size / backup_count if backup_count > 0 else 0,
        }
    
    def check_backup_age(self):
        """Check backup age"""
        now = datetime.now()
        old_backups = []
        
        for file in os.listdir(self.backup_dir):
            if file.endswith(('.sql.gz.enc', '.tar.gz')):
                file_path = os.path.join(self.backup_dir, file)
                stat = os.stat(file_path)
                age = now - datetime.fromtimestamp(stat.st_ctime)
                
                if age.days > 7:  # 7 days threshold
                    old_backups.append({
                        'filename': file,
                        'age_days': age.days,
                        'created': datetime.fromtimestamp(stat.st_ctime),
                    })
        
        return old_backups
    
    def check_backup_integrity(self):
        """Check backup integrity"""
        integrity_issues = []
        
        for file in os.listdir(self.backup_dir):
            if file.endswith('.md5'):
                file_path = os.path.join(self.backup_dir, file)
                backup_file = file_path.replace('.md5', '')
                
                if os.path.exists(backup_file):
                    # Check MD5 checksum
                    with open(file_path, 'r') as f:
                        expected_md5 = f.read().split()[0]
                    
                    import hashlib
                    with open(backup_file, 'rb') as f:
                        actual_md5 = hashlib.md5(f.read()).hexdigest()
                    
                    if expected_md5 != actual_md5:
                        integrity_issues.append({
                            'filename': file,
                            'issue': 'MD5 checksum mismatch',
                            'expected': expected_md5,
                            'actual': actual_md5,
                        })
        
        return integrity_issues
    
    def generate_backup_report(self):
        """Generate backup report"""
        status = self.check_backup_status()
        
        report = []
        report.append("=== Backup Status Report ===")
        report.append(f"Generated: {datetime.now()}")
        report.append("")
        
        # Database backups
        report.append("Database Backups:")
        for backup in status['database_backups'][:5]:  # Last 5
            report.append(f"  {backup['filename']} - {backup['size']} bytes - {backup['created']}")
        report.append("")
        
        # Application backups
        report.append("Application Backups:")
        for backup in status['application_backups'][:5]:  # Last 5
            report.append(f"  {backup['filename']} - {backup['size']} bytes - {backup['created']}")
        report.append("")
        
        # Backup sizes
        sizes = status['backup_sizes']
        report.append(f"Total Backup Size: {sizes['total_size']} bytes")
        report.append(f"Backup Count: {sizes['backup_count']}")
        report.append(f"Average Size: {sizes['average_size']} bytes")
        report.append("")
        
        # Old backups
        old_backups = status['backup_age']
        if old_backups:
            report.append("Old Backups (>7 days):")
            for backup in old_backups:
                report.append(f"  {backup['filename']} - {backup['age_days']} days old")
            report.append("")
        
        # Integrity issues
        integrity_issues = status['backup_integrity']
        if integrity_issues:
            report.append("Integrity Issues:")
            for issue in integrity_issues:
                report.append(f"  {issue['filename']}: {issue['issue']}")
            report.append("")
        
        return "\n".join(report)
```

## 📋 Backup Checklist

### Daily Backup Tasks
- [ ] **Database Backup**: Create daily database backup
- [ ] **Backup Verification**: Verify backup integrity
- [ ] **Backup Compression**: Compress and encrypt backups
- [ ] **Remote Upload**: Upload backups to remote storage
- [ ] **Cleanup**: Remove old local backups
- [ ] **Monitoring**: Check backup status and alerts

### Weekly Backup Tasks
- [ ] **Full System Backup**: Create complete system backup
- [ ] **Configuration Backup**: Backup all configuration files
- [ ] **Media Backup**: Backup user-uploaded media files
- [ ] **Log Backup**: Backup system and application logs
- [ ] **Backup Testing**: Test backup restoration procedures
- [ ] **Backup Report**: Generate backup status report

### Monthly Backup Tasks
- [ ] **Backup Audit**: Review backup procedures and policies
- [ ] **Disaster Recovery Test**: Test complete system recovery
- [ ] **Backup Optimization**: Optimize backup processes
- [ ] **Storage Management**: Review and optimize storage usage
- [ ] **Security Review**: Review backup security measures
- [ ] **Documentation Update**: Update backup documentation

---

**Remember**: Regular backups are essential for data protection. Always test backup restoration procedures and maintain multiple backup copies in different locations.
