# Workout Tracking System - Security Guide

## 🔒 Security Overview

This guide covers security best practices, implementation, and maintenance for the Workout Tracking System. Security is a critical aspect that must be considered at every level of the application.

## 🛡️ Security Architecture

### Security Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Network Security (Firewall, VPN, DDoS Protection)        │
│ 2. Application Security (Authentication, Authorization)     │
│ 3. Data Security (Encryption, Backup, Access Control)      │
│ 4. Infrastructure Security (OS, Database, Server)          │
│ 5. Operational Security (Monitoring, Incident Response)     │
└─────────────────────────────────────────────────────────────┘
```

### Threat Model
- **External Threats**: Unauthorized access, data breaches, DDoS attacks
- **Internal Threats**: Privilege escalation, data exfiltration
- **Application Threats**: SQL injection, XSS, CSRF, authentication bypass
- **Infrastructure Threats**: Server compromise, database attacks

## 🔐 Authentication & Authorization

### JWT Token Security
```python
# JWT Configuration
JWT_AUTH = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}
```

### Password Security
```python
# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 12,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Password hashing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
]
```

### Session Security
```python
# Session configuration
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600  # 1 hour
```

## 🔒 Data Protection

### Database Security
```python
# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'workout_tracker',
        'USER': 'workout_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}
```

### Data Encryption
```python
# Field-level encryption
from django_cryptography.fields import encrypt

class WorkoutLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE)
    notes = encrypt(models.TextField(blank=True))  # Encrypted field
    date_time = models.DateTimeField()
    weight = models.DecimalField(max_digits=5, decimal_places=2)
    reps = models.IntegerField()
    rir = models.IntegerField()
    attributes = models.JSONField(default=list)
```

### Backup Security
```bash
# Encrypted backup script
#!/bin/bash
BACKUP_DIR="/opt/workout-tracker/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="workout_tracker"
DB_USER="workout_user"
DB_PASS="secure_password"
ENCRYPTION_KEY="your-encryption-key"

# Create encrypted backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | \
openssl enc -aes-256-cbc -salt -k $ENCRYPTION_KEY > \
$BACKUP_DIR/db_backup_$DATE.sql.enc

# Verify backup
openssl enc -aes-256-cbc -d -k $ENCRYPTION_KEY -in \
$BACKUP_DIR/db_backup_$DATE.sql.enc | head -10
```

## 🌐 Network Security

### Firewall Configuration
```bash
# UFW Firewall Rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3306/tcp  # Block MySQL from external access
sudo ufw enable
```

### SSL/TLS Configuration
```nginx
# Nginx SSL Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Certificate
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self';" always;
}
```

### DDoS Protection
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

server {
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://workout_backend;
    }
    
    # Login rate limiting
    location /api/auth/login/ {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://workout_backend;
    }
}
```

## 🔍 Input Validation & Sanitization

### Django Form Validation
```python
# Custom validators
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator

def validate_activation_rating(value):
    if not 0 <= value <= 100:
        raise ValidationError('Activation rating must be between 0 and 100')

def validate_workout_name(value):
    if len(value) < 3:
        raise ValidationError('Workout name must be at least 3 characters')
    if not value.replace(' ', '').isalnum():
        raise ValidationError('Workout name can only contain letters, numbers, and spaces')

# Model validation
class Workout(models.Model):
    workout_name = models.CharField(
        max_length=200,
        validators=[validate_workout_name]
    )
    type = models.CharField(max_length=50)
    notes = models.TextField(max_length=1000, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    def clean(self):
        if self.workout_name:
            self.workout_name = self.workout_name.strip()
        if self.notes:
            self.notes = self.notes.strip()
```

### API Input Validation
```python
# Serializer validation
class WorkoutSerializer(serializers.ModelSerializer):
    muscles = WorkoutMuscleSerializer(many=True)
    
    class Meta:
        model = Workout
        fields = ['workout_name', 'type', 'notes', 'muscles']
    
    def validate_workout_name(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Workout name must be at least 3 characters")
        return value.strip()
    
    def validate_muscles(self, value):
        if not value:
            raise serializers.ValidationError("At least one muscle must be specified")
        return value
    
    def validate(self, attrs):
        # Cross-field validation
        if attrs.get('type') == 'bodyweight' and attrs.get('notes'):
            # Additional validation for bodyweight exercises
            pass
        return attrs
```

### SQL Injection Prevention
```python
# Safe ORM queries
def get_user_workouts(user_id):
    # Safe - uses ORM
    return Workout.objects.filter(user_id=user_id)
    
def get_workout_by_name(name):
    # Safe - uses ORM
    return Workout.objects.filter(workout_name__icontains=name)

# Unsafe examples (NEVER DO THIS)
def unsafe_query(user_id):
    # UNSAFE - vulnerable to SQL injection
    return Workout.objects.raw(f"SELECT * FROM workouts WHERE user_id = {user_id}")
```

## 🛡️ Application Security

### CORS Configuration
```python
# CORS settings
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # Never set to True in production

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOWED_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
```

### CSRF Protection
```python
# CSRF settings
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### XSS Protection
```python
# XSS protection in templates
# Use |escape filter
{{ user_input|escape }}

# Use |safe only for trusted content
{{ trusted_content|safe }}

# In JavaScript
function sanitizeInput(input) {
    return input.replace(/[<>]/g, function(match) {
        return match === '<' ? '&lt;' : '&gt;';
    });
}
```

## 🔐 Access Control

### Permission Classes
```python
# Custom permission classes
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return obj.user == request.user

class IsWorkoutOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

# Usage in views
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsWorkoutOwner])
def workout_detail(request, workout_id):
    # View implementation
    pass
```

### Role-Based Access Control
```python
# User roles
class UserRole(models.Model):
    name = models.CharField(max_length=50, unique=True)
    permissions = models.JSONField(default=list)
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.ForeignKey(UserRole, on_delete=models.CASCADE)
    
    def has_permission(self, permission):
        return permission in self.role.permissions

# Permission decorator
def require_permission(permission):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.userprofile.has_permission(permission):
                return Response({'error': 'Permission denied'}, status=403)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
```

## 📊 Security Monitoring

### Logging Security Events
```python
# Security logging
import logging
from django.contrib.auth.signals import user_logged_in, user_login_failed

security_logger = logging.getLogger('security')

def log_user_login(sender, user, request, **kwargs):
    security_logger.info(f"User {user.username} logged in from {request.META.get('REMOTE_ADDR')}")

def log_login_failed(sender, credentials, request, **kwargs):
    security_logger.warning(f"Failed login attempt for {credentials.get('username')} from {request.META.get('REMOTE_ADDR')}")

user_logged_in.connect(log_user_login)
user_login_failed.connect(log_login_failed)
```

### Intrusion Detection
```python
# Failed login monitoring
from django.core.cache import cache
from django.http import HttpResponse

def rate_limit_login(request):
    ip_address = request.META.get('REMOTE_ADDR')
    key = f"login_attempts_{ip_address}"
    
    attempts = cache.get(key, 0)
    if attempts >= 5:
        security_logger.warning(f"Too many login attempts from {ip_address}")
        return HttpResponse("Too many login attempts", status=429)
    
    cache.set(key, attempts + 1, timeout=300)  # 5 minutes
    return None
```

### Security Headers Middleware
```python
# Custom security middleware
class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add security headers
        response['X-Frame-Options'] = 'DENY'
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
```

## 🔍 Vulnerability Assessment

### Security Testing
```python
# Security test cases
from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

class SecurityTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_sql_injection_protection(self):
        # Test SQL injection protection
        malicious_input = "'; DROP TABLE workouts; --"
        response = self.client.get(f'/api/workouts/?search={malicious_input}')
        self.assertEqual(response.status_code, 200)
        # Verify table still exists
        self.assertTrue(Workout.objects.exists())
    
    def test_xss_protection(self):
        # Test XSS protection
        malicious_input = "<script>alert('XSS')</script>"
        response = self.client.post('/api/workouts/', {
            'workout_name': malicious_input,
            'type': 'barbell',
            'muscles': []
        })
        self.assertEqual(response.status_code, 400)
    
    def test_authentication_required(self):
        # Test authentication requirement
        response = self.client.get('/api/workouts/')
        self.assertEqual(response.status_code, 401)
    
    def test_csrf_protection(self):
        # Test CSRF protection
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/workouts/', {
            'workout_name': 'Test Workout',
            'type': 'barbell',
            'muscles': []
        })
        self.assertEqual(response.status_code, 403)
```

### Penetration Testing
```bash
# OWASP ZAP scanning
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://yourdomain.com

# Nikto web vulnerability scanner
nikto -h http://yourdomain.com

# Nmap port scanning
nmap -sS -O yourdomain.com
```

## 🚨 Incident Response

### Security Incident Plan
1. **Detection**: Monitor logs and alerts
2. **Assessment**: Determine severity and impact
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threats and vulnerabilities
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

### Incident Response Script
```bash
#!/bin/bash
# Security incident response script

echo "=== Security Incident Response ==="
echo "Timestamp: $(date)"
echo "Incident ID: INC-$(date +%Y%m%d-%H%M%S)"

# 1. Isolate affected systems
echo "1. Isolating affected systems..."
sudo ufw deny from $ATTACKER_IP

# 2. Preserve evidence
echo "2. Preserving evidence..."
sudo cp /var/log/nginx/access.log /opt/incident-response/logs/
sudo cp /var/log/gunicorn/error.log /opt/incident-response/logs/
sudo cp /var/log/mysql/error.log /opt/incident-response/logs/

# 3. Check for compromise
echo "3. Checking for compromise..."
sudo find /opt/workout-tracker -name "*.php" -o -name "*.sh" | xargs ls -la
sudo netstat -tlnp | grep -E "(80|443|3306)"

# 4. Notify stakeholders
echo "4. Notifying stakeholders..."
# Send notification email
# Update status page
# Contact security team

echo "Incident response completed"
```

## 🔧 Security Maintenance

### Regular Security Tasks
```bash
# Daily security tasks
#!/bin/bash
echo "=== Daily Security Tasks ==="

# Check for failed login attempts
grep "Failed login" /var/log/gunicorn/error.log | tail -10

# Check for suspicious activity
grep "ERROR" /var/log/nginx/access.log | tail -10

# Check disk space
df -h

# Check running processes
ps aux | grep -E "(python|node|mysql|nginx)"

echo "Daily security check completed"
```

### Security Updates
```bash
# Weekly security updates
#!/bin/bash
echo "=== Weekly Security Updates ==="

# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python packages
pip install --upgrade pip
pip install --upgrade -r requirements.txt

# Update Node.js packages
npm update

# Check for security vulnerabilities
pip install safety
safety check

# Check for outdated packages
pip list --outdated
npm outdated

echo "Security updates completed"
```

### Security Auditing
```bash
# Monthly security audit
#!/bin/bash
echo "=== Monthly Security Audit ==="

# Check file permissions
find /opt/workout-tracker -type f -perm /o+w
find /opt/workout-tracker -type d -perm /o+w

# Check for SUID/SGID files
find /opt/workout-tracker -type f -perm /u+s
find /opt/workout-tracker -type f -perm /g+s

# Check for world-writable files
find /opt/workout-tracker -type f -perm /o+w

# Check for empty password fields
sudo awk -F: '($2 == "") {print $1}' /etc/shadow

# Check for root login
sudo grep "^root" /etc/passwd

echo "Security audit completed"
```

## 📋 Security Checklist

### Pre-Deployment Security
- [ ] All passwords are strong and unique
- [ ] SSL/TLS certificates are valid and properly configured
- [ ] Firewall rules are properly configured
- [ ] Database access is restricted
- [ ] All dependencies are up to date
- [ ] Security headers are configured
- [ ] Input validation is implemented
- [ ] Authentication and authorization are properly configured
- [ ] Logging is configured for security events
- [ ] Backup and recovery procedures are tested

### Post-Deployment Security
- [ ] Monitor logs for security events
- [ ] Regularly update dependencies
- [ ] Perform security scans
- [ ] Test backup and recovery procedures
- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Monitor system resources
- [ ] Verify SSL certificate validity
- [ ] Test incident response procedures

### Ongoing Security
- [ ] Weekly security updates
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Annual security review
- [ ] Continuous monitoring
- [ ] Regular training for team members
- [ ] Update security policies
- [ ] Review and update incident response plan

---

**Remember**: Security is an ongoing process, not a one-time implementation. Regular monitoring, updates, and testing are essential for maintaining a secure system.
