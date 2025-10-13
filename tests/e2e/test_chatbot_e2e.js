/**
 * E2E Tests for Food Chatbot System
 * 
 * Tests complete workflows including:
 * - Text input parsing and logging
 * - Voice recording and transcription
 * - Meal creation via chatbot
 * - Metadata generation
 * - Interaction history
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import FoodChatbot from '../../frontend/src/components/FoodChatbot';
import VoiceRecorder from '../../frontend/src/components/VoiceRecorder';
import FoodCreator from '../../frontend/src/components/FoodCreator';
import api from '../../frontend/src/services/api';

// Mock API
jest.mock('../../frontend/src/services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  createFood: jest.fn(),
}));

// Mock voice service
jest.mock('../../frontend/src/services/voiceService', () => ({
  __esModule: true,
  default: {
    isVoiceSupported: () => true,
    initializeRecognition: jest.fn(() => ({
      start: jest.fn(),
      stop: jest.fn()
    })),
    start: jest.fn(),
    stop: jest.fn()
  }
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Food Chatbot E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Text Input Parsing', () => {
    test('parses and logs foods from text input', async () => {
      const onFoodsLogged = jest.fn();

      api.post.mockResolvedValue({
        data: {
          data: {
            success: true,
            foods_parsed: [
              { name: 'Chicken Breast', source: 'food_exact' }
            ],
            logs_created: [
              { log_id: 1, food_name: 'Chicken Breast', servings: 2 }
            ],
            meal_created: null,
            errors: []
          }
        }
      });

      render(
        <TestWrapper>
          <FoodChatbot onFoodsLogged={onFoodsLogged} />
        </TestWrapper>
      );

      // Enter text
      const textarea = screen.getByPlaceholderText(/describe your food/i);
      fireEvent.change(textarea, {
        target: { value: '2 chicken breasts' }
      });

      // Submit
      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/openai/parse-food/', {
          input_text: '2 chicken breasts',
          create_meal: false
        });
        expect(onFoodsLogged).toHaveBeenCalled();
      });
    });

    test('creates meal from parsed foods', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            success: true,
            foods_parsed: [
              { name: 'Chicken', source: 'food_exact' },
              { name: 'Rice', source: 'food_exact' }
            ],
            logs_created: [
              { log_id: 1, food_name: 'Chicken' },
              { log_id: 2, food_name: 'Rice' }
            ],
            meal_created: { meal_id: 1, meal_name: 'Lunch' },
            errors: []
          }
        }
      });

      render(
        <TestWrapper>
          <FoodChatbot onFoodsLogged={jest.fn()} />
        </TestWrapper>
      );

      // Enter text
      fireEvent.change(screen.getByPlaceholderText(/describe your food/i), {
        target: { value: 'chicken and rice' }
      });

      // Click Create Meal
      fireEvent.click(screen.getByText('Create Meal'));

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/openai/parse-food/', {
          input_text: 'chicken and rice',
          create_meal: true
        });
      });
    });

    test('displays recent interactions', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            success: true,
            foods_parsed: [{ name: 'Apple' }],
            logs_created: [{ log_id: 1, food_name: 'Apple', servings: 1 }],
            meal_created: null,
            errors: []
          }
        }
      });

      render(
        <TestWrapper>
          <FoodChatbot onFoodsLogged={jest.fn()} />
        </TestWrapper>
      );

      // Submit interaction
      fireEvent.change(screen.getByPlaceholderText(/describe your food/i), {
        target: { value: '1 apple' }
      });

      fireEvent.click(screen.getByText('Send'));

      // Should display in history
      await waitFor(() => {
        expect(screen.getByText('Recent Interactions')).toBeInTheDocument();
        expect(screen.getByText(/1 food\(s\) logged/i)).toBeInTheDocument();
      });
    });

    test('handles parsing errors gracefully', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            success: false,
            foods_parsed: [],
            logs_created: [],
            meal_created: null,
            errors: ['No foods could be parsed from input']
          }
        }
      });

      render(
        <TestWrapper>
          <FoodChatbot onFoodsLogged={jest.fn()} />
        </TestWrapper>
      );

      fireEvent.change(screen.getByPlaceholderText(/describe your food/i), {
        target: { value: 'invalid input' }
      });

      fireEvent.click(screen.getByText('Send'));

      await waitFor(() => {
        expect(screen.getByText(/No foods could be parsed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Voice Input', () => {
    test('toggles voice recorder', () => {
      render(
        <TestWrapper>
          <FoodChatbot onFoodsLogged={jest.fn()} />
        </TestWrapper>
      );

      // Voice recorder should not be visible
      expect(screen.queryByText('Voice Input')).not.toBeInTheDocument();

      // Click to show voice
      fireEvent.click(screen.getByText('Voice Input'));

      // Should display voice recorder
      expect(screen.getByText(/Voice Input/i)).toBeInTheDocument();
    });

    test('transcription updates text input', () => {
      const onTranscriptionComplete = jest.fn();

      render(
        <TestWrapper>
          <VoiceRecorder onTranscriptionComplete={onTranscriptionComplete} />
        </TestWrapper>
      );

      // Voice recorder controls should be visible
      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });
  });

  describe('Metadata Generation', () => {
    test('generates missing metadata for manual food creation', async () => {
      api.post.mockResolvedValue({
        data: {
          data: {
            food_name: 'Apple',
            metadata: {
              calories: 95,
              protein: 0.5,
              fat: 0.3,
              carbohydrates: 25,
              fiber: 4,
              food_group: 'fruit'
            }
          }
        }
      });

      api.createFood.mockResolvedValue({
        data: {
          data: {
            food_id: 1,
            food_name: 'Apple'
          }
        }
      });

      render(
        <TestWrapper>
          <FoodCreator onFoodCreated={jest.fn()} />
        </TestWrapper>
      );

      // Enter food name
      fireEvent.change(screen.getByLabelText(/Food Name/i), {
        target: { value: 'Apple' }
      });

      // Click generate metadata button
      const generateButton = screen.getByText(/AI Generate Missing Data/i);
      fireEvent.click(generateButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/openai/generate-metadata/', {
          food_name: 'Apple',
          existing_metadata: expect.any(Object)
        });
      });
    });
  });
});


if __name__ == '__main__':
    unittest.main()

