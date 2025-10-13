import React, { useState, useEffect, useRef } from 'react';
import voiceService from '../services/voiceService';

/**
 * VoiceRecorder Component
 * 
 * Provides voice recording functionality with:
 * - Record button to start recording
 * - Live timer display (in seconds)
 * - Auto-stop after 60 seconds
 * - Stop button to manually end recording
 * - Transcribed text in editable field
 * 
 * Uses Web Speech API for browser-based speech recognition.
 * For Vosk offline recognition, server-side processing would be needed.
 */
const VoiceRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize recognition
    recognitionRef.current = voiceService.initializeRecognition(
      (result) => {
        if (result.isFinal && result.final) {
          setTranscription(prev => (prev + ' ' + result.final).trim());
        }
        setInterimText(result.interim);
      },
      (error) => {
        setError(`Recognition error: ${error}`);
        stopRecording();
      }
    );

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  const startRecording = () => {
    if (!voiceService.isVoiceSupported()) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    setError('');
    setTranscription('');
    setInterimText('');
    setRecordingTime(0);
    setIsRecording(true);

    voiceService.start();

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        const newTime = prev + 1;
        
        // Auto-stop after 60 seconds
        if (newTime >= 60) {
          stopRecording();
          return 60;
        }
        
        return newTime;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    voiceService.stop();
    setIsRecording(false);

    // Trigger callback with final transcription
    if (onTranscriptionComplete && transcription) {
      onTranscriptionComplete(transcription);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder card" style={{ background: 'var(--bg-tertiary)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg className="icon icon-lg" viewBox="0 0 20 20" fill="var(--accent-purple)">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
          <h3 style={{ margin: 0 }}>Voice Input</h3>
        </div>

        {isRecording && (
          <div className="recording-indicator animate-pulse">
            <div className="recording-dot"></div>
            <span className="text-sm font-medium" style={{ color: 'var(--accent-danger)' }}>
              Recording: {formatTime(recordingTime)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message mb-4">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex gap-4 mb-4">
        {!isRecording ? (
          <button
            className="btn btn-danger"
            onClick={startRecording}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Start Recording
          </button>
        ) : (
          <button
            className="btn btn-secondary"
            onClick={stopRecording}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
            </svg>
            Stop Recording
          </button>
        )}
      </div>

      {/* Transcription Display */}
      {(transcription || interimText) && (
        <div className="transcription-display">
          <label className="form-label">Transcribed Text (Editable)</label>
          <textarea
            className="form-input"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            rows="4"
            placeholder="Transcribed text will appear here..."
          />
          
          {interimText && (
            <div className="interim-text text-sm text-tertiary mt-2">
              <em>{interimText}</em>
            </div>
          )}
        </div>
      )}

      {!voiceService.isVoiceSupported() && (
        <div className="warning-message">
          <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Voice recognition not supported in this browser. Try Chrome or Edge.
        </div>
      )}

      <style jsx>{`
        .recording-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .recording-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-full);
          background: var(--accent-danger);
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .interim-text {
          font-style: italic;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default VoiceRecorder;

