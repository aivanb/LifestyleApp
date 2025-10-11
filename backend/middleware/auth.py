from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.users.models import User


class AuthMiddleware(MiddlewareMixin):
    """Custom authentication middleware for JWT token validation"""
    
    def process_request(self, request):
        """Process incoming requests and validate JWT tokens"""
        # Skip authentication for certain paths
        skip_paths = [
            '/admin/',
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/token/refresh/',
        ]
        
        if any(request.path.startswith(path) for path in skip_paths):
            return None
        
        # Skip authentication for non-API paths
        if not request.path.startswith('/api/'):
            return None
        
        # Get token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({
                'error': {'message': 'Authentication token required'}
            }, status=401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Validate token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get user from database
            try:
                user = User.objects.get(user_id=user_id)
                request.user = user
            except User.DoesNotExist:
                return JsonResponse({
                    'error': {'message': 'User not found'}
                }, status=401)
                
        except (InvalidToken, TokenError, KeyError):
            return JsonResponse({
                'error': {'message': 'Invalid authentication token'}
            }, status=401)
        
        return None
