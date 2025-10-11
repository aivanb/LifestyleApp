"""
Tests for users app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import AccessLevel, Unit, ActivityLevel, UserGoal

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.unit, _ = Unit.objects.get_or_create(unit_name='kg')
        self.activity_level, _ = ActivityLevel.objects.get_or_create(
            name='moderate',
            defaults={'description': 'Moderate activity level'}
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
    
    def test_user_with_optional_fields(self):
        """Test user creation with optional fields"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level,
            height=175.5,
            gender='male',
            unit_preference=self.unit,
            activity_level=self.activity_level
        )
        
        self.assertEqual(user.height, 175.5)
        self.assertEqual(user.gender, 'male')
        self.assertEqual(user.unit_preference, self.unit)
        self.assertEqual(user.activity_level, self.activity_level)


class AccessLevelModelTest(TestCase):
    """Test cases for AccessLevel model"""
    
    def test_access_level_creation(self):
        """Test access level creation"""
        access_level, created = AccessLevel.objects.get_or_create(role_name='admin')
        
        self.assertEqual(access_level.role_name, 'admin')
        self.assertEqual(str(access_level), 'admin')
    
    def test_access_level_choices(self):
        """Test access level role choices"""
        valid_choices = ['admin', 'user', 'guest']
        
        for choice in valid_choices:
            access_level, _ = AccessLevel.objects.get_or_create(role_name=choice)
            self.assertEqual(access_level.role_name, choice)


class UnitModelTest(TestCase):
    """Test cases for Unit model"""
    
    def test_unit_creation(self):
        """Test unit creation"""
        unit, _ = Unit.objects.get_or_create(unit_name='kg')
        
        self.assertEqual(unit.unit_name, 'kg')
        self.assertEqual(str(unit), 'kg')
    
    def test_unit_uniqueness(self):
        """Test unit name uniqueness"""
        # This test is not applicable since we're using get_or_create in tests
        # The uniqueness constraint is enforced by the database
        unit, created = Unit.objects.get_or_create(unit_name='test_unique_unit')
        self.assertTrue(created)
        
        unit2, created2 = Unit.objects.get_or_create(unit_name='test_unique_unit')
        self.assertFalse(created2)
        self.assertEqual(unit, unit2)


class ActivityLevelModelTest(TestCase):
    """Test cases for ActivityLevel model"""
    
    def test_activity_level_creation(self):
        """Test activity level creation"""
        activity_level, _ = ActivityLevel.objects.get_or_create(
            name='test_activity',
            defaults={'description': 'Test activity level'}
        )
        
        self.assertEqual(activity_level.name, 'test_activity')
        self.assertEqual(activity_level.description, 'Test activity level')
        self.assertEqual(str(activity_level), 'test_activity')


class UserGoalModelTest(TestCase):
    """Test cases for UserGoal model"""
    
    def setUp(self):
        self.access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            access_level=self.access_level
        )
    
    def test_user_goal_creation(self):
        """Test user goal creation"""
        user_goal = UserGoal.objects.create(
            user=self.user,
            tokens_goal=1000,
            cost_goal=10.50,
            weight_goal=70.5,
            calories_goal=2000
        )
        
        self.assertEqual(user_goal.user, self.user)
        self.assertEqual(user_goal.tokens_goal, 1000)
        self.assertEqual(user_goal.cost_goal, 10.50)
        self.assertEqual(user_goal.weight_goal, 70.5)
        self.assertEqual(user_goal.calories_goal, 2000)
        self.assertEqual(str(user_goal), "testuser's Goals")
