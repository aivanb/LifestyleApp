/**
 * Test suite for Data Viewer frontend components
 * 
 * Tests cover:
 * - Component rendering
 * - User interactions
 * - API integration
 * - Filtering, sorting, and searching
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../frontend/src/contexts/AuthContext';
import DataViewer from '../../frontend/src/pages/DataViewer';
import DataTable from '../../frontend/src/components/DataTable';
import DataFilters from '../../frontend/src/components/DataFilters';
import dataViewerAPI from '../../frontend/src/services/dataViewerApi';

// Mock the data viewer API
jest.mock('../../frontend/src/services/dataViewerApi', () => ({
  getAvailableTables: jest.fn(),
  getTableSchema: jest.fn(),
  getTableData: jest.fn(),
  getTableRowCount: jest.fn(),
}));

// Mock the AuthContext
jest.mock('../../frontend/src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', access_level: 'user' },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }) => <div>{children}</div>,
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('DataTable Component', () => {
  const mockSchema = {
    fields: [
      { name: 'id', type: 'AutoField', primary_key: true },
      { name: 'name', type: 'CharField', max_length: 100 },
      { name: 'value', type: 'IntegerField' },
    ],
  };

  const mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
  ];

  const mockPagination = {
    total: 2,
    pages: 1,
    current_page: 1,
    page_size: 20,
    has_next: false,
    has_previous: false,
  };

  test('renders table with data', () => {
    render(
      <DataTable
        data={mockData}
        schema={mockSchema}
        pagination={mockPagination}
        onSort={jest.fn()}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  test('handles sorting on column click', () => {
    const onSort = jest.fn();
    
    render(
      <DataTable
        data={mockData}
        schema={mockSchema}
        pagination={mockPagination}
        onSort={onSort}
        onPageChange={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('name'));
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  test('displays pagination controls', () => {
    const mockPaginationMultiple = {
      ...mockPagination,
      pages: 3,
      current_page: 2,
      has_next: true,
      has_previous: true,
    };

    render(
      <DataTable
        data={mockData}
        schema={mockSchema}
        pagination={mockPaginationMultiple}
        onSort={jest.fn()}
        onPageChange={jest.fn()}
      />
    );

    expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeEnabled();
    expect(screen.getByText('Next')).toBeEnabled();
  });

  test('shows loading state', () => {
    render(
      <DataTable
        data={[]}
        schema={mockSchema}
        pagination={mockPagination}
        onSort={jest.fn()}
        onPageChange={jest.fn()}
        loading={true}
      />
    );

    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  test('shows empty state when no data', () => {
    render(
      <DataTable
        data={[]}
        schema={mockSchema}
        pagination={mockPagination}
        onSort={jest.fn()}
        onPageChange={jest.fn()}
        loading={false}
      />
    );

    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });
});

describe('DataFilters Component', () => {
  const mockSchema = {
    fields: [
      { name: 'name', type: 'CharField' },
      { name: 'value', type: 'IntegerField' },
      { name: 'date', type: 'DateField' },
    ],
  };

  test('renders search input', () => {
    render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={jest.fn()}
        onSearchChange={jest.fn()}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Search across all text fields/)).toBeInTheDocument();
  });

  test('handles search input change', () => {
    const onSearchChange = jest.fn();

    render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={jest.fn()}
        onSearchChange={onSearchChange}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Search across all text fields/);
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(onSearchChange).toHaveBeenCalledWith('test search');
  });

  test('adds field filter', () => {
    const onFilterChange = jest.fn();

    render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={onFilterChange}
        onSearchChange={jest.fn()}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />
    );

    // Select field
    const fieldSelect = screen.getByRole('combobox');
    fireEvent.change(fieldSelect, { target: { value: 'name' } });

    // Enter value
    const valueInput = screen.getByPlaceholderText('Filter value...');
    fireEvent.change(valueInput, { target: { value: 'test value' } });

    // Add filter
    fireEvent.click(screen.getByText('Add'));

    expect(onFilterChange).toHaveBeenCalledWith({ name: 'test value' });
  });

  test('removes filter', () => {
    const onFilterChange = jest.fn();

    const { rerender } = render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={onFilterChange}
        onSearchChange={jest.fn()}
        onApply={jest.fn()}
        onClear={jest.fn()}
      />
    );

    // Add a filter first
    const fieldSelect = screen.getByRole('combobox');
    fireEvent.change(fieldSelect, { target: { value: 'name' } });
    const valueInput = screen.getByPlaceholderText('Filter value...');
    fireEvent.change(valueInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Add'));

    // Filter should be displayed
    expect(screen.getByText(/name: test/)).toBeInTheDocument();

    // Remove filter
    const removeButton = screen.getByTitle('Remove filter');
    fireEvent.click(removeButton);

    expect(onFilterChange).toHaveBeenLastCalledWith({});
  });

  test('applies filters', () => {
    const onApply = jest.fn();

    render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={jest.fn()}
        onSearchChange={jest.fn()}
        onApply={onApply}
        onClear={jest.fn()}
      />
    );

    fireEvent.click(screen.getByText('Apply Filters'));
    expect(onApply).toHaveBeenCalled();
  });

  test('clears all filters', () => {
    const onClear = jest.fn();

    render(
      <DataFilters
        schema={mockSchema}
        onFilterChange={jest.fn()}
        onSearchChange={jest.fn()}
        onApply={jest.fn()}
        onClear={onClear}
      />
    );

    fireEvent.click(screen.getByText('Clear All'));
    expect(onClear).toHaveBeenCalled();
  });
});

describe('DataViewer Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock API responses
    dataViewerAPI.getAvailableTables.mockResolvedValue({
      data: {
        tables: [
          { name: 'foods', app: 'foods', field_count: 20, has_user_field: false, has_public_field: true },
          { name: 'meals', app: 'foods', field_count: 5, has_user_field: true, has_public_field: false },
        ],
        access_level: 'user',
        total_count: 2,
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
        has_user_field: false,
        has_public_field: true,
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
        search_applied: null,
      },
    });
  });

  test('renders data viewer page', async () => {
    render(
      <TestWrapper>
        <DataViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Database Viewer')).toBeInTheDocument();
    });
  });

  test('loads and displays available tables', async () => {
    render(
      <TestWrapper>
        <DataViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('foods')).toBeInTheDocument();
      expect(screen.getByText('meals')).toBeInTheDocument();
    });
  });

  test('loads table data when table is selected', async () => {
    render(
      <TestWrapper>
        <DataViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('foods')).toBeInTheDocument();
    });

    // Click on table to select it
    fireEvent.click(screen.getByText('foods'));

    await waitFor(() => {
      expect(dataViewerAPI.getTableSchema).toHaveBeenCalledWith('foods');
      expect(dataViewerAPI.getTableData).toHaveBeenCalled();
    });
  });

  test('displays access level information', async () => {
    render(
      <TestWrapper>
        <DataViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Access Level: user/)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    dataViewerAPI.getAvailableTables.mockRejectedValue({
      response: {
        data: {
          error: { message: 'Failed to load tables' },
        },
      },
    });

    render(
      <TestWrapper>
        <DataViewer />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load tables/)).toBeInTheDocument();
    });
  });
});

