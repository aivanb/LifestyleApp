/**
 * Voice Transcription Service
 * 
 * Provides voice-to-text transcription using:
 * 1. Vosk offline model (preferred) - server-side transcription
 * 2. Web Speech API (fallback) - browser-based transcription
 * 
 * The service automatically detects which method is available and uses the best option.
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.isWebSpeechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.isVoskAvailable = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    
    // Check Vosk availability only when needed (not on initialization)
    this._voskCheckPromise = null;
  }

  /**
   * Check if Vosk transcription service is available
   */
  async _checkVoskAvailability() {
    // Return cached promise if already checking
    if (this._voskCheckPromise) {
      return this._voskCheckPromise;
    }

    this._voskCheckPromise = this._performVoskCheck();
    return this._voskCheckPromise;
  }

  async _performVoskCheck() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No auth token available for Vosk check');
        return false;
      }

      const response = await fetch('/api/openai/transcription-status/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isVoskAvailable = data.data.available;
        return this.isVoskAvailable;
      } else {
        console.log('Vosk check failed:', response.status);
        this.isVoskAvailable = false;
        return false;
      }
    } catch (error) {
      console.log('Vosk not available, using Web Speech API:', error.message);
      this.isVoskAvailable = false;
      return false;
    }
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
   * Check if voice input is supported (either Vosk or Web Speech API)
   */
  isVoiceSupported() {
    // Always return true if Web Speech API is supported
    // Vosk availability is checked dynamically when recording starts
    return this.isWebSpeechSupported;
  }

  /**
   * Start recording with the best available method
   */
  async startRecording(onResult, onError) {
    // Check Vosk availability first if not already checked
    if (!this._voskCheckPromise) {
      await this._checkVoskAvailability();
    }

    if (this.isVoskAvailable) {
      return this._startVoskRecording(onResult, onError);
    } else if (this.isWebSpeechSupported) {
      return this._startWebSpeechRecording(onResult, onError);
    } else {
      if (onError) {
        onError('No voice recognition method available');
      }
      return false;
    }
  }

  /**
   * Start Vosk-based recording
   */
  async _startVoskRecording(onResult, onError) {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      // Create MediaRecorder for Vosk
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        try {
          // Convert to WAV format for Vosk
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          const wavBlob = await this._convertToWav(audioBlob);
          
          // Send to Vosk transcription endpoint
          const transcription = await this._transcribeWithVosk(wavBlob);
          
          if (transcription.success) {
            if (onResult) {
              onResult({
                final: transcription.text,
                interim: '',
                isFinal: true,
                confidence: transcription.confidence
              });
            }
          } else {
            if (onError) {
              onError(transcription.error || 'Transcription failed');
            }
          }
        } catch (error) {
          if (onError) {
            onError(error.message);
          }
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      return true;

    } catch (error) {
      if (onError) {
        onError(`Microphone access denied: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Start Web Speech API recording
   */
  _startWebSpeechRecording(onResult, onError) {
    if (!this.isWebSpeechSupported) {
      if (onError) {
        onError('Web Speech API not supported');
      }
      return false;
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
      this.isRecording = false;
    };

    try {
      this.recognition.start();
      this.isRecording = true;
      return true;
    } catch (error) {
      if (onError) {
        onError(`Failed to start recognition: ${error.message}`);
      }
      return false;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (this.isVoskAvailable && this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    } else if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }

  /**
   * Convert audio blob to WAV format for Vosk
   */
  async _convertToWav(audioBlob) {
    // For now, return the blob as-is
    // In production, you'd want to use Web Audio API to convert to proper WAV format
    return audioBlob;
  }

  /**
   * Transcribe audio using Vosk API
   */
  async _transcribeWithVosk(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');

      const response = await fetch('/api/openai/transcribe/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          text: data.data.text,
          confidence: data.data.confidence
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || 'Transcription failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if currently recording
   */
  isCurrentlyRecording() {
    return this.isRecording;
  }

  /**
   * Get the preferred transcription method
   */
  getPreferredMethod() {
    if (this.isVoskAvailable) {
      return 'vosk';
    } else if (this.isWebSpeechSupported) {
      return 'web-speech';
    } else {
      return 'none';
    }
  }
}

const voiceService = new VoiceService();
export default voiceService;

