"""
Test suite for Food Chatbot System

Tests cover:
- Food parsing from natural language
- Metadata generation via OpenAI
- Database validation logic
- Meal/food matching
- Duplicate detection
- Automatic logging
- Meal creation from parsed foods
"""

import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import unittest
from unittest.mock import Mock, patch, MagicMock
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from apps.foods.models import Food, Meal
from apps.openai_service.food_parser import FoodParserService
from decimal import Decimal

User = get_user_model()


class FoodParserServiceTest(TestCase):
    """Test cases for FoodParserService"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        # Create test food in database
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
    def test_parse_foods_from_text(self, mock_openai):
        """Test parsing foods from natural language"""
        # Mock OpenAI response
        mock_service = Mock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': '[{"name": "Chicken Breast", "metadata": {"servings": "2"}}]'
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(user=self.user)
        parsed = parser._parse_foods_from_text("2 chicken breasts")
        
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]['name'], 'Chicken Breast')
        self.assertEqual(parsed[0]['metadata']['servings'], '2')
    
    def test_metadata_matches_existing_food(self):
        """Test metadata matching logic"""
        parser = FoodParserService(user=self.user)
        
        # No metadata - should match
        self.assertTrue(parser._metadata_matches(self.existing_food, {}))
        
        # Similar calories - should match
        self.assertTrue(parser._metadata_matches(self.existing_food, {'calories': 160}))
        
        # Very different calories - should not match
        self.assertFalse(parser._metadata_matches(self.existing_food, {'calories': 300}))
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_generate_metadata(self, mock_openai):
        """Test metadata generation for new foods"""
        mock_service = Mock()
        mock_service.send_prompt.return_value = {
            'success': True,
            'response': '{"serving_size": 100, "unit": "g", "calories": 200, "protein": 20, "fat": 10, "carbohydrates": 15, "fiber": 2, "sodium": 100, "sugar": 5, "saturated_fat": 3, "trans_fat": 0, "calcium": 50, "iron": 2, "magnesium": 30, "cholesterol": 0, "vitamin_a": 100, "vitamin_c": 10, "vitamin_d": 5, "caffeine": 0, "food_group": "protein", "brand": ""}'
        }
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(user=self.user)
        metadata = parser._generate_metadata("New Food", {})
        
        self.assertIn('calories', metadata)
        self.assertIn('protein', metadata)
        self.assertEqual(metadata['food_group'], 'protein')
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_process_existing_food(self, mock_openai):
        """Test processing food that exists in database"""
        mock_service = Mock()
        mock_openai.return_value = mock_service
        
        parser = FoodParserService(user=self.user)
        
        food_data = {
            'name': 'Chicken Breast',
            'metadata': {'servings': '2'}
        }
        
        result = parser._process_single_food(food_data)
        
        self.assertEqual(result['source'], 'food_exact')
        self.assertEqual(result['food_object'].food_id, self.existing_food.food_id)
        self.assertEqual(result['servings'], Decimal('2'))
    
    @patch('apps.openai_service.food_parser.OpenAIService')
    def test_process_meal_reference(self, mock_openai):
        """Test processing when user references existing meal"""
        mock_service = Mock()
        mock_openai.return_value = mock_service
        
        # Create test meal
        meal = Meal.objects.create(
            user=self.user,
            meal_name='Breakfast'
        )
        
        parser = FoodParserService(user=self.user)
        
        food_data = {
            'name': 'Breakfast',
            'metadata': {}
        }
        
        result = parser._process_single_food(food_data)
        
        self.assertEqual(result['source'], 'meal')
        self.assertEqual(result['meal_object'].meal_id, meal.meal_id)


class ChatbotAPITest(TestCase):
    """Test cases for Chatbot API endpoints"""
    
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
    
    @patch('apps.openai_service.food_parser.FoodParserService.parse_food_input')
    def test_parse_food_endpoint(self, mock_parse):
        """Test food parsing API endpoint"""
        mock_parse.return_value = {
            'success': True,
            'foods_parsed': [{'name': 'Apple'}],
            'logs_created': [{'log_id': 1, 'food_name': 'Apple'}],
            'meal_created': None,
            'errors': []
        }
        
        url = '/api/openai/parse-food/'
        data = {
            'input_text': '1 apple',
            'create_meal': False
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.json())
        self.assertTrue(response.json()['data']['success'])
    
    @patch('apps.openai_service.food_parser.FoodParserService.generate_missing_metadata')
    def test_generate_metadata_endpoint(self, mock_generate):
        """Test metadata generation API endpoint"""
        mock_generate.return_value = {
            'calories': 95,
            'protein': 0.3,
            'fat': 0.2,
            'carbohydrates': 25,
            'food_group': 'fruit'
        }
        
        url = '/api/openai/generate-metadata/'
        data = {
            'food_name': 'Apple',
            'existing_metadata': {}
        }
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('metadata', response.json()['data'])
    
    def test_parse_food_requires_input(self):
        """Test that parsing requires input text"""
        url = '/api/openai/parse-food/'
        data = {'input_text': ''}
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_metadata_requires_food_name(self):
        """Test that metadata generation requires food name"""
        url = '/api/openai/generate-metadata/'
        data = {'food_name': ''}
        
        response = self.client.post(url, data, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


if __name__ == '__main__':
    unittest.main()

