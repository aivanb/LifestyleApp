/**
 * E2E Tests for Food Logging System
 * 
 * Tests complete user flows including:
 * - Food creation with macro preview
 * - Meal creation with multiple foods
 * - Food logging and viewing
 * - Search and filtering
 * - Delete functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import FoodLog from '../../frontend/src/pages/FoodLog';
import FoodCreator from '../../frontend/src/components/FoodCreator';
import MealCreator from '../../frontend/src/components/MealCreator';
import FoodLogViewer from '../../frontend/src/components/FoodLogViewer';
import api from '../../frontend/src/services/api';

// Mock API
jest.mock('../../frontend/src/services/api', () => ({
  createFood: jest.fn(),
  createMeal: jest.fn(),
  getFoods: jest.fn(),
  getFoodLogs: jest.fn(),
  deleteFoodLog: jest.fn(),
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('Food Logging E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Food Creation Flow', () => {
    test('creates food with macro preview', async () => {
      const onFoodCreated = jest.fn();

      api.createFood.mockResolvedValue({
        data: {
          data: {
            food_id: 1,
            food_name: 'Chicken Breast',
            calories: 165,
            protein: 31,
            carbohydrates: 0,
            fat: 3.6,
            macro_preview: { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6 }
          }
        }
      });

      render(
        <TestWrapper>
          <FoodCreator onFoodCreated={onFoodCreated} />
        </TestWrapper>
      );

      // Fill in food details
      fireEvent.change(screen.getByLabelText(/Food Name/i), {
        target: { value: 'Chicken Breast' }
      });

      fireEvent.change(screen.getByLabelText(/Serving Size/i), {
        target: { value: '100' }
      });

      fireEvent.change(screen.getByLabelText(/Calories/i), {
        target: { value: '165' }
      });

      fireEvent.change(screen.getByLabelText(/Protein/i), {
        target: { value: '31' }
      });

      fireEvent.change(screen.getByLabelText(/Carbohydrates/i), {
        target: { value: '0' }
      });

      fireEvent.change(screen.getByLabelText(/^Fat/i), {
        target: { value: '3.6' }
      });

      // Check macro preview updates
      await waitFor(() => {
        expect(screen.getByText('165')).toBeInTheDocument(); // Calories
        expect(screen.getByText('31g')).toBeInTheDocument();  // Protein
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Food'));

      await waitFor(() => {
        expect(api.createFood).toHaveBeenCalled();
        expect(onFoodCreated).toHaveBeenCalled();
      });
    });

    test('creates food and logs it immediately', async () => {
      api.createFood.mockResolvedValue({
        data: {
          data: {
            food_id: 1,
            food_name: 'Chicken Breast',
            create_and_log: true
          }
        }
      });

      render(
        <TestWrapper>
          <FoodCreator onFoodCreated={jest.fn()} />
        </TestWrapper>
      );

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Food Name/i), {
        target: { value: 'Chicken Breast' }
      });

      fireEvent.change(screen.getByLabelText(/Serving Size/i), {
        target: { value: '100' }
      });

      fireEvent.change(screen.getByLabelText(/Calories/i), {
        target: { value: '165' }
      });

      fireEvent.change(screen.getByLabelText(/Protein/i), {
        target: { value: '31' }
      });

      fireEvent.change(screen.getByLabelText(/Carbohydrates/i), {
        target: { value: '0' }
      });

      fireEvent.change(screen.getByLabelText(/^Fat/i), {
        target: { value: '3.6' }
      });

      // Check "Log immediately" option
      const checkbox = screen.getByLabelText(/Log immediately/i);
      fireEvent.click(checkbox);

      // Submit
      fireEvent.click(screen.getByText('Create Food'));

      await waitFor(() => {
        expect(api.createFood).toHaveBeenCalledWith(
          expect.objectContaining({
            create_and_log: true
          })
        );
      });
    });
  });

  describe('Meal Creation Flow', () => {
    test('creates meal with multiple foods', async () => {
      const onMealCreated = jest.fn();

      api.getFoods.mockResolvedValue({
        data: {
          data: {
            foods: [
              {
                food_id: 1,
                food_name: 'Food 1',
                macro_preview: { calories: 100, protein: 10, carbohydrates: 10, fat: 5 }
              },
              {
                food_id: 2,
                food_name: 'Food 2',
                macro_preview: { calories: 200, protein: 20, carbohydrates: 20, fat: 10 }
              }
            ]
          }
        }
      });

      api.createMeal.mockResolvedValue({
        data: {
          data: {
            meal_id: 1,
            meal_name: 'Test Meal',
            macro_preview: { calories: 300, protein: 30, carbohydrates: 30, fat: 15 }
          }
        }
      });

      render(
        <TestWrapper>
          <MealCreator onMealCreated={onMealCreated} />
        </TestWrapper>
      );

      // Enter meal name
      fireEvent.change(screen.getByLabelText(/Meal Name/i), {
        target: { value: 'Test Meal' }
      });

      // Search for foods
      fireEvent.change(screen.getByLabelText(/Search Foods/i), {
        target: { value: 'Food' }
      });

      // Foods should appear
      await waitFor(() => {
        expect(screen.getByText('Food 1')).toBeInTheDocument();
      });

      // Add foods to meal
      fireEvent.click(screen.getByText('Food 1'));
      fireEvent.click(screen.getByText('Food 2'));

      // Submit
      fireEvent.click(screen.getByText('Create Meal'));

      await waitFor(() => {
        expect(api.createMeal).toHaveBeenCalled();
        expect(onMealCreated).toHaveBeenCalled();
      });
    });
  });

  describe('Food Log Viewing Flow', () => {
    test('displays food logs with filtering', async () => {
      api.getFoodLogs.mockResolvedValue({
        data: {
          data: {
            logs: [
              {
                macro_log_id: 1,
                food_name: 'Chicken Breast',
                servings: 1,
                date_time: new Date().toISOString(),
                consumed_macros: {
                  calories: 165,
                  protein: 31,
                  carbohydrates: 0,
                  fat: 3.6
                }
              }
            ],
            pagination: {
              total: 1,
              page: 1,
              pages: 1
            }
          }
        }
      });

      render(
        <TestWrapper>
          <FoodLogViewer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Chicken Breast')).toBeInTheDocument();
        expect(screen.getByText(/165.*cal/)).toBeInTheDocument();
      });
    });

    test('deletes food log entry', async () => {
      global.confirm = jest.fn(() => true);

      api.getFoodLogs.mockResolvedValue({
        data: {
          data: {
            logs: [
              {
                macro_log_id: 1,
                food_name: 'Test Food',
                servings: 1,
                date_time: new Date().toISOString(),
                consumed_macros: { calories: 100, protein: 10, carbohydrates: 10, fat: 5 }
              }
            ]
          }
        }
      });

      api.deleteFoodLog.mockResolvedValue({
        data: { data: { message: 'Deleted' } }
      });

      render(
        <TestWrapper>
          <FoodLogViewer />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Food')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByLabelText(/Delete log/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(api.deleteFoodLog).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Tab Navigation Flow', () => {
    test('switches between tabs', async () => {
      api.getFoodLogs.mockResolvedValue({
        data: { data: { logs: [] } }
      });

      api.getFoods.mockResolvedValue({
        data: { data: { foods: [] } }
      });

      render(
        <TestWrapper>
          <FoodLog />
        </TestWrapper>
      );

      // Should start on View Log tab
      expect(screen.getByText('Food Log')).toBeInTheDocument();

      // Switch to Create Food tab
      fireEvent.click(screen.getByText('Create Food'));

      await waitFor(() => {
        expect(screen.getByText('Create New Food')).toBeInTheDocument();
      });

      // Switch to Create Meal tab
      fireEvent.click(screen.getByText('Create Meal'));

      await waitFor(() => {
        expect(screen.getByText('Create New Meal')).toBeInTheDocument();
      });

      // Switch back to View Log
      fireEvent.click(screen.getByText('View Log'));

      await waitFor(() => {
        expect(screen.getByText('Food Log')).toBeInTheDocument();
      });
    });
  });
});

