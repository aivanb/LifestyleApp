"""Tests for GET /api/analytics/home/dashboard/."""
from decimal import Decimal
from datetime import datetime
from django.utils import timezone

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import AccessLevel, UserGoal
from apps.logging.models import FoodLog, WeightLog, StepsLog, WaterLog
from apps.foods.models import Food, Meal

User = get_user_model()


class HomeDashboardTests(APITestCase):
    def setUp(self):
        self.access, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='hdash',
            email='hdash@example.com',
            password='x',
            access_level=self.access,
            height=Decimal('180.00'),
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
        self.food = Food.objects.create(
            food_name='Test Dash Food',
            serving_size=Decimal('100'),
            unit='g',
            calories=Decimal('100'),
            protein=Decimal('10'),
            fat=Decimal('5'),
            carbohydrates=Decimal('12'),
            fiber=Decimal('1'),
            sodium=Decimal('1'),
            sugar=Decimal('1'),
            saturated_fat=Decimal('1'),
            trans_fat=Decimal('0'),
            calcium=Decimal('0'),
            iron=Decimal('0'),
            magnesium=Decimal('0'),
            cholesterol=Decimal('0'),
            vitamin_a=Decimal('0'),
            vitamin_c=Decimal('0'),
            vitamin_d=Decimal('0'),
            caffeine=Decimal('0'),
            food_group='other',
        )
        self.meal = Meal.objects.create(meal_name='Dash Meal', user=self.user)
        today = timezone.localdate()
        FoodLog.objects.create(
            user=self.user,
            food=self.food,
            meal=self.meal,
            servings=Decimal('2'),
            measurement='g',
            date_time=timezone.make_aware(datetime.combine(today, datetime.min.time())),
        )
        WeightLog.objects.create(
            user=self.user,
            weight=Decimal('80'),
            weight_unit='kg',
            date_time=timezone.make_aware(datetime.combine(today, datetime.min.time())),
        )
        UserGoal.objects.create(
            user=self.user,
            tokens_goal=1000,
            calories_goal=2000,
            protein_goal=Decimal('150'),
            carbohydrates_goal=Decimal('200'),
            fat_goal=Decimal('60'),
        )

    def test_dashboard_macros_and_calorie_remaining(self):
        url = '/api/analytics/home/dashboard/'
        r = self.client.get(url)
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        body = r.json()
        self.assertTrue(body['success'])
        d = body['data']
        self.assertEqual(d['consumed']['calories'], 200.0)
        self.assertEqual(d['consumed']['protein'], 20.0)
        self.assertEqual(d['macro_remaining']['protein'], 130.0)
        self.assertIsNotNone(d['calorie_remaining'])
        self.assertGreater(d['calorie_remaining'], 1500)

    def test_steps_calories_uses_height_and_weight(self):
        today = timezone.localdate()
        StepsLog.objects.create(
            user=self.user,
            steps=10000,
            date_time=timezone.make_aware(datetime.combine(today, datetime.min.time())),
        )
        r = self.client.get('/api/analytics/home/dashboard/')
        self.assertEqual(r.status_code, status.HTTP_200_OK)
        d = r.json()['data']
        self.assertEqual(d['steps_today'], 10000)
        self.assertGreater(d['steps_calories_estimate'], 0)
        self.assertEqual(d['weight_kg_used_for_steps'], 80.0)

    def test_trackers_not_logged_includes_water(self):
        r = self.client.get('/api/analytics/home/dashboard/')
        ids = {t['id'] for t in r.json()['data']['trackers_not_logged']}
        self.assertIn('water', ids)

    def test_water_logged_not_in_missing_list(self):
        today = timezone.localdate()
        WaterLog.objects.create(
            user=self.user,
            amount=Decimal('1'),
            unit='L',
            date_time=timezone.make_aware(datetime.combine(today, datetime.min.time())),
        )
        r = self.client.get('/api/analytics/home/dashboard/')
        ids = {t['id'] for t in r.json()['data']['trackers_not_logged']}
        self.assertNotIn('water', ids)
