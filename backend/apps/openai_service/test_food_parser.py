"""
Comprehensive tests for the OpenAI Food Parser Service

Tests cover:
- Natural language parsing of food descriptions
- Metadata generation and validation
- Invalid field filtering
- Food creation and duplicate handling
- Food log creation
- Meal creation from parsed foods
- Error handling for various edge cases
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import AccessLevel
from apps.foods.models import Food
from apps.logging.models import FoodLog
from apps.openai_service.food_parser import FoodParserService
from unittest.mock import patch, MagicMock
from decimal import Decimal
import json

User = get_user_model()


class FoodParserMetadataFilteringTest(TestCase):
    """Test that invalid fields are filtered out from AI responses"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        self.parser = FoodParserService(self.user)
    
    def test_filter_invalid_fields_from_metadata(self):
        """Test that invalid fields like 'quantity' and 'protein_per_item' are filtered out"""
        # Simulate metadata with invalid fields (like what AI might return)
        metadata_with_invalid_fields = {
            'calories': 70,
            'protein': 6,
            'quantity': 3,  # Invalid - not a Food model field
            'protein_per_item': 6,  # Invalid - not a Food model field
            'serving_size': 50,
            'unit': 'g',
            'carbohydrates': 0.5,
            'fat': 5,
            'fiber': 0,
            'sodium': 70,
            'sugar': 0.5,
            'saturated_fat': 1.5,
            'trans_fat': 0,
            'calcium': 25,
            'iron': 0.9,
            'magnesium': 6,
            'cholesterol': 185,
            'vitamin_a': 75,
            'vitamin_c': 0,
            'vitamin_d': 1.1,
            'caffeine': 0,
            'food_group': 'protein',
            'brand': 'Trader Joes'
        }
        
        # Filter the metadata
        filtered = self.parser._ensure_complete_metadata(metadata_with_invalid_fields)
        
        # Verify invalid fields were removed
        self.assertNotIn('quantity', filtered)
        self.assertNotIn('protein_per_item', filtered)
        
        # Verify valid fields were kept
        self.assertIn('calories', filtered)
        self.assertIn('protein', filtered)
        self.assertIn('serving_size', filtered)
        self.assertEqual(filtered['calories'], 70)
        self.assertEqual(filtered['protein'], 6)
    
    def test_ensure_all_required_fields_present(self):
        """Test that missing required fields are filled with defaults"""
        partial_metadata = {
            'calories': 100,
            'protein': 10,
            # Missing many fields
        }
        
        complete = self.parser._ensure_complete_metadata(partial_metadata)
        
        # Verify all required fields are present
        required_fields = [
            'serving_size', 'unit', 'calories', 'protein', 'fat', 
            'carbohydrates', 'fiber', 'sodium', 'sugar', 'saturated_fat',
            'trans_fat', 'calcium', 'iron', 'magnesium', 'cholesterol',
            'vitamin_a', 'vitamin_c', 'vitamin_d', 'caffeine', 'food_group', 'brand'
        ]
        
        for field in required_fields:
            self.assertIn(field, complete, f"Missing required field: {field}")
        
        # Verify provided values were kept
        self.assertEqual(complete['calories'], 100)
        self.assertEqual(complete['protein'], 10)
        
        # Verify defaults were added for missing fields
        self.assertIsNotNone(complete['carbohydrates'])
        self.assertIsNotNone(complete['fat'])


class FoodParserParsingTest(TestCase):
    """Test food parsing from natural language"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        self.parser = FoodParserService(self.user)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_parse_single_food_with_metadata(self, mock_openai):
        """Test parsing a single food item with metadata"""
        # Mock the OpenAI parsing response
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([
                {
                    'name': 'brown eggs',
                    'metadata': {
                        'quantity': 3,
                        'brand': 'Trader Joes',
                        'protein_per_item': 6
                    }
                }
            ])
        }
        mock_openai.return_value = mock_service
        
        # Create a new parser with mocked OpenAI
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        # Parse the input
        parsed = parser._parse_foods_from_text("3 brown eggs from Trader Joe's, each with 6 grams of protein")
        
        # Verify parsing worked
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]['name'], 'brown eggs')
        self.assertIn('metadata', parsed[0])
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_parse_multiple_foods(self, mock_openai):
        """Test parsing multiple foods from one input"""
        # Mock the OpenAI parsing response
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([
                {'name': 'chicken breast', 'metadata': {}},
                {'name': 'brown rice', 'metadata': {'servings': '1.5'}},
                {'name': 'broccoli', 'metadata': {}}
            ])
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        parsed = parser._parse_foods_from_text("chicken breast, 1.5 servings of brown rice, and broccoli")
        
        self.assertEqual(len(parsed), 3)
        self.assertEqual(parsed[0]['name'], 'chicken breast')
        self.assertEqual(parsed[1]['name'], 'brown rice')
        self.assertEqual(parsed[2]['name'], 'broccoli')


class FoodParserIntegrationTest(TestCase):
    """Integration tests for full food parsing workflow"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        self.parser = FoodParserService(self.user)
        
        # Create a test food in database
        self.existing_food = Food.objects.create(
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
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_parse_with_invalid_fields_creates_food_successfully(self, mock_openai):
        """
        Test that food parsing works even when AI returns invalid fields.
        This is the main bug fix test - validates that invalid fields are filtered out.
        """
        # Mock OpenAI to return metadata with invalid fields
        mock_service = MagicMock()
        
        # First call: parse foods from text
        mock_service.send_prompt.side_effect = [
            {
                'success': True,
                'response': json.dumps([
                    {
                        'name': 'brown eggs',
                        'metadata': {
                            'quantity': 3,
                            'brand': 'Trader Joes',
                            'protein_per_item': 6
                        }
                    }
                ])
            },
            # Second call: generate metadata
            {
                'success': True,
                'response': json.dumps({
                    'serving_size': 50,
                    'unit': 'g',
                    'calories': 70,
                    'protein': 6,
                    'fat': 5,
                    'carbohydrates': 0.5,
                    'fiber': 0,
                    'sodium': 70,
                    'sugar': 0.5,
                    'saturated_fat': 1.5,
                    'trans_fat': 0,
                    'calcium': 25,
                    'iron': 0.9,
                    'magnesium': 6,
                    'cholesterol': 185,
                    'vitamin_a': 75,
                    'vitamin_c': 0,
                    'vitamin_d': 1.1,
                    'caffeine': 0,
                    'food_group': 'protein',
                    'brand': 'Trader Joes',
                    'quantity': 3,  # Invalid field
                    'protein_per_item': 6  # Invalid field
                })
            }
        ]
        
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        # Parse the problematic input
        result = parser.parse_food_input("3 brown eggs from Trader Joe's, each with 6 grams of protein")
        
        # Verify success
        self.assertTrue(result['success'], f"Parsing failed with errors: {result.get('errors')}")
        self.assertEqual(len(result['errors']), 0, f"Unexpected errors: {result['errors']}")
        self.assertEqual(len(result['foods_parsed']), 1)
        self.assertEqual(len(result['logs_created']), 1)
        
        # Verify food was created (check serialized format)
        parsed_food = result['foods_parsed'][0]
        self.assertIn('food', parsed_food)
        food_info = parsed_food['food']
        self.assertIsNotNone(food_info)
        self.assertTrue(food_info['food_name'].lower().startswith('brown eggs'))
        
        # Verify log was created
        food_id = food_info['food_id']
        log = FoodLog.objects.filter(user=self.user, food_id=food_id).first()
        self.assertIsNotNone(log)
    
    def test_existing_food_lookup(self):
        """Test that existing foods are found correctly"""
        processed = self.parser._process_single_food({
            'name': 'Chicken Breast',
            'metadata': {}
        })
        
        self.assertEqual(processed['source'], 'food_exact')
        self.assertEqual(processed['food_object'], self.existing_food)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_food_log_creation(self, mock_openai):
        """Test that food logs are created correctly"""
        # Create food log for existing food
        log = self.parser._create_food_log(
            food=self.existing_food,
            servings=Decimal('2'),
            metadata={}
        )
        
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.food, self.existing_food)
        self.assertEqual(log.servings, Decimal('2'))


class FoodParserMetadataGenerationTest(TestCase):
    """Test metadata generation respects existing values"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        self.parser = FoodParserService(self.user)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_keep_existing_metadata_when_generating(self, mock_openai):
        """
        Test that when generating metadata, existing user-provided values are kept
        and NOT overridden by AI-generated values.
        """
        # User has already filled in some fields
        existing_metadata = {
            'calories': 200,  # User provided
            'protein': 25,    # User provided
            'brand': 'My Brand'  # User provided
        }
        
        # Mock AI response that tries to override these
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps({
                'serving_size': 100,
                'unit': 'g',
                'calories': 150,  # AI tries to override
                'protein': 20,    # AI tries to override
                'fat': 5,
                'carbohydrates': 10,
                'fiber': 2,
                'sodium': 50,
                'sugar': 1,
                'saturated_fat': 1,
                'trans_fat': 0,
                'calcium': 20,
                'iron': 1,
                'magnesium': 10,
                'cholesterol': 0,
                'vitamin_a': 50,
                'vitamin_c': 5,
                'vitamin_d': 2,
                'caffeine': 0,
                'food_group': 'protein',
                'brand': 'Generic'  # AI tries to override
            })
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        # Generate metadata
        complete = parser.generate_missing_metadata('Test Food', existing_metadata)
        
        # Verify existing values were KEPT (not overridden)
        self.assertEqual(complete['calories'], 200, "User's calories should be kept")
        self.assertEqual(complete['protein'], 25, "User's protein should be kept")
        self.assertEqual(complete['brand'], 'My Brand', "User's brand should be kept")
        
        # Verify missing values were FILLED IN from AI
        self.assertEqual(complete['fat'], 5, "Missing fat should be filled in")
        self.assertEqual(complete['carbohydrates'], 10, "Missing carbohydrates should be filled in")
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_generate_only_missing_fields(self, mock_openai):
        """Test that only truly missing fields are generated"""
        # User provided most fields
        existing_metadata = {
            'serving_size': 150,
            'unit': 'g',
            'calories': 250,
            'protein': 30,
            'fat': 10,
            # carbohydrates is missing
            # fiber is missing
        }
        
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps({
                'serving_size': 100,
                'unit': 'oz',
                'calories': 200,
                'protein': 25,
                'fat': 8,
                'carbohydrates': 15,
                'fiber': 3,
                'sodium': 60,
                'sugar': 2,
                'saturated_fat': 2,
                'trans_fat': 0,
                'calcium': 25,
                'iron': 1.2,
                'magnesium': 15,
                'cholesterol': 50,
                'vitamin_a': 60,
                'vitamin_c': 6,
                'vitamin_d': 3,
                'caffeine': 0,
                'food_group': 'protein',
                'brand': ''
            })
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        complete = parser.generate_missing_metadata('Test Food', existing_metadata)
        
        # Verify user values were kept
        self.assertEqual(complete['serving_size'], 150)
        self.assertEqual(complete['unit'], 'g')
        self.assertEqual(complete['calories'], 250)
        self.assertEqual(complete['protein'], 30)
        self.assertEqual(complete['fat'], 10)
        
        # Verify missing values were generated
        self.assertIsNotNone(complete['carbohydrates'])
        self.assertIsNotNone(complete['fiber'])


class FoodParserErrorHandlingTest(TestCase):
    """Test error handling in food parser"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        self.parser = FoodParserService(self.user)
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_handle_empty_parsing_result(self, mock_openai):
        """Test handling when no foods can be parsed"""
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': json.dumps([])
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        result = parser.parse_food_input("not a food description")
        
        self.assertFalse(result['success'])
        self.assertIn('No foods could be parsed', result['errors'][0])
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_handle_openai_api_failure(self, mock_openai):
        """Test handling when OpenAI API fails"""
        mock_service = MagicMock()
        mock_service.send_prompt.return_value = {
            'success': False,
            'error': 'API error'
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(self.user)
        parser.openai_service = mock_service
        
        result = parser.parse_food_input("some food")
        
        # Should fail gracefully
        self.assertFalse(result['success'])


if __name__ == '__main__':
    import django
    import os
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    
    from django.test.utils import get_runner
    from django.conf import settings
    TestRunner = get_runner(settings)
    test_runner = TestRunner()
    failures = test_runner.run_tests(["apps.openai_service.test_food_parser"])

