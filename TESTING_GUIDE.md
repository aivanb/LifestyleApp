# Workout Tracking System - Testing Guide

## 🧪 Testing Overview

This guide covers comprehensive testing strategies for the Workout Tracking System, including unit tests, integration tests, end-to-end tests, and performance tests.

## 🏗️ Testing Architecture

### Testing Pyramid
```
┌─────────────────────────────────────────────────────────────┐
│                    Testing Pyramid                          │
├─────────────────────────────────────────────────────────────┤
│ 1. E2E Tests (Few, High Value)                             │
│ 2. Integration Tests (Some, Medium Value)                  │
│ 3. Unit Tests (Many, Low Value)                            │
└─────────────────────────────────────────────────────────────┘
```

### Test Categories
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test security vulnerabilities
- **Accessibility Tests**: Test accessibility compliance

## 🔧 Backend Testing

### Django Test Setup
```python
# Test configuration
from django.test import TestCase, APITestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from apps.workouts.models import Workout, WorkoutMuscle, Split, SplitDay

class WorkoutTestCase(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test muscles
        self.muscle_chest = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
        self.muscle_back = Muscle.objects.create(
            muscle_name='Back',
            muscle_group='Upper Body'
        )
    
    def tearDown(self):
        """Clean up test data"""
        Workout.objects.all().delete()
        User.objects.all().delete()
        Muscle.objects.all().delete()
```

### Unit Tests
```python
# Model tests
class WorkoutModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.muscle = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
    
    def test_workout_creation(self):
        """Test workout creation"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        self.assertEqual(workout.workout_name, 'Bench Press')
        self.assertEqual(workout.type, 'barbell')
        self.assertEqual(workout.user, self.user)
    
    def test_workout_str_representation(self):
        """Test workout string representation"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        self.assertEqual(str(workout), 'Bench Press')
    
    def test_workout_muscle_relationship(self):
        """Test workout-muscle relationship"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        WorkoutMuscle.objects.create(
            workout=workout,
            muscle=self.muscle,
            activation_rating=100
        )
        
        self.assertEqual(workout.workoutmuscle_set.count(), 1)
        self.assertEqual(workout.workoutmuscle_set.first().muscle, self.muscle)

# Serializer tests
class WorkoutSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.muscle = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
    
    def test_workout_serialization(self):
        """Test workout serialization"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        WorkoutMuscle.objects.create(
            workout=workout,
            muscle=self.muscle,
            activation_rating=100
        )
        
        serializer = WorkoutSerializer(workout)
        data = serializer.data
        
        self.assertEqual(data['workout_name'], 'Bench Press')
        self.assertEqual(data['type'], 'barbell')
        self.assertEqual(len(data['muscles']), 1)
        self.assertEqual(data['muscles'][0]['activation_rating'], 100)
    
    def test_workout_deserialization(self):
        """Test workout deserialization"""
        data = {
            'workout_name': 'Bench Press',
            'type': 'barbell',
            'muscles': [
                {
                    'muscle': self.muscle.muscles_id,
                    'activation_rating': 100
                }
            ]
        }
        
        serializer = WorkoutSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        workout = serializer.save(user=self.user)
        self.assertEqual(workout.workout_name, 'Bench Press')
        self.assertEqual(workout.workoutmuscle_set.count(), 1)
```

### API Tests
```python
# API endpoint tests
class WorkoutAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.muscle = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
    
    def test_create_workout(self):
        """Test workout creation via API"""
        data = {
            'workout_name': 'Bench Press',
            'type': 'barbell',
            'muscles': [
                {
                    'muscle': self.muscle.muscles_id,
                    'activation_rating': 100
                }
            ]
        }
        
        response = self.client.post('/api/workouts/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['data']['workout_name'], 'Bench Press')
        self.assertEqual(len(response.data['data']['muscles']), 1)
    
    def test_get_workouts(self):
        """Test getting workouts via API"""
        Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        response = self.client.get('/api/workouts/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(response.data['data'][0]['workout_name'], 'Bench Press')
    
    def test_update_workout(self):
        """Test workout update via API"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        data = {
            'workout_name': 'Updated Bench Press',
            'type': 'barbell',
            'muscles': []
        }
        
        response = self.client.put(f'/api/workouts/{workout.workout_id}/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['workout_name'], 'Updated Bench Press')
    
    def test_delete_workout(self):
        """Test workout deletion via API"""
        workout = Workout.objects.create(
            workout_name='Bench Press',
            type='barbell',
            user=self.user
        )
        
        response = self.client.delete(f'/api/workouts/{workout.workout_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Workout.objects.filter(workout_id=workout.workout_id).exists())
```

### Integration Tests
```python
# Integration tests
class WorkoutIntegrationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test muscles
        self.muscle_chest = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
        self.muscle_back = Muscle.objects.create(
            muscle_name='Back',
            muscle_group='Upper Body'
        )
    
    def test_complete_workout_workflow(self):
        """Test complete workout workflow"""
        # 1. Create workout
        workout_data = {
            'workout_name': 'Bench Press',
            'type': 'barbell',
            'muscles': [
                {
                    'muscle': self.muscle_chest.muscles_id,
                    'activation_rating': 100
                }
            ]
        }
        
        response = self.client.post('/api/workouts/', workout_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workout_id = response.data['data']['workout_id']
        
        # 2. Create split
        split_data = {
            'split_name': 'Push/Pull/Legs',
            'start_date': '2024-01-01',
            'split_days': [
                {
                    'day_name': 'Push Day',
                    'day_order': 1,
                    'targets': [
                        {
                            'muscle': self.muscle_chest.muscles_id,
                            'target_activation': 250
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post('/api/workouts/splits/', split_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        split_id = response.data['data']['splits_id']
        
        # 3. Activate split
        activate_data = {'start_date': '2024-01-01'}
        response = self.client.post(f'/api/workouts/splits/{split_id}/activate/', activate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. Log workout
        log_data = {
            'workout': workout_id,
            'date_time': '2024-01-01T10:00:00Z',
            'weight': 100,
            'reps': 10,
            'rir': 2
        }
        
        response = self.client.post('/api/workouts/logs/', log_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 5. Verify current split day
        response = self.client.get('/api/workouts/current-split-day/?date=2024-01-01')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['current_split_day']['day_name'], 'Push Day')
```

## ⚛️ Frontend Testing

### React Testing Setup
```javascript
// Test setup
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import WorkoutTracker from '../pages/WorkoutTracker';

// Test wrapper
const TestWrapper = ({ children }) => (
    <Provider store={store}>
        <BrowserRouter>
            {children}
        </BrowserRouter>
    </Provider>
);

// Mock API
jest.mock('../services/api', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));
```

### Component Tests
```javascript
// Component tests
describe('WorkoutTracker', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    test('renders workout tracker page', () => {
        render(
            <TestWrapper>
                <WorkoutTracker />
            </TestWrapper>
        );
        
        expect(screen.getByText('Workout Tracker')).toBeInTheDocument();
        expect(screen.getByText('Muscle Priority')).toBeInTheDocument();
        expect(screen.getByText('Workout Adder')).toBeInTheDocument();
    });
    
    test('switches between tabs', async () => {
        const user = userEvent.setup();
        
        render(
            <TestWrapper>
                <WorkoutTracker />
            </TestWrapper>
        );
        
        const workoutAdderTab = screen.getByText('Workout Adder');
        await user.click(workoutAdderTab);
        
        expect(screen.getByText('Create New Workout')).toBeInTheDocument();
    });
    
    test('handles tab navigation', async () => {
        const user = userEvent.setup();
        
        render(
            <TestWrapper>
                <WorkoutTracker />
            </TestWrapper>
        );
        
        const tabs = [
            'Muscle Priority',
            'Workout Adder',
            'Split Creator',
            'Workout Logger',
            'Workout Log'
        ];
        
        for (const tabName of tabs) {
            const tab = screen.getByText(tabName);
            await user.click(tab);
            
            // Verify tab is active
            expect(tab).toHaveClass('btn-primary');
        }
    });
});
```

### Hook Tests
```javascript
// Custom hook tests
import { renderHook, act } from '@testing-library/react';
import { useWorkouts } from '../hooks/useWorkouts';

describe('useWorkouts', () => {
    test('fetches workouts on mount', async () => {
        const mockWorkouts = [
            { id: 1, workout_name: 'Bench Press', type: 'barbell' },
            { id: 2, workout_name: 'Squats', type: 'barbell' }
        ];
        
        api.get.mockResolvedValue({ data: { data: mockWorkouts } });
        
        const { result } = renderHook(() => useWorkouts());
        
        await waitFor(() => {
            expect(result.current.workouts).toEqual(mockWorkouts);
            expect(result.current.loading).toBe(false);
        });
    });
    
    test('creates new workout', async () => {
        const newWorkout = {
            workout_name: 'Deadlift',
            type: 'barbell',
            muscles: []
        };
        
        const createdWorkout = { id: 3, ...newWorkout };
        
        api.post.mockResolvedValue({ data: { data: createdWorkout } });
        
        const { result } = renderHook(() => useWorkouts());
        
        await act(async () => {
            await result.current.createWorkout(newWorkout);
        });
        
        expect(result.current.workouts).toContain(createdWorkout);
    });
    
    test('handles errors gracefully', async () => {
        const error = new Error('API Error');
        api.get.mockRejectedValue(error);
        
        const { result } = renderHook(() => useWorkouts());
        
        await waitFor(() => {
            expect(result.current.error).toBe(error);
            expect(result.current.loading).toBe(false);
        });
    });
});
```

### API Integration Tests
```javascript
// API integration tests
describe('API Integration', () => {
    test('workout CRUD operations', async () => {
        const workoutData = {
            workout_name: 'Bench Press',
            type: 'barbell',
            muscles: [
                { muscle: 1, activation_rating: 100 }
            ]
        };
        
        // Create workout
        api.post.mockResolvedValue({
            data: { data: { id: 1, ...workoutData } }
        });
        
        const response = await api.post('/workouts/', workoutData);
        expect(response.data.data.workout_name).toBe('Bench Press');
        
        // Get workouts
        api.get.mockResolvedValue({
            data: { data: [{ id: 1, ...workoutData }] }
        });
        
        const workouts = await api.get('/workouts/');
        expect(workouts.data.data).toHaveLength(1);
        
        // Update workout
        const updatedData = { ...workoutData, workout_name: 'Updated Bench Press' };
        api.put.mockResolvedValue({
            data: { data: { id: 1, ...updatedData } }
        });
        
        const updatedResponse = await api.put('/workouts/1/', updatedData);
        expect(updatedResponse.data.data.workout_name).toBe('Updated Bench Press');
        
        // Delete workout
        api.delete.mockResolvedValue({ status: 204 });
        
        const deleteResponse = await api.delete('/workouts/1/');
        expect(deleteResponse.status).toBe(204);
    });
});
```

## 🎭 End-to-End Testing

### Playwright Setup
```javascript
// Playwright configuration
const { test, expect } = require('@playwright/test');

test.describe('Workout Tracker E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('http://localhost:3000');
        
        // Login (if required)
        await page.fill('[data-testid="username"]', 'testuser');
        await page.fill('[data-testid="password"]', 'testpass123');
        await page.click('[data-testid="login-button"]');
        
        // Wait for navigation
        await page.waitForURL('**/workout-tracker');
    });
    
    test('complete workout workflow', async ({ page }) => {
        // 1. Create workout
        await page.click('[data-testid="workout-adder-tab"]');
        await page.fill('[data-testid="workout-name"]', 'Bench Press');
        await page.selectOption('[data-testid="workout-type"]', 'barbell');
        await page.click('[data-testid="add-muscle-button"]');
        await page.selectOption('[data-testid="muscle-select"]', '1');
        await page.fill('[data-testid="activation-rating"]', '100');
        await page.click('[data-testid="create-workout-button"]');
        
        // Verify workout created
        await expect(page.locator('[data-testid="workout-list"]')).toContainText('Bench Press');
        
        // 2. Create split
        await page.click('[data-testid="split-creator-tab"]');
        await page.fill('[data-testid="split-name"]', 'Push/Pull/Legs');
        await page.fill('[data-testid="start-date"]', '2024-01-01');
        await page.click('[data-testid="add-day-button"]');
        await page.fill('[data-testid="day-name"]', 'Push Day');
        await page.fill('[data-testid="day-order"]', '1');
        await page.click('[data-testid="add-target-button"]');
        await page.selectOption('[data-testid="target-muscle"]', '1');
        await page.fill('[data-testid="target-activation"]', '250');
        await page.click('[data-testid="create-split-button"]');
        
        // Verify split created
        await expect(page.locator('[data-testid="split-list"]')).toContainText('Push/Pull/Legs');
        
        // 3. Activate split
        await page.click('[data-testid="activate-split-button"]');
        await page.fill('[data-testid="activation-date"]', '2024-01-01');
        await page.click('[data-testid="confirm-activation"]');
        
        // Verify split activated
        await expect(page.locator('[data-testid="active-split"]')).toContainText('Push/Pull/Legs');
        
        // 4. Log workout
        await page.click('[data-testid="workout-logger-tab"]');
        await page.fill('[data-testid="workout-search"]', 'Bench Press');
        await page.click('[data-testid="workout-item"]');
        await page.fill('[data-testid="weight"]', '100');
        await page.fill('[data-testid="reps"]', '10');
        await page.fill('[data-testid="rir"]', '2');
        await page.click('[data-testid="log-workout-button"]');
        
        // Verify workout logged
        await expect(page.locator('[data-testid="workout-log"]')).toContainText('Bench Press');
        
        // 5. View workout log
        await page.click('[data-testid="workout-log-tab"]');
        await expect(page.locator('[data-testid="current-split-day"]')).toContainText('Push Day');
        await expect(page.locator('[data-testid="workout-stats"]')).toContainText('Total Sets: 1');
    });
    
    test('muscle priority management', async ({ page }) => {
        await page.click('[data-testid="muscle-priority-tab"]');
        
        // Expand muscle group
        await page.click('[data-testid="upper-body-group"]');
        
        // Update chest priority
        await page.fill('[data-testid="chest-priority"]', '95');
        
        // Update back priority
        await page.fill('[data-testid="back-priority"]', '75');
        
        // Save changes
        await page.click('[data-testid="update-priorities-button"]');
        
        // Verify changes saved
        await expect(page.locator('[data-testid="chest-priority"]')).toHaveValue('95');
        await expect(page.locator('[data-testid="back-priority"]')).toHaveValue('75');
    });
});
```

### Cypress Setup
```javascript
// Cypress configuration
describe('Workout Tracker E2E', () => {
    beforeEach(() => {
        cy.visit('/workout-tracker');
        cy.login('testuser', 'testpass123');
    });
    
    it('should create and log workout', () => {
        // Create workout
        cy.get('[data-testid="workout-adder-tab"]').click();
        cy.get('[data-testid="workout-name"]').type('Bench Press');
        cy.get('[data-testid="workout-type"]').select('barbell');
        cy.get('[data-testid="add-muscle-button"]').click();
        cy.get('[data-testid="muscle-select"]').select('1');
        cy.get('[data-testid="activation-rating"]').type('100');
        cy.get('[data-testid="create-workout-button"]').click();
        
        // Verify workout created
        cy.get('[data-testid="workout-list"]').should('contain', 'Bench Press');
        
        // Log workout
        cy.get('[data-testid="workout-logger-tab"]').click();
        cy.get('[data-testid="workout-search"]').type('Bench Press');
        cy.get('[data-testid="workout-item"]').click();
        cy.get('[data-testid="weight"]').type('100');
        cy.get('[data-testid="reps"]').type('10');
        cy.get('[data-testid="rir"]').type('2');
        cy.get('[data-testid="log-workout-button"]').click();
        
        // Verify workout logged
        cy.get('[data-testid="workout-log"]').should('contain', 'Bench Press');
    });
    
    it('should manage muscle priorities', () => {
        cy.get('[data-testid="muscle-priority-tab"]').click();
        
        // Expand muscle group
        cy.get('[data-testid="upper-body-group"]').click();
        
        // Update priorities
        cy.get('[data-testid="chest-priority"]').clear().type('95');
        cy.get('[data-testid="back-priority"]').clear().type('75');
        
        // Save changes
        cy.get('[data-testid="update-priorities-button"]').click();
        
        // Verify changes
        cy.get('[data-testid="chest-priority"]').should('have.value', '95');
        cy.get('[data-testid="back-priority"]').should('have.value', '75');
    });
});
```

## 🚀 Performance Testing

### Load Testing
```javascript
// Artillery load testing
const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
    test('API response times', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('http://localhost:3000/api/workouts/');
        
        const response = await page.waitForResponse('**/api/workouts/');
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        expect(responseTime).toBeLessThan(200); // 200ms threshold
    });
    
    test('concurrent user simulation', async ({ browser }) => {
        const contexts = await Promise.all([
            browser.newContext(),
            browser.newContext(),
            browser.newContext(),
            browser.newContext(),
            browser.newContext()
        ]);
        
        const pages = await Promise.all(
            contexts.map(context => context.newPage())
        );
        
        // Simulate concurrent users
        await Promise.all(
            pages.map(page => page.goto('http://localhost:3000/workout-tracker'))
        );
        
        // Verify all pages loaded
        await Promise.all(
            pages.map(page => expect(page.locator('h1')).toContainText('Workout Tracker'))
        );
        
        // Cleanup
        await Promise.all(contexts.map(context => context.close()));
    });
});
```

### Database Performance Testing
```python
# Database performance tests
from django.test import TestCase
from django.db import connection
from django.test.utils import override_settings
import time

class DatabasePerformanceTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create test data
        for i in range(100):
            Workout.objects.create(
                workout_name=f'Workout {i}',
                type='barbell',
                user=self.user
            )
    
    def test_workout_query_performance(self):
        """Test workout query performance"""
        start_time = time.time()
        
        workouts = Workout.objects.filter(user=self.user).all()
        list(workouts)  # Force evaluation
        
        end_time = time.time()
        query_time = end_time - start_time
        
        self.assertLess(query_time, 0.1)  # 100ms threshold
    
    def test_workout_creation_performance(self):
        """Test workout creation performance"""
        start_time = time.time()
        
        Workout.objects.create(
            workout_name='Performance Test Workout',
            type='barbell',
            user=self.user
        )
        
        end_time = time.time()
        creation_time = end_time - start_time
        
        self.assertLess(creation_time, 0.05)  # 50ms threshold
    
    def test_database_connection_pooling(self):
        """Test database connection pooling"""
        connections_before = len(connection.queries)
        
        # Perform multiple operations
        for i in range(10):
            Workout.objects.create(
                workout_name=f'Pool Test {i}',
                type='barbell',
                user=self.user
            )
        
        connections_after = len(connection.queries)
        
        # Should reuse connections efficiently
        self.assertLess(connections_after - connections_before, 20)
```

## 🔒 Security Testing

### Authentication Tests
```python
# Authentication security tests
class AuthenticationSecurityTest(APITestCase):
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        response = self.client.get('/api/workouts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_invalid_token(self):
        """Test access with invalid token"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        response = self.client.get('/api/workouts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_expired_token(self):
        """Test access with expired token"""
        # Create expired token
        expired_token = create_expired_token()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {expired_token}')
        response = self.client.get('/api/workouts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
```

### Input Validation Tests
```python
# Input validation security tests
class InputValidationSecurityTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_sql_injection_protection(self):
        """Test SQL injection protection"""
        malicious_input = "'; DROP TABLE workouts; --"
        
        response = self.client.get(f'/api/workouts/?search={malicious_input}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify table still exists
        self.assertTrue(Workout.objects.exists())
    
    def test_xss_protection(self):
        """Test XSS protection"""
        malicious_input = "<script>alert('XSS')</script>"
        
        response = self.client.post('/api/workouts/', {
            'workout_name': malicious_input,
            'type': 'barbell',
            'muscles': []
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_csrf_protection(self):
        """Test CSRF protection"""
        response = self.client.post('/api/workouts/', {
            'workout_name': 'Test Workout',
            'type': 'barbell',
            'muscles': []
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
```

## 📊 Test Coverage

### Coverage Configuration
```python
# Coverage configuration
COVERAGE_SETTINGS = {
    'source': '.',
    'omit': [
        '*/migrations/*',
        '*/venv/*',
        '*/node_modules/*',
        '*/tests/*',
        '*/test_*',
        '*/__pycache__/*',
    ],
    'branch': True,
    'show_missing': True,
    'precision': 2,
    'fail_under': 80,
}
```

### Coverage Reporting
```bash
# Generate coverage report
coverage run --source='.' manage.py test
coverage report
coverage html

# View HTML coverage report
open htmlcov/index.html
```

## 🧪 Test Automation

### CI/CD Pipeline
```yaml
# GitHub Actions workflow
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
      - name: Generate coverage
        run: coverage run --source='.' manage.py test
      - name: Upload coverage
        uses: codecov/codecov-action@v1

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
      - name: Upload coverage
        uses: codecov/codecov-action@v1

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm install
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npx playwright test
```

### Test Scripts
```bash
#!/bin/bash
# Test runner script

echo "=== Running Tests ==="

# Backend tests
echo "=== Backend Tests ==="
cd backend
python manage.py test
coverage run --source='.' manage.py test
coverage report

# Frontend tests
echo "=== Frontend Tests ==="
cd ../frontend
npm test -- --coverage --watchAll=false

# E2E tests
echo "=== E2E Tests ==="
npx playwright test

echo "=== All Tests Completed ==="
```

## 📋 Testing Checklist

### Unit Testing
- [ ] Test all model methods and properties
- [ ] Test serializer validation and serialization
- [ ] Test API endpoint functionality
- [ ] Test error handling and edge cases
- [ ] Test authentication and authorization
- [ ] Test input validation and sanitization

### Integration Testing
- [ ] Test component interactions
- [ ] Test API integration
- [ ] Test database operations
- [ ] Test external service integration
- [ ] Test error propagation
- [ ] Test data flow between components

### End-to-End Testing
- [ ] Test complete user workflows
- [ ] Test cross-browser compatibility
- [ ] Test responsive design
- [ ] Test accessibility compliance
- [ ] Test performance under load
- [ ] Test error scenarios

### Performance Testing
- [ ] Test API response times
- [ ] Test database query performance
- [ ] Test frontend load times
- [ ] Test concurrent user handling
- [ ] Test memory usage
- [ ] Test CPU usage

### Security Testing
- [ ] Test authentication mechanisms
- [ ] Test authorization controls
- [ ] Test input validation
- [ ] Test SQL injection protection
- [ ] Test XSS protection
- [ ] Test CSRF protection

---

**Remember**: Testing is an ongoing process. Regular testing, monitoring, and improvement are essential for maintaining system quality and reliability.
