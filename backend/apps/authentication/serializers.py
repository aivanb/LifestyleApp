from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from apps.users.models import User, AccessLevel, Unit, ActivityLevel


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['access_level'] = user.access_level.role_name if user.access_level else None
        
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = {
            'id': self.user.user_id,
            'username': self.user.username,
            'email': self.user.email,
            'access_level': self.user.access_level.role_name if self.user.access_level else None,
        }
        
        # Wrap the response in the expected format
        return {
            'data': {
                'user': data['user'],
                'tokens': {
                    'access': data['access'],
                    'refresh': data['refresh']
                }
            }
        }


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm', 'height', 'birthday', 'gender')
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        
        # Set default access level to 'user'
        user_level, _ = AccessLevel.objects.get_or_create(role_name='user')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            access_level=user_level,
            height=validated_data.get('height'),
            birthday=validated_data.get('birthday'),
            gender=validated_data.get('gender'),
        )
        
        return user


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data"""
    access_level = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = User
        fields = ('user_id', 'username', 'email', 'access_level', 'height', 'birthday', 'gender', 'created_at')
        read_only_fields = ('user_id', 'created_at')


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value
