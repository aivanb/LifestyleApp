import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch, MagicMock
import json

from apps.users.models import User, UserGoal, Unit, ActivityLevel
from apps.logging.models import WeightLog

User = get_user_model()

class ProfileViewsTestCase(TestCase):
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            height=175.0,
            birthday='1990-01-01',
            gender='male'
        )
        
        # Create units and activity levels
        self.metric_unit = Unit.objects.create(unit_id=1, unit_name='Metric')
        self.activity_level = ActivityLevel.objects.create(
            activity_level_id=3,
            activity_name='Moderate',
            multiplier=1.55
        )
        
        # Update user with units and activity level
        self.user.unit_preference = self.metric_unit
        self.user.activity_level = self.activity_level
        self.user.save()
        
        # Create user goals
        self.user_goals = UserGoal.objects.create(
            user=self.user,
            weight_goal=70.0,
            lean_mass_goal=50.0,
            fat_mass_goal=20.0,
            calories_goal=2000,
            protein_goal=150.0,
            fat_goal=80.0,
            carbohydrates_goal=200.0
        )
        
        # Create weight logs for historical data
        WeightLog.objects.create(
            user=self.user,
            weight=75.0,
            date='2024-01-01'
        )
        WeightLog.objects.create(
            user=self.user,
            weight=74.5,
            date='2024-01-08'
        )
        WeightLog.objects.create(
            user=self.user,
            weight=74.0,
            date='2024-01-15'
        )
        
        # Create client and login
        self.client = Client()
        self.client.force_login(self.user)

    def test_get_user_profile_success(self):
        """Test successful profile retrieval"""
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check response structure
        self.assertIn('data', data)
        self.assertIn('user', data['data'])
        self.assertIn('goals', data['data'])
        self.assertIn('metrics', data['data'])
        self.assertIn('historical', data['data'])
        
        # Check user data
        user_data = data['data']['user']
        self.assertEqual(user_data['username'], 'testuser')
        self.assertEqual(user_data['email'], 'test@example.com')
        self.assertEqual(user_data['height'], 175.0)
        
        # Check goals data
        goals_data = data['data']['goals']
        self.assertEqual(goals_data['weight_goal'], 70.0)
        self.assertEqual(goals_data['calories_goal'], 2000)
        
        # Check metrics data
        metrics_data = data['data']['metrics']
        self.assertIn('bmi', metrics_data)
        self.assertIn('bmr', metrics_data)
        self.assertIn('tdee', metrics_data)
        self.assertIn('fitness_rank', metrics_data)

    def test_get_user_profile_unauthenticated(self):
        """Test profile retrieval without authentication"""
        self.client.logout()
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 401)

    def test_update_user_profile_success(self):
        """Test successful profile update"""
        url = reverse('update_user_profile')
        update_data = {
            'height': 180.0,
            'birthday': '1985-05-15',
            'gender': 'female',
            'unit_preference': 1,
            'activity_level': 4
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify user was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.height, 180.0)
        self.assertEqual(self.user.birthday, '1985-05-15')
        self.assertEqual(self.user.gender, 'female')

    def test_update_user_profile_invalid_data(self):
        """Test profile update with invalid data"""
        url = reverse('update_user_profile')
        update_data = {
            'height': 'invalid',
            'gender': 'invalid_gender'
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_get_user_goals_success(self):
        """Test successful goals retrieval"""
        url = reverse('get_user_goals')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('data', data)
        goals_data = data['data']
        self.assertEqual(goals_data['weight_goal'], 70.0)
        self.assertEqual(goals_data['calories_goal'], 2000)

    def test_update_user_goals_success(self):
        """Test successful goals update"""
        url = reverse('update_user_goals')
        update_data = {
            'weight_goal': 75.0,
            'calories_goal': 2200,
            'protein_goal': 160.0
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify goals were updated
        self.user_goals.refresh_from_db()
        self.assertEqual(self.user_goals.weight_goal, 75.0)
        self.assertEqual(self.user_goals.calories_goal, 2200)
        self.assertEqual(self.user_goals.protein_goal, 160.0)

    def test_calculate_body_metrics_success(self):
        """Test successful body metrics calculation"""
        url = reverse('calculate_body_metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('data', data)
        metrics_data = data['data']
        
        # Check that all required metrics are present
        required_metrics = [
            'bmi', 'bmr', 'tdee', 'waist_to_height_ratio',
            'waist_to_shoulder_ratio', 'legs_to_height_ratio',
            'fat_mass_percentage', 'lean_mass_percentage', 'ffbmi',
            'fitness_rank'
        ]
        
        for metric in required_metrics:
            self.assertIn(metric, metrics_data)
        
        # Check fitness rank structure
        fitness_rank = metrics_data['fitness_rank']
        self.assertIn('current_rank', fitness_rank)
        self.assertIn('next_rank', fitness_rank)
        self.assertIn('current_bmi', fitness_rank)
        self.assertIn('bmi_to_next', fitness_rank)

    @patch('apps.users.services.BodyMetricsService.calculate_all_metrics')
    def test_calculate_body_metrics_service_error(self, mock_calculate):
        """Test body metrics calculation with service error"""
        mock_calculate.side_effect = Exception('Calculation error')
        
        url = reverse('calculate_body_metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 500)
        data = response.json()
        self.assertIn('error', data)

    def test_generate_macro_goals_success(self):
        """Test successful macro goals generation"""
        url = reverse('generate_macro_goals')
        request_data = {
            'weight_goal': 65.0,
            'timeframe_weeks': 12
        }
        
        response = self.client.post(
            url,
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('data', data)
        macro_data = data['data']
        
        # Check that all macro values are present
        required_macros = [
            'calories', 'protein', 'fat', 'carbohydrates',
            'fiber', 'sodium'
        ]
        
        for macro in required_macros:
            self.assertIn(macro, macro_data)
        
        # Check that values are reasonable
        self.assertGreater(macro_data['calories'], 1000)
        self.assertLess(macro_data['calories'], 4000)
        self.assertGreater(macro_data['protein'], 50)
        self.assertGreater(macro_data['fat'], 20)

    def test_generate_macro_goals_invalid_data(self):
        """Test macro goals generation with invalid data"""
        url = reverse('generate_macro_goals')
        request_data = {
            'weight_goal': 'invalid',
            'timeframe_weeks': -5
        }
        
        response = self.client.post(
            url,
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)

    def test_generate_macro_goals_extreme_goal(self):
        """Test macro goals generation with extreme weight goal"""
        url = reverse('generate_macro_goals')
        request_data = {
            'weight_goal': 50.0,  # Very low weight
            'timeframe_weeks': 4   # Very short timeframe
        }
        
        response = self.client.post(
            url,
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check that warnings are included
        self.assertIn('warnings', data['data'])
        warnings = data['data']['warnings']
        self.assertGreater(len(warnings), 0)
        
        # Check for specific warning types
        warning_text = ' '.join(warnings).lower()
        self.assertTrue(
            'aggressive' in warning_text or 
            'extreme' in warning_text or
            'unsafe' in warning_text
        )

    def test_generate_macro_goals_missing_data(self):
        """Test macro goals generation with missing required fields"""
        url = reverse('generate_macro_goals')
        request_data = {
            'weight_goal': 65.0
            # Missing timeframe_weeks
        }
        
        response = self.client.post(
            url,
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)

    @patch('apps.users.services.MacroGoalsService.calculate_macros')
    def test_generate_macro_goals_service_error(self, mock_calculate):
        """Test macro goals generation with service error"""
        mock_calculate.side_effect = Exception('Calculation error')
        
        url = reverse('generate_macro_goals')
        request_data = {
            'weight_goal': 65.0,
            'timeframe_weeks': 12
        }
        
        response = self.client.post(
            url,
            data=json.dumps(request_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 500)
        data = response.json()
        self.assertIn('error', data)

    def test_profile_data_includes_historical_data(self):
        """Test that profile data includes historical weight data"""
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        historical_data = data['data']['historical']
        self.assertIn('total_weight_change', historical_data)
        self.assertIn('weekly_recommendation', historical_data)
        self.assertIn('weight_trend', historical_data)
        self.assertIn('weight_logs', historical_data)
        
        # Check weight logs
        weight_logs = historical_data['weight_logs']
        self.assertEqual(len(weight_logs), 3)
        
        # Check that logs are ordered by date
        dates = [log['date'] for log in weight_logs]
        self.assertEqual(dates, sorted(dates))

    def test_profile_data_calculates_weight_trend(self):
        """Test that profile data correctly calculates weight trend"""
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        historical_data = data['data']['historical']
        
        # With decreasing weights, trend should be 'losing'
        self.assertEqual(historical_data['weight_trend'], 'losing')
        self.assertLess(historical_data['total_weight_change'], 0)

    def test_profile_data_with_no_weight_logs(self):
        """Test profile data when user has no weight logs"""
        # Delete all weight logs
        WeightLog.objects.filter(user=self.user).delete()
        
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        historical_data = data['data']['historical']
        self.assertEqual(len(historical_data['weight_logs']), 0)
        self.assertEqual(historical_data['weight_trend'], 'no_data')

    def test_profile_data_with_gaining_weight_trend(self):
        """Test profile data with gaining weight trend"""
        # Update weight logs to show gaining trend
        WeightLog.objects.filter(user=self.user).update(weight=75.0)
        WeightLog.objects.create(
            user=self.user,
            weight=76.0,
            date='2024-01-22'
        )
        
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        historical_data = data['data']['historical']
        self.assertEqual(historical_data['weight_trend'], 'gaining')
        self.assertGreater(historical_data['total_weight_change'], 0)

    def test_profile_data_with_stable_weight_trend(self):
        """Test profile data with stable weight trend"""
        # Update weight logs to show stable trend
        WeightLog.objects.filter(user=self.user).update(weight=75.0)
        
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        historical_data = data['data']['historical']
        self.assertEqual(historical_data['weight_trend'], 'stable')
        self.assertEqual(historical_data['total_weight_change'], 0)

    def test_profile_endpoints_require_authentication(self):
        """Test that all profile endpoints require authentication"""
        self.client.logout()
        
        endpoints = [
            ('get_user_profile', 'GET'),
            ('update_user_profile', 'PUT'),
            ('get_user_goals', 'GET'),
            ('update_user_goals', 'PUT'),
            ('calculate_body_metrics', 'GET'),
            ('generate_macro_goals', 'POST')
        ]
        
        for endpoint_name, method in endpoints:
            url = reverse(endpoint_name)
            
            if method == 'GET':
                response = self.client.get(url)
            elif method == 'PUT':
                response = self.client.put(url, data='{}', content_type='application/json')
            elif method == 'POST':
                response = self.client.post(url, data='{}', content_type='application/json')
            
            self.assertEqual(response.status_code, 401, 
                           f"Endpoint {endpoint_name} should require authentication")

    def test_profile_data_serialization(self):
        """Test that profile data is properly serialized"""
        url = reverse('get_user_profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check that all data types are correct
        user_data = data['data']['user']
        self.assertIsInstance(user_data['height'], (int, float))
        self.assertIsInstance(user_data['username'], str)
        self.assertIsInstance(user_data['email'], str)
        
        goals_data = data['data']['goals']
        self.assertIsInstance(goals_data['weight_goal'], (int, float))
        self.assertIsInstance(goals_data['calories_goal'], int)
        
        metrics_data = data['data']['metrics']
        self.assertIsInstance(metrics_data['bmi'], (int, float))
        self.assertIsInstance(metrics_data['bmr'], (int, float))
        self.assertIsInstance(metrics_data['tdee'], (int, float))

    def test_profile_update_partial_data(self):
        """Test profile update with partial data"""
        url = reverse('update_user_profile')
        update_data = {
            'height': 185.0
            # Only updating height, other fields should remain unchanged
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify only height was updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.height, 185.0)
        self.assertEqual(self.user.gender, 'male')  # Should remain unchanged
        self.assertEqual(self.user.birthday, '1990-01-01')  # Should remain unchanged

    def test_goals_update_partial_data(self):
        """Test goals update with partial data"""
        url = reverse('update_user_goals')
        update_data = {
            'calories_goal': 2500
            # Only updating calories, other goals should remain unchanged
        }
        
        response = self.client.put(
            url,
            data=json.dumps(update_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Verify only calories was updated
        self.user_goals.refresh_from_db()
        self.assertEqual(self.user_goals.calories_goal, 2500)
        self.assertEqual(self.user_goals.weight_goal, 70.0)  # Should remain unchanged
        self.assertEqual(self.user_goals.protein_goal, 150.0)  # Should remain unchanged
