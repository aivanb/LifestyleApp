"""
Test suite for Food Logging System

Tests cover:
- Food creation and CRUD operations
- Meal creation with multiple foods
- Food logging functionality
- Access control for food/meal visibility
- Macro calculations
- Search and filtering
"""

import os
import django
from django.conf import settings

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from apps.foods.models import Food, Meal, MealFood
from apps.logging.models import FoodLog
from decimal import Decimal
from datetime import datetime

User = get_user_model()


class FoodModelTest(TestCase):
    """Test cases for Food model"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
    
    def test_food_creation(self):
        """Test food creation with all fields"""
        food = Food.objects.create(
            food_name='Test Food',
            serving_size=100,
            unit='g',
            calories=250,
            protein=20,
            fat=10,
            carbohydrates=30,
            fiber=5,
            sodium=100,
            sugar=5,
            saturated_fat=3,
            trans_fat=0,
            calcium=50,
            iron=2,
            magnesium=30,
            cholesterol=0,
            vitamin_a=100,
            vitamin_c=10,
            vitamin_d=5,
            caffeine=0,
            food_group='protein',
            make_public=False
        )
        
        self.assertEqual(food.food_name, 'Test Food')
        self.assertEqual(food.calories, Decimal('250'))
        self.assertFalse(food.make_public)
    
    def test_food_public_flag(self):
        """Test make_public flag functionality"""
        food = Food.objects.create(
            food_name='Public Food',
            serving_size=100,
            unit='g',
            calories=100,
            protein=5,
            fat=2,
            carbohydrates=15,
            fiber=2,
            sodium=50,
            sugar=1,
            saturated_fat=0,
            trans_fat=0,
            calcium=20,
            iron=1,
            magnesium=10,
            cholesterol=0,
            vitamin_a=50,
            vitamin_c=5,
            vitamin_d=2,
            caffeine=0,
            food_group='fruit',
            make_public=True
        )
        
        self.assertTrue(food.make_public)


class MealModelTest(TestCase):
    """Test cases for Meal model"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        self.food1 = Food.objects.create(
            food_name='Food 1',
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
        
        self.food2 = Food.objects.create(
            food_name='Food 2',
            serving_size=50,
            unit='g',
            calories=50,
            protein=2,
            fat=1,
            carbohydrates=8,
            fiber=1,
            sodium=25,
            sugar=2,
            saturated_fat=0,
            trans_fat=0,
            calcium=10,
            iron=0.5,
            magnesium=5,
            cholesterol=0,
            vitamin_a=25,
            vitamin_c=2,
            vitamin_d=1,
            caffeine=0,
            food_group='vegetable',
            make_public=False
        )
    
    def test_meal_creation(self):
        """Test meal creation with multiple foods"""
        meal = Meal.objects.create(
            user=self.user,
            meal_name='Test Meal'
        )
        
        # Add foods to meal
        MealFood.objects.create(meal=meal, food=self.food1, servings=Decimal('2'))
        MealFood.objects.create(meal=meal, food=self.food2, servings=Decimal('1'))
        
        self.assertEqual(meal.mealfood_set.count(), 2)
        self.assertEqual(meal.meal_name, 'Test Meal')


class FoodAPITest(TestCase):
    """Test cases for Food API endpoints"""
    
    def setUp(self):
        self.client = Client()
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_create_food(self):
        """Test creating a new food entry"""
        url = '/api/foods/'
        data = {
            'food_name': 'New Food',
            'serving_size': 100,
            'unit': 'g',
            'calories': 200,
            'protein': 15,
            'fat': 8,
            'carbohydrates': 20,
            'fiber': 3,
            'sodium': 80,
            'sugar': 2,
            'saturated_fat': 2,
            'trans_fat': 0,
            'calcium': 40,
            'iron': 1.5,
            'magnesium': 20,
            'cholesterol': 0,
            'vitamin_a': 80,
            'vitamin_c': 8,
            'vitamin_d': 4,
            'caffeine': 0,
            'food_group': 'protein',
            'make_public': False
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('data', response.json())
        self.assertEqual(response.json()['data']['food_name'], 'New Food')
    
    def test_create_food_and_log(self):
        """Test creating food and logging it simultaneously"""
        url = '/api/foods/'
        data = {
            'food_name': 'New Food',
            'serving_size': 100,
            'unit': 'g',
            'calories': 200,
            'protein': 15,
            'fat': 8,
            'carbohydrates': 20,
            'fiber': 3,
            'sodium': 80,
            'sugar': 2,
            'saturated_fat': 2,
            'trans_fat': 0,
            'calcium': 40,
            'iron': 1.5,
            'magnesium': 20,
            'cholesterol': 0,
            'vitamin_a': 80,
            'vitamin_c': 8,
            'vitamin_d': 4,
            'caffeine': 0,
            'food_group': 'protein',
            'make_public': False,
            'create_and_log': True,
            'servings': 1.5
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check that food log was created
        food_id = response.json()['data']['food_id']
        log_exists = FoodLog.objects.filter(user=self.user, food_id=food_id).exists()
        self.assertTrue(log_exists)
    
    def test_list_foods_with_search(self):
        """Test listing foods with search filter"""
        # Create test foods
        Food.objects.create(
            food_name='Chicken Breast',
            serving_size=100,
            unit='g',
            calories=165,
            protein=31,
            fat=3.6,
            carbohydrates=0,
            fiber=0,
            sodium=74,
            sugar=0,
            saturated_fat=1,
            trans_fat=0,
            calcium=15,
            iron=0.9,
            magnesium=29,
            cholesterol=85,
            vitamin_a=18,
            vitamin_c=0,
            vitamin_d=0.1,
            caffeine=0,
            food_group='protein',
            make_public=True
        )
        
        url = '/api/foods/?search=Chicken'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.json()['data']['foods']), 0)


class MealAPITest(TestCase):
    """Test cases for Meal API endpoints"""
    
    def setUp(self):
        self.client = Client()
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        # Create test foods
        self.food1 = Food.objects.create(
            food_name='Food 1',
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
    
    def test_create_meal(self):
        """Test creating a meal with foods"""
        url = '/api/foods/meals/'
        data = {
            'meal_name': 'Test Meal',
            'foods': [
                {'food_id': self.food1.food_id, 'servings': '2'}
            ],
            'create_and_log': False
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['data']['meal_name'], 'Test Meal')
    
    def test_meal_macro_preview(self):
        """Test meal returns total macro preview"""
        # Create meal via API
        url = '/api/foods/meals/'
        data = {
            'meal_name': 'Test Meal',
            'foods': [
                {'food_id': self.food1.food_id, 'servings': '2'}
            ]
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertIn('macro_preview', response.json()['data'])
        macros = response.json()['data']['macro_preview']
        
        # Should be 2x the food's macros
        self.assertEqual(macros['calories'], 200)


class FoodLogAPITest(TestCase):
    """Test cases for Food Log API endpoints"""
    
    def setUp(self):
        self.client = Client()
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
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
    
    def test_create_food_log(self):
        """Test creating a food log entry"""
        url = '/api/foods/logs/'
        data = {
            'food': self.food.food_id,
            'servings': 2,
            'measurement': 'g',
            'date_time': datetime.now().isoformat()
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('consumed_macros', response.json()['data'])
    
    def test_list_food_logs(self):
        """Test listing food logs"""
        # Create a log entry
        FoodLog.objects.create(
            user=self.user,
            food=self.food,
            servings=1,
            measurement='g',
            date_time=datetime.now()
        )
        
        url = '/api/foods/logs/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.json()['data']['logs']), 0)
    
    def test_delete_food_log(self):
        """Test deleting a food log entry"""
        # Create a log entry
        log = FoodLog.objects.create(
            user=self.user,
            food=self.food,
            servings=1,
            measurement='g',
            date_time=datetime.now()
        )
        
        url = f'/api/foods/logs/{log.macro_log_id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(FoodLog.objects.filter(macro_log_id=log.macro_log_id).exists())
    
    def test_consumed_macros_calculation(self):
        """Test that consumed macros are calculated correctly"""
        url = '/api/foods/logs/'
        data = {
            'food': self.food.food_id,
            'servings': 2,
            'measurement': 'g',
            'date_time': datetime.now().isoformat()
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        macros = response.json()['data']['consumed_macros']
        
        # Should be 2x the food's macros
        self.assertEqual(macros['calories'], 300)  # 150 * 2
        self.assertEqual(macros['protein'], 24)    # 12 * 2


class AccessControlTest(TestCase):
    """Test access control for food/meal visibility"""
    
    def setUp(self):
        self.client = Client()
        self.access_level = AccessLevel.objects.create(role_name='user')
        
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        # Create food owned by user1
        self.private_food = Food.objects.create(
            food_name='Private Food',
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
        
        self.public_food = Food.objects.create(
            food_name='Public Food',
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
            make_public=True
        )
    
    def test_user_can_see_public_foods(self):
        """Test users can see public foods"""
        refresh = RefreshToken.for_user(self.user2)
        token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = '/api/foods/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        foods = response.json()['data']['foods']
        
        # Should see public food
        food_names = [f['food_name'] for f in foods]
        self.assertIn('Public Food', food_names)


if __name__ == '__main__':
    unittest.main()

