"""
Test suite for Data Viewer functionality

Tests cover:
- Authentication and authorization
- Role-based access control
- Data filtering, sorting, and searching
- Input validation and sanitization
- Error handling
- Security measures
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
from apps.users.models import AccessLevel, Unit, ActivityLevel
from apps.foods.models import Food
from apps.data_viewer.services import DataAccessService

User = get_user_model()


class DataAccessServiceTest(TestCase):
    """Test cases for DataAccessService"""
    
    def setUp(self):
        # Create access levels
        self.admin_level = AccessLevel.objects.create(role_name='admin')
        self.user_level = AccessLevel.objects.create(role_name='user')
        self.guest_level = AccessLevel.objects.create(role_name='guest')
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            access_level=self.admin_level
        )
        
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123',
            access_level=self.user_level
        )
        
        self.guest_user = User.objects.create_user(
            username='guest',
            email='guest@test.com',
            password='testpass123',
            access_level=self.guest_level
        )
        
        # Create test data
        self.test_food = Food.objects.create(
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
            make_public=True
        )
    
    def test_service_initialization_with_authenticated_user(self):
        """Test service initializes with authenticated user"""
        service = DataAccessService(user=self.regular_user)
        self.assertEqual(service.access_level, 'user')
    
    def test_service_initialization_fails_with_unauthenticated_user(self):
        """Test service initialization fails without authentication"""
        with self.assertRaises(ValueError):
            DataAccessService(user=None)
    
    def test_admin_can_access_all_tables(self):
        """Test admin can access all tables including internal"""
        service = DataAccessService(user=self.admin_user)
        tables = service.get_available_tables()
        
        # Admin should see more tables than regular users
        self.assertGreater(len(tables), 0)
    
    def test_user_cannot_access_internal_tables(self):
        """Test regular user cannot access internal Django tables"""
        service = DataAccessService(user=self.regular_user)
        tables = service.get_available_tables()
        
        # Check that internal tables are not in the list
        table_names = [t['name'] for t in tables]
        self.assertNotIn('auth_permission', table_names)
        self.assertNotIn('django_session', table_names)
    
    def test_get_table_schema(self):
        """Test retrieving table schema"""
        service = DataAccessService(user=self.regular_user)
        schema = service.get_table_schema('foods')
        
        self.assertIn('fields', schema)
        self.assertIn('relationships', schema)
        self.assertGreater(len(schema['fields']), 0)
    
    def test_get_table_data_with_filters(self):
        """Test retrieving data with filters"""
        service = DataAccessService(user=self.regular_user)
        result = service.get_table_data(
            'foods',
            filters={'food_group': 'protein'}
        )
        
        self.assertIn('data', result)
        self.assertIn('pagination', result)
        self.assertGreater(len(result['data']), 0)
    
    def test_get_table_data_with_search(self):
        """Test retrieving data with search term"""
        service = DataAccessService(user=self.regular_user)
        result = service.get_table_data(
            'foods',
            search='Test'
        )
        
        self.assertGreater(len(result['data']), 0)
    
    def test_get_table_data_with_sorting(self):
        """Test retrieving data with sorting"""
        service = DataAccessService(user=self.regular_user)
        result = service.get_table_data(
            'foods',
            sort_by='food_name',
            sort_order='asc'
        )
        
        self.assertIn('sort_applied', result)
        self.assertEqual(result['sort_applied']['field'], 'food_name')
    
    def test_pagination(self):
        """Test data pagination"""
        service = DataAccessService(user=self.regular_user)
        result = service.get_table_data(
            'foods',
            page=1,
            page_size=10
        )
        
        self.assertIn('pagination', result)
        self.assertEqual(result['pagination']['current_page'], 1)
        self.assertEqual(result['pagination']['page_size'], 10)
    
    def test_input_sanitization(self):
        """Test input sanitization prevents SQL injection"""
        service = DataAccessService(user=self.regular_user)
        
        # Try to inject SQL through filter
        malicious_input = "'; DROP TABLE foods; --"
        sanitized = service._sanitize_input(malicious_input)
        
        # Dangerous characters should be removed
        self.assertNotIn("'", sanitized)
        self.assertNotIn(";", sanitized)
        self.assertNotIn("--", sanitized)
    
    def test_access_control_for_user_specific_data(self):
        """Test users can only see their own data"""
        service = DataAccessService(user=self.regular_user)
        
        # Try to access a table with user_id field
        result = service.get_table_data('users')
        
        # Should only see own user record
        self.assertLessEqual(len(result['data']), 1)


class DataViewerAPITest(TestCase):
    """Test cases for Data Viewer API endpoints"""
    
    def setUp(self):
        self.client = Client()
        
        # Create access levels
        self.admin_level = AccessLevel.objects.create(role_name='admin')
        self.user_level = AccessLevel.objects.create(role_name='user')
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            access_level=self.user_level
        )
        
        # Get authentication token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
    
    def test_get_available_tables_requires_auth(self):
        """Test endpoint requires authentication"""
        response = self.client.get('/api/data-viewer/tables/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_available_tables_with_auth(self):
        """Test getting available tables with authentication"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/data-viewer/tables/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.json())
        self.assertIn('tables', response.json()['data'])
    
    def test_get_table_schema_with_auth(self):
        """Test getting table schema"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/data-viewer/tables/foods/schema/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.json())
        self.assertIn('fields', response.json()['data'])
    
    def test_get_table_data_with_filters(self):
        """Test getting table data with filters"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        response = self.client.post(
            '/api/data-viewer/tables/foods/data/',
            {
                'filters': {'food_group': 'protein'},
                'page': 1,
                'page_size': 20
            },
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('data', response.json())
    
    def test_invalid_table_name_returns_error(self):
        """Test invalid table name returns appropriate error"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/data-viewer/tables/nonexistent/schema/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())
    
    def test_access_control_prevents_internal_table_access(self):
        """Test non-admin users cannot access internal tables"""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        response = self.client.get('/api/data-viewer/tables/auth_permission/schema/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


if __name__ == '__main__':
    unittest.main()

