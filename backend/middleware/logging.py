from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from apps.analytics.models import ApiUsageLog, ErrorLog
import json
import traceback


class LoggingMiddleware(MiddlewareMixin):
    """Middleware for logging API requests and errors"""
    
    def process_request(self, request):
        """Log incoming API requests"""
        if request.path.startswith('/api/'):
            request.start_time = timezone.now()
        return None
    
    def process_response(self, request, response):
        """Log API responses"""
        if hasattr(request, 'start_time') and request.path.startswith('/api/'):
            try:
                # Calculate response time
                response_time = (timezone.now() - request.start_time).total_seconds()
                
                # Get user if authenticated
                user = getattr(request, 'user', None)
                if hasattr(user, 'is_authenticated') and not user.is_authenticated:
                    user = None
                
                # Log API usage
                ApiUsageLog.objects.create(
                    user=user,
                    request_type=f"{request.method} {request.path}",
                    model_used='N/A',
                    tokens_used=0,
                    cost=0,
                    response_time=response_time,
                    request=self._get_request_data(request),
                    response=self._get_response_data(response),
                    success=response.status_code < 400
                )
                
            except Exception as e:
                # Don't let logging errors break the main functionality
                print(f"Failed to log API response: {e}")
        
        return response
    
    def process_exception(self, request, exception):
        """Log exceptions"""
        if request.path.startswith('/api/'):
            try:
                user = getattr(request, 'user', None)
                if hasattr(user, 'is_authenticated') and not user.is_authenticated:
                    user = None
                
                ErrorLog.objects.create(
                    user=user,
                    error_type=type(exception).__name__,
                    error_message=str(exception),
                    user_input=self._get_request_data(request)
                )
                
            except Exception as e:
                print(f"Failed to log exception: {e}")
        
        return None
    
    def _get_request_data(self, request):
        """Extract request data for logging"""
        try:
            data = {
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET),
                'headers': dict(request.META),
            }
            
            # Add body data if it's JSON
            if hasattr(request, 'body') and request.body:
                try:
                    body_data = json.loads(request.body.decode('utf-8'))
                    data['body'] = body_data
                except (json.JSONDecodeError, UnicodeDecodeError):
                    data['body'] = 'Non-JSON body'
            
            return json.dumps(data)[:1000]  # Truncate for storage
            
        except Exception:
            return 'Error extracting request data'
    
    def _get_response_data(self, response):
        """Extract response data for logging"""
        try:
            if hasattr(response, 'content'):
                content = response.content.decode('utf-8')
                return content[:1000]  # Truncate for storage
            return 'No content'
        except Exception:
            return 'Error extracting response data'
