"""
Comprehensive tests for AI food generator functionality.

Tests all possible input scenarios for the food parsing service:
1. Food inside database with matching metadata
2. Food inside database with full non-matching metadata
3. Food inside database with partial non-matching metadata
4. Food inside database with no metadata
5. Food not in database with full metadata
6. Food not in database with partial metadata
7. Food not in database with no metadata
8. Meal inside database
9. Meal not in database
"""

import json
from decimal import Decimal
from django.test import TestCase
from apps.users.models import User
from unittest.mock import patch, MagicMock
from apps.foods.models import Food, Meal, MealFood
from apps.logging.models import FoodLog
from apps.users.models import UserGoal
from .food_parser import FoodParserService
from .services import OpenAIService


class FoodParserServiceTest(TestCase):
    """Test suite for FoodParserService with comprehensive input scenarios"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test foods in database
        self.chicken_breast = Food.objects.create(
            food_name='chicken breast',
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
            brand='',
            cost=None,
            make_public=True
        )
        
        self.white_rice = Food.objects.create(
            food_name='white rice',
            serving_size=100,
            unit='g',
            calories=130,
            protein=2.7,
            fat=0.3,
            carbohydrates=28,
            fiber=0.4,
            sodium=5,
            sugar=0,
            saturated_fat=0.1,
            trans_fat=0,
            calcium=28,
            iron=0.8,
            magnesium=25,
            cholesterol=0,
            vitamin_a=0,
            vitamin_c=0,
            vitamin_d=0,
            caffeine=0,
            food_group='grain',
            brand='',
            cost=None,
            make_public=True
        )
        
        # Create test meal in database
        self.test_meal = Meal.objects.create(
            user=self.user,
            meal_name='My Breakfast'
        )
        
        # Add foods to meal
        MealFood.objects.create(
            meal=self.test_meal,
            food=self.chicken_breast,
            servings=Decimal('1.5')
        )
        MealFood.objects.create(
            meal=self.test_meal,
            food=self.white_rice,
            servings=Decimal('1')
        )
        
        # Mock OpenAI responses
        self.mock_openai_responses = {
            'food_parsing_single': [{"name": "chicken breast", "metadata": {}}],
            'food_parsing_multiple': [
                {"name": "chicken breast", "metadata": {}},
                {"name": "white rice", "metadata": {"brand": "Trader Joes"}}
            ],
            'metadata_generation': {
                "serving_size": 100,
                "unit": "g",
                "calories": 200,
                "protein": 25,
                "fat": 5,
                "carbohydrates": 15,
                "fiber": 2,
                "sodium": 100,
                "sugar": 3,
                "saturated_fat": 2,
                "trans_fat": 0,
                "calcium": 50,
                "iron": 1.5,
                "magnesium": 30,
                "cholesterol": 60,
                "vitamin_a": 25,
                "vitamin_c": 5,
                "vitamin_d": 0.2,
                "caffeine": 0,
                "food_group": "protein",
                "brand": "",
                "cost": None
            }
        }
    
    def _mock_openai_service(self):
        """Create a mock OpenAI service"""
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps(self.mock_openai_responses['food_parsing_single'])
        }
        return mock_service
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_in_database_with_matching_metadata(self, mock_openai_class):
        """Test: Food inside database with matching metadata"""
        # Setup mock
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "chicken breast", "metadata": {}}])
        }
        mock_openai_class.return_value = mock_service
        
        # Test input with matching metadata
        input_text = "chicken breast"
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        self.assertEqual(len(result['logs_created']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'chicken breast')
        self.assertEqual(food_parsed['source'], 'food_exact')
        self.assertEqual(food_parsed['food']['food_id'], self.chicken_breast.food_id)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_in_database_with_full_non_matching_metadata(self, mock_openai_class):
        """Test: Food inside database with full non-matching metadata"""
        # Setup mock with non-matching metadata
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with non-matching metadata (different calories)
        input_text = "chicken breast with 200 calories"
        
        # Mock parsing response with different metadata
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "chicken breast", "metadata": {"calories": 200}}])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        self.assertEqual(len(result['logs_created']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'chicken breast')
        self.assertEqual(food_parsed['source'], 'food_duplicate')  # Should create duplicate
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_in_database_with_partial_non_matching_metadata(self, mock_openai_class):
        """Test: Food inside database with partial non-matching metadata"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with partial metadata (brand only)
        input_text = "chicken breast from Trader Joes"
        
        # Mock parsing response with brand metadata
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "chicken breast", "metadata": {"brand": "Trader Joes"}}])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'chicken breast')
        # With only brand metadata, should still match existing food
        self.assertEqual(food_parsed['source'], 'food_exact')
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_in_database_with_no_metadata(self, mock_openai_class):
        """Test: Food inside database with no metadata"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with no metadata
        input_text = "white rice"
        
        # Mock parsing response with empty metadata
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "white rice", "metadata": {}}])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'white rice')
        self.assertEqual(food_parsed['source'], 'food_exact')
        self.assertEqual(food_parsed['food']['food_id'], self.white_rice.food_id)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_not_in_database_with_full_metadata(self, mock_openai_class):
        """Test: Food not in database with full metadata"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with new food and full metadata
        input_text = "salmon fillet"
        
        # Mock parsing response
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "salmon fillet", "metadata": {"calories": 208, "protein": 25, "fat": 12}}])
        }
        
        # Mock metadata generation
        mock_service.send_prompt.side_effect = [
            # First call for parsing
            {'success': True, 'response': json.dumps([{"name": "salmon fillet", "metadata": {"calories": 208, "protein": 25, "fat": 12}}])},
            # Second call for metadata generation
            {'success': True, 'response': json.dumps(self.mock_openai_responses['metadata_generation'])}
        ]
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        self.assertEqual(len(result['logs_created']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'salmon fillet')
        self.assertEqual(food_parsed['source'], 'food_new')
        
        # Verify new food was created
        new_food = Food.objects.filter(food_name='salmon fillet').first()
        self.assertIsNotNone(new_food)
        self.assertEqual(float(new_food.calories), 208)  # Should preserve provided metadata
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_not_in_database_with_partial_metadata(self, mock_openai_class):
        """Test: Food not in database with partial metadata"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with new food and partial metadata
        input_text = "avocado"
        
        # Mock parsing response with partial metadata
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "avocado", "metadata": {"fat": 21}}])
        }
        
        # Mock metadata generation
        mock_service.send_prompt.side_effect = [
            # First call for parsing
            {'success': True, 'response': json.dumps([{"name": "avocado", "metadata": {"fat": 21}}])},
            # Second call for metadata generation
            {'success': True, 'response': json.dumps(self.mock_openai_responses['metadata_generation'])}
        ]
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'avocado')
        self.assertEqual(food_parsed['source'], 'food_new')
        
        # Verify new food was created with preserved metadata
        new_food = Food.objects.filter(food_name='avocado').first()
        self.assertIsNotNone(new_food)
        self.assertEqual(float(new_food.fat), 21)  # Should preserve provided metadata
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_not_in_database_with_no_metadata(self, mock_openai_class):
        """Test: Food not in database with no metadata"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with new food and no metadata
        input_text = "banana"
        
        # Mock parsing response with no metadata
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "banana", "metadata": {}}])
        }
        
        # Mock metadata generation
        mock_service.send_prompt.side_effect = [
            # First call for parsing
            {'success': True, 'response': json.dumps([{"name": "banana", "metadata": {}}])},
            # Second call for metadata generation
            {'success': True, 'response': json.dumps(self.mock_openai_responses['metadata_generation'])}
        ]
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'banana')
        self.assertEqual(food_parsed['source'], 'food_new')
        
        # Verify new food was created
        new_food = Food.objects.filter(food_name='banana').first()
        self.assertIsNotNone(new_food)
        self.assertTrue(new_food.make_public)  # AI-generated foods should be public
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_meal_in_database(self, mock_openai_class):
        """Test: Meal inside database"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with existing meal
        input_text = "My Breakfast"
        
        # Mock parsing response
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "My Breakfast", "metadata": {}}])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'My Breakfast')
        self.assertEqual(food_parsed['source'], 'meal')
        self.assertEqual(food_parsed['meal']['meal_id'], self.test_meal.meal_id)
        
        # Should not create individual food logs for meals
        self.assertEqual(len(result['logs_created']), 0)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_meal_not_in_database(self, mock_openai_class):
        """Test: Meal not in database"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with non-existing meal
        input_text = "My Dinner"
        
        # Mock parsing response
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([{"name": "My Dinner", "metadata": {}}])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text)
        
        # Verify results - should treat as new food since meal doesn't exist
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 1)
        
        food_parsed = result['foods_parsed'][0]
        self.assertEqual(food_parsed['name'], 'My Dinner')
        self.assertEqual(food_parsed['source'], 'food_new')  # Should create as new food
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_create_meal_from_multiple_foods(self, mock_openai_class):
        """Test: Create meal from multiple parsed foods"""
        # Setup mock
        mock_service = self._mock_openai_service()
        mock_openai_class.return_value = mock_service
        
        # Test input with multiple foods
        input_text = "chicken breast and white rice"
        
        # Mock parsing response with multiple foods
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([
                {"name": "chicken breast", "metadata": {}},
                {"name": "white rice", "metadata": {}}
            ])
        }
        
        parser = FoodParserService(user=self.user)
        result = parser.parse_food_input(input_text, create_meal=True)
        
        # Verify results
        self.assertTrue(result['success'])
        self.assertEqual(len(result['foods_parsed']), 2)
        self.assertEqual(len(result['logs_created']), 2)
        self.assertIsNotNone(result['meal_created'])
        
        # Verify meal was created
        meal_created = result['meal_created']
        self.assertIsNotNone(meal_created['meal_id'])
        self.assertIn('chicken breast and white rice', meal_created['meal_name'])
    
    def test_metadata_generation_preserves_existing_values(self):
        """Test that metadata generation preserves existing values"""
        # Test data with existing metadata
        existing_metadata = {
            'calories': 200,
            'protein': 25,
            'brand': 'Trader Joes'
        }
        
        parser = FoodParserService(user=self.user)
        
        # Mock the OpenAI service to return generated metadata
        with patch.object(parser.openai_service, 'send_prompt') as mock_send_prompt:
            mock_send_prompt.return_value = {
                'success': True,
                'response': json.dumps({
                    'calories': 150,  # Different from existing
                    'protein': 30,    # Different from existing
                    'brand': 'Other Brand',  # Different from existing
                    'serving_size': 100,
                    'unit': 'g',
                    'fat': 5,
                    'carbohydrates': 15,
                    'fiber': 2,
                    'sodium': 100,
                    'sugar': 3,
                    'saturated_fat': 2,
                    'trans_fat': 0,
                    'calcium': 50,
                    'iron': 1.5,
                    'magnesium': 30,
                    'cholesterol': 60,
                    'vitamin_a': 25,
                    'vitamin_c': 5,
                    'vitamin_d': 0.2,
                    'caffeine': 0,
                    'food_group': 'protein',
                    'cost': None
                })
            }
            
            result = parser.generate_missing_metadata('test food', existing_metadata)
            
            # Verify existing values are preserved
            self.assertEqual(result['calories'], 200)  # Should preserve existing
            self.assertEqual(result['protein'], 25)    # Should preserve existing
            self.assertEqual(result['brand'], 'Trader Joes')  # Should preserve existing
            
            # Verify other fields are generated
            self.assertEqual(result['fat'], 5)
            self.assertEqual(result['carbohydrates'], 15)
    
    def test_error_handling_invalid_json_response(self):
        """Test error handling for invalid JSON responses"""
        parser = FoodParserService(user=self.user)
        
        # Mock OpenAI service to return invalid JSON
        with patch.object(parser.openai_service, 'send_prompt') as mock_send_prompt:
            mock_send_prompt.return_value = {
                'success': True,
                'response': 'Invalid JSON response'
            }
            
            result = parser.parse_food_input('test food')
            
            # Should handle error gracefully
            self.assertFalse(result['success'])
            self.assertTrue(len(result['errors']) > 0)
    
    def test_error_handling_openai_service_failure(self):
        """Test error handling when OpenAI service fails"""
        parser = FoodParserService(user=self.user)
        
        # Mock OpenAI service to return failure
        with patch.object(parser.openai_service, 'send_prompt') as mock_send_prompt:
            mock_send_prompt.return_value = {
                'success': False,
                'error': 'OpenAI API error'
            }
            
            result = parser.parse_food_input('test food')
            
            # Should handle error gracefully
            self.assertFalse(result['success'])
            self.assertTrue(len(result['errors']) > 0)


class OpenAIServiceTest(TestCase):
    """Test suite for OpenAIService"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_send_prompt_no_api_key(self):
        """Test prompt sending when no API key is configured"""
        # Mock settings to have no API key
        with patch('apps.openai_service.services.settings') as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            mock_settings.OPENAI_MODEL = 'gpt-3.5-turbo'
            
            service = OpenAIService()
            result = service.send_prompt('Test prompt', user=self.user)
            
            self.assertFalse(result['success'])
            self.assertIn('API key is not configured', result['error'])
            self.assertIn('response_time', result)
    
    def test_cost_calculation(self):
        """Test cost calculation method"""
        service = OpenAIService()
        
        # Test cost calculation
        cost = service._calculate_cost(1000)
        expected_cost = 0.0018  # 1000 * 0.00175 / 1000, rounded to 4 decimal places
        self.assertEqual(cost, expected_cost)
    
    def test_no_api_key_configured(self):
        """Test behavior when no API key is configured"""
        with patch('apps.openai_service.services.settings') as mock_settings:
            mock_settings.OPENAI_API_KEY = None
            
            service = OpenAIService()
            result = service.send_prompt('Test prompt', user=self.user)
            
            self.assertFalse(result['success'])
            self.assertIn('API key is not configured', result['error'])