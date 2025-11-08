"""
Test for profile_detail view endpoint
"""
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import AccessLevel, Unit, ActivityLevel
from apps.logging.models import WeightLog
from decimal import Decimal
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()


class ProfileViewTest(APITestCase):
    """Test cases for profile_detail view"""
    
    def setUp(self):
        """Set up test data"""
        # Create access level
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        
        # Create unit
        self.unit, _ = Unit.objects.get_or_create(unit_name='kg')
        
        # Create activity level
        self.activity_level, _ = ActivityLevel.objects.get_or_create(
            name='moderate',
            defaults={'description': 'Moderate activity level'}
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level,
            height=Decimal('175.0'),
            gender='male',
            birthday=datetime.now().date() - timedelta(days=365*25),
            unit_preference=self.unit,
            activity_level=self.activity_level
        )
        
        # Create a weight log
        WeightLog.objects.create(
            user=self.user,
            weight=Decimal('75.5'),
            weight_unit='kg',
            date_time=timezone.now()
        )
        
        # Authenticate
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_get_profile_success(self):
        """Test successful profile retrieval"""
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
        data = response.data['data']
        
        # Check required fields
        self.assertIn('user', data)
        self.assertIn('goals', data)
        self.assertIn('metrics', data)
        self.assertIn('historical', data)
        
        # Check user data
        user_data = data['user']
        self.assertEqual(user_data['username'], 'testuser')
        self.assertEqual(user_data['email'], 'test@example.com')
        
        # Check metrics are calculated
        metrics = data['metrics']
        self.assertIn('bmi', metrics)
        self.assertIn('bmr', metrics)
        self.assertIn('tdee', metrics)
        
        # Check historical data
        historical = data['historical']
        self.assertIn('weight_trend', historical)
        self.assertIn('weight_logs', historical)
    
    def test_get_profile_without_weight_log(self):
        """Test profile retrieval when user has no weight logs"""
        # Delete weight logs
        WeightLog.objects.filter(user=self.user).delete()
        
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        # Should still return 200 with default values
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
        data = response.data['data']
        historical = data['historical']
        self.assertEqual(historical['weight_trend'], 'no_data')
        self.assertEqual(len(historical['weight_logs']), 0)
    
    def test_get_profile_without_goals(self):
        """Test profile retrieval when user has no goals"""
        from apps.users.models import UserGoal
        UserGoal.objects.filter(user=self.user).delete()
        
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        # Should still return 200 with empty goals
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
        data = response.data['data']
        goals = data['goals']
        self.assertEqual(goals, {})
    
    def test_get_profile_with_multiple_goals(self):
        """Test profile retrieval when user has multiple goal records"""
        # Create a second goal record for the user
        from apps.users.models import UserGoal
        UserGoal.objects.create(
            user=self.user,
            weight_goal=Decimal('80.0'),
            calories_goal=2500
        )
        
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        # Should return 200 and use the most recent goal
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        
        data = response.data['data']
        goals = data['goals']
        # Should use the most recently updated goal
        self.assertEqual(float(goals['weight_goal']), 80.0)
        self.assertEqual(goals['calories_goal'], 2500)
    
    def test_get_profile_unauthorized(self):
        """Test profile retrieval without authentication"""
        self.client.credentials()  # Clear credentials
        
        url = '/api/users/profile/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

