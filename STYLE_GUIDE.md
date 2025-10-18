# Style Guide for Developers and AI Agents

This guide defines the coding standards, patterns, and practices for the Workout & Macro Tracking App. All contributors (human and AI) must follow these rules to maintain consistency.

## 🏗️ Project Structure

```
TrackingApp/
├── backend/          # Django REST API
│   ├── apps/         # Django applications
│   ├── backend/      # Core Django settings
│   ├── middleware/   # Custom middleware
│   └── database_setup/ # DB initialization
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level components
│   │   ├── services/    # API communication
│   │   ├── contexts/    # React contexts
│   │   └── hooks/       # Custom React hooks
├── tests/            # All test files
│   ├── backend/      # Django tests
│   ├── frontend/     # React tests
│   └── e2e/          # End-to-end tests
├── docs/             # Documentation
└── notes/            # Development notes
```

## 📝 Code Style Rules

### Python (Backend)

1. **Follow PEP 8** with these specifications:
   - Line length: 100 characters max
   - Indentation: 4 spaces
   - Imports: Group by standard library, third-party, local

2. **Import Order**:
   ```python
   # Standard library
   import os
   from datetime import datetime
   
   # Third-party
   from django.db import models
   from rest_framework import status
   
   # Local application
   from apps.users.models import User
   from .serializers import FoodSerializer
   ```

3. **Docstrings** (Required for all public functions/classes):
   ```python
   def calculate_macros(food_items, user_goals):
       """
       Calculate macro totals and compare to user goals.
       
       Args:
           food_items (list): List of FoodItem objects
           user_goals (UserGoal): User's macro targets
           
       Returns:
           dict: Macro totals and remaining allowances
           
       Raises:
           ValueError: If food_items is empty
       """
   ```

4. **Variable Naming**:
   - Functions/variables: `snake_case`
   - Classes: `PascalCase`
   - Constants: `UPPER_SNAKE_CASE`
   - Private methods: `_leading_underscore`

### JavaScript/React (Frontend)

1. **ES6+ Modern JavaScript**:
   - Use `const`/`let`, never `var`
   - Arrow functions for callbacks
   - Destructuring when appropriate
   - Template literals for string interpolation

2. **React Patterns**:
   ```javascript
   // Functional components with hooks
   const FoodLogger = ({ userId, onSuccess }) => {
     const [loading, setLoading] = useState(false);
     const [foods, setFoods] = useState([]);
     
     useEffect(() => {
       // Effect logic
     }, [userId]); // Dependency array
     
     return (
       <div className="food-logger">
         {/* JSX content */}
       </div>
     );
   };
   ```

3. **File Naming**:
   - Components: `PascalCase.js` (e.g., `FoodLogger.js`)
   - Utilities: `camelCase.js` (e.g., `apiHelpers.js`)
   - Tests: `ComponentName.test.js`

4. **Props Validation** (Use PropTypes or TypeScript):
   ```javascript
   FoodLogger.propTypes = {
     userId: PropTypes.number.isRequired,
     onSuccess: PropTypes.func
   };
   ```

## 🔧 Development Practices

### Git Commit Messages

Format: `<type>(<scope>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

Example: `feat(food-log): add voice recording support`

### Error Handling

1. **Backend**:
   ```python
   try:
       result = risky_operation()
   except SpecificException as e:
       # Log the error
       logger.error(f"Operation failed: {str(e)}")
       # Return appropriate response
       return Response(
           {'error': {'message': 'User-friendly error message'}},
           status=status.HTTP_400_BAD_REQUEST
       )
   ```

2. **Frontend**:
   ```javascript
   try {
     const response = await api.post('/foods', data);
     return response.data;
   } catch (error) {
     console.error('Food creation failed:', error);
     toast.error('Failed to create food. Please try again.');
     throw error; // Re-throw for upstream handling
   }
   ```

### API Response Format

All API responses must follow this structure:

**Success**:
```json
{
  "data": {
    "id": 123,
    "name": "Chicken Breast",
    "calories": 165
  }
}
```

**Error**:
```json
{
  "error": {
    "message": "Food not found",
    "field_errors": {
      "name": ["This field is required"]
    }
  }
}
```

### Database Conventions

1. **Table Names**: Plural, snake_case (e.g., `food_items`, `workout_logs`)
2. **Column Names**: Snake_case (e.g., `created_at`, `user_id`)
3. **Foreign Keys**: `<table>_id` (e.g., `user_id`, `food_id`)
4. **Indexes**: Add for foreign keys and frequently queried fields

## 🧪 Testing Standards

### Test Structure

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test user workflows

### Test Naming

```python
# Python
def test_calculate_macros_returns_correct_totals(self):
    """Test that macro calculation returns accurate totals."""
    
# JavaScript
test('should display error when food creation fails', () => {
  // Test implementation
});
```

### Coverage Requirements

- New features: 90% coverage minimum
- Bug fixes: Must include regression test
- Refactoring: Maintain existing coverage

## 🚨 Linting and Formatting

### Backend (Python)

Use these tools (configuration in `setup.cfg`):
- `flake8` for linting
- `black` for formatting
- `isort` for import sorting

Run before committing:
```bash
flake8 .
black .
isort .
```

### Frontend (JavaScript)

Use these tools (configuration in `package.json`):
- ESLint for linting
- Prettier for formatting

Run before committing:
```bash
npm run lint
npm run format
```

## 📦 Dependencies

### Adding Dependencies

1. **Backend**: 
   - Add to `requirements.txt` with specific version
   - Document why it's needed in commit message

2. **Frontend**:
   - Use `npm install --save` or `--save-dev`
   - Keep `package-lock.json` in sync

### Security

- No credentials in code (use environment variables)
- Validate all user inputs
- Use parameterized queries (no SQL concatenation)
- Keep dependencies updated

## 🤖 AI Agent Guidelines

When modifying code:

1. **Read existing code first** - Understand patterns before changing
2. **Maintain consistency** - Follow existing style in each file
3. **Test your changes** - Ensure tests pass or write new ones
4. **Update documentation** - Keep docs in sync with code
5. **One feature at a time** - Make focused, atomic changes
6. **Preserve functionality** - Don't break existing features

### Agent Don'ts

- Don't remove code without understanding its purpose
- Don't change established patterns without justification  
- Don't skip error handling
- Don't hardcode values that should be configurable
- Don't create duplicate functionality

## 🔄 Code Review Checklist

Before submitting changes:

- [ ] Code follows style guide
- [ ] All tests pass
- [ ] New code has tests
- [ ] Documentation is updated
- [ ] No hardcoded secrets
- [ ] Error handling is appropriate
- [ ] Performance impact considered
- [ ] Security implications reviewed

---

**Remember**: Consistency is key. When in doubt, follow the existing patterns in the codebase.