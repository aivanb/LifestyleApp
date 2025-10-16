import json
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.logging.models import WeightLog, BodyMeasurementLog, WaterLog, StepsLog, CardioLog
from apps.health.models import SleepLog, HealthMetricsLog

User = get_user_model()


class AdditionalTrackersTestCase(APITestCase):
    """Test cases for the Additional Trackers system"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create JWT token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_weight_log_crud(self):
        """Test weight log CRUD operations"""
        # Create
        data = {
            'weight': 150.5,
            'weight_unit': 'lbs'
        }
        response = self.client.post('/api/logging/weight/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WeightLog.objects.count(), 1)
        
        weight_log = WeightLog.objects.first()
        self.assertEqual(weight_log.weight, 150.5)
        self.assertEqual(weight_log.weight_unit, 'lbs')
        self.assertEqual(weight_log.user, self.user)

        # Read
        response = self.client.get('/api/logging/weight/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        # Update
        update_data = {'weight': 151.0}
        response = self.client.put(f'/api/logging/weight/{weight_log.weight_log_id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        weight_log.refresh_from_db()
        self.assertEqual(weight_log.weight, 151.0)

        # Delete
        response = self.client.delete(f'/api/logging/weight/{weight_log.weight_log_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WeightLog.objects.count(), 0)

    def test_water_log_crud(self):
        """Test water log CRUD operations"""
        # Create
        data = {
            'amount': 16.0,
            'unit': 'oz'
        }
        response = self.client.post('/api/logging/water/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WaterLog.objects.count(), 1)

        water_log = WaterLog.objects.first()
        self.assertEqual(water_log.amount, 16.0)
        self.assertEqual(water_log.unit, 'oz')

        # Test different units
        data = {
            'amount': 500.0,
            'unit': 'ml'
        }
        response = self.client.post('/api/logging/water/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_body_measurement_log_crud(self):
        """Test body measurement log CRUD operations"""
        # Create with multiple measurements
        data = {
            'waist': 32.0,
            'shoulder': 44.0,
            'leg': 24.0
        }
        response = self.client.post('/api/logging/body-measurement/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        measurement_log = BodyMeasurementLog.objects.first()
        self.assertEqual(measurement_log.waist, 32.0)
        self.assertEqual(measurement_log.shoulder, 44.0)
        self.assertEqual(measurement_log.leg, 24.0)

        # Test partial update
        update_data = {'waist': 31.5}
        response = self.client.patch(f'/api/logging/body-measurement/{measurement_log.measurement_id}/', update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        measurement_log.refresh_from_db()
        self.assertEqual(measurement_log.waist, 31.5)

    def test_steps_log_crud(self):
        """Test steps log CRUD operations"""
        from datetime import datetime
        
        # Create
        data = {
            'steps': 10000,
            'date_time': datetime.now().isoformat()
        }
        response = self.client.post('/api/logging/steps/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        steps_log = StepsLog.objects.first()
        self.assertEqual(steps_log.steps, 10000)

    def test_cardio_log_crud(self):
        """Test cardio log CRUD operations"""
        from datetime import datetime
        
        # Create with all fields
        data = {
            'cardio_type': 'Running',
            'duration': 30.0,
            'distance': 3.5,
            'distance_unit': 'miles',
            'calories_burned': 350,
            'heart_rate': 150,
            'date_time': datetime.now().isoformat()
        }
        response = self.client.post('/api/logging/cardio/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        cardio_log = CardioLog.objects.first()
        self.assertEqual(cardio_log.cardio_type, 'Running')
        self.assertEqual(cardio_log.duration, 30.0)
        self.assertEqual(cardio_log.distance, 3.5)
        self.assertEqual(cardio_log.calories_burned, 350)

    def test_sleep_log_crud(self):
        """Test sleep log CRUD operations"""
        # Create
        data = {
            'date_time': '2024-01-15',
            'time_went_to_bed': '23:00:00',
            'time_got_out_of_bed': '07:00:00',
            'time_fell_asleep': '23:30:00',
            'time_in_light_sleep': 180,
            'time_in_deep_sleep': 120,
            'time_in_rem_sleep': 90,
            'number_of_times_woke_up': 2,
            'resting_heart_rate': 60
        }
        response = self.client.post('/api/health/sleep/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        sleep_log = SleepLog.objects.first()
        self.assertEqual(sleep_log.time_went_to_bed, '23:00:00')
        self.assertEqual(sleep_log.time_in_light_sleep, 180)

    def test_health_metrics_log_crud(self):
        """Test health metrics log CRUD operations"""
        # Create
        data = {
            'date_time': '2024-01-15',
            'resting_heart_rate': 65,
            'blood_pressure_systolic': 120,
            'blood_pressure_diastolic': 80,
            'morning_energy': 8,
            'stress_level': 3,
            'mood': 9,
            'soreness': 2,
            'illness_level': 1
        }
        response = self.client.post('/api/health/health-metrics/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        health_log = HealthMetricsLog.objects.first()
        self.assertEqual(health_log.resting_heart_rate, 65)
        self.assertEqual(health_log.mood, 9)

    def test_streak_calculations(self):
        """Test streak calculation endpoints"""
        from datetime import date, timedelta
        
        # Create some weight logs for streak testing
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        WeightLog.objects.create(
            user=self.user,
            weight=150.0,
            weight_unit='lbs',
            created_at=f'{today} 10:00:00'
        )
        
        WeightLog.objects.create(
            user=self.user,
            weight=149.5,
            weight_unit='lbs',
            created_at=f'{yesterday} 10:00:00'
        )

        # Test weight streak
        response = self.client.get('/api/logging/weight/streak/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['streak'], 2)

        # Test all streaks
        response = self.client.get('/api/logging/streaks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('weight', response.data)
        self.assertEqual(response.data['weight'], 2)

    def test_validation_errors(self):
        """Test validation error handling"""
        # Test negative weight
        data = {'weight': -10, 'weight_unit': 'lbs'}
        response = self.client.post('/api/logging/weight/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid weight unit
        data = {'weight': 150, 'weight_unit': 'invalid'}
        response = self.client.post('/api/logging/weight/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test empty body measurements
        data = {}
        response = self.client.post('/api/logging/body-measurement/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test invalid rating values
        data = {
            'date_time': '2024-01-15',
            'morning_energy': 15  # Should be 1-10
        }
        response = self.client.post('/api/health/health-metrics/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_authentication_required(self):
        """Test that authentication is required for all endpoints"""
        self.client.credentials()  # Remove authentication
        
        # Test weight log
        response = self.client.get('/api/logging/weight/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Test health metrics
        response = self.client.get('/api/health/health-metrics/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_isolation(self):
        """Test that users can only see their own data"""
        # Create another user
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        
        # Create weight log for other user
        WeightLog.objects.create(
            user=other_user,
            weight=200.0,
            weight_unit='lbs'
        )
        
        # Current user should not see other user's data
        response = self.client.get('/api/logging/weight/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_date_filtering(self):
        """Test date filtering functionality"""
        from datetime import date, timedelta
        
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Create logs for different dates
        WeightLog.objects.create(
            user=self.user,
            weight=150.0,
            weight_unit='lbs',
            created_at=f'{today} 10:00:00'
        )
        
        WeightLog.objects.create(
            user=self.user,
            weight=149.5,
            weight_unit='lbs',
            created_at=f'{yesterday} 10:00:00'
        )

        # Filter by today
        response = self.client.get(f'/api/logging/weight/?date={today}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        # Filter by yesterday
        response = self.client.get(f'/api/logging/weight/?date={yesterday}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class TrackerIntegrationTestCase(TestCase):
    """Integration tests for the tracker system"""

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='integrationuser',
            email='integration@example.com',
            password='testpass123'
        )

    def test_complete_tracking_workflow(self):
        """Test a complete tracking workflow"""
        # Login
        self.client.login(username='integrationuser', password='testpass123')
        
        # Track weight
        response = self.client.post('/api/logging/weight/', {
            'weight': 150.0,
            'weight_unit': 'lbs'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Track water intake
        response = self.client.post('/api/logging/water/', {
            'amount': 16.0,
            'unit': 'oz'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Track steps
        from datetime import datetime
        response = self.client.post('/api/logging/steps/', {
            'steps': 8000,
            'date_time': datetime.now().isoformat()
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify all logs were created
        self.assertEqual(WeightLog.objects.count(), 1)
        self.assertEqual(WaterLog.objects.count(), 1)
        self.assertEqual(StepsLog.objects.count(), 1)

    def test_data_consistency(self):
        """Test data consistency across different tracker types"""
        from datetime import date, timedelta
        
        # Create logs for the same date
        today = date.today()
        
        WeightLog.objects.create(
            user=self.user,
            weight=150.0,
            weight_unit='lbs',
            created_at=f'{today} 08:00:00'
        )
        
        WaterLog.objects.create(
            user=self.user,
            amount=32.0,
            unit='oz',
            created_at=f'{today} 12:00:00'
        )
        
        StepsLog.objects.create(
            user=self.user,
            steps=10000,
            date_time=f'{today} 18:00:00'
        )

        # Verify data integrity
        self.assertEqual(WeightLog.objects.filter(user=self.user).count(), 1)
        self.assertEqual(WaterLog.objects.filter(user=self.user).count(), 1)
        self.assertEqual(StepsLog.objects.filter(user=self.user).count(), 1)
        
        # Verify user isolation
        other_user = User.objects.create_user(
            username='otheruser2',
            email='other2@example.com',
            password='testpass123'
        )
        
        self.assertEqual(WeightLog.objects.filter(user=other_user).count(), 0)
        self.assertEqual(WaterLog.objects.filter(user=other_user).count(), 0)
        self.assertEqual(StepsLog.objects.filter(user=other_user).count(), 0)
