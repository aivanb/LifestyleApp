"""
Tests for authentication app
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel, UserGoal, InviteKey
from apps.workouts.models import Muscle, MuscleLog

User = get_user_model()


class AuthenticationAPITest(APITestCase):
    """Test cases for authentication API endpoints"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
    
    def test_user_registration(self):
        """Test user registration endpoint with valid invite key."""
        # Ensure there are muscles to seed into muscle_log
        Muscle.objects.create(muscle_name='Chest', muscle_group='chest')
        Muscle.objects.create(muscle_name='Back', muscle_group='back')
        Muscle.objects.create(muscle_name='Quadriceps', muscle_group='legs')

        invite_key = InviteKey.objects.create(key='test-invite-key-001')

        url = '/api/auth/register/'
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'newpass123',
            'password_confirm': 'newpass123',
            'invite_key': invite_key.key,
            # Mimic frontend optional fields when left blank
            'height': '',
            'birthday': '',
            'gender': ''
        }

        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('data', response.data)
        self.assertIn('tokens', response.data['data'])
        self.assertEqual(response.data['data']['user']['username'], 'newuser')

        created_user = User.objects.get(username='newuser')
        self.assertEqual(created_user.invite_key_id, invite_key.invite_key_id)

        # Verify user_goal baseline exists
        self.assertTrue(UserGoal.objects.filter(user=created_user, tokens_goal=1000).exists())

        # Verify full muscle_log seeding with default priority 80
        muscles_count = Muscle.objects.count()
        self.assertEqual(MuscleLog.objects.filter(user=created_user).count(), muscles_count)
        self.assertFalse(MuscleLog.objects.filter(user=created_user).exclude(priority=80).exists())

    def test_registration_requires_invite_key(self):
        """Registration without invite key returns 400."""
        Muscle.objects.create(muscle_name='Chest', muscle_group='chest')
        url = '/api/auth/register/'
        data = {
            'username': 'nokeyuser',
            'email': 'nokey@example.com',
            'password': 'validpass123!',
            'password_confirm': 'validpass123!',
            'height': '',
            'birthday': '',
            'gender': ''
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('invite_key', response.data.get('error', {}).get('details', {}))

    def test_registration_rejects_invalid_invite_key(self):
        """Registration with invalid invite key returns 400."""
        Muscle.objects.create(muscle_name='Chest', muscle_group='chest')
        url = '/api/auth/register/'
        data = {
            'username': 'badkeyuser',
            'email': 'badkey@example.com',
            'password': 'validpass123!',
            'password_confirm': 'validpass123!',
            'invite_key': 'nonexistent-key-xyz',
            'height': '',
            'birthday': '',
            'gender': ''
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_rejects_used_invite_key(self):
        """Registration with an already-used invite key returns 400."""
        Muscle.objects.create(muscle_name='Chest', muscle_group='chest')
        invite_key = InviteKey.objects.create(key='used-key-001')
        User.objects.create_user(
            username='firstuser',
            email='first@example.com',
            password='pass123',
            access_level=self.access_level,
            invite_key=invite_key,
        )
        url = '/api/auth/register/'
        data = {
            'username': 'seconduser',
            'email': 'second@example.com',
            'password': 'validpass123!',
            'password_confirm': 'validpass123!',
            'invite_key': invite_key.key,
            'height': '',
            'birthday': '',
            'gender': ''
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_invite_key_endpoint(self):
        """Validate invite key endpoint returns valid/ invalid and message."""
        valid_key = InviteKey.objects.create(key='valid-key-xyz')
        url = '/api/auth/validate-invite-key/'
        # Valid unused key
        r1 = self.client.post(url, {'key': valid_key.key}, format='json')
        self.assertEqual(r1.status_code, status.HTTP_200_OK)
        self.assertTrue(r1.data['data']['valid'])
        self.assertIsNone(r1.data['data']['message'])
        # Invalid key
        r2 = self.client.post(url, {'key': 'not-a-real-key'}, format='json')
        self.assertEqual(r2.status_code, status.HTTP_200_OK)
        self.assertFalse(r2.data['data']['valid'])
        self.assertIsNotNone(r2.data['data']['message'])
        # Used key
        User.objects.create_user(
            username='consumer',
            email='c@example.com',
            password='pass',
            access_level=self.access_level,
            invite_key=valid_key,
        )
        r3 = self.client.post(url, {'key': valid_key.key}, format='json')
        self.assertEqual(r3.status_code, status.HTTP_200_OK)
        self.assertFalse(r3.data['data']['valid'])

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
        response = self.client.get(url, HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
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
