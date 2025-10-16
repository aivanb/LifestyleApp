"""
User serializers for API endpoints.
"""

from rest_framework import serializers
from .models import User, UserGoal, AccessLevel, Unit, ActivityLevel


class AccessLevelSerializer(serializers.ModelSerializer):
    """Serializer for AccessLevel model"""
    
    class Meta:
        model = AccessLevel
        fields = ['access_level_id', 'role_name']


class UnitSerializer(serializers.ModelSerializer):
    """Serializer for Unit model"""
    
    class Meta:
        model = Unit
        fields = ['unit_id', 'unit_name']


class ActivityLevelSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLevel model"""
    
    class Meta:
        model = ActivityLevel
        fields = ['activity_level_id', 'name', 'description']


class UserGoalSerializer(serializers.ModelSerializer):
    """Serializer for UserGoal model"""
    
    class Meta:
        model = UserGoal
        fields = [
            'user_goal_id', 'user', 'tokens_goal', 'cost_goal', 'weight_goal',
            'lean_mass_goal', 'fat_mass_goal', 'calories_goal', 'protein_goal',
            'fat_goal', 'carbohydrates_goal', 'fiber_goal', 'sodium_goal',
            'sugar_goal', 'saturated_fat_goal', 'trans_fat_goal', 'calcium_goal',
            'iron_goal', 'magnesium_goal', 'cholesterol_goal', 'vitamin_a_goal',
            'vitamin_c_goal', 'vitamin_d_goal', 'caffeine_goal', 'created_at',
            'updated_at'
        ]
        read_only_fields = ['user_goal_id', 'user', 'created_at', 'updated_at']


class UserGoalCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating UserGoal model"""
    
    class Meta:
        model = UserGoal
        fields = [
            'tokens_goal', 'cost_goal', 'weight_goal', 'lean_mass_goal',
            'fat_mass_goal', 'calories_goal', 'protein_goal', 'fat_goal',
            'carbohydrates_goal', 'fiber_goal', 'sodium_goal', 'sugar_goal',
            'saturated_fat_goal', 'trans_fat_goal', 'calcium_goal', 'iron_goal',
            'magnesium_goal', 'cholesterol_goal', 'vitamin_a_goal', 'vitamin_c_goal',
            'vitamin_d_goal', 'caffeine_goal'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    access_level = AccessLevelSerializer(read_only=True)
    unit_preference = UnitSerializer(read_only=True)
    activity_level = ActivityLevelSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'user_id', 'username', 'email', 'access_level', 'height',
            'birthday', 'gender', 'unit_preference', 'activity_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user_id', 'created_at', 'updated_at']


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating User model"""
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'height', 'birthday', 'gender',
            'unit_preference', 'activity_level'
        ]
