# Debugging Guide for AI Agents

This document provides comprehensive debugging strategies for the Workout & Macro Tracking App.

## Known Issues

### 1. SECRET_KEY Not Set
**Error**: `ValueError: SECRET_KEY environment variable must be set`
**Solution**: 
```bash
# Create .env file in project root
echo "SECRET_KEY=your-very-long-random-secret-key-here" >> .env
```

### 2. MySQL Connection Failed
**Error**: `django.db.utils.OperationalError: (2003, "Can't connect to MySQL server"`
**Common Causes**:
- MySQL service not running
- Wrong credentials in .env
- Database doesn't exist

**Solutions**:
```bash
# Check MySQL status
mysql --version
systemctl status mysql  # Linux
net start MySQL         # Windows

# Create database
mysql -u root -p
CREATE DATABASE tracking_app;
```

### 3. OpenAI Empty Response
**Issue**: Food parsing returns all zeros
**Cause**: Reasoning models use all tokens for internal reasoning
**Solution**: Already fixed - using 5000 tokens for reasoning models

### 4. CORS Errors
**Error**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS`
**Solution**: Ensure backend is running and CORS_ALLOWED_ORIGINS includes frontend URL

### 5. JWT Token Expired
**Error**: `401 Unauthorized` on API calls
**Solution**: Token refresh is automatic, but if refresh token expires, user must re-login

## Logging

### Enable Debug Logging

**Backend** (Django):
```python
# In settings.py temporarily
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'level': 'DEBUG',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

**Frontend** (React):
```javascript
// In services/api.js
api.interceptors.request.use(request => {
  console.log('Starting Request:', request)
  return request
})

api.interceptors.response.use(
  response => {
    console.log('Response:', response)
    return response
  },
  error => {
    console.error('Error:', error)
    return Promise.reject(error)
  }
)
```

### Log Locations

- **Django Logs**: `backend/logs/django.log`
- **Browser Console**: F12 → Console tab
- **Network Tab**: F12 → Network tab (see all API calls)
- **Django Console**: Terminal where `runserver` is running

## Common Failure Points

### Authentication Failures

1. **Token Not Sent**
   - Check localStorage for `access_token`
   - Verify AuthContext is wrapping components
   - Check axios interceptor is adding Authorization header

2. **Token Invalid**
   - Check token expiration
   - Verify JWT_SECRET_KEY matches between generates and validates
   - Ensure middleware is in correct order

### Database Query Issues

1. **N+1 Queries**
   ```python
   # Bad - causes N+1
   for food_log in FoodLog.objects.filter(user=user):
       print(food_log.food.food_name)
   
   # Good - single query
   food_logs = FoodLog.objects.filter(user=user).select_related('food')
   for food_log in food_logs:
       print(food_log.food.food_name)
   ```

2. **Missing Relations**
   ```python
   # Add to view
   queryset = queryset.select_related('user', 'food')
   queryset = queryset.prefetch_related('meal__foods')
   ```

### API Response Issues

1. **Wrong Response Format**
   ```python
   # Bad
   return Response(data)
   
   # Good
   return Response({'data': data})
   
   # Error
   return Response({'error': {'message': 'Error details'}}, status=400)
   ```

2. **Serializer Validation**
   ```python
   serializer = FoodSerializer(data=request.data)
   if not serializer.is_valid():
       print(serializer.errors)  # Debug validation errors
       return Response({'error': serializer.errors}, status=400)
   ```

### Frontend State Issues

1. **Component Not Re-rendering**
   ```javascript
   // Check dependencies
   useEffect(() => {
     console.log('Effect triggered')
     fetchData()
   }, [userId])  // Make sure all dependencies are listed
   ```

2. **Stale Data**
   ```javascript
   // Force refetch
   const refreshData = async () => {
     setData(null)  // Clear cache
     const fresh = await api.get('/endpoint')
     setData(fresh.data.data)
   }
   ```

## Debugging Tools

### Django Shell
```bash
python manage.py shell
```

```python
# Test queries
from apps.users.models import User
from apps.foods.models import Food

# Get user
user = User.objects.get(username='testuser')

# Test relationships
user.foodlog_set.all()
user.usergoal

# Test calculations
from apps.users.services import BodyMetricsService
metrics = BodyMetricsService(user_data).get_all_metrics()
```

### Django Admin
```bash
# Create superuser
python manage.py createsuperuser

# Access at http://localhost:8000/admin
```

### API Testing
```bash
# Test with curl
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Test authenticated endpoint
curl http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### React DevTools
1. Install browser extension
2. Open DevTools → Components tab
3. Inspect props and state
4. Track context values

## Performance Debugging

### Slow Queries
```python
# In Django shell
from django.db import connection
from django.test.utils import override_settings

with override_settings(DEBUG=True):
    # Your query here
    list(Food.objects.all())
    
    # See queries
    for query in connection.queries:
        print(f"{query['time']}s: {query['sql'][:100]}")
```

### Memory Leaks
```javascript
// Check for uncleared intervals/timeouts
useEffect(() => {
  const timer = setInterval(() => {
    // Do something
  }, 1000)
  
  return () => clearInterval(timer)  // Cleanup!
}, [])
```

### Bundle Size
```bash
# Analyze bundle
npm run build
npm install -g source-map-explorer
source-map-explorer 'build/static/js/*.js'
```

## Error Patterns

### Backend Errors

1. **Import Errors**
   ```python
   # Wrong
   from authentication.models import User
   
   # Right
   from apps.authentication.models import User
   ```

2. **Circular Imports**
   ```python
   # Use string references
   user = models.ForeignKey('users.User', on_delete=models.CASCADE)
   ```

3. **Migration Conflicts**
   ```bash
   # Reset migrations (dev only!)
   python manage.py migrate app_name zero
   python manage.py makemigrations app_name
   python manage.py migrate app_name
   ```

### Frontend Errors

1. **Cannot read property of undefined**
   ```javascript
   // Bad
   {user.profile.name}
   
   // Good
   {user?.profile?.name}
   ```

2. **Invalid Hook Call**
   ```javascript
   // Hooks must be at top level
   const Component = () => {
     if (condition) {
       useState()  // Wrong!
     }
   }
   ```

3. **Infinite Loops**
   ```javascript
   // Bad - infinite loop
   useEffect(() => {
     setData(newData)
   })
   
   // Good - with dependencies
   useEffect(() => {
     setData(newData)
   }, [newData])
   ```

## Quick Fixes

### Reset Everything
```bash
# Backend
cd backend
rm -rf migrations/
python manage.py makemigrations
python manage.py migrate
python manage.py setup_database --required --dummy

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Clear Cache
```javascript
// Browser
localStorage.clear()
sessionStorage.clear()

// React
window.location.reload(true)
```

### Check Health
```bash
# API health check
curl http://localhost:8000/api/health/

# Database check
python manage.py dbshell
SHOW TABLES;
SELECT COUNT(*) FROM users_user;
```

## When All Else Fails

1. **Check the logs** - Most errors are logged
2. **Read the error message** - It usually tells you what's wrong
3. **Check the network tab** - See actual API requests/responses
4. **Use breakpoints** - Step through code execution
5. **Isolate the problem** - Comment out code until it works
6. **Check the database** - Ensure data exists as expected
7. **Restart everything** - Sometimes it just needs a fresh start

---

**Remember**: The error message is your friend. Read it carefully, it usually points directly to the problem.
