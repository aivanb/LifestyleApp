"""
Voice Transcription Service using Vosk offline model

This module provides server-side voice transcription using the Vosk model.
The vosk-model-small-en-us-0.15 model should be downloaded and placed in
the models directory.

Usage:
    python -c "
    import os
    import requests
    
    # Download Vosk model
    model_url = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip'
    model_dir = 'models'
    
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
    
    # Download and extract model
    response = requests.get(model_url)
    with open('models/vosk-model.zip', 'wb') as f:
        f.write(response.content)
    
    import zipfile
    with zipfile.ZipFile('models/vosk-model.zip', 'r') as zip_ref:
        zip_ref.extractall(model_dir)
    "
"""

import os
import json
import logging
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger(__name__)

class VoskTranscriptionService:
    """
    Vosk-based offline voice transcription service.
    
    Requires vosk-model-small-en-us-0.15 to be downloaded and extracted
    to the models directory.
    """
    
    def __init__(self):
        self.model_path = os.path.join(settings.BASE_DIR, 'models', 'vosk-model-small-en-us-0.15')
        self.model = None
        self.recognizer = None
        self.is_available_flag = self._check_model_availability()
        
        if self.is_available_flag:
            self._initialize_model()
    
    def _check_model_availability(self) -> bool:
        """Check if Vosk model is available."""
        if not os.path.exists(self.model_path):
            logger.warning(f"Vosk model not found at {self.model_path}")
            logger.info("To download the model, run:")
            logger.info("  mkdir -p models")
            logger.info("  wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip -O models/vosk-model.zip")
            logger.info("  unzip models/vosk-model.zip -d models/")
            return False
        
        # Check for required model files
        required_files = ['am/final.mdl', 'graph/phones.txt', 'ivector/online_cmvn.conf']
        for file_path in required_files:
            if not os.path.exists(os.path.join(self.model_path, file_path)):
                logger.warning(f"Vosk model incomplete - missing {file_path}")
                return False
        
        return True
    
    def _initialize_model(self):
        """Initialize the Vosk model."""
        try:
            import vosk
            
            # Set Vosk model path
            os.environ['VOSK_MODEL_PATH'] = self.model_path
            
            # Initialize model
            self.model = vosk.Model(self.model_path)
            self.recognizer = vosk.KaldiRecognizer(self.model, 16000)
            
            logger.info("Vosk model initialized successfully")
            
        except ImportError:
            logger.error("Vosk not installed. Install with: pip install vosk")
            self.is_available_flag = False
        except Exception as e:
            logger.error(f"Failed to initialize Vosk model: {e}")
            self.is_available_flag = False
    
    def transcribe_audio(self, audio_data: bytes, sample_rate: int = 16000) -> Dict[str, Any]:
        """
        Transcribe audio data using Vosk.
        
        Args:
            audio_data: Raw audio bytes (WAV format, 16kHz, mono)
            sample_rate: Audio sample rate (default: 16000)
            
        Returns:
            Dict with transcription result and confidence
        """
        if not self.is_available_flag or not self.recognizer:
            return {
                'success': False,
                'error': 'Vosk model not available',
                'text': '',
                'confidence': 0.0
            }
        
        try:
            # Reset recognizer for new audio
            self.recognizer = vosk.KaldiRecognizer(self.model, sample_rate)
            
            # Process audio in chunks
            chunk_size = 4000  # Process 4000 bytes at a time
            result_text = ""
            
            for i in range(0, len(audio_data), chunk_size):
                chunk = audio_data[i:i + chunk_size]
                
                if self.recognizer.AcceptWaveform(chunk):
                    result = json.loads(self.recognizer.Result())
                    if 'text' in result:
                        result_text += result['text'] + ' '
            
            # Get final result
            final_result = json.loads(self.recognizer.FinalResult())
            if 'text' in final_result:
                result_text += final_result['text']
            
            # Calculate confidence (Vosk doesn't provide confidence scores)
            # We'll estimate based on text length and completeness
            confidence = min(0.95, max(0.5, len(result_text.strip()) / 50))
            
            return {
                'success': True,
                'text': result_text.strip(),
                'confidence': confidence,
                'model': 'vosk-model-small-en-us-0.15'
            }
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {
                'success': False,
                'error': str(e),
                'text': '',
                'confidence': 0.0
            }
    
    def is_available(self) -> bool:
        """Check if transcription service is available."""
        return self.is_available_flag


# Global instance
_transcription_service = None

def get_transcription_service() -> VoskTranscriptionService:
    """Get the global transcription service instance."""
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = VoskTranscriptionService()
    return _transcription_service
