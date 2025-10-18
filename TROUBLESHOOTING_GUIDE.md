# Workout Tracking System - Troubleshooting Guide

## 🔍 Troubleshooting Overview

This guide provides comprehensive troubleshooting procedures for the Workout Tracking System, covering common issues, diagnostic tools, and resolution strategies.

## 🚨 Emergency Procedures

### System Completely Down
1. **Check Service Status**:
   ```bash
   sudo systemctl status workout-tracker
   sudo systemctl status nginx
   sudo systemctl status mysql
   ```

2. **Restart Services**:
   ```bash
   sudo systemctl restart workout-tracker
   sudo systemctl restart nginx
   sudo systemctl restart mysql
   ```

3. **Check Logs**:
   ```bash
   sudo journalctl -u workout-tracker -f
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/mysql/error.log
   ```

4. **Verify Configuration**:
   ```bash
   sudo nginx -t
   python manage.py check --deploy
   ```

### Database Connection Lost
1. **Check MySQL Status**:
   ```bash
   sudo systemctl status mysql
   sudo systemctl restart mysql
   ```

2. **Test Connection**:
   ```bash
   mysql -u workout_user -p workout_tracker
   ```

3. **Check Disk Space**:
   ```bash
   df -h
   ```

4. **Restore from Backup**:
   ```bash
   # Stop services
   sudo systemctl stop workout-tracker
   
   # Restore database
   gunzip /opt/workout-tracker/backups/db_backup_latest.sql.gz
   mysql -u workout_user -p workout_tracker < /opt/workout-tracker/backups/db_backup_latest.sql
   
   # Restart services
   sudo systemctl start workout-tracker
   ```

## 🐛 Backend Issues

### Django Application Errors

#### ImportError: No module named 'apps'
**Symptoms**: Application fails to start with import errors
**Cause**: Python path issues or missing dependencies
**Solution**:
```bash
# Check Python path
cd /opt/workout-tracker/backend
source ../venv/bin/activate
python -c "import sys; print(sys.path)"

# Reinstall dependencies
pip install -r requirements.txt

# Check Django installation
python -c "import django; print(django.get_version())"
```

#### OperationalError: no such table
**Symptoms**: Database table not found errors
**Cause**: Missing migrations or database schema issues
**Solution**:
```bash
# Check migration status
python manage.py showmigrations

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Check database tables
mysql -u workout_user -p workout_tracker
SHOW TABLES;
```

#### ValueError: SECRET_KEY environment variable must be set
**Symptoms**: Django fails to start due to missing SECRET_KEY
**Cause**: Environment variables not properly configured
**Solution**:
```bash
# Check environment file
cat backend/.env

# Set SECRET_KEY
echo "SECRET_KEY=your-secret-key-here" >> backend/.env

# Restart service
sudo systemctl restart workout-tracker
```

#### Foreign Key Errors
**Symptoms**: `ValueError: Cannot assign "1": "MuscleLog.muscle_name" must be a "Muscle" instance`
**Cause**: Passing IDs instead of model instances
**Solution**:
```python
# Incorrect
muscle_log, created = MuscleLog.objects.update_or_create(
    user=request.user,
    muscle_name=muscle_id,  # Wrong: passing ID
    defaults={'priority': priority}
)

# Correct
muscle = Muscle.objects.get(muscles_id=muscle_id)
muscle_log, created = MuscleLog.objects.update_or_create(
    user=request.user,
    muscle_name=muscle,  # Correct: passing instance
    defaults={'priority': priority}
)
```

#### Related Manager Access Errors
**Symptoms**: `AttributeError: 'Split' object has no attribute 'split_days'`
**Cause**: Using incorrect related manager names
**Solution**:
```python
# Incorrect
obj.split_days.exists()
obj.split_days.count()

# Correct
obj.splitday_set.exists()
obj.splitday_set.count()
```

### API Endpoint Issues

#### 401 Unauthorized Errors
**Symptoms**: API calls return 401 status
**Cause**: Authentication issues
**Solution**:
```bash
# Check JWT token
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/workouts/

# Test authentication endpoint
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'
```

#### 500 Internal Server Error
**Symptoms**: API returns 500 status
**Cause**: Server-side errors
**Solution**:
```bash
# Check Django logs
sudo journalctl -u workout-tracker -f

# Check error logs
tail -f /var/log/gunicorn/error.log

# Test in Django shell
python manage.py shell
>>> from apps.workouts.models import Workout
>>> Workout.objects.all()
```

#### CORS Errors
**Symptoms**: Frontend can't access API
**Cause**: CORS configuration issues
**Solution**:
```python
# Check CORS settings in settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

# Test CORS
curl -H "Origin: https://yourdomain.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:8000/api/workouts/
```

### Database Issues

#### Connection Refused
**Symptoms**: `MySQLdb.OperationalError: (2003, "Can't connect to MySQL server")`
**Cause**: MySQL service not running or connection issues
**Solution**:
```bash
# Check MySQL status
sudo systemctl status mysql

# Start MySQL
sudo systemctl start mysql

# Check MySQL configuration
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# Test connection
mysql -u workout_user -p workout_tracker
```

#### Table Lock Issues
**Symptoms**: Queries hang or timeout
**Cause**: Table locks or long-running queries
**Solution**:
```sql
-- Check for locks
SHOW PROCESSLIST;

-- Kill problematic queries
KILL QUERY <process_id>;

-- Check table status
SHOW TABLE STATUS LIKE 'workouts';

-- Repair tables if needed
REPAIR TABLE workouts;
```

#### Schema Mismatch Errors
**Symptoms**: `MySQLdb.OperationalError: (1054, "Unknown column 'column_name' in 'field list'")`
**Cause**: Model fields don't match database schema
**Solution**:
```bash
# Check current schema
mysql -u workout_user -p workout_tracker
DESCRIBE workouts;

# Compare with model
python manage.py inspectdb

# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

## ⚛️ Frontend Issues

### React Application Errors

#### Module Not Found Errors
**Symptoms**: `Module not found: Can't resolve 'module-name'`
**Cause**: Missing dependencies or incorrect import paths
**Solution**:
```bash
# Check node_modules
ls -la frontend/node_modules/

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

# Check import paths
grep -r "import.*module-name" frontend/src/
```

#### Build Failures
**Symptoms**: `npm run build` fails
**Cause**: Syntax errors or dependency issues
**Solution**:
```bash
# Check for syntax errors
npm run build 2>&1 | grep -i error

# Check ESLint
npm run lint

# Fix TypeScript errors
npm run type-check

# Clear build cache
rm -rf frontend/build
npm run build
```

#### Runtime Errors
**Symptoms**: Application crashes or shows errors in browser
**Cause**: JavaScript errors or API issues
**Solution**:
```bash
# Check browser console
# Open Developer Tools (F12)
# Check Console tab for errors

# Check Network tab
# Verify API calls are successful

# Test API endpoints
curl http://localhost:8000/api/workouts/
```

### Component Issues

#### State Management Problems
**Symptoms**: Components not updating or showing stale data
**Cause**: State management issues
**Solution**:
```javascript
// Check state updates
console.log('Current state:', state);

// Verify useEffect dependencies
useEffect(() => {
    // Effect logic
}, [dependency1, dependency2]);

// Check API calls
const fetchData = async () => {
    try {
        const response = await api.get('/workouts/');
        setData(response.data);
    } catch (error) {
        console.error('API Error:', error);
    }
};
```

#### API Integration Issues
**Symptoms**: Frontend can't communicate with backend
**Cause**: API configuration or network issues
**Solution**:
```javascript
// Check API configuration
console.log('API Base URL:', process.env.REACT_APP_API_URL);

// Test API connection
fetch('/api/health/')
    .then(response => response.json())
    .then(data => console.log('API Health:', data))
    .catch(error => console.error('API Error:', error));
```

## 🌐 Network Issues

### DNS Resolution Problems
**Symptoms**: Domain not resolving or slow resolution
**Cause**: DNS configuration issues
**Solution**:
```bash
# Test DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check DNS servers
cat /etc/resolv.conf

# Flush DNS cache
sudo systemctl flush-dns
```

### SSL Certificate Issues
**Symptoms**: SSL errors or certificate warnings
**Cause**: Certificate problems
**Solution**:
```bash
# Check certificate
sudo openssl x509 -in /etc/ssl/certs/yourdomain.com.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Renew certificate
sudo certbot renew --dry-run
sudo certbot renew
```

### Firewall Issues
**Symptoms**: Can't access services from external networks
**Cause**: Firewall blocking connections
**Solution**:
```bash
# Check firewall status
sudo ufw status

# Check open ports
sudo netstat -tlnp

# Allow required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
```

## 📊 Performance Issues

### Slow Database Queries
**Symptoms**: API responses are slow
**Cause**: Inefficient database queries
**Solution**:
```bash
# Enable slow query log
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
```

```bash
# Check slow queries
sudo tail -f /var/log/mysql/slow.log

# Optimize queries
mysql -u workout_user -p workout_tracker
EXPLAIN SELECT * FROM workouts WHERE user_id = 1;
```

### High Memory Usage
**Symptoms**: System running out of memory
**Cause**: Memory leaks or inefficient processes
**Solution**:
```bash
# Check memory usage
free -h
htop

# Check process memory usage
ps aux --sort=-%mem | head -10

# Restart services
sudo systemctl restart workout-tracker
sudo systemctl restart nginx
```

### High CPU Usage
**Symptoms**: System running slowly
**Cause**: CPU-intensive processes
**Solution**:
```bash
# Check CPU usage
top
htop

# Check process CPU usage
ps aux --sort=-%cpu | head -10

# Check system load
uptime
```

## 🔧 Configuration Issues

### Environment Variables
**Symptoms**: Application not using correct configuration
**Cause**: Environment variables not set
**Solution**:
```bash
# Check environment file
cat backend/.env

# Verify variables are loaded
python manage.py shell
>>> import os
>>> print(os.getenv('SECRET_KEY'))

# Check frontend environment
cat frontend/.env.production
```

### File Permissions
**Symptoms**: Permission denied errors
**Cause**: Incorrect file permissions
**Solution**:
```bash
# Check file permissions
ls -la /opt/workout-tracker/

# Fix permissions
sudo chown -R www-data:www-data /opt/workout-tracker/
sudo chmod -R 755 /opt/workout-tracker/

# Check log permissions
sudo chown www-data:www-data /var/log/gunicorn/
sudo chmod 755 /var/log/gunicorn/
```

### Service Configuration
**Symptoms**: Services not starting or behaving incorrectly
**Cause**: Configuration errors
**Solution**:
```bash
# Check service configuration
sudo systemctl cat workout-tracker

# Test configuration
sudo nginx -t
python manage.py check --deploy

# Reload configuration
sudo systemctl reload workout-tracker
sudo systemctl reload nginx
```

## 🔍 Debugging Tools

### Log Analysis
```bash
# Real-time log monitoring
sudo journalctl -u workout-tracker -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Search logs
sudo journalctl -u workout-tracker --since "1 hour ago"
grep "ERROR" /var/log/gunicorn/error.log
```

### Database Debugging
```sql
-- Check database status
SHOW STATUS;

-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS "Size (MB)"
FROM information_schema.TABLES
WHERE table_schema = 'workout_tracker'
ORDER BY (data_length + index_length) DESC;

-- Check slow queries
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
```

### Network Debugging
```bash
# Test connectivity
ping yourdomain.com
telnet yourdomain.com 80
telnet yourdomain.com 443

# Check DNS
nslookup yourdomain.com
dig yourdomain.com

# Test SSL
openssl s_client -connect yourdomain.com:443
```

## 🚨 Recovery Procedures

### Complete System Recovery
1. **Stop all services**:
   ```bash
   sudo systemctl stop workout-tracker
   sudo systemctl stop nginx
   sudo systemctl stop mysql
   ```

2. **Restore from backup**:
   ```bash
   # Restore application
   tar -xzf /opt/workout-tracker/backups/app_backup_latest.tar.gz -C /
   
   # Restore database
   gunzip /opt/workout-tracker/backups/db_backup_latest.sql.gz
   mysql -u workout_user -p workout_tracker < /opt/workout-tracker/backups/db_backup_latest.sql
   ```

3. **Restart services**:
   ```bash
   sudo systemctl start mysql
   sudo systemctl start workout-tracker
   sudo systemctl start nginx
   ```

### Partial Recovery
1. **Restore specific components**:
   ```bash
   # Restore only database
   gunzip /opt/workout-tracker/backups/db_backup_latest.sql.gz
   mysql -u workout_user -p workout_tracker < /opt/workout-tracker/backups/db_backup_latest.sql
   
   # Restore only application
   tar -xzf /opt/workout-tracker/backups/app_backup_latest.tar.gz -C /
   ```

2. **Restart affected services**:
   ```bash
   sudo systemctl restart workout-tracker
   ```

## 📞 Getting Help

### Before Contacting Support
1. **Check this guide** for common solutions
2. **Review logs** for error messages
3. **Test basic functionality** (database connection, API endpoints)
4. **Document the issue** with steps to reproduce

### Information to Provide
- **Error messages** (exact text)
- **Log entries** (relevant lines)
- **Steps to reproduce** the issue
- **System information** (OS, versions)
- **Recent changes** made to the system

### Support Channels
- **Documentation**: Check all documentation files
- **Community Forums**: Post questions in community forums
- **Issue Tracker**: Report bugs in the issue tracker
- **Direct Support**: Contact support team with detailed information

## 🔧 Troubleshooting Scripts

### System Health Check
```bash
#!/bin/bash
# System health check script

echo "=== System Health Check ==="
echo "Date: $(date)"
echo "Uptime: $(uptime)"

# Check services
echo "=== Service Status ==="
systemctl is-active workout-tracker
systemctl is-active nginx
systemctl is-active mysql

# Check resources
echo "=== System Resources ==="
free -h
df -h
top -bn1 | grep "Cpu(s)"

# Check logs
echo "=== Recent Errors ==="
grep -i "error" /var/log/gunicorn/error.log | tail -5
grep -i "error" /var/log/nginx/error.log | tail -5

echo "Health check completed"
```

### Database Health Check
```bash
#!/bin/bash
# Database health check script

echo "=== Database Health Check ==="

# Test connection
mysql -u workout_user -p workout_tracker -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
fi

# Check table status
echo "=== Table Status ==="
mysql -u workout_user -p workout_tracker -e "
SHOW TABLE STATUS;
" 2>/dev/null

# Check slow queries
echo "=== Slow Queries ==="
mysql -u workout_user -p workout_tracker -e "
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
" 2>/dev/null

echo "Database health check completed"
```

### API Health Check
```bash
#!/bin/bash
# API health check script

echo "=== API Health Check ==="

# Test API endpoint
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/workouts/)
if [ $response -eq 200 ]; then
    echo "✅ API endpoint: OK"
else
    echo "❌ API endpoint: FAILED (HTTP $response)"
fi

# Test authentication
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/auth/login/)
if [ $response -eq 405 ]; then
    echo "✅ Authentication endpoint: OK"
else
    echo "❌ Authentication endpoint: FAILED (HTTP $response)"
fi

echo "API health check completed"
```

---

**Remember**: Always backup your system before making changes and test solutions in a staging environment first.