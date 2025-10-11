"""
Tests for authentication app
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
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
        
        response = self.client.post(url, data, content_type='application/json')
        
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
        
        response = self.client.post(url, data, content_type='application/json')
        
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


class MiddlewareTest(TestCase):
    """Test cases for custom middleware"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
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
