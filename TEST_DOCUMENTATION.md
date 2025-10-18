# Workout Tracking System - Test Documentation

## 🧪 Test Overview

The Workout Tracking System has comprehensive test coverage including backend API tests, frontend component tests, and end-to-end workflow tests. All tests simulate real user interactions and actually modify the database to ensure the system works correctly.

## 🔧 Backend Tests

### Test Structure
```
backend/apps/workouts/tests.py
├── RealUserWorkflowTestCase
│   ├── setUp() - Create test data
│   ├── test_complete_user_workflow_real_database() - Full workflow test
│   └── Helper methods for data creation
```

### Test Coverage
- ✅ **Model Creation**: Workout, Split, SplitDay, SplitDayTarget
- ✅ **API Endpoints**: All workout-related endpoints
- ✅ **Database Operations**: Real database modifications
- ✅ **User Authentication**: JWT token handling
- ✅ **Split Activation**: Start date setting and day calculation
- ✅ **Muscle Priorities**: Priority updates and retrieval
- ✅ **Workout Logging**: Session logging with attributes
- ✅ **Statistics**: Workout stats calculation

### Running Backend Tests
```bash
# Run all workout tests
python manage.py test apps.workouts.tests

# Run specific test case
python manage.py test apps.workouts.tests.RealUserWorkflowTestCase

# Run with verbose output
python manage.py test apps.workouts.tests.RealUserWorkflowTestCase -v 2
```

### Test Data Setup
The tests create realistic test data including:
- **Muscles**: Chest, Back, Biceps, Triceps, Quads, Hamstrings
- **Workouts**: Bench Press, Squats with emoji icons
- **Splits**: Push/Pull/Legs with multiple days
- **Targets**: Muscle activation targets for each day
- **Logs**: Workout sessions with detailed tracking

## 🎯 Frontend Tests

### Test Structure
```
frontend/src/
├── components/
│   ├── MusclePriority.test.js
│   ├── WorkoutAdder.test.js
│   ├── SplitCreator.test.js
│   ├── WorkoutLogger.test.js
│   └── WorkoutLog.test.js
└── pages/
    └── WorkoutTracker.test.js
```

### Test Coverage
- ✅ **Component Rendering**: All components render correctly
- ✅ **User Interactions**: Button clicks, form submissions
- ✅ **State Management**: Component state updates
- ✅ **API Integration**: Mock API calls and responses
- ✅ **Error Handling**: Error states and messages
- ✅ **Loading States**: Loading indicators and spinners

### Running Frontend Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern=WorkoutTracker

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Utilities
```javascript
// Mock API responses
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

// Test user interactions
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

## 🔄 End-to-End Workflow Test

### Complete User Workflow
The `RealUserWorkflowTestCase` simulates a complete user journey:

1. **Create Workouts**:
   - Bench Press 💪 with chest and triceps activation
   - Squats 🦵 with quads and hamstrings activation

2. **Create Split**:
   - Push/Pull/Legs split with 3 days
   - Each day has target muscle activations
   - Total of 6 split day targets created

3. **Activate Split**:
   - Set start date for the split
   - Verify split is active in database

4. **Log Workout**:
   - Log Bench Press workout session
   - Include weight, reps, RIR, and attributes

5. **Verify Current Split Day**:
   - Check current split day calculation
   - Verify day name and targets

6. **Update Muscle Priorities**:
   - Update chest and back priorities
   - Verify changes are saved

7. **Check Statistics**:
   - Verify workout count and muscle count
   - Check recently logged workouts

### Test Assertions
```python
# Verify workout creation
self.assertEqual(response.status_code, status.HTTP_201_CREATED)
self.assertEqual(response.data['data']['workout_name'], 'Bench Press 💪')

# Verify split creation
self.assertEqual(len(response.data['data']['split_days']), 3)
self.assertEqual(len(response.data['data']['split_days'][0]['targets']), 2)

# Verify split activation
split = Split.objects.get(splits_id=split_id)
self.assertEqual(split.start_date, today)

# Verify workout logging
self.assertEqual(response.data['data']['weight'], 100)
self.assertEqual(response.data['data']['reps'], 10)

# Verify current split day
self.assertEqual(response.data['data']['current_split_day']['day_name'], 'Push Day')

# Verify muscle priorities
self.assertEqual(response.data['data'][0]['priority'], 95)
self.assertEqual(response.data['data'][1]['priority'], 75)

# Verify statistics
self.assertGreaterEqual(response.data['data']['total_workouts'], 2)
self.assertGreaterEqual(response.data['data']['total_muscles'], 4)
```

## 🐛 Test Debugging

### Common Test Issues

1. **Database Schema Mismatches**:
   ```bash
   # Check for pending migrations
   python manage.py makemigrations --dry-run
   
   # Apply migrations
   python manage.py migrate
   ```

2. **Foreign Key Errors**:
   ```python
   # Ensure model instances are created
   muscle = Muscle.objects.get(muscles_id=muscle_id)
   muscle_log, created = MuscleLog.objects.update_or_create(
       user=request.user,
       muscle_name=muscle,  # Pass instance, not ID
       defaults={'priority': priority}
   )
   ```

3. **Related Manager Access**:
   ```python
   # Use correct related manager name
   split_days = split.splitday_set.all()  # Correct
   # split_days = split.split_days.all()  # Incorrect
   ```

### Test Data Cleanup
```python
def tearDown(self):
    """Clean up test data"""
    WorkoutLog.objects.filter(user=self.user).delete()
    Split.objects.filter(user=self.user).delete()
    Workout.objects.filter(user=self.user).delete()
    MuscleLog.objects.filter(user=self.user).delete()
```

## 📊 Test Metrics

### Coverage Goals
- **Backend**: 100% API endpoint coverage
- **Frontend**: 90% component coverage
- **Integration**: Complete user workflow coverage

### Performance Benchmarks
- **API Response Time**: < 200ms for most endpoints
- **Database Queries**: < 10 queries per request
- **Frontend Render Time**: < 100ms for component updates

## 🔍 Test Monitoring

### Continuous Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run tests
        run: python manage.py test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test -- --coverage --watchAll=false
```

### Test Reporting
```bash
# Generate coverage report
coverage run --source='.' manage.py test
coverage report
coverage html

# View HTML coverage report
open htmlcov/index.html
```

## 🚀 Test Automation

### Pre-commit Hooks
```bash
# Install pre-commit
pip install pre-commit

# Setup hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Test Scripts
```bash
# Run all tests
./scripts/run_tests.sh

# Run backend tests only
./scripts/run_backend_tests.sh

# Run frontend tests only
./scripts/run_frontend_tests.sh
```

## 📝 Test Documentation

### Writing New Tests
1. **Follow Naming Conventions**:
   - Test methods: `test_<functionality>_<scenario>`
   - Test classes: `<Feature>TestCase`

2. **Use Descriptive Names**:
   ```python
   def test_create_workout_with_valid_data(self):
       """Test creating a workout with valid input data"""
   
   def test_create_workout_with_invalid_activation_rating(self):
       """Test creating a workout with invalid activation rating"""
   ```

3. **Include Docstrings**:
   ```python
   def test_complete_user_workflow_real_database(self):
       """
       Test complete user workflow that actually modifies the database.
       
       This test simulates a real user journey:
       1. Creates workouts with emoji icons
       2. Creates splits with multiple days
       3. Activates splits with start dates
       4. Logs workouts to the split
       5. Updates muscle priorities
       6. Verifies current split day calculation
       7. Checks workout statistics
       """
   ```

### Test Data Management
```python
def setUp(self):
    """Set up test data for each test"""
    self.user = User.objects.create_user(
        username='testuser',
        password='testpass123'
    )
    self.client.force_authenticate(user=self.user)
    
    # Create test muscles
    self.muscle_chest = Muscle.objects.create(
        muscle_name='Chest',
        muscle_group='Upper Body'
    )
    # ... create other muscles
```

## 🎯 Test Best Practices

### Do's
- ✅ Test real user workflows
- ✅ Use realistic test data
- ✅ Test error conditions
- ✅ Verify database changes
- ✅ Include edge cases
- ✅ Use descriptive test names
- ✅ Clean up test data

### Don'ts
- ❌ Don't mock database operations
- ❌ Don't use hardcoded test data
- ❌ Don't skip error testing
- ❌ Don't ignore edge cases
- ❌ Don't forget cleanup
- ❌ Don't test implementation details

## 🔧 Test Configuration

### Django Test Settings
```python
# settings/test.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()
```

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/setupTests.js',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 📈 Test Metrics Dashboard

### Key Performance Indicators
- **Test Coverage**: 95%+ for critical paths
- **Test Execution Time**: < 30 seconds for full suite
- **Test Reliability**: 99%+ pass rate
- **Test Maintenance**: < 10% test code changes per feature

### Monitoring
- Track test execution times
- Monitor test failure rates
- Alert on coverage drops
- Track flaky test identification

---

**Remember**: Tests are not just about finding bugs - they're about ensuring the system works correctly for real users. Always test the complete user workflow, not just individual components.
