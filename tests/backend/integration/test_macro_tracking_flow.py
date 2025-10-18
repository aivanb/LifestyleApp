"""
Integration Test: Macro Tracking Flow

This test simulates a complete macro tracking journey including:
- Setting macro goals
- Creating and logging foods
- Tracking daily intake
- Viewing macro summaries and progress
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
from datetime import date, datetime, timedelta

from apps.users.models import AccessLevel, UserGoal
from apps.foods.models import Food, FoodGroup
from apps.meals.models import Meal, MealFood
from apps.logging.models import FoodLog

User = get_user_model()


class MacroTrackingFlowIntegrationTest(TransactionTestCase):
    """
    Integration test for complete macro tracking flow.
    Tests the journey from goal setting to daily tracking and analysis.
    """
    
    def setUp(self):
        """Set up test data and authenticated user"""
        self.client = APIClient()
        
        # Create required reference data
        self.access_level = AccessLevel.objects.create(
            access_level_id=1,
            role_name='user'
        )
        
        # Create food groups
        self.protein_group = FoodGroup.objects.create(
            group_id=1,
            group_name='Protein'
        )
        
        self.carbs_group = FoodGroup.objects.create(
            group_id=2,
            group_name='Carbohydrates'
        )
        
        self.fats_group = FoodGroup.objects.create(
            group_id=3,
            group_name='Fats'
        )
        
        # Create test user
        self.user = User.objects.create_user(
            username='macrouser',
            email='macrouser@example.com',
            password='HealthyPass123!',
            access_level=self.access_level
        )
        
        # Authenticate client
        self.client.force_authenticate(user=self.user)
    
    def test_complete_macro_tracking_flow(self):
        """Test the complete macro tracking journey"""
        
        # Step 1: Set Macro Goals
        goals_data = {
            'calories_goal': 2500,
            'protein_goal': 180,
            'carbohydrates_goal': 300,
            'fat_goal': 80,
            'fiber_goal': 30,
            'sugar_goal': 50,
            'sodium_goal': 2300
        }
        
        response = self.client.put('/api/users/goals/', goals_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify goals were set
        goals = UserGoal.objects.get(user=self.user)
        self.assertEqual(goals.calories_goal, 2500)
        self.assertEqual(float(goals.protein_goal), 180)
        
        # Step 2: Create Custom Foods
        foods_to_create = [
            {
                'food_name': 'Grilled Chicken Breast',
                'food_group': self.protein_group.group_id,
                'serving_size': 100,
                'serving_unit': 'g',
                'calories': 165,
                'protein': 31.0,
                'carbohydrates': 0,
                'fat': 3.6,
                'fiber': 0,
                'sugar': 0,
                'sodium': 74,
                'make_public': False
            },
            {
                'food_name': 'Brown Rice (Cooked)',
                'food_group': self.carbs_group.group_id,
                'serving_size': 100,
                'serving_unit': 'g',
                'calories': 112,
                'protein': 2.6,
                'carbohydrates': 23.5,
                'fat': 0.9,
                'fiber': 1.8,
                'sugar': 0.4,
                'sodium': 5,
                'make_public': False
            },
            {
                'food_name': 'Avocado',
                'food_group': self.fats_group.group_id,
                'serving_size': 100,
                'serving_unit': 'g',
                'calories': 160,
                'protein': 2.0,
                'carbohydrates': 8.5,
                'fat': 14.7,
                'fiber': 6.7,
                'sugar': 0.7,
                'sodium': 7,
                'make_public': False
            }
        ]
        
        created_foods = []
        for food_data in foods_to_create:
            response = self.client.post('/api/foods/', food_data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            created_foods.append(response.data['data'])
        
        # Step 3: Create a Meal
        meal_data = {
            'meal_name': 'Balanced Lunch',
            'meal_description': 'High protein lunch with complex carbs'
        }
        
        response = self.client.post('/api/meals/', meal_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        meal_id = response.data['data']['meal_id']
        
        # Step 4: Add Foods to Meal
        meal_foods = [
            {
                'meal': meal_id,
                'food': created_foods[0]['food_id'],  # Chicken
                'quantity': 150  # 150g
            },
            {
                'meal': meal_id,
                'food': created_foods[1]['food_id'],  # Brown Rice
                'quantity': 200  # 200g
            },
            {
                'meal': meal_id,
                'food': created_foods[2]['food_id'],  # Avocado
                'quantity': 50   # 50g
            }
        ]
        
        for meal_food in meal_foods:
            response = self.client.post('/api/meals/foods/', meal_food)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 5: Log Foods Throughout the Day
        
        # Breakfast
        breakfast_logs = [
            {
                'food_id': created_foods[0]['food_id'],  # Chicken
                'quantity': 100,
                'meal_type': 'breakfast',
                'log_date': date.today().isoformat()
            }
        ]
        
        # Lunch (log the meal)
        lunch_log = {
            'meal_id': meal_id,
            'meal_type': 'lunch',
            'log_date': date.today().isoformat()
        }
        
        # Dinner
        dinner_logs = [
            {
                'food_id': created_foods[0]['food_id'],  # Chicken
                'quantity': 150,
                'meal_type': 'dinner',
                'log_date': date.today().isoformat()
            },
            {
                'food_id': created_foods[1]['food_id'],  # Rice
                'quantity': 150,
                'meal_type': 'dinner',
                'log_date': date.today().isoformat()
            }
        ]
        
        # Log all foods
        for food_log in breakfast_logs + dinner_logs:
            response = self.client.post('/api/logging/food/', food_log)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Log meal
        response = self.client.post('/api/logging/meal/', lunch_log)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Step 6: Get Daily Macro Summary
        response = self.client.get(f'/api/logging/daily-summary/?date={date.today()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        summary = response.data['data']
        self.assertIn('totals', summary)
        self.assertIn('goals', summary)
        self.assertIn('remaining', summary)
        self.assertIn('percentage', summary)
        
        # Verify totals are calculated correctly
        totals = summary['totals']
        self.assertGreater(totals['calories'], 0)
        self.assertGreater(totals['protein'], 0)
        self.assertGreater(totals['carbohydrates'], 0)
        self.assertGreater(totals['fat'], 0)
        
        # Step 7: Get Weekly Macro Trends
        response = self.client.get('/api/logging/weekly-trends/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        trends = response.data['data']
        self.assertIn('daily_averages', trends)
        self.assertIn('goal_adherence', trends)
        
        # Step 8: Search Foods
        response = self.client.get('/api/foods/search/?q=chicken')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        results = response.data['data']
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]['food_name'], 'Grilled Chicken Breast')
        
        # Step 9: Get Food Recommendations
        response = self.client.get('/api/foods/recommendations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        recommendations = response.data['data']
        self.assertIn('frequently_logged', recommendations)
        self.assertIn('meal_suggestions', recommendations)
    
    def test_macro_calculations_accuracy(self):
        """Test that macro calculations are accurate"""
        
        # Create a food with known macros
        food = Food.objects.create(
            food_name='Test Food',
            food_group=self.protein_group,
            serving_size=100,
            serving_unit='g',
            calories=200,
            protein=Decimal('25.5'),
            carbohydrates=Decimal('10.0'),
            fat=Decimal('8.0'),
            user=self.user
        )
        
        # Log 150g of the food
        food_log = FoodLog.objects.create(
            user=self.user,
            food=food,
            quantity=Decimal('150'),
            meal_type='lunch'
        )
        
        # Get daily summary
        response = self.client.get(f'/api/logging/daily-summary/?date={date.today()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        totals = response.data['data']['totals']
        
        # Verify calculations (150% of base values)
        self.assertEqual(totals['calories'], 300)  # 200 * 1.5
        self.assertEqual(float(totals['protein']), 38.25)  # 25.5 * 1.5
        self.assertEqual(float(totals['carbohydrates']), 15.0)  # 10 * 1.5
        self.assertEqual(float(totals['fat']), 12.0)  # 8 * 1.5
    
    def test_meal_macro_aggregation(self):
        """Test that meal macros are properly aggregated"""
        
        # Create foods
        food1 = Food.objects.create(
            food_name='Food 1',
            food_group=self.protein_group,
            serving_size=100,
            serving_unit='g',
            calories=100,
            protein=Decimal('20'),
            carbohydrates=Decimal('5'),
            fat=Decimal('2'),
            user=self.user
        )
        
        food2 = Food.objects.create(
            food_name='Food 2',
            food_group=self.carbs_group,
            serving_size=100,
            serving_unit='g',
            calories=150,
            protein=Decimal('5'),
            carbohydrates=Decimal('30'),
            fat=Decimal('3'),
            user=self.user
        )
        
        # Create meal
        meal = Meal.objects.create(
            meal_name='Test Meal',
            user=self.user
        )
        
        # Add foods to meal
        MealFood.objects.create(meal=meal, food=food1, quantity=100)
        MealFood.objects.create(meal=meal, food=food2, quantity=100)
        
        # Get meal details
        response = self.client.get(f'/api/meals/{meal.meal_id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        meal_data = response.data['data']
        self.assertIn('total_macros', meal_data)
        
        # Verify aggregation
        totals = meal_data['total_macros']
        self.assertEqual(totals['calories'], 250)  # 100 + 150
        self.assertEqual(float(totals['protein']), 25)  # 20 + 5
        self.assertEqual(float(totals['carbohydrates']), 35)  # 5 + 30
        self.assertEqual(float(totals['fat']), 5)  # 2 + 3
    
    def test_goal_progress_tracking(self):
        """Test that goal progress is tracked correctly"""
        
        # Set goals
        UserGoal.objects.create(
            user=self.user,
            calories_goal=2000,
            protein_goal=Decimal('150'),
            carbohydrates_goal=Decimal('200'),
            fat_goal=Decimal('67')
        )
        
        # Create and log a food
        food = Food.objects.create(
            food_name='Goal Test Food',
            food_group=self.protein_group,
            serving_size=100,
            serving_unit='g',
            calories=500,
            protein=Decimal('50'),
            carbohydrates=Decimal('40'),
            fat=Decimal('20'),
            user=self.user
        )
        
        FoodLog.objects.create(
            user=self.user,
            food=food,
            quantity=Decimal('100'),
            meal_type='lunch'
        )
        
        # Get progress
        response = self.client.get(f'/api/logging/daily-summary/?date={date.today()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data['data']
        
        # Verify percentages
        percentages = data['percentage']
        self.assertEqual(percentages['calories'], 25)  # 500/2000 * 100
        self.assertAlmostEqual(percentages['protein'], 33.33, places=1)  # 50/150 * 100
        self.assertEqual(percentages['carbohydrates'], 20)  # 40/200 * 100
        self.assertAlmostEqual(percentages['fat'], 29.85, places=1)  # 20/67 * 100
        
        # Verify remaining
        remaining = data['remaining']
        self.assertEqual(remaining['calories'], 1500)  # 2000 - 500
        self.assertEqual(float(remaining['protein']), 100)  # 150 - 50
        self.assertEqual(float(remaining['carbohydrates']), 160)  # 200 - 40
        self.assertEqual(float(remaining['fat']), 47)  # 67 - 20
    
    def tearDown(self):
        """Clean up after tests"""
        # Django's TransactionTestCase handles database cleanup
        pass


if __name__ == '__main__':
    from django.test.runner import DiscoverRunner
    test_runner = DiscoverRunner(verbosity=2)
    test_runner.run_tests(['tests.backend.integration.test_macro_tracking_flow'])
