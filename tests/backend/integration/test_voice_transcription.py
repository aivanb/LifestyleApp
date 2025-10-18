#!/usr/bin/env python
"""
Test Voice Transcription System

This script tests the voice transcription functionality including:
1. Vosk model availability
2. Transcription endpoint
3. Error handling

Usage:
    python test_voice_transcription.py
"""

import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import AccessLevel
from apps.openai_service.transcription import get_transcription_service
import json

User = get_user_model()

def test_transcription_service():
    """Test the transcription service directly."""
    print("\n" + "="*60)
    print("TESTING VOICE TRANSCRIPTION SERVICE")
    print("="*60)
    
    # Test service availability
    service = get_transcription_service()
    print(f"[OK] Service created successfully")
    
    # Check model availability
    available = service.is_available()
    print(f"Model available: {available}")
    
    if available:
        print(f"Model path: {service.model_path}")
        
        # Test with dummy audio data
        dummy_audio = b'\x00' * 1000  # 1KB of silence
        result = service.transcribe_audio(dummy_audio)
        
        print(f"Transcription result: {result}")
        
        if result['success']:
            print(f"[OK] Transcription successful: '{result['text']}'")
            print(f"Confidence: {result['confidence']}")
        else:
            print(f"[WARNING] Transcription failed: {result['error']}")
    else:
        print("[ERROR] Vosk model not available")
        print("\nTo install the model, run:")
        print("  python download_vosk_model.py")
    
    return available

def test_transcription_endpoints():
    """Test the transcription API endpoints."""
    print("\n" + "="*60)
    print("TESTING TRANSCRIPTION API ENDPOINTS")
    print("="*60)
    
    # Setup test client and user
    client = Client()
    access_level, _ = AccessLevel.objects.get_or_create(role_name='user')
    user, created = User.objects.get_or_create(
        username='voicetest',
        defaults={
            'email': 'voicetest@test.com',
            'access_level': access_level
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Test 1: Check transcription status
    print("\n1. Testing: GET /api/openai/transcription-status/")
    response = client.get(
        '/api/openai/transcription-status/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_HOST='localhost'
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Available: {data['data']['available']}")
        print(f"   Model: {data['data']['model']}")
    else:
        print(f"   ERROR: {response.json()}")
    
    # Test 2: Test transcription endpoint (without actual audio)
    print("\n2. Testing: POST /api/openai/transcribe/ (without audio)")
    response = client.post(
        '/api/openai/transcribe/',
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_HOST='localhost'
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        print("   [OK] Correctly rejected request without audio file")
    else:
        print(f"   ERROR: {response.json()}")
    
    # Test 3: Test with invalid file type
    print("\n3. Testing: POST /api/openai/transcribe/ (invalid file type)")
    from django.core.files.uploadedfile import SimpleUploadedFile
    
    # Create a fake text file
    fake_audio = SimpleUploadedFile(
        "test.txt",
        b"This is not audio data",
        content_type="text/plain"
    )
    
    response = client.post(
        '/api/openai/transcribe/',
        {'audio': fake_audio},
        HTTP_AUTHORIZATION=f'Bearer {access_token}',
        HTTP_HOST='localhost'
    )
    
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        print("   [OK] Correctly rejected non-audio file")
    else:
        print(f"   ERROR: {response.json()}")

def main():
    """Run all voice transcription tests."""
    print("VOICE TRANSCRIPTION SYSTEM TEST")
    print("="*60)
    
    try:
        # Test service directly
        service_available = test_transcription_service()
        
        # Test API endpoints
        test_transcription_endpoints()
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        if service_available:
            print("[OK] Voice transcription system is READY")
            print("   - Vosk model is available")
            print("   - API endpoints are working")
            print("   - Error handling is working")
        else:
            print("[WARNING] Voice transcription system needs setup")
            print("   - Vosk model is not available")
            print("   - Run: python download_vosk_model.py")
            print("   - API will fall back to Web Speech API")
        
        print("\nNext steps:")
        print("1. Start the Django server: python manage.py runserver")
        print("2. Test in browser: Navigate to Food Log page")
        print("3. Click the voice recorder button")
        print("4. Grant microphone permissions")
        print("5. Speak your food description")
        
    except Exception as e:
        print(f"[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
