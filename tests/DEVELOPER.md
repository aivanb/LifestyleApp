# Tests Developer Guide for AI Agents

Technical documentation for AI agents working on the test suite. This document covers test architecture, patterns, requirements, and extension points.

## Test Architecture Overview

### Directory Structure
```
tests/
├── backend/          # Django backend tests
│   ├── integration/ # Integration tests
│   └── test_*.py     # Unit and integration tests
├── frontend/         # React frontend tests
│   └── test_*.js    # Component and unit tests
└── e2e/             # End-to-end tests
    └── *.spec.js    # Playwright E2E tests
```

## Backend Testing Strategy

### Test Categories

#### Model Tests
- **Purpose**: Test Django model creation, validation, and relationships
- **Coverage**: All models in the database schema
- **Key Areas**:
  - Model field validation
  - Foreign key relationships
  - Unique constraints
  - String representations
  - Model methods

#### API Endpoint Tests
- **Purpose**: Test REST API endpoints and responses
- **Coverage**: All API endpoints
- **Key Areas**:
  - HTTP status codes
  - Response data format
  - Authentication requirements
  - Input validation
  - Error handling

#### Middleware Tests
- **Purpose**: Test custom middleware functionality
- **Coverage**: AuthMiddleware and LoggingMiddleware
- **Key Areas**:
  - JWT token validation
  - Request/response logging
  - Error handling
  - Performance impact

#### Service Tests
- **Purpose**: Test business logic and external service integration
- **Coverage**: OpenAI service, body metrics, macro calculations
- **Key Areas**:
  - Service method functionality
  - External API integration
  - Error handling
  - Data processing

### Test Data Management

#### Test Database Setup
```python
class ModelTest(TestCase):
    def setUp(self):
        # Create test data
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
    
    def tearDown(self):
        # Clean up test data
        User.objects.all().delete()
        AccessLevel.objects.all().delete()
```

#### Mock External Services
```python
@unittest.mock.patch('apps.openai_service.services.OpenAIService.send_prompt')
def test_openai_integration(self, mock_send):
    mock_send.return_value = {
        'success': True,
        'response': 'Test response',
        'tokens_used': 10,
        'cost': 0.001
    }
    
    # Test OpenAI integration
    response = self.client.post('/api/openai/prompt/', data)
    self.assertEqual(response.status_code, 200)
```

### Authentication Testing

#### JWT Token Testing
```python
def test_protected_endpoint_with_auth(self):
    # Create user and get token
    user = User.objects.create_user(...)
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Test protected endpoint
    headers = {'Authorization': f'Bearer {access_token}'}
    response = self.client.get('/api/auth/profile/', headers=headers)
    
    self.assertEqual(response.status_code, 200)
```

## Frontend Testing Strategy

### Test Categories

#### Component Tests
- **Purpose**: Test individual React components
- **Coverage**: All UI components
- **Key Areas**:
  - Component rendering
  - User interactions
  - State changes
  - Props handling

#### Page Tests
- **Purpose**: Test complete page components
- **Coverage**: All application pages
- **Key Areas**:
  - Form handling
  - Data display
  - Navigation
  - Error states

#### Context Tests
- **Purpose**: Test React Context providers
- **Coverage**: Authentication context, Theme context
- **Key Areas**:
  - State management
  - Context updates
  - Provider functionality

#### Service Tests
- **Purpose**: Test API service layer
- **Coverage**: All API communication
- **Key Areas**:
  - HTTP requests
  - Token handling
  - Error handling
  - Response processing

### Test Setup and Mocking

#### Component Test Setup
```javascript
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <Component />
      </TestWrapper>
    );
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### API Service Mocking
```javascript
jest.mock('../../frontend/src/services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  setAuthToken: jest.fn(),
}));

test('handles API call', async () => {
  api.post.mockResolvedValue({
    data: { data: { success: true } }
  });
  
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/endpoint', data);
  });
});
```

## E2E Testing Strategy

### Test Categories

#### Authentication Flow Tests
- **Purpose**: Test complete user authentication journeys
- **Coverage**: Registration, login, logout flows
- **Key Areas**:
  - Form validation
  - API integration
  - State management
  - Route protection

#### User Journey Tests
- **Purpose**: Test complete user workflows
- **Coverage**: Multi-page user interactions
- **Key Areas**:
  - Navigation flows
  - Data persistence
  - State synchronization
  - Error handling

#### Integration Tests
- **Purpose**: Test frontend-backend integration
- **Coverage**: Real API communication
- **Key Areas**:
  - Data flow
  - Error propagation
  - Performance
  - Security

### E2E Test Setup

#### Playwright Configuration
- Browser automation
- Screenshot on failure
- Video recording
- Network interception

#### Test Data
- Use test users from database setup
- Clean data between tests
- Realistic test scenarios

## Test Requirements

### Coverage Requirements
- New features: 90% coverage minimum
- Bug fixes: Must include regression test
- Refactoring: Maintain existing coverage

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

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

## Running Tests

### Autonomous Test Execution
All tests can be run autonomously using the test runner:
```bash
python run_tests.py --all        # Run all tests
python run_tests.py --backend    # Backend only
python run_tests.py --frontend   # Frontend only
python run_tests.py --e2e        # E2E only
```

### Backend Tests
```bash
# Using test runner (recommended)
python run_tests.py --backend

# Using Django directly
cd backend
python manage.py test                    # All tests
python manage.py test apps.workouts.tests # Specific app
python manage.py test tests.backend      # Tests from tests/backend/
```

### Frontend Tests
```bash
# Using test runner (recommended)
python run_tests.py --frontend

# Using npm directly
cd frontend
npm test -- --watchAll=false --ci        # CI mode (non-interactive)
npm test -- --coverage                    # With coverage
```

### E2E Tests
```bash
# Using test runner (recommended)
python run_tests.py --e2e

# Using Playwright directly
npx playwright test                      # All E2E tests
npx playwright test tests/e2e/test_workout_tracker_e2e.spec.js  # Specific test
```

### Test Discovery
- **Backend**: Django automatically discovers tests in `apps/*/tests.py` and `apps/*/tests/`
- **Frontend**: Jest discovers tests matching `*.test.js` and `*.spec.js` patterns
- **E2E**: Playwright discovers tests matching `*.spec.js` in `tests/e2e/`

## Test Data Patterns

### Backend Test Data
```python
class TestDataFactory:
    @staticmethod
    def create_user(username='testuser', email='test@example.com'):
        access_level = AccessLevel.objects.create(role_name='user')
        return User.objects.create_user(
            username=username,
            email=email,
            password='testpass123',
            access_level=access_level
        )
```

### Frontend Test Data
```javascript
const createMockUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  access_level: 'user',
  ...overrides
});
```

## Common Test Patterns

### Authentication Testing
```javascript
test('user login flow', async () => {
  api.post.mockResolvedValue(mockLoginResponse);
  
  render(<Login />);
  
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'testuser' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'testpass' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /login/i }));
  
  await waitFor(() => {
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass');
  });
});
```

### Form Testing
```javascript
test('form validation', async () => {
  render(<Form />);
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });
});
```

### API Integration Testing
```javascript
test('handles API errors', async () => {
  api.post.mockRejectedValue(mockErrorResponse);
  
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
```

## Test Maintenance

### When to Update Tests
- Feature changes
- API modifications
- Component updates
- Bug fixes

### How to Update Tests
- Update test data
- Modify assertions
- Add new test cases
- Remove obsolete tests

## Critical Invariants

### Test Isolation
- Tests must not depend on each other
- Clean up test data after each test
- Use fresh instances for each test
- Mock external dependencies

### Test Reliability
- Use deterministic test data
- Wait for async operations
- Mock external dependencies
- Use proper cleanup

## Extension Points

### Adding New Backend Tests
1. Create test file in `tests/backend/` or app's `tests.py`
2. Extend `TestCase` or `APITestCase`
3. Set up test data in `setUp()`
4. Write test methods
5. Clean up in `tearDown()`

### Adding New Frontend Tests
1. Create test file `ComponentName.test.js`
2. Import testing utilities
3. Set up component with providers
4. Write test cases
5. Mock API calls

### Adding New E2E Tests
1. Create test file in `tests/e2e/`
2. Use Playwright test structure
3. Set up authentication
4. Test user workflows
5. Add assertions

## What Must NOT Be Changed

- Test isolation requirements
- Authentication test patterns
- API mocking patterns
- Test data cleanup

## What Can Be Safely Extended

- New test cases
- New test utilities
- New test data factories
- New E2E scenarios

---

**Remember**: Tests must be reliable, isolated, and maintainable. Always clean up test data.
