from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    ChangePasswordSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view with additional user data"""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User registration endpoint"""
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'data': {
                'user': {
                    'id': user.user_id,
                    'username': user.username,
                    'email': user.email,
                    'access_level': user.access_level.role_name if user.access_level else None,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Get current user profile"""
    serializer = UserSerializer(request.user)
    return Response({
        'data': serializer.data
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update current user profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'data': serializer.data
        })
    
    return Response({
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'data': {'message': 'Password changed successfully'}
        })
    
    return Response({
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout user by blacklisting refresh token"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response({
            'data': {'message': 'Logged out successfully'}
        })
    except Exception as e:
        return Response({
            'error': {'message': 'Invalid token'}
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh(request):
    """Refresh JWT access token"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        
        return Response({
            'data': {
                'access': str(token.access_token)
            }
        })
    except Exception as e:
        return Response({
            'error': {'message': 'Invalid refresh token'}
        }, status=status.HTTP_400_BAD_REQUEST)
