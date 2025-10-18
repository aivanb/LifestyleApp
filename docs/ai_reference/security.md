# Security Guide for AI Agents

This document outlines security best practices, authentication mechanisms, authorization rules, and secrets management for the Workout & Macro Tracking App.

## Authentication System

### JWT Token Flow

```
1. User Login
   POST /api/auth/login/
   → Validate credentials
   → Generate access token (1 hour)
   → Generate refresh token (7 days)
   → Return both tokens

2. API Request
   GET /api/users/profile/
   → Extract token from Authorization header
   → Validate token signature
   → Check token expiration
   → Extract user from token
   → Process request

3. Token Refresh
   POST /api/auth/token/refresh/
   → Validate refresh token
   → Generate new access token
   → Return new access token
```

### Token Storage

**Frontend**:
```javascript
// Stored in localStorage
localStorage.setItem('access_token', token.access);
localStorage.setItem('refresh_token', token.refresh);

// Added to requests via axios interceptor
config.headers.Authorization = `Bearer ${accessToken}`;
```

**Security Considerations**:
- Tokens contain user_id but no sensitive data
- Tokens are signed with SECRET_KEY
- Expired tokens are automatically rejected
- Refresh tokens can be blacklisted on logout

## Authorization Rules

### Permission Classes

```python
# All views require authentication by default
@permission_classes([IsAuthenticated])

# Public endpoints (rare)
@permission_classes([AllowAny])  # Only for login, register

# Admin only endpoints
@permission_classes([IsAuthenticated, IsAdminUser])
```

### Data Access Control

**User Isolation**:
```python
# Good - Users can only see their own data
def get_queryset(self):
    return FoodLog.objects.filter(user=self.request.user)

# Bad - Exposes all users' data
def get_queryset(self):
    return FoodLog.objects.all()
```

**Object-Level Permissions**:
```python
# Verify ownership before updates
food = Food.objects.get(food_id=food_id)
if food.user != request.user and not food.is_public:
    return Response(
        {'error': 'Permission denied'},
        status=status.HTTP_403_FORBIDDEN
    )
```

## Input Validation

### Serializer Validation

```python
class FoodSerializer(serializers.ModelSerializer):
    calories = serializers.IntegerField(min_value=0, max_value=10000)
    protein = serializers.DecimalField(
        max_digits=8, 
        decimal_places=2,
        min_value=0
    )
    
    def validate_food_name(self, value):
        # Custom validation
        if len(value) < 2:
            raise serializers.ValidationError(
                "Food name must be at least 2 characters"
            )
        return value
    
    def validate(self, attrs):
        # Cross-field validation
        if attrs.get('calories', 0) < 0:
            raise serializers.ValidationError(
                "Calories cannot be negative"
            )
        return attrs
```

### SQL Injection Prevention

**Always use ORM**:
```python
# Good - Parameterized query
user = User.objects.filter(username=username).first()

# Bad - SQL injection vulnerable
query = f"SELECT * FROM users WHERE username = '{username}'"
cursor.execute(query)
```

**Raw queries (if needed)**:
```python
# Good - Parameterized
User.objects.raw(
    "SELECT * FROM users WHERE username = %s", 
    [username]
)

# Bad - String formatting
User.objects.raw(
    f"SELECT * FROM users WHERE username = '{username}'"
)
```

### XSS Prevention

**Backend**:
```python
# Django automatically escapes HTML in templates
# For API responses, ensure proper content-type
return Response(
    data,
    content_type='application/json'
)
```

**Frontend**:
```javascript
// React automatically escapes values
<div>{userInput}</div>  // Safe

// Dangerous - only if absolutely necessary
<div dangerouslySetInnerHTML={{__html: userInput}} />

// Safe HTML sanitization if needed
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirty);
```

## Secrets Management

### Environment Variables

**Required Secrets**:
```bash
# .env file (NEVER commit this)
SECRET_KEY=very-long-random-string-at-least-50-characters
JWT_SECRET_KEY=another-very-long-random-string
DB_PASSWORD=strong-database-password
OPENAI_API_KEY=sk-...
```

**Generation**:
```python
# Generate secure keys
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### Configuration Security

```python
# settings.py

# Good - Require SECRET_KEY
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY environment variable must be set")

# Good - Default to secure
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Good - Restrict hosts in production
if not DEBUG:
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')
else:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1']
```

## Common Security Vulnerabilities

### 1. Mass Assignment

**Vulnerable**:
```python
# Bad - Allows user to set any field
serializer = UserSerializer(user, data=request.data)
serializer.save()
```

**Secure**:
```python
# Good - Explicit field list
serializer = UserSerializer(
    user, 
    data=request.data,
    fields=['name', 'email']  # Only these can be updated
)
```

### 2. Information Disclosure

**Vulnerable**:
```python
# Bad - Exposes internal details
except Exception as e:
    return Response({'error': str(e)})
```

**Secure**:
```python
# Good - Generic error message
except Exception as e:
    logger.error(f"Error in view: {str(e)}")
    return Response({
        'error': 'An error occurred processing your request'
    })
```

### 3. Insecure Direct Object References

**Vulnerable**:
```python
# Bad - No ownership check
food_id = request.GET.get('id')
food = Food.objects.get(food_id=food_id)
return Response(FoodSerializer(food).data)
```

**Secure**:
```python
# Good - Ownership verification
food_id = request.GET.get('id')
food = Food.objects.filter(
    Q(food_id=food_id) & 
    (Q(user=request.user) | Q(is_public=True))
).first()

if not food:
    return Response({'error': 'Food not found'}, status=404)
```

### 4. Session Security

```python
# settings.py

# Use secure cookies in production
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = True

# Session timeout
SESSION_COOKIE_AGE = 86400  # 24 hours
```

## API Security

### Rate Limiting

```python
# Add to views that might be abused
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers

@cache_page(60)  # Cache for 1 minute
@vary_on_headers('Authorization')
def expensive_calculation(request):
    # Expensive operation
    pass
```

### CORS Configuration

```python
# settings.py

# Restrictive CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://yourdomain.com",
]

# Don't use in production
# CORS_ALLOW_ALL_ORIGINS = True  # NEVER!
```

### Request Size Limits

```python
# settings.py

# Limit file uploads
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# Limit request body
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

## Security Checklist

### For Every Feature

- [ ] All endpoints require authentication
- [ ] Users can only access their own data
- [ ] Input validation on all user data
- [ ] No sensitive data in responses
- [ ] Errors don't leak system info
- [ ] No hardcoded secrets
- [ ] SQL queries use ORM or parameters
- [ ] File uploads are validated
- [ ] Rate limiting on expensive operations

### For Authentication

- [ ] Passwords are hashed (Django default)
- [ ] Tokens expire appropriately
- [ ] Logout blacklists refresh token
- [ ] Failed logins are logged
- [ ] Password reset is secure
- [ ] No user enumeration possible

### For Data Access

- [ ] Foreign keys enforce ownership
- [ ] Bulk operations check each item
- [ ] Cascading deletes are intentional
- [ ] Public/private data is clearly marked
- [ ] Exports only include user's data

## Security Headers

```python
# middleware/security.py

class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
```

## Incident Response

### If Security Breach Suspected

1. **Rotate all secrets immediately**
2. **Check access logs for anomalies**
3. **Invalidate all existing tokens**
4. **Review recent code changes**
5. **Check for unauthorized data access**
6. **Document incident details**

### Security Logging

```python
# Log security events
import logging
security_logger = logging.getLogger('security')

# Log failed authentication
security_logger.warning(
    f"Failed login attempt for username: {username} from IP: {ip}"
)

# Log authorization failures
security_logger.warning(
    f"Unauthorized access attempt by user {user.id} to {resource}"
)
```

## Regular Security Tasks

### Weekly
- Review error logs for security issues
- Check for unusual access patterns
- Verify no sensitive data in logs

### Monthly
- Update dependencies for security patches
- Review user permissions and access
- Audit API usage patterns

### Quarterly
- Rotate API keys and secrets
- Security scan of codebase
- Review and update security policies

---

**Remember**: Security is not optional. Every feature must be secure by default. When in doubt, choose the more restrictive option.
