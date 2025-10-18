# Testing Guide for AI Agents

This guide provides comprehensive testing strategies and patterns for the Workout & Macro Tracking App.

## Testing Philosophy

- **Test behavior, not implementation**
- **Each test should be independent**
- **Tests should be fast and deterministic**
- **Write tests before fixing bugs**
- **Maintain high test coverage (>90%)**

## Backend Testing

### Django Test Structure

```python
# Basic test class structure
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

class ModelTestCase(TestCase):
    """Test model logic and methods"""
    
    def setUp(self):
        """Run before each test"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def tearDown(self):
        """Run after each test"""
        # Usually not needed - Django handles cleanup
        pass
    
    def test_model_creation(self):
        """Test model can be created"""
        # Test implementation
        pass
```

### Testing Models

```python
# apps/foods/tests.py

class FoodModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.food_group = FoodGroup.objects.create(
            group_name='Protein'
        )
    
    def test_food_creation(self):
        """Test food can be created with valid data"""
        food = Food.objects.create(
            food_name='Test Food',
            food_group=self.food_group,
            calories=100,
            protein=20,
            carbohydrates=5,
            fat=2,
            user=self.user
        )
        
        self.assertEqual(food.food_name, 'Test Food')
        self.assertEqual(food.calories, 100)
        self.assertEqual(str(food), 'Test Food')
    
    def test_food_validation(self):
        """Test food validation rules"""
        with self.assertRaises(ValidationError):
            food = Food(
                food_name='',  # Empty name
                calories=-100,  # Negative calories
                user=self.user
            )
            food.full_clean()
    
    def test_macro_calculation(self):
        """Test macro percentage calculations"""
        food = Food.objects.create(
            food_name='Balanced Food',
            calories=400,
            protein=30,  # 120 cal = 30%
            carbohydrates=40,  # 160 cal = 40%
            fat=13.33,  # 120 cal = 30%
            user=self.user
        )
        
        self.assertAlmostEqual(food.protein_percentage, 30, places=1)
        self.assertAlmostEqual(food.carb_percentage, 40, places=1)
        self.assertAlmostEqual(food.fat_percentage, 30, places=1)
```

### Testing Views/APIs

```python
# apps/foods/tests.py

class FoodAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_food(self):
        """Test food creation via API"""
        data = {
            'food_name': 'API Test Food',
            'calories': 200,
            'protein': 25,
            'carbohydrates': 10,
            'fat': 8
        }
        
        response = self.client.post('/api/foods/', data)
        
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['data']['food_name'], 'API Test Food')
        self.assertTrue(
            Food.objects.filter(food_name='API Test Food').exists()
        )
    
    def test_unauthorized_access(self):
        """Test that unauthenticated requests are rejected"""
        self.client.force_authenticate(user=None)
        
        response = self.client.get('/api/foods/')
        
        self.assertEqual(response.status_code, 401)
    
    def test_data_isolation(self):
        """Test users can't see each other's private data"""
        # Create food for first user
        food1 = Food.objects.create(
            food_name='User 1 Food',
            calories=100,
            user=self.user,
            is_public=False
        )
        
        # Create second user
        user2 = User.objects.create_user(
            username='testuser2',
            password='testpass123'
        )
        
        # Authenticate as second user
        self.client.force_authenticate(user=user2)
        
        # Try to access first user's food
        response = self.client.get(f'/api/foods/{food1.food_id}/')
        
        self.assertEqual(response.status_code, 404)
```

### Testing Services

```python
# apps/users/tests.py

class BodyMetricsServiceTest(TestCase):
    def setUp(self):
        self.user_data = {
            'height': 180,  # cm
            'weight': 80,   # kg
            'age': 30,
            'gender': 'M',
            'activity_level': 'moderate'
        }
    
    def test_bmi_calculation(self):
        """Test BMI calculation accuracy"""
        service = BodyMetricsService(self.user_data)
        bmi = service.calculate_bmi()
        
        # BMI = 80 / (1.8 * 1.8) = 24.69
        self.assertAlmostEqual(bmi, 24.69, places=2)
    
    def test_bmr_calculation(self):
        """Test BMR calculation for different genders"""
        service = BodyMetricsService(self.user_data)
        bmr_male = service.calculate_bmr()
        
        # Male: 88.362 + (13.397 × 80) + (4.799 × 180) - (5.677 × 30)
        expected_male = 88.362 + 1071.76 + 863.82 - 170.31
        self.assertAlmostEqual(bmr_male, expected_male, places=0)
        
        # Test female
        self.user_data['gender'] = 'F'
        service = BodyMetricsService(self.user_data)
        bmr_female = service.calculate_bmr()
        
        # Female: 447.593 + (9.247 × 80) + (3.098 × 180) - (4.330 × 30)
        expected_female = 447.593 + 739.76 + 557.64 - 129.9
        self.assertAlmostEqual(bmr_female, expected_female, places=0)
```

### Testing with Mocks

```python
# apps/openai_service/tests.py
from unittest.mock import patch, MagicMock

class OpenAIServiceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    @patch('openai.ChatCompletion.create')
    def test_send_prompt_success(self, mock_openai):
        """Test successful OpenAI API call"""
        # Mock the OpenAI response
        mock_openai.return_value = MagicMock(
            choices=[MagicMock(
                message=MagicMock(content='Test response')
            )],
            usage=MagicMock(total_tokens=50)
        )
        
        service = OpenAIService()
        result = service.send_prompt('Test prompt', self.user)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['response'], 'Test response')
        self.assertEqual(result['tokens_used'], 50)
        
        # Verify API was called correctly
        mock_openai.assert_called_once()
    
    @patch('openai.ChatCompletion.create')
    def test_send_prompt_failure(self, mock_openai):
        """Test OpenAI API failure handling"""
        mock_openai.side_effect = Exception('API Error')
        
        service = OpenAIService()
        result = service.send_prompt('Test prompt', self.user)
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)
```

## Frontend Testing

### Component Testing

```javascript
// src/components/__tests__/FoodLogger.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodLogger from '../FoodLogger';
import api from '../../services/api';

// Mock the API
jest.mock('../../services/api');

describe('FoodLogger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders food search input', () => {
    render(<FoodLogger />);
    
    expect(screen.getByPlaceholderText('Search foods...')).toBeInTheDocument();
  });

  test('searches for foods on input', async () => {
    const mockFoods = [
      { food_id: 1, food_name: 'Apple', calories: 95 },
      { food_id: 2, food_name: 'Banana', calories: 105 }
    ];
    
    api.get.mockResolvedValue({ data: { data: mockFoods } });
    
    render(<FoodLogger />);
    
    const searchInput = screen.getByPlaceholderText('Search foods...');
    await userEvent.type(searchInput, 'fruit');
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/foods/search/', {
        params: { q: 'fruit' }
      });
    });
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  test('logs food with quantity', async () => {
    const mockFood = { food_id: 1, food_name: 'Apple', calories: 95 };
    const onFoodLogged = jest.fn();
    
    api.post.mockResolvedValue({ data: { data: { log_id: 123 } } });
    
    render(<FoodLogger onFoodLogged={onFoodLogged} />);
    
    // Simulate selecting a food
    const foodButton = screen.getByText('Apple');
    fireEvent.click(foodButton);
    
    // Enter quantity
    const quantityInput = screen.getByLabelText('Quantity (g)');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '150');
    
    // Submit
    const logButton = screen.getByText('Log Food');
    fireEvent.click(logButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/logging/food/', {
        food_id: 1,
        quantity: 150,
        meal_type: 'snack'
      });
    });
    
    expect(onFoodLogged).toHaveBeenCalled();
  });
});
```

### Hook Testing

```javascript
// src/hooks/__tests__/useAuth.test.js

import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

jest.mock('../../services/api');

describe('useAuth', () => {
  const wrapper = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  test('login sets user and tokens', async () => {
    const mockResponse = {
      data: {
        user: { id: 1, username: 'testuser' },
        tokens: {
          access: 'access-token',
          refresh: 'refresh-token'
        }
      }
    };
    
    api.post.mockResolvedValue(mockResponse);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      await result.current.login('testuser', 'password');
    });
    
    expect(result.current.user).toEqual({ id: 1, username: 'testuser' });
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('access-token');
  });
});
```

### Service Testing

```javascript
// src/services/__tests__/api.test.js

import api from '../api';
import MockAdapter from 'axios-mock-adapter';

describe('API Service', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(api);
    localStorage.setItem('access_token', 'test-token');
  });

  afterEach(() => {
    mock.restore();
    localStorage.clear();
  });

  test('adds auth header to requests', async () => {
    mock.onGet('/test').reply(200, { data: 'success' });
    
    await api.get('/test');
    
    expect(mock.history.get[0].headers.Authorization).toBe('Bearer test-token');
  });

  test('refreshes token on 401', async () => {
    localStorage.setItem('refresh_token', 'refresh-token');
    
    // First request returns 401
    mock.onGet('/test').replyOnce(401);
    
    // Token refresh succeeds
    mock.onPost('/auth/token/refresh/').reply(200, {
      data: { access: 'new-token' }
    });
    
    // Retry succeeds
    mock.onGet('/test').reply(200, { data: 'success' });
    
    const response = await api.get('/test');
    
    expect(response.data.data).toBe('success');
    expect(localStorage.getItem('access_token')).toBe('new-token');
  });
});
```

## E2E Testing

### Playwright Tests

```javascript
// tests/e2e/user_journey.spec.js

const { test, expect } = require('@playwright/test');

test.describe('User Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('complete food logging flow', async ({ page }) => {
    // Login
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'testpass123');
    await page.click('button:has-text("Login")');
    
    // Navigate to food log
    await page.click('a:has-text("Food Log")');
    await expect(page).toHaveURL('/food-log');
    
    // Search for food
    await page.fill('[placeholder="Search foods..."]', 'chicken');
    await page.waitForSelector('.food-results');
    
    // Select food
    await page.click('.food-item:first-child');
    
    // Enter quantity
    await page.fill('[name="quantity"]', '150');
    
    // Log food
    await page.click('button:has-text("Log Food")');
    
    // Verify success
    await expect(page.locator('.success-message')).toBeVisible();
    await expect(page.locator('.daily-summary')).toContainText('150g');
  });

  test('responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    await expect(page.locator('.desktop-nav')).not.toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.desktop-nav')).toBeVisible();
    await expect(page.locator('.mobile-menu-button')).not.toBeVisible();
  });
});
```

## Test Data Management

### Fixtures

```python
# tests/fixtures.py

import json
from django.contrib.auth import get_user_model

User = get_user_model()

class TestDataMixin:
    """Mixin for creating test data"""
    
    @classmethod
    def create_test_user(cls, username='testuser'):
        return User.objects.create_user(
            username=username,
            email=f'{username}@test.com',
            password='testpass123'
        )
    
    @classmethod
    def create_test_food(cls, user, **kwargs):
        defaults = {
            'food_name': 'Test Food',
            'calories': 100,
            'protein': 20,
            'carbohydrates': 10,
            'fat': 5,
            'user': user
        }
        defaults.update(kwargs)
        return Food.objects.create(**defaults)
    
    @classmethod
    def load_fixture(cls, filename):
        with open(f'tests/fixtures/{filename}') as f:
            return json.load(f)
```

### Factory Pattern

```python
# tests/factories.py

import factory
from factory.django import DjangoModelFactory
from apps.users.models import User
from apps.foods.models import Food

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f'user{n}')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@test.com')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')

class FoodFactory(DjangoModelFactory):
    class Meta:
        model = Food
    
    food_name = factory.Faker('word')
    calories = factory.Faker('random_int', min=50, max=500)
    protein = factory.Faker('random_int', min=0, max=50)
    carbohydrates = factory.Faker('random_int', min=0, max=100)
    fat = factory.Faker('random_int', min=0, max=50)
    user = factory.SubFactory(UserFactory)
```

## Test Coverage

### Running Coverage

```bash
# Backend coverage
cd backend
coverage run --source='.' manage.py test
coverage report
coverage html  # Generate HTML report

# Frontend coverage
cd frontend
npm test -- --coverage --watchAll=false
```

### Coverage Requirements

- **New features**: Minimum 90% coverage
- **Bug fixes**: Must include regression test
- **Refactoring**: Maintain existing coverage

### Excluding from Coverage

```python
# Exclude from coverage
if TYPE_CHECKING:  # pragma: no cover
    from typing import Optional
    
def debug_only():  # pragma: no cover
    """This function is only for debugging"""
    pass
```

## Testing Best Practices

### DO's
- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Set up test data in setUp/beforeEach
- ✅ Clean up in tearDown/afterEach
- ✅ Use mocks for external services
- ✅ Test edge cases and errors
- ✅ Keep tests fast (<1 second each)

### DON'Ts
- ❌ Don't test implementation details
- ❌ Don't use production data
- ❌ Don't skip error cases
- ❌ Don't write brittle selectors
- ❌ Don't share state between tests
- ❌ Don't test framework code
- ❌ Don't ignore flaky tests

## Continuous Integration

### Test Pipeline

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.9
      - name: Install dependencies
        run: |
          pip install -r backend/requirements.txt
      - name: Run tests
        run: |
          cd backend
          python manage.py test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node
        uses: actions/setup-node@v2
        with:
          node-version: 16
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm test -- --watchAll=false
```

---

**Remember**: Tests are documentation. They show how the code is meant to be used. Write them clearly and maintain them well.
