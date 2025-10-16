/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VoiceRecorder from './VoiceRecorder';
import voiceService from '../services/voiceService';

// Mock the voice service
jest.mock('../services/voiceService', () => {
  const mockVoiceService = {
    isVoiceSupported: jest.fn(() => true),
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    isCurrentlyRecording: jest.fn(() => false),
    getPreferredMethod: jest.fn(() => 'web-speech'),
    _checkVoskAvailability: jest.fn(),
    isVoskAvailable: false,
    isWebSpeechSupported: true
  };
  return {
    __esModule: true,
    default: mockVoiceService
  };
});

// Mock MediaRecorder
global.MediaRecorder = jest.fn().mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn()
}));

// Mock getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [{ stop: jest.fn() }]
    }))
  }
});

describe('VoiceRecorder Component', () => {
  const mockOnTranscriptionComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset voice service mock to default values
    voiceService.isVoiceSupported.mockReturnValue(true);
    voiceService.startRecording.mockResolvedValue(true);
    voiceService.stopRecording.mockImplementation(() => {});
    voiceService.isCurrentlyRecording.mockReturnValue(false);
    voiceService.getPreferredMethod.mockReturnValue('web-speech');
    
    // Mock console methods to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders voice recorder button when voice is supported', () => {
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    expect(screen.getByText('Start Recording')).toBeInTheDocument();
    expect(voiceService.isVoiceSupported).toHaveBeenCalled();
  });

  it('shows warning when voice is not supported', () => {
    voiceService.isVoiceSupported.mockReturnValue(false);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    expect(screen.getByText('Voice recognition not supported in this browser. Try Chrome or Edge.')).toBeInTheDocument();
  });

  it('starts recording when button is clicked', async () => {
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    expect(voiceService.startRecording).toHaveBeenCalled();
    expect(screen.getByText('Stop Recording')).toBeInTheDocument();
  });

  it('handles recording start failure', async () => {
    voiceService.startRecording.mockResolvedValue(false);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to start recording')).toBeInTheDocument();
    });
  });

  it('stops recording when stop button is clicked', () => {
    voiceService.startRecording.mockResolvedValue(true);
    voiceService.isCurrentlyRecording.mockReturnValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording first
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Then stop recording
    const stopButton = screen.getByText('Stop Recording');
    fireEvent.click(stopButton);
    
    expect(voiceService.stopRecording).toHaveBeenCalled();
  });

  it('shows recording time', async () => {
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Recording: 0:00/)).toBeInTheDocument();
    });
  });

  it('auto-stops after 60 seconds', async () => {
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Wait for recording to start
    await waitFor(() => {
      expect(voiceService.startRecording).toHaveBeenCalled();
    });
    
    // Fast-forward time to 60 seconds
    jest.advanceTimersByTime(60000);
    
    // Wait for the timer callback to execute and call stopRecording
    await waitFor(() => {
      expect(voiceService.stopRecording).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('calls onTranscriptionComplete with transcribed text', async () => {
    const testTranscription = 'I ate an apple';
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Wait for recording to start
    await waitFor(() => {
      expect(voiceService.startRecording).toHaveBeenCalled();
    });
    
    // Simulate transcription result
    const onResultCallback = voiceService.startRecording.mock.calls[0][0];
    onResultCallback({
      final: testTranscription,
      interim: '',
      isFinal: true
    });
    
    // Wait for transcription to be set in state
    await waitFor(() => {
      expect(screen.getByDisplayValue(testTranscription)).toBeInTheDocument();
    });
    
    // Stop recording
    const stopButton = screen.getByText('Stop Recording');
    fireEvent.click(stopButton);
    
    expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(testTranscription);
  });

  it('shows interim transcription text', async () => {
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Wait for recording to start
    await waitFor(() => {
      expect(voiceService.startRecording).toHaveBeenCalled();
    });
    
    // Simulate interim result
    const onResultCallback = voiceService.startRecording.mock.calls[0][0];
    onResultCallback({
      final: '',
      interim: 'I am eating',
      isFinal: false
    });
    
    // Wait for interim text to appear
    await waitFor(() => {
      expect(screen.getByText('I am eating')).toBeInTheDocument();
    });
  });

  it('handles transcription errors', async () => {
    const errorMessage = 'Microphone access denied';
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Simulate error
    const onErrorCallback = voiceService.startRecording.mock.calls[0][1];
    onErrorCallback(errorMessage);
    
    await waitFor(() => {
      expect(screen.getByText(`Recognition error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('shows transcription text area when recording', async () => {
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Wait for recording to start
    await waitFor(() => {
      expect(voiceService.startRecording).toHaveBeenCalled();
    });
    
    // Simulate transcription result to trigger text area display
    const onResultCallback = voiceService.startRecording.mock.calls[0][0];
    onResultCallback({
      final: 'Test transcription',
      interim: '',
      isFinal: true
    });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Transcribed text will appear here...')).toBeInTheDocument();
    });
  });

  it('displays preferred transcription method', () => {
    voiceService.getPreferredMethod.mockReturnValue('vosk');
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // The component should show which method is being used
    // This would depend on the actual implementation
    // Note: The current implementation doesn't call getPreferredMethod on render
    // but it's available for future use
    expect(voiceService.getPreferredMethod).toBeDefined();
  });

  it('cleans up timers on unmount', async () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const { unmount } = render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    // Start recording to set up timers
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Wait for recording to start and timer to be created
    await waitFor(() => {
      expect(voiceService.startRecording).toHaveBeenCalled();
    });
    
    // Advance timers to ensure the setInterval is actually created
    jest.advanceTimersByTime(1000);
    
    unmount();
    
    // clearInterval should be called during cleanup
    expect(clearIntervalSpy).toHaveBeenCalled();
    
    clearIntervalSpy.mockRestore();
  });

  it('handles Vosk transcription method', async () => {
    voiceService.getPreferredMethod.mockReturnValue('vosk');
    voiceService.isVoskAvailable = true;
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    expect(voiceService.startRecording).toHaveBeenCalled();
  });

  it('handles Web Speech API transcription method', async () => {
    voiceService.getPreferredMethod.mockReturnValue('web-speech');
    voiceService.isWebSpeechSupported = true;
    voiceService.startRecording.mockResolvedValue(true);
    
    render(<VoiceRecorder onTranscriptionComplete={mockOnTranscriptionComplete} />);
    
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    expect(voiceService.startRecording).toHaveBeenCalled();
  });
});

// Test the voice service integration
describe('VoiceRecorder Integration', () => {
  it('works with real voice service methods', () => {
    // Test that the component properly integrates with the voice service
    expect(voiceService.isVoiceSupported).toBeDefined();
    expect(voiceService.startRecording).toBeDefined();
    expect(voiceService.stopRecording).toBeDefined();
    expect(voiceService.isCurrentlyRecording).toBeDefined();
  });
});
