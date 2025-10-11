"""
Tests for OpenAI service app
"""
import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from unittest.mock import patch, MagicMock

User = get_user_model()


class OpenAIAPITest(APITestCase):
    """Test cases for OpenAI API endpoints"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        # Get authentication token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_send_prompt_without_auth(self):
        """Test send prompt endpoint without authentication"""
        self.client.credentials()  # Remove auth
        
        url = '/api/openai/prompt/'
        data = {'prompt': 'Test prompt'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    @patch('apps.openai_service.services.OpenAIService.send_prompt')
    def test_send_prompt_with_auth(self, mock_send):
        """Test send prompt endpoint with authentication"""
        mock_send.return_value = {
            'success': True,
            'response': 'Test response',
            'tokens_used': 10,
            'cost': 0.001,
            'response_time': 1.5
        }
        
        url = '/api/openai/prompt/'
        data = {'prompt': 'Test prompt'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertEqual(response.data['data']['response'], 'Test response')
    
    def test_usage_stats_endpoint(self):
        """Test usage statistics endpoint"""
        url = '/api/openai/usage/'
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('total_tokens', response.data['data'])


class OpenAIServiceTest(TestCase):
    """Test cases for OpenAI service class"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
    
    @patch('apps.openai_service.services.settings')
    def test_openai_service_no_api_key(self, mock_settings):
        """Test OpenAI service when API key is not configured"""
        mock_settings.OPENAI_API_KEY = None
        mock_settings.OPENAI_MODEL = 'gpt-3.5-turbo'
        
        from apps.openai_service.services import OpenAIService
        service = OpenAIService()
        
        result = service.send_prompt("Test prompt", user=self.user)
        
        self.assertFalse(result['success'])
        self.assertIn('API key', result['error'])
    
    @patch('apps.openai_service.services.openai.ChatCompletion')
    @patch('apps.openai_service.services.settings')
    def test_openai_service_with_api_key(self, mock_settings, mock_chat_completion):
        """Test OpenAI service with API key configured"""
        mock_settings.OPENAI_API_KEY = 'test-api-key'
        mock_settings.OPENAI_MODEL = 'gpt-3.5-turbo'
        
        # Mock OpenAI ChatCompletion response
        mock_response = MagicMock()
        mock_response.choices = [MagicMock()]
        mock_response.choices[0].message.content = 'Test AI response'
        mock_response.usage.total_tokens = 10
        mock_chat_completion.create.return_value = mock_response
        
        from apps.openai_service.services import OpenAIService
        service = OpenAIService()
        
        result = service.send_prompt("Test prompt", user=self.user)
        
        self.assertTrue(result['success'])
        self.assertEqual(result['response'], 'Test AI response')
        self.assertEqual(result['tokens_used'], 10)
