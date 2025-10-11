import os
import django
from django.conf import settings

# Set up Django settings for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

import unittest
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel, Unit, ActivityLevel
from apps.authentication.serializers import UserRegistrationSerializer

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.unit = Unit.objects.create(unit_name='kg')
        self.activity_level = ActivityLevel.objects.create(
            name='moderate',
            description='Moderate activity level'
        )
    
    def test_user_creation(self):
        """Test user creation with required fields"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.access_level, self.access_level)
        self.assertTrue(user.check_password('testpass123'))
    
    def test_user_str_representation(self):
        """Test user string representation"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        self.assertEqual(str(user), 'testuser')


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.client = Client()
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        url = '/api/auth/register/'
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('data', response.data)
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['username'], 'newuser')
    
    def test_user_login(self):
        """Test user login endpoint"""
        # Create user first
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        url = '/api/auth/login/'
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.data)
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['username'], 'testuser')
    
    def test_protected_endpoint_access(self):
        """Test access to protected endpoint without authentication"""
        url = '/api/auth/profile/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_protected_endpoint_with_auth(self):
        """Test access to protected endpoint with authentication"""
        # Create user and get token
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
        
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        
        url = '/api/auth/profile/'
        headers = {'Authorization': f'Bearer {access_token}'}
        response = self.client.get(url, headers=headers)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['username'], 'testuser')


class OpenAIAPITest(APITestCase):
    """Test cases for OpenAI API endpoints"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
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
    
    def test_send_prompt_with_auth(self):
        """Test send prompt endpoint with authentication"""
        url = '/api/openai/prompt/'
        data = {'prompt': 'Test prompt'}
        
        # Mock OpenAI response
        with unittest.mock.patch('apps.openai_service.services.OpenAIService.send_prompt') as mock_send:
            mock_send.return_value = {
                'success': True,
                'response': 'Test response',
                'tokens_used': 10,
                'cost': 0.001,
                'response_time': 1.5
            }
            
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


class MiddlewareTest(TestCase):
    """Test cases for custom middleware"""
    
    def setUp(self):
        self.access_level = AccessLevel.objects.create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
    
    def test_auth_middleware_with_valid_token(self):
        """Test auth middleware with valid JWT token"""
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        client = Client()
        headers = {'HTTP_AUTHORIZATION': f'Bearer {access_token}'}
        
        response = client.get('/api/auth/profile/', **headers)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_auth_middleware_with_invalid_token(self):
        """Test auth middleware with invalid JWT token"""
        client = Client()
        headers = {'HTTP_AUTHORIZATION': 'Bearer invalid_token'}
        
        response = client.get('/api/auth/profile/', **headers)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


if __name__ == '__main__':
    unittest.main()
