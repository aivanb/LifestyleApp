# Tests README

Comprehensive testing suite for the Tracking App covering backend, frontend, and end-to-end scenarios.

## Test Structure

```
tests/
├── backend/          # Backend unit and integration tests
├── frontend/         # Frontend component and unit tests
└── e2e/             # End-to-end user flow tests
```

## Running Tests

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### All Tests
```bash
# Backend tests
cd backend && python manage.py test && cd ..

# Frontend tests
cd frontend && npm test && cd ..
```

## Test Coverage

### Backend Test Coverage
- **Models**: User, Food, Meal, Workout, and all other model tests
- **API Endpoints**: Authentication, OpenAI, and all API endpoint tests
- **Middleware**: Authentication and logging middleware tests
- **Serializers**: Data validation and serialization tests
- **Services**: OpenAI service and business logic tests

### Frontend Test Coverage
- **Components**: All React components with user interactions
- **Pages**: Login, Register, Dashboard, OpenAI, Profile pages
- **Context**: Authentication context and state management
- **Services**: API service layer and HTTP communication
- **Routing**: Protected routes and navigation

### E2E Test Coverage
- **Authentication Flow**: Complete registration and login flows
- **Navigation**: Protected route navigation and user flows
- **OpenAI Integration**: Prompt submission and response handling
- **Profile Management**: Profile updates and data persistence
- **Error Handling**: Network errors and invalid token handling

## Test Categories

### Unit Tests
- Individual component testing
- Model validation testing
- Service method testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database integration testing
- Authentication flow testing
- Component integration testing

### E2E Tests
- Complete user journey testing
- Cross-component interaction testing
- Real API integration testing
- Error scenario testing

## Test Data and Mocking

### Backend Test Data
- Test users with different access levels
- Sample food and meal data
- Mock OpenAI API responses
- Database fixtures for consistent testing

### Frontend Test Data
- Mock API responses
- Test user data
- Component state scenarios
- Error response simulations

### E2E Test Data
- Complete user profiles
- Realistic API responses
- Error scenarios
- Network failure simulations

## Test Configuration

### Backend Test Settings
- Separate test database
- Mock external services
- Test-specific environment variables
- Isolated test data

### Frontend Test Settings
- Jest test runner configuration
- React Testing Library setup
- Mock service worker for API mocking
- Test environment variables

### E2E Test Settings
- Full application testing
- Real browser testing
- Cross-browser compatibility
- Performance testing

## Writing Tests

### Backend Test Guidelines
```python
class ModelTest(TestCase):
    def setUp(self):
        # Set up test data
        
    def test_model_creation(self):
        # Test model creation and validation
        
    def test_model_relationships(self):
        # Test foreign key relationships
```

### Frontend Test Guidelines
```javascript
describe('Component', () => {
  test('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  test('handles user interaction', async () => {
    render(<Component />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });
});
```

### E2E Test Guidelines
```javascript
describe('User Flow', () => {
  test('complete user journey', async () => {
    // Navigate through multiple pages
    // Interact with forms
    // Verify state changes
    // Check API calls
  });
});
```

## Test Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and independent

### Test Data Management
- Use factories for test data creation
- Clean up test data after each test
- Use realistic test data
- Avoid hardcoded values

### Mocking Strategy
- Mock external dependencies
- Use realistic mock responses
- Test both success and error scenarios
- Verify mock interactions

### Performance Testing
- Test component rendering performance
- Monitor API response times
- Check memory usage
- Validate bundle sizes

## Continuous Integration

### Automated Testing
- Run tests on every commit
- Fail builds on test failures
- Generate test coverage reports
- Run tests in multiple environments

### Test Reporting
- Generate HTML coverage reports
- Track test trends over time
- Monitor test execution times
- Report test failures

## Debugging Tests

### Backend Test Debugging
- Use Django debug toolbar
- Check test database state
- Verify model relationships
- Check API response data

### Frontend Test Debugging
- Use React DevTools
- Check component state
- Verify API calls
- Use browser dev tools

### E2E Test Debugging
- Take screenshots on failures
- Record test execution
- Check network requests
- Verify DOM state

## Test Maintenance

### Regular Updates
- Update tests when features change
- Refactor tests for better maintainability
- Remove obsolete tests
- Add tests for new features

### Test Quality
- Ensure tests are reliable
- Avoid flaky tests
- Keep tests fast
- Maintain good coverage

## Common Test Patterns

### Authentication Testing
- Test login/logout flows
- Verify token handling
- Check protected route access
- Test session management

### API Testing
- Test all HTTP methods
- Verify request/response formats
- Check error handling
- Test authentication requirements

### Component Testing
- Test rendering
- Test user interactions
- Test state changes
- Test error states

### Integration Testing
- Test component interactions
- Test API integration
- Test data flow
- Test error propagation
