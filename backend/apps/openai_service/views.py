from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import io
import wave
from .services import OpenAIService
from .food_parser import FoodParserService
from .transcription import get_transcription_service


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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transcribe_audio(request):
    """
    Transcribe audio using Vosk offline model
    
    Expected payload:
    {
        "audio": <audio_file_blob>
    }
    """
    if 'audio' not in request.FILES:
        return Response({
            'error': {'message': 'Audio file is required'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    audio_file = request.FILES['audio']
    
    # Validate file size (max 10MB)
    if audio_file.size > 10 * 1024 * 1024:
        return Response({
            'error': {'message': 'Audio file too large (max 10MB)'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate file type
    allowed_types = ['audio/wav', 'audio/wave', 'audio/x-wav']
    if audio_file.content_type not in allowed_types:
        return Response({
            'error': {'message': 'Only WAV audio files are supported'}
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Read audio data
        audio_data = audio_file.read()
        
        # Convert to proper format for Vosk (16kHz, mono, 16-bit)
        audio_data = _convert_audio_to_vosk_format(audio_data)
        
        # Get transcription service
        transcription_service = get_transcription_service()
        
        if not transcription_service.is_available():
            return Response({
                'error': {'message': 'Voice transcription service not available. Please install Vosk model.'}
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Transcribe audio
        result = transcription_service.transcribe_audio(audio_data)
        
        if result['success']:
            return Response({
                'data': {
                    'text': result['text'],
                    'confidence': result['confidence'],
                    'model': result.get('model', 'unknown')
                }
            })
        else:
            return Response({
                'error': {'message': f'Transcription failed: {result.get("error", "Unknown error")}'}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': {'message': f'Transcription failed: {str(e)}'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _convert_audio_to_vosk_format(audio_data):
    """
    Convert audio data to Vosk-compatible format (16kHz, mono, 16-bit)
    
    Args:
        audio_data: Raw audio bytes
        
    Returns:
        Converted audio bytes suitable for Vosk
    """
    try:
        # Try to read as WAV file
        audio_io = io.BytesIO(audio_data)
        
        with wave.open(audio_io, 'rb') as wav_file:
            # Get audio parameters
            frames = wav_file.getnframes()
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            
            # Read raw audio data
            raw_audio = wav_file.readframes(frames)
            
            # If already in correct format, return as-is
            if sample_rate == 16000 and channels == 1 and sample_width == 2:
                return raw_audio
            
            # For now, return raw audio and let Vosk handle it
            # In production, you'd want to use librosa or pydub for proper conversion
            return raw_audio
            
    except Exception as e:
        # If we can't parse as WAV, return raw data
        # Vosk might still be able to handle it
        return audio_data


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transcription_status(request):
    """
    Check if transcription service is available
    """
    transcription_service = get_transcription_service()
    
    return Response({
        'data': {
            'available': transcription_service.is_available(),
            'model': 'vosk-model-small-en-us-0.15' if transcription_service.is_available() else None
        }
    })
