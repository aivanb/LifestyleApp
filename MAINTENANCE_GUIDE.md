# Workout Tracking System - Maintenance Guide

## 🔧 Maintenance Overview

This guide covers routine maintenance tasks, monitoring, and upkeep procedures for the Workout Tracking System to ensure optimal performance and reliability.

## 📅 Maintenance Schedule

### Daily Tasks
- **System Health Check**: Monitor CPU, memory, and disk usage
- **Service Status**: Verify all services are running
- **Log Review**: Check for errors and warnings
- **Backup Verification**: Ensure backups are successful
- **Security Monitoring**: Check for failed login attempts

### Weekly Tasks
- **Performance Review**: Analyze system performance metrics
- **Log Rotation**: Manage log file sizes
- **Dependency Updates**: Check for available updates
- **Database Maintenance**: Optimize tables and check integrity
- **Security Updates**: Apply security patches

### Monthly Tasks
- **Comprehensive Backup**: Full system backup
- **Performance Optimization**: Review and optimize queries
- **Security Audit**: Review access logs and permissions
- **Capacity Planning**: Analyze growth trends
- **Documentation Update**: Update system documentation

### Quarterly Tasks
- **Disaster Recovery Test**: Test backup and recovery procedures
- **Security Assessment**: Comprehensive security review
- **Performance Benchmarking**: Measure system performance
- **Dependency Audit**: Review and update all dependencies
- **Infrastructure Review**: Evaluate hardware and software needs

## 🔍 Daily Maintenance Scripts

### System Health Check
```bash
#!/bin/bash
# Daily system health check

echo "=== Daily System Health Check ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"

# Check disk usage
echo "=== Disk Usage ==="
df -h

# Check memory usage
echo "=== Memory Usage ==="
free -h

# Check CPU usage
echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)"

# Check running services
echo "=== Service Status ==="
systemctl is-active workout-tracker
systemctl is-active nginx
systemctl is-active mysql

# Check log sizes
echo "=== Log Sizes ==="
du -sh /var/log/gunicorn/*
du -sh /var/log/nginx/*
du -sh /var/log/mysql/*

echo "Health check completed"
```

### Service Status Check
```bash
#!/bin/bash
# Service status check

echo "=== Service Status Check ==="

# Check Django application
if systemctl is-active --quiet workout-tracker; then
    echo "✅ Workout Tracker: Running"
else
    echo "❌ Workout Tracker: Not running"
    systemctl status workout-tracker --no-pager
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
    systemctl status nginx --no-pager
fi

# Check MySQL
if systemctl is-active --quiet mysql; then
    echo "✅ MySQL: Running"
else
    echo "❌ MySQL: Not running"
    systemctl status mysql --no-pager
fi

# Check Redis (if used)
if systemctl is-active --quiet redis; then
    echo "✅ Redis: Running"
else
    echo "❌ Redis: Not running"
    systemctl status redis --no-pager
fi
```

### Log Review
```bash
#!/bin/bash
# Log review script

echo "=== Log Review ==="

# Check for errors in Django logs
echo "=== Django Errors ==="
grep -i "error" /var/log/gunicorn/error.log | tail -10

# Check for errors in Nginx logs
echo "=== Nginx Errors ==="
grep -i "error" /var/log/nginx/error.log | tail -10

# Check for errors in MySQL logs
echo "=== MySQL Errors ==="
grep -i "error" /var/log/mysql/error.log | tail -10

# Check for failed login attempts
echo "=== Failed Login Attempts ==="
grep "Failed login" /var/log/gunicorn/error.log | tail -10

# Check for slow queries
echo "=== Slow Queries ==="
grep "slow query" /var/log/mysql/slow.log | tail -10
```

## 🔄 Weekly Maintenance Scripts

### Performance Review
```bash
#!/bin/bash
# Weekly performance review

echo "=== Weekly Performance Review ==="

# Check system load
echo "=== System Load ==="
uptime
iostat 1 5

# Check memory usage trends
echo "=== Memory Usage Trends ==="
free -h
ps aux --sort=-%mem | head -10

# Check disk I/O
echo "=== Disk I/O ==="
iotop -b -n 1

# Check network usage
echo "=== Network Usage ==="
nethogs -t

# Check database performance
echo "=== Database Performance ==="
mysql -u workout_user -p workout_tracker -e "
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Qcache_hits';
SHOW STATUS LIKE 'Qcache_misses';
"
```

### Log Rotation
```bash
#!/bin/bash
# Log rotation script

echo "=== Log Rotation ==="

# Rotate Gunicorn logs
if [ -f /var/log/gunicorn/access.log ]; then
    mv /var/log/gunicorn/access.log /var/log/gunicorn/access.log.$(date +%Y%m%d)
    touch /var/log/gunicorn/access.log
    chown www-data:www-data /var/log/gunicorn/access.log
fi

if [ -f /var/log/gunicorn/error.log ]; then
    mv /var/log/gunicorn/error.log /var/log/gunicorn/error.log.$(date +%Y%m%d)
    touch /var/log/gunicorn/error.log
    chown www-data:www-data /var/log/gunicorn/error.log
fi

# Rotate Nginx logs
if [ -f /var/log/nginx/access.log ]; then
    mv /var/log/nginx/access.log /var/log/nginx/access.log.$(date +%Y%m%d)
    touch /var/log/nginx/access.log
    chown www-data:www-data /var/log/nginx/access.log
fi

if [ -f /var/log/nginx/error.log ]; then
    mv /var/log/nginx/error.log /var/log/nginx/error.log.$(date +%Y%m%d)
    touch /var/log/nginx/error.log
    chown www-data:www-data /var/log/nginx/error.log
fi

# Restart services to use new log files
systemctl reload workout-tracker
systemctl reload nginx

echo "Log rotation completed"
```

### Dependency Updates
```bash
#!/bin/bash
# Dependency update check

echo "=== Dependency Update Check ==="

# Check Python package updates
echo "=== Python Package Updates ==="
pip list --outdated

# Check Node.js package updates
echo "=== Node.js Package Updates ==="
cd /opt/workout-tracker/frontend
npm outdated

# Check system package updates
echo "=== System Package Updates ==="
apt list --upgradable

# Check for security updates
echo "=== Security Updates ==="
apt list --upgradable | grep -i security
```

## 🗄️ Database Maintenance

### Table Optimization
```sql
-- Weekly table optimization
OPTIMIZE TABLE workouts;
OPTIMIZE TABLE workout_muscle;
OPTIMIZE TABLE splits;
OPTIMIZE TABLE split_days;
OPTIMIZE TABLE workout_logs;
OPTIMIZE TABLE muscle_logs;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)",
    table_rows
FROM information_schema.TABLES
WHERE table_schema = 'workout_tracker'
ORDER BY (data_length + index_length) DESC;
```

### Database Integrity Check
```sql
-- Check table integrity
CHECK TABLE workouts;
CHECK TABLE workout_muscle;
CHECK TABLE splits;
CHECK TABLE split_days;
CHECK TABLE workout_logs;
CHECK TABLE muscle_logs;

-- Repair tables if needed
REPAIR TABLE workouts;
REPAIR TABLE workout_muscle;
REPAIR TABLE splits;
REPAIR TABLE split_days;
REPAIR TABLE workout_logs;
REPAIR TABLE muscle_logs;
```

### Database Performance Monitoring
```sql
-- Check slow queries
SELECT 
    query_time,
    lock_time,
    rows_sent,
    rows_examined,
    sql_text
FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;

-- Check connection usage
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Max_used_connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Threads_running';

-- Check query cache
SHOW STATUS LIKE 'Qcache_hits';
SHOW STATUS LIKE 'Qcache_misses';
SHOW STATUS LIKE 'Qcache_inserts';
```

## 🔒 Security Maintenance

### Security Monitoring
```bash
#!/bin/bash
# Security monitoring script

echo "=== Security Monitoring ==="

# Check for failed login attempts
echo "=== Failed Login Attempts ==="
grep "Failed login" /var/log/gunicorn/error.log | tail -20

# Check for suspicious activity
echo "=== Suspicious Activity ==="
grep -i "error\|warning\|critical" /var/log/nginx/access.log | tail -20

# Check for root login attempts
echo "=== Root Login Attempts ==="
grep "root" /var/log/auth.log | tail -10

# Check for SSH login attempts
echo "=== SSH Login Attempts ==="
grep "sshd" /var/log/auth.log | tail -10

# Check for file permission changes
echo "=== File Permission Changes ==="
find /opt/workout-tracker -type f -perm /o+w
find /opt/workout-tracker -type d -perm /o+w
```

### Access Log Review
```bash
#!/bin/bash
# Access log review

echo "=== Access Log Review ==="

# Check top IP addresses
echo "=== Top IP Addresses ==="
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Check top requested URLs
echo "=== Top Requested URLs ==="
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10

# Check for 404 errors
echo "=== 404 Errors ==="
grep " 404 " /var/log/nginx/access.log | tail -10

# Check for 500 errors
echo "=== 500 Errors ==="
grep " 500 " /var/log/nginx/access.log | tail -10
```

## 📊 Performance Monitoring

### System Resource Monitoring
```bash
#!/bin/bash
# System resource monitoring

echo "=== System Resource Monitoring ==="

# CPU usage
echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)"

# Memory usage
echo "=== Memory Usage ==="
free -h

# Disk usage
echo "=== Disk Usage ==="
df -h

# Disk I/O
echo "=== Disk I/O ==="
iostat 1 5

# Network usage
echo "=== Network Usage ==="
nethogs -t

# Process monitoring
echo "=== Top Processes ==="
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

### Application Performance Monitoring
```python
# Django performance monitoring
import time
from django.db import connection
from django.core.cache import cache

class PerformanceMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        start_time = time.time()
        queries_before = len(connection.queries)
        
        response = self.get_response(request)
        
        end_time = time.time()
        queries_after = len(connection.queries)
        
        # Log performance metrics
        performance_data = {
            'response_time': end_time - start_time,
            'query_count': queries_after - queries_before,
            'path': request.path,
            'method': request.method,
            'timestamp': time.time(),
        }
        
        # Store in cache for monitoring
        cache_key = f'performance_{request.path}_{int(time.time())}'
        cache.set(cache_key, performance_data, 300)  # 5 minutes
        
        return response
```

## 🔄 Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"

echo "=== Starting Backup ==="
echo "Date: $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "=== Database Backup ==="
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Application backup
echo "=== Application Backup ==="
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude='venv' \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backups' \
    /opt/workout-tracker/

# Configuration backup
echo "=== Configuration Backup ==="
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
    /etc/nginx/sites-available/workout-tracker \
    /etc/systemd/system/workout-tracker.service \
    /opt/workout-tracker/backend/.env

# Cleanup old backups (keep last 7 days)
echo "=== Cleanup Old Backups ==="
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "config_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed successfully"
```

### Recovery Script
```bash
#!/bin/bash
# Recovery script

BACKUP_DIR="/opt/workout-tracker/backups"
BACKUP_DATE=$1

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/
    exit 1
fi

echo "=== Starting Recovery ==="
echo "Backup Date: $BACKUP_DATE"

# Stop services
echo "=== Stopping Services ==="
systemctl stop workout-tracker
systemctl stop nginx

# Restore database
echo "=== Restoring Database ==="
gunzip $BACKUP_DIR/db_backup_$BACKUP_DATE.sql.gz
mysql -u workout_user -p workout_tracker < $BACKUP_DIR/db_backup_$BACKUP_DATE.sql

# Restore application
echo "=== Restoring Application ==="
tar -xzf $BACKUP_DIR/app_backup_$BACKUP_DATE.tar.gz -C /

# Restore configuration
echo "=== Restoring Configuration ==="
tar -xzf $BACKUP_DIR/config_backup_$BACKUP_DATE.tar.gz -C /

# Start services
echo "=== Starting Services ==="
systemctl start workout-tracker
systemctl start nginx

echo "Recovery completed successfully"
```

## 🚨 Alerting and Monitoring

### Health Check Endpoint
```python
# Health check endpoint
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import psutil
import os

def health_check(request):
    """Comprehensive health check endpoint"""
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'healthy'
    except Exception as e:
        health_status['checks']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Cache check
    try:
        cache.set('health_check', 'test', 10)
        cache.get('health_check')
        health_status['checks']['cache'] = 'healthy'
    except Exception as e:
        health_status['checks']['cache'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Disk space check
    try:
        disk_usage = psutil.disk_usage('/')
        free_percent = (disk_usage.free / disk_usage.total) * 100
        if free_percent < 10:
            health_status['checks']['disk'] = f'unhealthy: {free_percent:.1f}% free'
            health_status['status'] = 'unhealthy'
        else:
            health_status['checks']['disk'] = f'healthy: {free_percent:.1f}% free'
    except Exception as e:
        health_status['checks']['disk'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Memory check
    try:
        memory = psutil.virtual_memory()
        if memory.percent > 90:
            health_status['checks']['memory'] = f'unhealthy: {memory.percent}% used'
            health_status['status'] = 'unhealthy'
        else:
            health_status['checks']['memory'] = f'healthy: {memory.percent}% used'
    except Exception as e:
        health_status['checks']['memory'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    return JsonResponse(health_status)
```

### Monitoring Script
```bash
#!/bin/bash
# Monitoring script

echo "=== System Monitoring ==="

# Check health endpoint
echo "=== Health Check ==="
curl -s http://localhost:8000/api/health/ | jq .

# Check service status
echo "=== Service Status ==="
systemctl is-active workout-tracker
systemctl is-active nginx
systemctl is-active mysql

# Check system resources
echo "=== System Resources ==="
free -h
df -h
uptime

# Check recent errors
echo "=== Recent Errors ==="
grep -i "error" /var/log/gunicorn/error.log | tail -5
grep -i "error" /var/log/nginx/error.log | tail -5
```

## 📋 Maintenance Checklist

### Daily Checklist
- [ ] Check system health (CPU, memory, disk)
- [ ] Verify all services are running
- [ ] Review error logs
- [ ] Check backup status
- [ ] Monitor failed login attempts
- [ ] Check disk space
- [ ] Review performance metrics

### Weekly Checklist
- [ ] Analyze performance trends
- [ ] Rotate log files
- [ ] Check for dependency updates
- [ ] Optimize database tables
- [ ] Review security logs
- [ ] Test backup integrity
- [ ] Update documentation

### Monthly Checklist
- [ ] Perform comprehensive backup
- [ ] Review and optimize queries
- [ ] Conduct security audit
- [ ] Analyze capacity trends
- [ ] Update system documentation
- [ ] Review access permissions
- [ ] Test disaster recovery procedures

### Quarterly Checklist
- [ ] Test disaster recovery procedures
- [ ] Conduct security assessment
- [ ] Benchmark system performance
- [ ] Audit all dependencies
- [ ] Review infrastructure needs
- [ ] Update security policies
- [ ] Plan capacity upgrades

## 🔧 Troubleshooting Common Issues

### Service Won't Start
```bash
# Check service status
systemctl status workout-tracker

# Check logs
journalctl -u workout-tracker -f

# Check configuration
python manage.py check --deploy

# Restart service
systemctl restart workout-tracker
```

### Database Connection Issues
```bash
# Check MySQL status
systemctl status mysql

# Test connection
mysql -u workout_user -p workout_tracker

# Check MySQL logs
tail -f /var/log/mysql/error.log

# Restart MySQL
systemctl restart mysql
```

### Performance Issues
```bash
# Check system resources
htop
iotop
nethogs

# Check database performance
mysql -u workout_user -p workout_tracker
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';

# Check application logs
tail -f /var/log/gunicorn/error.log
```

---

**Remember**: Regular maintenance is essential for system reliability and performance. Keep detailed logs of all maintenance activities and document any issues or solutions for future reference.
