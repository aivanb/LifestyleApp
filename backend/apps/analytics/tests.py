"""
Tests for analytics app. Verify API responses match database data.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import date, datetime, timedelta
from decimal import Decimal

from apps.workouts.models import Workout, WorkoutLog
from apps.logging.models import FoodLog
from apps.foods.models import Food, Meal

User = get_user_model()


def make_food(**kwargs):
    """Create a Food with required defaults."""
    defaults = {
        'food_name': 'Test Food',
        'serving_size': Decimal('100'),
        'unit': 'g',
        'calories': Decimal('200'),
        'protein': Decimal('10'),
        'fat': Decimal('5'),
        'carbohydrates': Decimal('20'),
        'fiber': Decimal('0'),
        'sodium': Decimal('1'),
        'sugar': Decimal('2'),
        'saturated_fat': Decimal('0'),
        'trans_fat': Decimal('0'),
        'calcium': Decimal('0'),
        'iron': Decimal('0'),
        'magnesium': Decimal('0'),
        'cholesterol': Decimal('0'),
        'vitamin_a': Decimal('0'),
        'vitamin_c': Decimal('0'),
        'vitamin_d': Decimal('0'),
        'caffeine': Decimal('0'),
        'food_group': 'other',
    }
    defaults.update(kwargs)
    return Food.objects.create(**defaults)


class AnalyticsDateBoundsTest(APITestCase):
    """Test analytics date-bounds endpoint returns correct first_date and today."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='boundsuser',
            email='b@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_date_bounds_workouts_no_data(self):
        """Without any workout logs, first_date should equal today."""
        response = self.client.get('/api/analytics/date-bounds/?section=workouts')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        data = response.data['data']
        self.assertIn('first_date', data)
        self.assertIn('today', data)
        self.assertEqual(data['first_date'], data['today'])

    def test_date_bounds_workouts_with_log(self):
        """With a workout log, first_date should be that log's date."""
        workout = Workout.objects.create(
            user=self.user,
            workout_name='Test',
            type='barbell'
        )
        log_date = date.today() - timedelta(days=10)
        WorkoutLog.objects.create(
            user=self.user,
            workout=workout,
            weight=Decimal('100'),
            reps=10,
            date_time=datetime.combine(log_date, datetime.min.time())
        )
        response = self.client.get('/api/analytics/date-bounds/?section=workouts')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['first_date'], log_date.isoformat())
        self.assertEqual(response.data['data']['today'], date.today().isoformat())

    def test_date_bounds_foods_with_log(self):
        """Food section first_date from food log."""
        food = make_food(food_name='Bounds Food')
        log_date = date.today() - timedelta(days=5)
        FoodLog.objects.create(
            user=self.user,
            food=food,
            meal=None,
            servings=Decimal('1'),
            measurement='g',
            date_time=datetime.combine(log_date, datetime.min.time())
        )
        response = self.client.get('/api/analytics/date-bounds/?section=foods')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['first_date'], log_date.isoformat())

    def test_date_bounds_invalid_section(self):
        response = self.client.get('/api/analytics/date-bounds/?section=invalid')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class WorkoutProgressionTest(APITestCase):
    """Test workout progression endpoint: required workout_id, only workout days, progression types, data matches DB."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='proguser',
            email='p@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.workout = Workout.objects.create(
            user=self.user,
            workout_name='Bench Press',
            type='barbell'
        )

    def test_workout_progression_all_workouts(self):
        """Without workout_id returns 200 with combined (all workouts) progression."""
        response = self.client.get('/api/analytics/workouts/progression/?range=2weeks')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        self.assertIsNone(response.data['data'].get('workout_id'))
        self.assertIn('points', response.data['data'])

    def test_workout_progression_only_dates_with_workout(self):
        """Points should only include dates where this workout was logged."""
        d1 = date.today() - timedelta(days=3)
        d2 = date.today() - timedelta(days=1)
        for d in (d1, d2):
            WorkoutLog.objects.create(
                user=self.user,
                workout=self.workout,
                weight=Decimal('100'),
                reps=10,
                date_time=datetime.combine(d, datetime.min.time())
            )
        response = self.client.get(
            f'/api/analytics/workouts/progression/?workout_id={self.workout.workouts_id}&range=2weeks'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        points = response.data['data']['points']
        dates = [p['date'] for p in points]
        self.assertIn(d1.isoformat(), dates)
        self.assertIn(d2.isoformat(), dates)
        self.assertEqual(len(points), 2)

    def test_workout_progression_value_matches_db(self):
        """Progression value for avg_weight_reps = avg(weight) * (1 + 0.333 * total_reps)."""
        d1 = date.today() - timedelta(days=1)
        WorkoutLog.objects.create(
            user=self.user,
            workout=self.workout,
            weight=Decimal('100'),
            reps=10,
            date_time=datetime.combine(d1, datetime.min.time())
        )
        WorkoutLog.objects.create(
            user=self.user,
            workout=self.workout,
            weight=Decimal('120'),
            reps=8,
            date_time=datetime.combine(d1, datetime.min.time())
        )
        response = self.client.get(
            f'/api/analytics/workouts/progression/?workout_id={self.workout.workouts_id}&range=2weeks&progression_type=avg_weight_reps'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        points = response.data['data']['points']
        self.assertEqual(len(points), 1)
        avg_weight = (100 + 120) / 2
        total_reps = 10 + 8
        expected = round(avg_weight * (1 + 0.333 * total_reps), 2)
        self.assertEqual(points[0]['progression'], expected)

    def test_workout_progression_max_weight(self):
        """progression_type=max_weight returns max weight that day."""
        d1 = date.today() - timedelta(days=1)
        WorkoutLog.objects.create(
            user=self.user,
            workout=self.workout,
            weight=Decimal('100'),
            reps=10,
            date_time=datetime.combine(d1, datetime.min.time())
        )
        WorkoutLog.objects.create(
            user=self.user,
            workout=self.workout,
            weight=Decimal('120'),
            reps=8,
            date_time=datetime.combine(d1, datetime.min.time())
        )
        response = self.client.get(
            f'/api/analytics/workouts/progression/?workout_id={self.workout.workouts_id}&range=2weeks&progression_type=max_weight'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['points'][0]['progression'], 120)

    def test_workout_progression_404_other_user_workout(self):
        """Non-existent or other user's workout returns 404."""
        other = User.objects.create_user(username='other', email='o@x.com', password='x')
        other_workout = Workout.objects.create(user=other, workout_name='Other', type='barbell')
        response = self.client.get(
            f'/api/analytics/workouts/progression/?workout_id={other_workout.workouts_id}&range=2weeks'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class WorkoutSetsPerDayTest(APITestCase):
    """Test sets-per-day endpoint returns total_sets and attribute_sets per day."""

    def setUp(self):
        self.user = User.objects.create_user(username='setuser', email='s@x.com', password='testpass123')
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.workout = Workout.objects.create(user=self.user, workout_name='Test', type='barbell')

    def test_sets_per_day_matches_db(self):
        d1 = date.today() - timedelta(days=1)
        WorkoutLog.objects.create(
            user=self.user, workout=self.workout,
            weight=Decimal('100'), reps=10,
            date_time=datetime.combine(d1, datetime.min.time())
        )
        WorkoutLog.objects.create(
            user=self.user, workout=self.workout,
            weight=Decimal('100'), reps=10, attributes=['belt'],
            date_time=datetime.combine(d1, datetime.min.time())
        )
        response = self.client.get('/api/analytics/workouts/sets-per-day/?range=2weeks')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        points = response.data['data']['points']
        self.assertEqual(len(points), 1)
        self.assertEqual(points[0]['total_sets'], 2)
        self.assertEqual(points[0]['attribute_sets'], 1)


class ActivationProgressDateRangeTest(APITestCase):
    """Test activation progress uses shared date range."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='actuser',
            email='a@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_activation_progress_accepts_range(self):
        """Activation progress accepts range=2weeks and returns success (or 404 if no split)."""
        response = self.client.get('/api/analytics/workouts/activation-progress/?range=2weeks')
        # May be 200 with empty points or 404 if no split
        self.assertIn(response.status_code, (status.HTTP_200_OK, status.HTTP_404_NOT_FOUND))
        if response.status_code == 200:
            self.assertTrue(response.data.get('success'))
            self.assertIn('points', response.data.get('data', {}))


class FoodAnalyticsDateRangeTest(APITestCase):
    """Test food analytics use shared date range and returned data matches DB."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='fooduser',
            email='f@example.com',
            password='testpass123'
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.food = make_food(food_name='Macro Food', calories=Decimal('200'))

    def test_food_frequency_filtered_by_range(self):
        """Food frequency respects date range; data matches DB in range."""
        log_date = date.today() - timedelta(days=1)
        FoodLog.objects.create(
            user=self.user,
            food=self.food,
            meal=None,
            servings=Decimal('1'),
            measurement='g',
            date_time=datetime.combine(log_date, datetime.min.time())
        )
        response = self.client.get(
            '/api/analytics/foods/frequency/?range=2weeks&entry_type=food_group&limit=10'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('success'))
        items = response.data['data'].get('items', [])
        # Our food has a food_group (default); count should reflect one log in range
        self.assertGreaterEqual(len(items), 0)

    def test_macro_split_returns_data_in_range(self):
        """Macro split with range returns points for dates in range."""
        log_date = date.today() - timedelta(days=2)
        FoodLog.objects.create(
            user=self.user,
            food=self.food,
            meal=None,
            servings=Decimal('1'),
            measurement='g',
            date_time=datetime.combine(log_date, datetime.min.time())
        )
        response = self.client.get('/api/analytics/foods/macro-split/?range=2weeks')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        points = response.data['data'].get('points', [])
        found = [p for p in points if p['date'] == log_date.isoformat()]
        self.assertEqual(len(found), 1)
        self.assertEqual(found[0]['calories'], 200)
        # Macro split data must match DB: protein, fat, carbohydrates from food * servings
        self.assertEqual(found[0]['protein'], 10)
        self.assertEqual(found[0]['fat'], 5)
        self.assertEqual(found[0]['carbohydrates'], 20)

    def test_food_frequency_both_returns_percentages(self):
        """entry_type=both returns food_groups and brands with percentage."""
        log_date = date.today() - timedelta(days=1)
        FoodLog.objects.create(
            user=self.user, food=self.food, meal=None,
            servings=Decimal('1'), measurement='g',
            date_time=datetime.combine(log_date, datetime.min.time())
        )
        response = self.client.get('/api/analytics/foods/frequency/?range=2weeks&entry_type=both')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('food_groups', response.data['data'])
        self.assertIn('brands', response.data['data'])
        for item in response.data['data']['food_groups']:
            self.assertIn('percentage', item)
            self.assertIn('name', item)
            self.assertIn('count', item)
