"""
Tests for Food Logging System
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from apps.foods.models import Food
from apps.logging.models import FoodLog
from datetime import datetime
from decimal import Decimal

User = get_user_model()


class FoodLogSerializerTest(TestCase):
    """Test cases for Food Log Serializer - fixing the created_at field issue"""
    
    def setUp(self):
        self.client = Client()
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        # Get access token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        # Create test food
        self.food = Food.objects.create(
            food_name='Test Food',
            serving_size=100,
            unit='g',
            calories=150,
            protein=12,
            fat=6,
            carbohydrates=15,
            fiber=2,
            sodium=60,
            sugar=2,
            saturated_fat=1.5,
            trans_fat=0,
            calcium=30,
            iron=1.2,
            magnesium=15,
            cholesterol=0,
            vitamin_a=60,
            vitamin_c=6,
            vitamin_d=3,
            caffeine=0,
            food_group='protein',
            make_public=False
        )
    
    def test_create_food_log_via_api(self):
        """Test creating a food log entry via API - should not fail on created_at"""
        url = '/api/foods/logs/'
        data = {
            'food': self.food.food_id,
            'servings': 2,
            'measurement': 'g',
            'date_time': datetime.now().isoformat()
        }
        
        response = self.client.post(
            url, 
            data, 
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.access_token}',
            HTTP_HOST='localhost'
        )
        
        # Should succeed and return 201 Created
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Should include consumed_macros in response
        response_data = response.json()
        self.assertIn('data', response_data)
        self.assertIn('consumed_macros', response_data['data'])
        
        # Verify macros are calculated correctly (2 servings)
        macros = response_data['data']['consumed_macros']
        self.assertEqual(macros['calories'], 300.0)  # 150 * 2
        self.assertEqual(macros['protein'], 24.0)    # 12 * 2
    
    def test_list_food_logs_via_api(self):
        """Test listing food logs - should serialize without created_at field error"""
        # Create a log entry directly
        log = FoodLog.objects.create(
            user=self.user,
            food=self.food,
            servings=Decimal('1.5'),
            measurement='g',
            date_time=datetime.now()
        )
        
        url = '/api/foods/logs/'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.access_token}',
            HTTP_HOST='localhost'
        )
        
        # Should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return logs
        response_data = response.json()
        self.assertIn('data', response_data)
        self.assertIn('logs', response_data['data'])
        self.assertGreater(len(response_data['data']['logs']), 0)
        
        # First log should have consumed_macros
        first_log = response_data['data']['logs'][0]
        self.assertIn('consumed_macros', first_log)
        
        # Should NOT have created_at field (since it doesn't exist in model)
        # But should have date_time
        self.assertIn('date_time', first_log)
    
    def test_recent_food_logs_query(self):
        """Test querying recent food logs with recent_days parameter"""
        # Create a log entry
        FoodLog.objects.create(
            user=self.user,
            food=self.food,
            servings=1,
            measurement='g',
            date_time=datetime.now()
        )
        
        url = '/api/foods/logs/?recent_days=7'
        response = self.client.get(
            url,
            HTTP_AUTHORIZATION=f'Bearer {self.access_token}',
            HTTP_HOST='localhost'
        )
        
        # Should succeed
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should return logs
        response_data = response.json()
        self.assertIn('data', response_data)
        self.assertIn('logs', response_data['data'])


class FoodModelTest(TestCase):
    """Basic food model tests"""
    
    def test_food_creation(self):
        """Test basic food creation"""
        food = Food.objects.create(
            food_name='Test Food',
            serving_size=100,
            unit='g',
            calories=100,
            protein=10,
            fat=5,
            carbohydrates=10,
            fiber=2,
            sodium=50,
            sugar=1,
            saturated_fat=1,
            trans_fat=0,
            calcium=20,
            iron=1,
            magnesium=10,
            cholesterol=0,
            vitamin_a=50,
            vitamin_c=5,
            vitamin_d=2,
            caffeine=0,
            food_group='protein',
            make_public=False
        )
        
        self.assertEqual(food.food_name, 'Test Food')
        self.assertEqual(food.calories, Decimal('100'))
        self.assertIsNotNone(food.created_at)  # Food model HAS created_at
        self.assertIsNotNone(food.updated_at)  # Food model HAS updated_at


class FoodLogModelTest(TestCase):
    """Basic food log model tests"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        self.food = Food.objects.create(
            food_name='Test Food',
            serving_size=100,
            unit='g',
            calories=150,
            protein=12,
            fat=6,
            carbohydrates=15,
            fiber=2,
            sodium=60,
            sugar=2,
            saturated_fat=1.5,
            trans_fat=0,
            calcium=30,
            iron=1.2,
            magnesium=15,
            cholesterol=0,
            vitamin_a=60,
            vitamin_c=6,
            vitamin_d=3,
            caffeine=0,
            food_group='protein',
            make_public=False
        )
    
    def test_food_log_creation(self):
        """Test food log creation"""
        log = FoodLog.objects.create(
            user=self.user,
            food=self.food,
            servings=2,
            measurement='g',
            date_time=datetime.now()
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.food, self.food)
        self.assertEqual(log.servings, Decimal('2'))
        
        # Verify FoodLog does NOT have created_at
        self.assertFalse(hasattr(log, 'created_at'))
        
        # But it HAS date_time
        self.assertIsNotNone(log.date_time)

