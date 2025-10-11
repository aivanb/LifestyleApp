from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import OpenAIService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_prompt(request):
    """
    Send a prompt to OpenAI API and return the response
    
    Expected payload:
    {
        "prompt": "Your prompt here"
    }
    """
    prompt = request.data.get('prompt')
    
    if not prompt:
        return Response({
            'error': {'message': 'Prompt is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(prompt) > 2000:
        return Response({
            'error': {'message': 'Prompt is too long (max 2000 characters)'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    openai_service = OpenAIService()
    result = openai_service.send_prompt(prompt, user=request.user)
    
    if result['success']:
        return Response({
            'data': {
                'response': result['response'],
                'tokens_used': result['tokens_used'],
                'cost': result['cost'],
                'response_time': result['response_time']
            }
        })
    else:
        return Response({
            'error': {'message': result['error']}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usage_stats(request):
    """Get user's OpenAI API usage statistics"""
    from apps.analytics.models import ApiUsageLog
    
    user_logs = ApiUsageLog.objects.filter(user=request.user)
    
    total_tokens = sum(log.tokens_used for log in user_logs)
    total_cost = sum(float(log.cost) for log in user_logs)
    total_requests = user_logs.count()
    successful_requests = user_logs.filter(success=True).count()
    
    # Handle division by zero
    success_rate = round((successful_requests / total_requests * 100) if total_requests > 0 else 0, 2)
    
    return Response({
        'data': {
            'total_tokens': total_tokens,
            'total_cost': round(total_cost, 4),
            'total_requests': total_requests,
            'successful_requests': successful_requests,
            'success_rate': success_rate
        }
    })
