from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import OpenAIService
from .food_parser import FoodParserService


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def parse_food_input(request):
    """
    Parse food input (text or voice transcription) and log foods automatically.
    
    Expected payload:
    {
        "input_text": "2 chicken breasts and 1 cup of rice",
        "create_meal": false,
        "voice_input": true  // optional flag
    }
    
    Returns:
    {
        "data": {
            "foods_parsed": [...],
            "logs_created": [...],
            "meal_created": {...},
            "errors": []
        }
    }
    """
    input_text = request.data.get('input_text', '').strip()
    create_meal = request.data.get('create_meal', False)
    
    if not input_text:
        return Response({
            'error': {'message': 'Input text is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        parser = FoodParserService(user=request.user)
        result = parser.parse_food_input(input_text, create_meal=create_meal)
        
        if result['success']:
            return Response({
                'data': result
            })
        else:
            return Response({
                'error': {
                    'message': 'Food parsing completed with errors',
                    'details': result['errors']
                },
                'data': result  # Include partial results
            }, status=status.HTTP_207_MULTI_STATUS)
            
    except Exception as e:
        return Response({
            'error': {'message': f'Food parsing failed: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_metadata(request):
    """
    Generate missing nutritional metadata for a food.
    
    Expected payload:
    {
        "food_name": "Chicken Breast",
        "existing_metadata": {
            "calories": 165,
            "protein": 31
        }
    }
    
    Returns complete metadata with generated values for missing fields.
    """
    food_name = request.data.get('food_name', '').strip()
    existing_metadata = request.data.get('existing_metadata', {})
    
    if not food_name:
        return Response({
            'error': {'message': 'Food name is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        parser = FoodParserService(user=request.user)
        complete_metadata = parser.generate_missing_metadata(food_name, existing_metadata)
        
        return Response({
            'data': {
                'food_name': food_name,
                'metadata': complete_metadata
            }
        })
        
    except Exception as e:
        return Response({
            'error': {'message': f'Metadata generation failed: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
