"""
Comprehensive Workout Tests - Complete rewrite from scratch
These tests simulate real user interactions and actually test the database
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, datetime, timedelta
from .models import Workout, Muscle, WorkoutLog, MuscleLog, WorkoutMuscle, Split, SplitDay, SplitDayTarget

User = get_user_model()


class RealUserWorkflowTestCase(APITestCase):
    """Test complete user workflows that actually modify the database"""
    
    def setUp(self):
        """Set up test data for real user workflow"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create refresh token for authentication
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Create test muscles
        self.chest = Muscle.objects.create(
            muscle_name='Chest',
            muscle_group='chest'
        )
        self.back = Muscle.objects.create(
            muscle_name='Back',
            muscle_group='back'
        )
        self.quads = Muscle.objects.create(
            muscle_name='Quadriceps',
            muscle_group='legs'
        )
        self.triceps = Muscle.objects.create(
            muscle_name='Triceps',
            muscle_group='arms'
        )
        
        # Create muscle logs with priorities
        self.chest_log = MuscleLog.objects.create(
            user=self.user,
            muscle_name=self.chest,
            priority=90
        )
        self.back_log = MuscleLog.objects.create(
            user=self.user,
            muscle_name=self.back,
            priority=85
        )
        self.quads_log = MuscleLog.objects.create(
            user=self.user,
            muscle_name=self.quads,
            priority=80
        )
        self.triceps_log = MuscleLog.objects.create(
            user=self.user,
            muscle_name=self.triceps,
            priority=75
        )

    def test_complete_user_workflow_real_database(self):
        """
        Test complete user workflow that actually modifies the database:
        1. Create workouts with emoji icons
        2. Create a split with multiple days
        3. Add muscle activations to split days
        4. Activate the split with start date
        5. Log workouts to the split
        6. Update muscle priorities
        7. Verify everything works end-to-end
        """
        
        print("\n=== Testing Complete User Workflow ===")
        
        # Step 1: Create workouts with emoji icons
        print("Step 1: Creating workouts with emoji icons...")
        
        workout_data_1 = {
            'workout_name': '🔥 Bench Press',
            'type': 'barbell',
            'notes': 'Heavy bench press workout',
            'muscles': [
                {'muscle': self.chest.muscles_id, 'activation_rating': 100},
                {'muscle': self.triceps.muscles_id, 'activation_rating': 75}
            ]
        }
        
        response = self.client.post('/api/workouts/', workout_data_1, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workout_1_id = response.data['data']['workouts_id']
        print(f"✓ Workout 1 created with ID: {workout_1_id}")
        
        # Verify workout was actually created in database
        workout_1 = Workout.objects.get(workouts_id=workout_1_id)
        self.assertEqual(workout_1.workout_name, '🔥 Bench Press')
        self.assertEqual(workout_1.user, self.user)
        
        # Verify workout muscles were created
        workout_muscles = WorkoutMuscle.objects.filter(workout=workout_1)
        self.assertEqual(workout_muscles.count(), 2)
        
        chest_muscle = workout_muscles.get(muscle=self.chest)
        self.assertEqual(chest_muscle.activation_rating, 100)
        
        triceps_muscle = workout_muscles.get(muscle=self.triceps)
        self.assertEqual(triceps_muscle.activation_rating, 75)
        
        workout_data_2 = {
            'workout_name': '⚡ Squats',
            'type': 'barbell',
            'notes': 'Heavy squat workout',
            'muscles': [
                {'muscle': self.quads.muscles_id, 'activation_rating': 100},
                {'muscle': self.back.muscles_id, 'activation_rating': 30}
            ]
        }
        
        response = self.client.post('/api/workouts/', workout_data_2, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workout_2_id = response.data['data']['workouts_id']
        print(f"✓ Workout 2 created with ID: {workout_2_id}")
        
        # Step 2: Create a split with multiple days
        print("Step 2: Creating split with multiple days...")
        today = date.today()
        split_data = {
            'split_name': 'Push/Pull/Legs',
            'start_date': today.isoformat(),
            'split_days': [
                {
                    'day_name': 'Push Day',
                    'day_order': 1,
                    'targets': [
                        {'muscle': self.chest.muscles_id, 'target_activation': 225},
                        {'muscle': self.triceps.muscles_id, 'target_activation': 150}
                    ]
                },
                {
                    'day_name': 'Pull Day', 
                    'day_order': 2,
                    'targets': [
                        {'muscle': self.back.muscles_id, 'target_activation': 300},
                        {'muscle': self.chest.muscles_id, 'target_activation': 100}
                    ]
                },
                {
                    'day_name': 'Leg Day',
                    'day_order': 3,
                    'targets': [
                        {'muscle': self.quads.muscles_id, 'target_activation': 400}
                    ]
                }
            ]
        }
        
        response = self.client.post('/api/workouts/splits/', split_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        split_id = response.data['data']['splits_id']
        print(f"✓ Split created with ID: {split_id}")
        
        # Verify split was actually created in database
        split = Split.objects.get(splits_id=split_id)
        self.assertEqual(split.split_name, 'Push/Pull/Legs')
        self.assertEqual(split.user, self.user)
        
        # Verify split days were created
        split_days = SplitDay.objects.filter(split=split)
        self.assertEqual(split_days.count(), 3)
        print(f"✓ {split_days.count()} split days created")
        
        # Verify split day targets were created
        total_targets = SplitDayTarget.objects.filter(split_day__split=split).count()
        self.assertEqual(total_targets, 5)  # 2 + 2 + 1 targets
        print(f"✓ {total_targets} split day targets created")
        
        # Step 3: Activate the split with start date
        print("Step 3: Activating split with start date...")
        activate_data = {'start_date': today.isoformat()}
        
        response = self.client.post(f'/api/workouts/splits/{split_id}/activate/', activate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print(f"✓ Split activated with start date: {today}")
        
        # Verify split is active in database
        split.refresh_from_db()
        # split.is_active doesn't exist in database, so just check start_date
        self.assertEqual(split.start_date, today)
        
        # Step 4: Log workouts to the split
        print("Step 4: Logging workouts...")
        
        # Log workout for today (should be Push Day based on start date)
        workout_log_data = {
            'workout': workout_1_id,
            'weight': 135.5,
            'reps': 10,
            'rir': 2,
            'date_time': datetime.now().isoformat(),
            'attributes': ['pause']
        }
        
        response = self.client.post('/api/workouts/logs/', workout_log_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        log_id = response.data['data']['workout_log_id']
        print(f"✓ Workout logged with ID: {log_id}")
        
        # Verify workout log was actually created in database
        workout_log = WorkoutLog.objects.get(workout_log_id=log_id)
        self.assertEqual(workout_log.user, self.user)
        self.assertEqual(workout_log.workout, workout_1)
        self.assertEqual(float(workout_log.weight), 135.5)
        self.assertEqual(workout_log.reps, 10)
        self.assertEqual(workout_log.rir, 2)
        self.assertEqual(workout_log.attributes, ['pause'])
        
        # Step 5: Verify current split day
        print("Step 5: Verifying current split day...")
        response = self.client.get(f'/api/workouts/current-split-day/?date={today.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        current_split_day = response.data['data']['current_split_day']
        self.assertIsNotNone(current_split_day)
        self.assertEqual(current_split_day['day_name'], 'Push Day')
        print(f"✓ Current split day: {current_split_day['day_name']}")
        
        # Step 6: Verify muscle priorities can be updated
        print("Step 6: Testing muscle priority updates...")
        priority_data = {
            'muscle_logs': [
                {'muscle_name': self.chest.muscles_id, 'priority': 95},
                {'muscle_name': self.back.muscles_id, 'priority': 75}
            ]
        }
        
        response = self.client.post('/api/workouts/muscle-priorities/', priority_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify priorities were actually updated in database
        updated_chest_log = MuscleLog.objects.get(muscle_log_id=self.chest_log.muscle_log_id)
        self.assertEqual(updated_chest_log.priority, 95)
        
        updated_back_log = MuscleLog.objects.get(muscle_log_id=self.back_log.muscle_log_id)
        self.assertEqual(updated_back_log.priority, 75)
        print(f"✓ Muscle priorities updated: Chest={updated_chest_log.priority}, Back={updated_back_log.priority}")
        
        # Step 7: Verify workout stats
        print("Step 7: Checking workout stats...")
        response = self.client.get('/api/workouts/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stats = response.data['data']
        self.assertGreater(stats['total_workouts'], 0)
        self.assertGreater(stats['total_muscles'], 0)
        print(f"✓ Workout stats: {stats['total_workouts']} workouts, {stats['total_muscles']} muscles")
        
        # Step 8: Verify recently logged workouts
        print("Step 8: Checking recently logged workouts...")
        response = self.client.get('/api/workouts/recently-logged/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recent_workouts = response.data['data']
        self.assertGreater(len(recent_workouts), 0)
        print(f"✓ {len(recent_workouts)} recently logged workouts")
        
        print("\n🎉 Complete user workflow test PASSED! All database operations successful.")

    def test_muscle_priority_workflow_real_database(self):
        """Test muscle priority workflow with real database operations"""
        print("\n=== Testing Muscle Priority Workflow ===")
        
        # Get current priorities
        response = self.client.get('/api/workouts/muscle-priorities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        initial_priorities = response.data['data']
        self.assertGreater(len(initial_priorities), 0)
        print(f"✓ Retrieved {len(initial_priorities)} muscle priorities")
        
        # Update priorities
        update_data = {
            'muscle_logs': [
                {'muscle_name': self.chest.muscles_id, 'priority': 95},
                {'muscle_name': self.back.muscles_id, 'priority': 75},
                {'muscle_name': self.quads.muscles_id, 'priority': 85},
                {'muscle_name': self.triceps.muscles_id, 'priority': 70}
            ]
        }
        
        response = self.client.post('/api/workouts/muscle-priorities/', update_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify updates in database
        updated_priorities = response.data['data']
        chest_priority = next(p for p in updated_priorities if p['muscle_name'] == 'Chest')
        self.assertEqual(chest_priority['priority'], 95)
        
        # Verify database was actually updated
        chest_log = MuscleLog.objects.get(muscle_log_id=self.chest_log.muscle_log_id)
        self.assertEqual(chest_log.priority, 95)
        
        back_log = MuscleLog.objects.get(muscle_log_id=self.back_log.muscle_log_id)
        self.assertEqual(back_log.priority, 75)
        
        print("✓ Muscle priorities workflow working correctly with database updates")

    def test_split_analysis_real_calculations(self):
        """Test split analysis with real calculations"""
        print("\n=== Testing Split Analysis Calculations ===")
        
        # Create a split
        today = date.today()
        split_data = {
            'split_name': 'Test Split',
            'start_date': today.isoformat(),
            'split_days': [
                {
                    'day_name': 'Day 1',
                    'day_order': 1,
                    'targets': [
                        {'muscle': self.chest.muscles_id, 'target_activation': 225},
                        {'muscle': self.triceps.muscles_id, 'target_activation': 150}
                    ]
                }
            ]
        }
        
        response = self.client.post('/api/workouts/splits/', split_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        split_id = response.data['data']['splits_id']
        
        # Get split analysis
        response = self.client.get(f'/api/workouts/splits/{split_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        split_data = response.data['data']
        self.assertIn('analysis', split_data)
        
        # Verify analysis contains expected muscle data
        analysis = split_data['analysis']
        self.assertIsInstance(analysis, list)
        self.assertGreater(len(analysis), 0)
        
        # Find the chest muscle analysis
        chest_analysis = next((item for item in analysis if item['muscle_name'] == 'Chest'), None)
        self.assertIsNotNone(chest_analysis)
        self.assertIn('total_activation', chest_analysis)
        self.assertIn('optimal_range_low', chest_analysis)
        self.assertIn('optimal_range_high', chest_analysis)
        self.assertIn('status', chest_analysis)
        
        # Verify calculations are correct
        self.assertEqual(chest_analysis['total_activation'], 225)
        self.assertEqual(chest_analysis['muscle_priority'], 90)
        
        print("✓ Split analysis calculations working correctly")

    def test_workout_creation_with_emoji_icons_real_database(self):
        """Test creating workouts with various emoji icons in real database"""
        print("\n=== Testing Workout Creation with Emoji Icons ===")
        
        icons = ['⚡', '🔥', '💎', '🌟', '⭐']
        
        for i, icon in enumerate(icons):
            workout_data = {
                'workout_name': f'{icon} Test Workout {i+1}',
                'type': 'barbell',
                'notes': f'Test workout with {icon} icon',
                'muscles': [
                    {'muscle': self.chest.muscles_id, 'activation_rating': 100}
                ]
            }
            
            response = self.client.post('/api/workouts/', workout_data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, 
                           f"Failed to create workout with icon: {icon}")
            
            # Verify workout was actually created in database
            workout = Workout.objects.get(workout_name=f'{icon} Test Workout {i+1}')
            self.assertIsNotNone(workout)
            self.assertEqual(workout.user, self.user)
            
            # Verify workout muscle was created
            workout_muscle = WorkoutMuscle.objects.get(workout=workout)
            self.assertEqual(workout_muscle.activation_rating, 100)
        
        print(f"✓ Successfully created {len(icons)} workouts with emoji icons in database")

    def test_workout_logging_real_database(self):
        """Test workout logging with real database operations"""
        print("\n=== Testing Workout Logging ===")
        
        # Create a workout first
        workout_data = {
            'workout_name': '🔥 Test Workout',
            'type': 'barbell',
            'muscles': [
                {'muscle': self.chest.muscles_id, 'activation_rating': 100}
            ]
        }
        
        response = self.client.post('/api/workouts/', workout_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        workout_id = response.data['data']['workouts_id']
        
        # Log the workout
        log_data = {
            'workout': workout_id,
            'weight': 135.5,
            'reps': 10,
            'rir': 2,
            'date_time': datetime.now().isoformat(),
            'attributes': ['pause']
        }
        
        response = self.client.post('/api/workouts/logs/', log_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify log was actually created in database
        log = WorkoutLog.objects.filter(user=self.user).first()
        self.assertIsNotNone(log)
        self.assertEqual(float(log.weight), 135.5)
        self.assertEqual(log.reps, 10)
        self.assertEqual(log.rir, 2)
        self.assertEqual(log.attributes, ['pause'])
        
        print("✓ Workout logging working correctly with database operations")
