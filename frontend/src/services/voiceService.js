/**
 * Voice Transcription Service
 * 
 * Provides voice-to-text transcription using browser-based Web Speech API
 * as a fallback when Vosk model is not available.
 * 
 * Production Note: For Vosk integration, you would need to:
 * 1. Download vosk-model-small-en-us-0.15
 * 2. Set up vosk-browser or server-side Vosk API
 * 3. Send audio blob to transcription endpoint
 * 
 * Current implementation uses Web Speech API for immediate functionality.
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   * 
   * @param {Function} onResult - Callback for transcription results
   * @param {Function} onError - Callback for errors
   */
  initializeRecognition(onResult, onError) {
    if (!this.isSupported) {
      if (onError) {
        onError('Speech recognition is not supported in this browser');
      }
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (onResult) {
        onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim(),
          isFinal: finalTranscript.length > 0
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (onError) {
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      // Recognition ended
    };

    return this.recognition;
  }

  /**
   * Start voice recognition
   */
  start() {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    }
  }

  /**
   * Stop voice recognition
   */
  stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Transcribe audio blob (for Vosk integration)
   * 
   * @param {Blob} audioBlob - Audio data to transcribe
   * @returns {Promise<string>} Transcribed text
   */
  async transcribeAudio(audioBlob) {
    // This would send audio to Vosk API endpoint
    // For now, return placeholder
    
    // TODO: Implement Vosk server-side transcription
    // const formData = new FormData();
    // formData.append('audio', audioBlob);
    // const response = await fetch('/api/transcribe/', {
    //   method: 'POST',
    //   body: formData
    // });
    // return await response.json();
    
    return "Vosk transcription not yet implemented - use Web Speech API";
  }

  /**
   * Check if voice input is supported
   */
  static isVoiceSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}

const voiceService = new VoiceService();
export default voiceService;

