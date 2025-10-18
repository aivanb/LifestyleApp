# Agent Guidelines for Autonomous Work

This document provides explicit do's and don'ts for AI agents working on the Workout & Macro Tracking App.

## Core Principles

1. **Preserve Functionality**: Never break existing features
2. **Maintain Consistency**: Follow established patterns
3. **Document Changes**: Update docs when changing code
4. **Test Everything**: Write tests for new code
5. **Security First**: Never compromise security

## DO's ✅

### Before Making Changes

✅ **Read Existing Code**
```python
# First, understand the current implementation
# Check models.py, views.py, serializers.py
# Look for similar features already implemented
```

✅ **Check Documentation**
```bash
# Read relevant docs
- architecture.md - understand system structure
- debugging.md - know common issues
- security.md - understand security requirements
```

✅ **Plan Your Approach**
```
1. Identify affected components
2. Check for dependencies
3. Plan database changes
4. Consider API design
5. Think about tests
```

### When Writing Code

✅ **Follow Existing Patterns**
```python
# If other views use this pattern:
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def view_name(request):
    if request.method == 'GET':
        # GET logic
    elif request.method == 'POST':
        # POST logic

# Don't create a new pattern without good reason
```

✅ **Add Proper Validation**
```python
# Always validate user input
serializer = FoodSerializer(data=request.data)
if serializer.is_valid():
    serializer.save()
else:
    return Response({'error': serializer.errors}, status=400)
```

✅ **Include Error Handling**
```python
try:
    # Risky operation
    result = perform_operation()
except SpecificException as e:
    # Handle specific error
    logger.error(f"Operation failed: {e}")
    return Response({'error': 'Friendly error message'}, status=400)
```

✅ **Write Tests**
```python
def test_new_feature(self):
    """Test the feature you just added"""
    response = self.client.post('/api/endpoint/', data)
    self.assertEqual(response.status_code, 201)
    self.assertIn('expected_field', response.data)
```

✅ **Update Documentation**
```markdown
# In appropriate .md file
## New Feature: [Feature Name]
- Added [date]
- Purpose: [why it exists]
- Usage: [how to use it]
```

### After Making Changes

✅ **Run Tests** (if environment allows)
```bash
python manage.py test apps.modified_app
npm test ComponentName.test.js
```

✅ **Check for Side Effects**
- Did you break any existing features?
- Are all related components updated?
- Do migrations run cleanly?

✅ **Clean Up**
- Remove debug print statements
- Delete temporary files
- Remove commented code

## DON'Ts ❌

### Never Do These

❌ **Don't Remove Code Without Understanding**
```python
# Bad - Don't know why this exists, but removing it
# user.validate_something()  # Deleted this

# Good - Understand first, then decide
# This validates user quota - keeping for now
user.validate_something()
```

❌ **Don't Skip Authentication**
```python
# Bad - Making endpoint public for convenience
@permission_classes([AllowAny])  # NO!

# Good - Always require authentication
@permission_classes([IsAuthenticated])
```

❌ **Don't Hardcode Values**
```python
# Bad
API_KEY = "sk-abc123def456"  # NEVER!
MAX_ITEMS = 50  # Magic number

# Good
API_KEY = os.getenv('API_KEY')
MAX_ITEMS = settings.PAGINATION_LIMIT
```

❌ **Don't Ignore Existing Utilities**
```python
# Bad - Writing custom date parser
def parse_date(date_str):
    # Custom parsing logic

# Good - Use Django's built-in
from django.utils.dateparse import parse_date
```

❌ **Don't Create Duplicate Features**
```python
# Bad - Creating new food search when one exists
def search_foods_v2(query):
    # Duplicate implementation

# Good - Extend existing functionality
def search_foods(query, filters=None):
    # Enhanced original function
```

❌ **Don't Mix Concerns**
```python
# Bad - View doing too much
def food_view(request):
    # API logic
    # Business logic
    # Database queries
    # Email sending
    # File generation

# Good - Separate concerns
def food_view(request):
    # Just API logic
    result = food_service.process(request.data)
    return Response(result)
```

❌ **Don't Expose Sensitive Data**
```python
# Bad
return Response({
    'user': {
        'id': user.id,
        'password_hash': user.password,  # NO!
        'api_keys': user.api_keys  # NO!
    }
})

# Good
return Response({
    'user': {
        'id': user.id,
        'username': user.username,
        'email': user.email
    }
})
```

## Common Pitfalls

### 1. Breaking Migrations
```python
# Don't rename fields without migration
# Bad: Rename field directly in model

# Good: Create migration
python manage.py makemigrations --name rename_field
```

### 2. Forgetting Timezones
```python
# Bad
now = datetime.now()

# Good
from django.utils import timezone
now = timezone.now()
```

### 3. N+1 Queries
```python
# Bad - Causes N+1 queries
for log in FoodLog.objects.filter(user=user):
    print(log.food.name)  # Extra query each time

# Good - Single query
logs = FoodLog.objects.filter(user=user).select_related('food')
for log in logs:
    print(log.food.name)
```

### 4. Unsafe User Input
```javascript
// Bad - XSS vulnerable
<div dangerouslySetInnerHTML={{__html: userInput}} />

// Good - React escapes automatically
<div>{userInput}</div>
```

## Decision Framework

When unsure, ask yourself:

1. **Is this secure?**
   - No hardcoded secrets?
   - Input validated?
   - Authentication required?

2. **Is this maintainable?**
   - Following existing patterns?
   - Well documented?
   - Properly tested?

3. **Is this necessary?**
   - Does similar functionality exist?
   - Is there a simpler solution?
   - Will users actually use this?

4. **Is this performant?**
   - Avoiding N+1 queries?
   - Using appropriate caching?
   - Limiting resource usage?

## Working with External Services

### OpenAI Integration
```python
# DO: Handle API failures gracefully
try:
    response = openai_service.send_prompt(prompt)
except Exception as e:
    # Fallback behavior
    return default_response

# DON'T: Let API failures crash the app
response = openai_service.send_prompt(prompt)  # Might throw
```

### Database Operations
```python
# DO: Use transactions for related operations
with transaction.atomic():
    user.save()
    profile.save()
    goals.save()

# DON'T: Save related objects separately
user.save()
profile.save()  # Might fail, leaving inconsistent state
goals.save()
```

## Code Review Checklist

Before considering your work complete:

- [ ] **Functionality**: Does it work as intended?
- [ ] **Security**: Is it secure?
- [ ] **Performance**: Is it efficient?
- [ ] **Style**: Does it follow conventions?
- [ ] **Tests**: Are there tests?
- [ ] **Documentation**: Is it documented?
- [ ] **Side Effects**: No broken features?
- [ ] **Clean**: No debug code left?

## Emergency Procedures

### If You Break Something

1. **Don't Panic**
2. **Identify** what's broken
3. **Revert** your changes if needed
4. **Fix** the specific issue
5. **Test** thoroughly
6. **Document** what happened

### If You're Stuck

1. **Read** error messages carefully
2. **Check** similar code in the project
3. **Search** for the error online
4. **Simplify** - remove code until it works
5. **Ask** for human help if needed

## Communication

### In Code Comments
```python
# TODO(agent): Implement error handling for network timeout
# FIXME(agent): This query is slow with large datasets
# NOTE(agent): Using deprecated API until v2 is stable
```

### In Commit Messages
```
feat(food-log): add barcode scanning support

- Added barcode scanner component
- Integrated with food database API
- Added tests for scanner functionality
- Updated documentation

Closes #123
```

### In Documentation
```markdown
## Changes Made by AI Agent

**Date**: 2024-01-15
**Agent**: Assistant
**Changes**:
- Added mood tracking feature
- Updated user model with mood fields
- Created API endpoints for mood logs
- Added frontend components

**Reasoning**: User requested mood tracking alongside food logging
**Testing**: All tests pass, manually verified functionality
```

## Final Reminders

1. **You're modifying a production system** - Be careful
2. **Real users depend on this** - Don't break things
3. **Other developers will read your code** - Make it clean
4. **Security is paramount** - Never compromise it
5. **When in doubt, don't** - Ask for clarification

---

**Remember**: Your goal is to improve the system while maintaining its integrity. Every change should make the codebase better, not just different.
