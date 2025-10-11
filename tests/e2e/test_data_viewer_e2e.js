/**
 * End-to-End Tests for Data Viewer
 * 
 * Tests complete user flows including:
 * - Authentication and access control
 * - Table selection and data viewing
 * - Filtering, sorting, and searching
 * - Pagination
 * - Role-based data visibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import App from '../../frontend/src/App';
import api from '../../frontend/src/services/api';
import dataViewerAPI from '../../frontend/src/services/dataViewerApi';

// Mock the API services
jest.mock('../../frontend/src/services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  setAuthToken: jest.fn(),
}));

jest.mock('../../frontend/src/services/dataViewerApi', () => ({
  getAvailableTables: jest.fn(),
  getTableSchema: jest.fn(),
  getTableData: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Data Viewer E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Authentication Flow', () => {
    test('redirects unauthenticated users to login', () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('authenticated users can access data viewer', async () => {
      // Mock authentication
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      // Mock data viewer API
      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [{ name: 'foods', app: 'foods', field_count: 20 }],
          access_level: 'user',
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        expect(screen.getByText('Database Viewer')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    test('admin users see all tables', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'admin', access_level: 'admin' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [
            { name: 'foods', app: 'foods' },
            { name: 'users', app: 'users' },
            { name: 'auth_permission', app: 'auth' },  // Internal table
          ],
          access_level: 'admin',
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        expect(screen.getByText('auth_permission')).toBeInTheDocument();
      });
    });

    test('regular users do not see internal tables', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'user', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [
            { name: 'foods', app: 'foods' },
            { name: 'users', app: 'users' },
          ],
          access_level: 'user',
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        expect(screen.queryByText('auth_permission')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Viewing Flow', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [{ name: 'foods', app: 'foods', field_count: 20 }],
          access_level: 'user',
        },
      });

      dataViewerAPI.getTableSchema.mockResolvedValue({
        data: {
          table_name: 'foods',
          fields: [
            { name: 'food_id', type: 'AutoField' },
            { name: 'food_name', type: 'CharField' },
            { name: 'calories', type: 'IntegerField' },
          ],
        },
      });

      dataViewerAPI.getTableData.mockResolvedValue({
        data: {
          data: [
            { food_id: 1, food_name: 'Apple', calories: 95 },
            { food_id: 2, food_name: 'Banana', calories: 105 },
          ],
          pagination: {
            total: 2,
            pages: 1,
            current_page: 1,
            page_size: 20,
            has_next: false,
            has_previous: false,
          },
          filters_applied: {},
          sort_applied: null,
        },
      });
    });

    test('complete data viewing flow', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      // Navigate to data viewer
      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      // Select a table
      await waitFor(() => {
        expect(screen.getByText('foods')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('foods'));

      // Data should be loaded
      await waitFor(() => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
      });

      // Verify API calls
      expect(dataViewerAPI.getTableSchema).toHaveBeenCalledWith('foods');
      expect(dataViewerAPI.getTableData).toHaveBeenCalled();
    });
  });

  describe('Filtering and Searching', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [{ name: 'foods', app: 'foods', field_count: 20 }],
        },
      });

      dataViewerAPI.getTableSchema.mockResolvedValue({
        data: {
          table_name: 'foods',
          fields: [
            { name: 'food_name', type: 'CharField' },
            { name: 'food_group', type: 'CharField' },
          ],
        },
      });

      dataViewerAPI.getTableData.mockResolvedValue({
        data: {
          data: [{ food_name: 'Apple', food_group: 'fruit' }],
          pagination: { total: 1, pages: 1, current_page: 1 },
          filters_applied: {},
        },
      });
    });

    test('applies search filter', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('foods'));
      });

      // Enter search term
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search across all text fields/);
        fireEvent.change(searchInput, { target: { value: 'Apple' } });
      });

      // Apply filters
      fireEvent.click(screen.getByText('Apply Filters'));

      await waitFor(() => {
        expect(dataViewerAPI.getTableData).toHaveBeenCalledWith(
          'foods',
          expect.objectContaining({ search: 'Apple' })
        );
      });
    });

    test('applies field filter', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('foods'));
      });

      // Add field filter
      await waitFor(() => {
        const fieldSelect = screen.getByRole('combobox');
        fireEvent.change(fieldSelect, { target: { value: 'food_group' } });

        const valueInput = screen.getByPlaceholderText('Filter value...');
        fireEvent.change(valueInput, { target: { value: 'fruit' } });

        fireEvent.click(screen.getByText('Add'));
      });

      // Apply filters
      fireEvent.click(screen.getByText('Apply Filters'));

      await waitFor(() => {
        expect(dataViewerAPI.getTableData).toHaveBeenCalledWith(
          'foods',
          expect.objectContaining({
            filters: { food_group: 'fruit' }
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    test('navigates through pages', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [{ name: 'foods', app: 'foods' }],
        },
      });

      dataViewerAPI.getTableSchema.mockResolvedValue({
        data: {
          table_name: 'foods',
          fields: [{ name: 'food_name', type: 'CharField' }],
        },
      });

      dataViewerAPI.getTableData.mockResolvedValue({
        data: {
          data: [{ food_name: 'Apple' }],
          pagination: {
            total: 50,
            pages: 3,
            current_page: 1,
            has_next: true,
            has_previous: false,
          },
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('foods'));
      });

      // Navigate to next page
      await waitFor(() => {
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);
      });

      expect(dataViewerAPI.getTableData).toHaveBeenLastCalledWith(
        'foods',
        expect.objectContaining({ page: 2 })
      );
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockRejectedValue({
        response: {
          data: {
            error: { message: 'Server error' },
          },
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Server error/)).toBeInTheDocument();
      });
    });

    test('handles unauthorized access attempts', async () => {
      localStorageMock.getItem.mockReturnValue('access-token');
      api.get.mockResolvedValueOnce({
        data: {
          data: { username: 'testuser', access_level: 'user' },
        },
      });

      dataViewerAPI.getAvailableTables.mockResolvedValue({
        data: {
          tables: [{ name: 'foods', app: 'foods' }],
        },
      });

      dataViewerAPI.getTableData.mockRejectedValue({
        response: {
          status: 401,
          data: {
            error: { message: 'Access denied' },
          },
        },
      });

      render(
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        fireEvent.click(screen.getByText('Data Viewer'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('foods'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Access denied/)).toBeInTheDocument();
      });
    });
  });
});

