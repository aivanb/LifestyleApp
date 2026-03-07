"""
Tests for goals_detail view endpoint
"""
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.users.models import AccessLevel, UserGoal
from decimal import Decimal

User = get_user_model()


class GoalsViewTest(APITestCase):
    """Test cases for goals_detail view"""

    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level,
        )

        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')

    def test_put_goals_creates_new_row_and_defaults_tokens_goal(self):
        url = '/api/users/goals/'

        # Existing goal row
        old_goal = UserGoal.objects.create(
            user=self.user,
            tokens_goal=None,
            weight_goal=Decimal('70.0'),
            calories_goal=2000,
        )

        self.assertEqual(UserGoal.objects.filter(user=self.user).count(), 1)

        payload = {
            "weight_goal": 75.5,
            "calories_goal": 2500,
        }
        resp = self.client.put(url, payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        goals_qs = UserGoal.objects.filter(user=self.user).order_by('-created_at')
        self.assertEqual(goals_qs.count(), 2)

        new_goal = goals_qs.first()
        old_goal.refresh_from_db()

        # Old row remains unchanged
        self.assertEqual(float(old_goal.weight_goal), 70.0)
        self.assertEqual(old_goal.calories_goal, 2000)

        # New row has updated values
        self.assertEqual(float(new_goal.weight_goal), 75.5)
        self.assertEqual(new_goal.calories_goal, 2500)

        # Token goal defaults to 1000 on new rows
        self.assertEqual(new_goal.tokens_goal, 1000)

