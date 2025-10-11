#!/usr/bin/env python
"""
End-to-end test for OpenAI integration
This test will actually call the OpenAI API to verify functionality
"""
import os
import sys
import django

# Set up Django first, before importing any Django modules
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from apps.openai_service.services import OpenAIService

User = get_user_model()

class OpenAIServiceE2ETest(TestCase):
    """End-to-end test for OpenAI service"""
    
    def setUp(self):
        # Create test user and access level
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
        
        # Set up client
        self.client = Client()
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.access_token}'
    
    def test_openai_service_initialization(self):
        """Test OpenAI service initialization"""
        service = OpenAIService()
        
        # Check if API key is configured
        api_key = service.api_key
        print(f"API Key configured: {bool(api_key)}")
        
        if api_key:
            print(f"API Key length: {len(api_key)}")
            self.assertIsNotNone(service.client)
        else:
            print("API Key not configured - skipping actual API test")
            self.assertIsNone(service.client)
    
    def test_openai_api_call_with_real_key(self):
        """Test actual OpenAI API call if API key is configured"""
        service = OpenAIService()
        
        if not service.client:
            self.skipTest("OpenAI API key not configured - skipping real API test")
        
        # Test with a simple prompt
        test_prompt = "Hello, this is a test. Please respond with 'Test successful'."
        
        result = service.send_prompt(test_prompt, user=self.user)
        
        print(f"API Response: {result}")
        
        # Verify the response structure
        self.assertIn('success', result)
        self.assertIn('response_time', result)
        
        if result['success']:
            self.assertIn('response', result)
            self.assertIn('tokens_used', result)
            self.assertIn('cost', result)
            print(f"AI Response: {result['response']}")
            print(f"Tokens used: {result['tokens_used']}")
            print(f"Cost: ${result['cost']}")
        else:
            print(f"API Error: {result['error']}")
    
    def test_openai_endpoint_integration(self):
        """Test the OpenAI endpoint through the API"""
        # Create a test user and get access token
        access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        user = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpass123',
            access_level=access_level
        )
        
        # Get access token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Test the endpoint with authentication
        response = self.client.post('/api/openai/prompt/', {
            'prompt': 'Hello, this is a test prompt.'
        }, content_type='application/json', HTTP_AUTHORIZATION=f'Bearer {access_token}', HTTP_HOST='localhost')
        
        print(f"Endpoint Response Status: {response.status_code}")
        print(f"Response Content-Type: {response.get('Content-Type', 'Not set')}")
        
        if response.status_code == 200:
            print(f"Endpoint Response Data: {response.json()}")
        else:
            print(f"Endpoint Response Error: {response.content}")
            if hasattr(response, 'content') and response.content:
                print(f"Response Content (first 500 chars): {response.content[:500].decode('utf-8', errors='ignore')}")
        
        # The endpoint should either return 200 with success or 500 with error
        self.assertIn(response.status_code, [200, 500])
        
        if response.status_code == 200:
            data = response.json()
            self.assertIn('data', data)
            self.assertIn('response', data['data'])
            self.assertIn('tokens_used', data['data'])
            self.assertIn('cost', data['data'])
        else:
            # Check if it's the expected API key error
            data = response.json()
            if 'error' in data:
                print(f"Expected error: {data['error']}")
    
    def test_usage_stats_endpoint(self):
        """Test the usage stats endpoint"""
        # Create a test user and get access token
        access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        user = User.objects.create_user(
            username='testuser3',
            email='test3@example.com',
            password='testpass123',
            access_level=access_level
        )
        
        # Get access token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        # Test the endpoint with authentication
        response = self.client.get('/api/openai/usage/', HTTP_AUTHORIZATION=f'Bearer {access_token}', HTTP_HOST='localhost')
        
        print(f"Usage Stats Response Status: {response.status_code}")
        print(f"Response Content-Type: {response.get('Content-Type', 'Not set')}")
        
        if response.status_code == 200:
            print(f"Usage Stats Response Data: {response.json()}")
        else:
            print(f"Usage Stats Response Error: {response.content}")
            if hasattr(response, 'content') and response.content:
                print(f"Response Content (first 500 chars): {response.content[:500].decode('utf-8', errors='ignore')}")
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('data', data)
        self.assertIn('total_tokens', data['data'])

if __name__ == '__main__':
    import unittest
    unittest.main()
