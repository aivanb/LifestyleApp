# Tests Developer Guide

Technical documentation for developers and AI agents working on the test suite.

## Test Architecture Overview

The test suite follows a comprehensive testing strategy covering all layers of the application:

```
tests/
├── backend/          # Django backend tests
│   └── test_backend.py
├── frontend/         # React frontend tests
│   └── test_frontend.js
└── e2e/             # End-to-end tests
    └── test_e2e.js
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
- **Coverage**: OpenAI service and other business logic
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

#### Authentication Flow Testing
```python
def test_complete_auth_flow(self):
    # Test registration
    response = self.client.post('/api/auth/register/', user_data)
    self.assertEqual(response.status_code, 201)
    
    # Test login
    response = self.client.post('/api/auth/login/', credentials)
    self.assertEqual(response.status_code, 200)
    
    # Test protected endpoint
    token = response.data['data']['tokens']['access']
    headers = {'Authorization': f'Bearer {token}'}
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
- **Coverage**: Authentication context
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

#### Context Mocking
```javascript
test('uses context data', () => {
  jest.spyOn(React, 'useContext').mockReturnValue({
    user: { username: 'testuser' },
    isAuthenticated: true,
    login: jest.fn(),
  });
  
  render(<Component />);
  expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
});
```

### User Interaction Testing

#### Form Testing
```javascript
test('handles form submission', async () => {
  const mockSubmit = jest.fn();
  
  render(<Form onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'testuser' }
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'testpass' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'testpass'
    });
  });
});
```

#### Navigation Testing
```javascript
test('navigates between pages', () => {
  render(
    <TestWrapper>
      <App />
    </TestWrapper>
  );
  
  fireEvent.click(screen.getByText('Dashboard'));
  expect(screen.getByText('Welcome')).toBeInTheDocument();
  
  fireEvent.click(screen.getByText('Profile'));
  expect(screen.getByText('Profile')).toBeInTheDocument();
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

#### Full Application Testing
```javascript
describe('E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });
  
  test('complete user registration flow', async () => {
    // Mock API responses
    api.post.mockResolvedValueOnce({
      data: {
        data: {
          user: { username: 'newuser' },
          tokens: { access: 'token', refresh: 'refresh' }
        }
      }
    });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Complete user flow
    // 1. Navigate to registration
    // 2. Fill form
    // 3. Submit
    // 4. Verify redirect
    // 5. Check authentication state
  });
});
```

#### Real API Integration
```javascript
test('OpenAI integration flow', async () => {
  // Mock authentication
  localStorageMock.getItem.mockReturnValue('access-token');
  api.get.mockResolvedValueOnce({
    data: { data: { username: 'testuser' } }
  });
  
  // Mock OpenAI response
  api.post.mockResolvedValueOnce({
    data: {
      data: {
        response: 'AI response',
        tokens_used: 15,
        cost: 0.002
      }
    }
  });
  
  // Test complete flow
  // 1. Navigate to OpenAI page
  // 2. Enter prompt
  // 3. Submit
  // 4. Verify response
  // 5. Check usage stats
});
```

## Test Data Management

### Test Data Patterns

#### Backend Test Data
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
    
    @staticmethod
    def create_food(name='Test Food'):
        return Food.objects.create(
            food_name=name,
            serving_size=100,
            unit='g',
            calories=250,
            protein=10,
            fat=5,
            carbohydrates=30
        )
```

#### Frontend Test Data
```javascript
const createMockUser = (overrides = {}) => ({
  username: 'testuser',
  email: 'test@example.com',
  access_level: 'user',
  ...overrides
});

const createMockApiResponse = (data) => ({
  data: { data }
});
```

### Mock Data Strategies

#### API Response Mocking
```javascript
const mockApiResponses = {
  login: {
    data: {
      data: {
        user: { username: 'testuser' },
        tokens: { access: 'token', refresh: 'refresh' }
      }
    }
  },
  profile: {
    data: {
      data: { username: 'testuser', email: 'test@example.com' }
    }
  },
  openai: {
    data: {
      data: {
        response: 'AI response',
        tokens_used: 10,
        cost: 0.001
      }
    }
  }
};
```

#### Error Response Mocking
```javascript
const mockErrorResponses = {
  unauthorized: {
    response: { status: 401 }
  },
  badRequest: {
    response: {
      data: { error: { message: 'Invalid input' } }
    }
  },
  serverError: {
    response: { status: 500 }
  }
};
```

## Test Performance and Optimization

### Test Execution Speed

#### Backend Test Optimization
- Use `setUp` and `tearDown` for test data
- Use database transactions for isolation
- Mock external services
- Use test-specific settings

#### Frontend Test Optimization
- Mock API calls
- Use shallow rendering where appropriate
- Avoid unnecessary re-renders
- Use `waitFor` for async operations

### Test Reliability

#### Avoiding Flaky Tests
- Use deterministic test data
- Wait for async operations
- Mock external dependencies
- Use proper cleanup

#### Test Isolation
- Clear mocks between tests
- Reset component state
- Clean up test data
- Use fresh instances

## Test Maintenance

### Test Updates

#### When to Update Tests
- Feature changes
- API modifications
- Component updates
- Bug fixes

#### How to Update Tests
- Update test data
- Modify assertions
- Add new test cases
- Remove obsolete tests

### Test Quality

#### Test Coverage
- Aim for high coverage
- Focus on critical paths
- Test edge cases
- Test error scenarios

#### Test Readability
- Use descriptive names
- Group related tests
- Add comments for complex logic
- Keep tests focused

## Common Test Patterns

### Authentication Testing
```javascript
// Test login flow
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
// Test form validation
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
// Test API error handling
test('handles API errors', async () => {
  api.post.mockRejectedValue(mockErrorResponse);
  
  render(<Component />);
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
```

## Debugging Tests

### Backend Test Debugging
- Use Django debug toolbar
- Check test database state
- Verify model relationships
- Use print statements for debugging

### Frontend Test Debugging
- Use React DevTools
- Check component state
- Verify API calls
- Use `screen.debug()` for DOM inspection

### E2E Test Debugging
- Take screenshots on failures
- Record test execution
- Check network requests
- Verify localStorage state
