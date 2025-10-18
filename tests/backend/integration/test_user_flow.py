"""
Integration Test: User Signup/Login Flow

This test simulates a complete user journey from registration to profile setup.
Tests database transactions, authentication, and data persistence.
"""

import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-integration-tests')
os.environ.setdefault('DEBUG', 'False')
django.setup()

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date

from apps.users.models import AccessLevel, Unit, ActivityLevel, UserGoal
from apps.logging.models import WeightLog

User = get_user_model()


class UserFlowIntegrationTest(TransactionTestCase):
    """
    Integration test for complete user signup and setup flow.
    Uses TransactionTestCase to test database transactions.
    """
    
    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create required reference data
        self.access_level = AccessLevel.objects.create(
            access_level_id=1,
            role_name='user'
        )
        
        self.unit_kg = Unit.objects.create(
            unit_id=1,
            unit_name='kg'
        )
        
        self.unit_lb = Unit.objects.create(
            unit_id=2,
            unit_name='lb'
        )
        
        self.activity_moderate = ActivityLevel.objects.create(
            activity_level_id=3,
            name='moderate',
            description='Moderate exercise 3-5 days/week',
            multiplier=1.55
        )
    
    def test_complete_user_signup_and_setup_flow(self):
        """Test the complete user journey from signup to profile completion"""
        
        # Step 1: User Registration
        registration_data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        
        response = self.client.post('/api/auth/register/', registration_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify response structure
        self.assertIn('data', response.data)
        self.assertIn('tokens', response.data['data'])
        self.assertIn('access', response.data['data']['tokens'])
        self.assertIn('refresh', response.data['data']['tokens'])
        
        # Extract tokens
        access_token = response.data['data']['tokens']['access']
        refresh_token = response.data['data']['tokens']['refresh']
        user_id = response.data['data']['user']['id']
        
        # Verify user was created in database
        user = User.objects.get(username='newuser')
        self.assertEqual(user.email, 'newuser@example.com')
        self.assertEqual(user.access_level, self.access_level)
        
        # Step 2: Update Profile with Personal Information
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        profile_data = {
            'height': 175.5,  # cm
            'birthday': '1990-01-15',
            'gender': 'M',
            'unit_preference': self.unit_kg.unit_id,
            'activity_level': self.activity_moderate.activity_level_id
        }
        
        response = self.client.put('/api/users/profile/', profile_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify profile was updated
        user.refresh_from_db()
        self.assertEqual(float(user.height), 175.5)
        self.assertEqual(user.birthday, date(1990, 1, 15))
        self.assertEqual(user.gender, 'M')
        self.assertEqual(user.unit_preference, self.unit_kg)
        self.assertEqual(user.activity_level, self.activity_moderate)
        
        # Step 3: Log Initial Weight
        weight_data = {
            'weight': 75.5,
            'weight_unit': 'kg'
        }
        
        response = self.client.post('/api/logging/weight/', weight_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify weight log was created
        weight_log = WeightLog.objects.get(user=user)
        self.assertEqual(float(weight_log.weight), 75.5)
        self.assertEqual(weight_log.weight_unit, 'kg')
        
        # Step 4: Set User Goals
        goals_data = {
            'weight_goal': 70.0,
            'calories_goal': 2000,
            'protein_goal': 150,
            'carbohydrates_goal': 200,
            'fat_goal': 65
        }
        
        response = self.client.put('/api/users/goals/', goals_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify goals were created
        goals = UserGoal.objects.get(user=user)
        self.assertEqual(float(goals.weight_goal), 70.0)
        self.assertEqual(goals.calories_goal, 2000)
        self.assertEqual(float(goals.protein_goal), 150)
        
        # Step 5: Calculate Macro Goals Based on Weight Target
        macro_calc_data = {
            'weight_goal': 70.0,
            'timeframe_weeks': 12
        }
        
        response = self.client.post('/api/users/calculate-macros/', macro_calc_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify macro calculation response
        self.assertIn('data', response.data)
        self.assertIn('macros', response.data['data'])
        self.assertIn('warnings', response.data['data'])
        
        # Step 6: Get Complete Profile with Metrics
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify complete profile response
        profile = response.data['data']
        self.assertEqual(profile['user']['username'], 'newuser')
        self.assertIsNotNone(profile['goals'])
        self.assertIsNotNone(profile['metrics'])
        self.assertIn('bmi', profile['metrics'])
        self.assertIn('bmr', profile['metrics'])
        self.assertIn('tdee', profile['metrics'])
        
        # Step 7: Test Token Refresh
        refresh_data = {'refresh': refresh_token}
        response = self.client.post('/api/auth/token/refresh/', refresh_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data['data'])
        
        # Step 8: Test Logout
        logout_data = {'refresh': refresh_token}
        response = self.client.post('/api/auth/logout/', logout_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify old token no longer works
        response = self.client.get('/api/users/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_user_data_isolation(self):
        """Test that users cannot access each other's data"""
        
        # Create two users
        user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='Pass123!',
            access_level=self.access_level
        )
        
        user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='Pass123!',
            access_level=self.access_level
        )
        
        # Create weight log for user1
        weight_log = WeightLog.objects.create(
            user=user1,
            weight=Decimal('80.0'),
            weight_unit='kg'
        )
        
        # Try to access as user2
        self.client.force_authenticate(user=user2)
        response = self.client.get('/api/logging/weight/')
        
        # Should not see user1's data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 0)
        
        # Access as user1
        self.client.force_authenticate(user=user1)
        response = self.client.get('/api/logging/weight/')
        
        # Should see own data
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
        self.assertEqual(float(response.data['data'][0]['weight']), 80.0)
    
    def test_transaction_rollback_on_error(self):
        """Test that database transactions are properly rolled back on error"""
        
        # This would require specific transaction testing scenarios
        # For example, creating related objects where one fails
        # The implementation depends on specific business logic
        pass
    
    def tearDown(self):
        """Clean up after tests"""
        # Django's TransactionTestCase handles database cleanup
        pass


if __name__ == '__main__':
    from django.test.runner import DiscoverRunner
    test_runner = DiscoverRunner(verbosity=2)
    test_runner.run_tests(['tests.backend.integration.test_user_flow'])
