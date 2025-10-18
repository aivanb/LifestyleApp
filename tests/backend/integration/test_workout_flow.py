"""
Integration Test: Workout Tracking Flow

This test simulates a complete workout tracking journey including:
- Creating workouts with exercises
- Logging workout sessions
- Tracking muscle activation
- Viewing workout history
"""

import os
import django
from django.conf import settings

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ.setdefault('SECRET_KEY', 'test-secret-key-for-integration-tests')
os.environ.setdefault('DEBUG', 'False')
django.setup()

from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
import json

from apps.users.models import AccessLevel
from apps.workouts.models import Muscle, Workout, WorkoutSet, MuscleLog, Split, SplitDay

User = get_user_model()


class WorkoutFlowIntegrationTest(TransactionTestCase):
    """
    Integration test for complete workout tracking flow.
    Tests the full journey from workout creation to history viewing.
    """
    
    def setUp(self):
        """Set up test data and authenticated user"""
        self.client = APIClient()
        
        # Create required reference data
        self.access_level = AccessLevel.objects.create(
            access_level_id=1,
            role_name='user'
        )
        
        # Create muscles
        self.chest = Muscle.objects.create(
            muscle_id=1,
            muscle_name='Chest',
            muscle_group='Upper Body'
        )
        
        self.triceps = Muscle.objects.create(
            muscle_id=2,
            muscle_name='Triceps',
            muscle_group='Arms'
        )
        
        self.shoulders = Muscle.objects.create(
            muscle_id=3,
            muscle_name='Shoulders',
            muscle_group='Upper Body'
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='gymuser',
            email='gymuser@example.com',
            password='StrongPass123!',
            access_level=self.access_level
        )
        
        # Authenticate client
        self.client.force_authenticate(user=self.user)
    
    def test_complete_workout_tracking_flow(self):
        """Test the complete workout journey from creation to logging"""
        
        # Step 1: Create a Workout
        workout_data = {
            'workout_name': 'Chest Day',
            'user_id': self.user.user_id
        }
        
        response = self.client.post('/api/workouts/workouts/', workout_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        workout_id = response.data['data']['workout_id']
        self.assertEqual(response.data['data']['workout_name'], 'Chest Day')
        
        # Step 2: Add Exercises to Workout
        exercises = [
            {
                'exercise_name': 'Bench Press',
                'sets': 4,
                'reps': '8-10',
                'weight': 80,
                'notes': 'Focus on form'
            },
            {
                'exercise_name': 'Incline Dumbbell Press',
                'sets': 3,
                'reps': '10-12',
                'weight': 30,
                'notes': 'Slow negative'
            },
            {
                'exercise_name': 'Cable Flyes',
                'sets': 3,
                'reps': '12-15',
                'weight': 20,
                'notes': 'Squeeze at top'
            }
        ]
        
        for exercise in exercises:
            set_data = {
                'workout': workout_id,
                **exercise
            }
            response = self.client.post('/api/workouts/sets/', set_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify exercises were added
        response = self.client.get(f'/api/workouts/workouts/{workout_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['sets']), 3)
        
        # Step 3: Log Muscle Activation
        muscle_log_data = {
            'workout': workout_id,
            'muscles': [
                {'muscle_id': self.chest.muscle_id, 'activation_level': 5},
                {'muscle_id': self.triceps.muscle_id, 'activation_level': 3},
                {'muscle_id': self.shoulders.muscle_id, 'activation_level': 2}
            ]
        }
        
        response = self.client.post('/api/workouts/muscle-logs/', muscle_log_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 4: Create a Split (Weekly Routine)
        split_data = {
            'split_name': 'Push/Pull/Legs',
            'description': '3-day workout split'
        }
        
        response = self.client.post('/api/workouts/splits/', split_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        split_id = response.data['data']['split_id']
        
        # Step 5: Add Workouts to Split Days
        split_days = [
            {'day_number': 1, 'day_name': 'Push Day', 'workout_ids': [workout_id]},
            {'day_number': 2, 'day_name': 'Pull Day', 'workout_ids': []},
            {'day_number': 3, 'day_name': 'Leg Day', 'workout_ids': []}
        ]
        
        for day in split_days:
            day_data = {
                'split': split_id,
                'day_number': day['day_number'],
                'day_name': day['day_name']
            }
            response = self.client.post('/api/workouts/split-days/', day_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            
            # Link workouts to day if any
            if day['workout_ids']:
                day_id = response.data['data']['split_day_id']
                for workout_id in day['workout_ids']:
                    # Update workout to link to split day
                    workout = Workout.objects.get(workout_id=workout_id)
                    # This would depend on your actual model relationships
        
        # Step 6: Log a Workout Session
        log_data = {
            'workout_id': workout_id,
            'date_logged': date.today().isoformat(),
            'sets_completed': [
                {
                    'exercise_name': 'Bench Press',
                    'set_number': 1,
                    'reps': 10,
                    'weight': 80
                },
                {
                    'exercise_name': 'Bench Press',
                    'set_number': 2,
                    'reps': 9,
                    'weight': 80
                },
                {
                    'exercise_name': 'Bench Press',
                    'set_number': 3,
                    'reps': 8,
                    'weight': 80
                },
                {
                    'exercise_name': 'Bench Press',
                    'set_number': 4,
                    'reps': 7,
                    'weight': 80
                }
            ],
            'notes': 'Great workout, felt strong'
        }
        
        response = self.client.post('/api/workouts/log/', log_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 7: View Workout History
        response = self.client.get('/api/workouts/history/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        history = response.data['data']
        self.assertGreater(len(history), 0)
        
        # Step 8: Get Muscle Activation Summary
        response = self.client.get('/api/workouts/muscle-summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['data']
        self.assertIn('muscle_frequency', summary)
        self.assertIn('activation_levels', summary)
        
        # Step 9: Get Workout Statistics
        response = self.client.get('/api/workouts/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stats = response.data['data']
        self.assertIn('total_workouts', stats)
        self.assertIn('this_week', stats)
        self.assertIn('favorite_exercises', stats)
    
    def test_workout_data_validation(self):
        """Test that workout data is properly validated"""
        
        # Test creating workout with invalid data
        invalid_workout_data = {
            'workout_name': '',  # Empty name
            'user_id': self.user.user_id
        }
        
        response = self.client.post('/api/workouts/workouts/', invalid_workout_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        
        # Test adding exercise with invalid weight
        workout = Workout.objects.create(
            workout_name='Test Workout',
            user=self.user
        )
        
        invalid_set_data = {
            'workout': workout.workout_id,
            'exercise_name': 'Test Exercise',
            'sets': -1,  # Negative sets
            'reps': '10',
            'weight': -50  # Negative weight
        }
        
        response = self.client.post('/api/workouts/sets/', invalid_set_data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_concurrent_workout_logging(self):
        """Test that multiple workouts can be logged without conflicts"""
        
        # Create two workouts
        workout1 = Workout.objects.create(
            workout_name='Morning Workout',
            user=self.user
        )
        
        workout2 = Workout.objects.create(
            workout_name='Evening Workout',
            user=self.user
        )
        
        # Log both on the same day
        today = date.today()
        
        log1_data = {
            'workout_id': workout1.workout_id,
            'date_logged': today.isoformat(),
            'notes': 'Morning session'
        }
        
        log2_data = {
            'workout_id': workout2.workout_id,
            'date_logged': today.isoformat(),
            'notes': 'Evening session'
        }
        
        response1 = self.client.post('/api/workouts/log/', log1_data)
        response2 = self.client.post('/api/workouts/log/', log2_data)
        
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Verify both logs exist
        response = self.client.get(f'/api/workouts/history/?date={today}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)
    
    def test_workout_deletion_cascade(self):
        """Test that deleting a workout properly cascades to related data"""
        
        # Create workout with exercises and muscle logs
        workout = Workout.objects.create(
            workout_name='To Be Deleted',
            user=self.user
        )
        
        WorkoutSet.objects.create(
            workout=workout,
            exercise_name='Test Exercise',
            sets=3,
            reps='10',
            weight=50
        )
        
        MuscleLog.objects.create(
            workout=workout,
            muscle=self.chest,
            activation_level=5
        )
        
        # Delete workout
        response = self.client.delete(f'/api/workouts/workouts/{workout.workout_id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify cascade deletion
        self.assertEqual(WorkoutSet.objects.filter(workout=workout).count(), 0)
        self.assertEqual(MuscleLog.objects.filter(workout=workout).count(), 0)
    
    def tearDown(self):
        """Clean up after tests"""
        # Django's TransactionTestCase handles database cleanup
        pass


if __name__ == '__main__':
    from django.test.runner import DiscoverRunner
    test_runner = DiscoverRunner(verbosity=2)
    test_runner.run_tests(['tests.backend.integration.test_workout_flow'])
