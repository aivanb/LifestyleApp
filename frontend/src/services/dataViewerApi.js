import api from './api';

/**
 * Data Viewer API Service
 * 
 * Provides methods for interacting with the database viewer API.
 * This service should be used as the foundation for all future data access needs.
 */

class DataViewerAPI {
  /**
   * Get list of tables available to current user
   * 
   * @returns {Promise} Promise resolving to list of tables
   */
  async getAvailableTables() {
    const response = await api.get('/data-viewer/tables/');
    return response.data;
  }

  /**
   * Get schema information for a specific table
   * 
   * @param {string} tableName - Name of table to get schema for
   * @returns {Promise} Promise resolving to table schema
   */
  async getTableSchema(tableName) {
    const response = await api.get(`/data-viewer/tables/${tableName}/schema/`);
    return response.data;
  }

  /**
   * Get data from a table with filtering, sorting, and searching
   * 
   * @param {string} tableName - Name of table to query
   * @param {Object} options - Query options
   * @param {Object} options.filters - Field:value filter pairs
   * @param {string} options.sortBy - Field name to sort by
   * @param {string} options.sortOrder - Sort direction ('asc' or 'desc')
   * @param {string} options.search - Search term
   * @param {number} options.page - Page number (1-indexed)
   * @param {number} options.pageSize - Results per page
   * @returns {Promise} Promise resolving to table data
   */
  async getTableData(tableName, options = {}) {
    const {
      filters = {},
      sortBy = null,
      sortOrder = 'asc',
      search = null,
      page = 1,
      pageSize = 20
    } = options;

    const response = await api.post(`/data-viewer/tables/${tableName}/data/`, {
      filters,
      sort_by: sortBy,
      sort_order: sortOrder,
      search,
      page,
      page_size: pageSize
    });

    return response.data;
  }

  /**
   * Get row count for a table
   * 
   * @param {string} tableName - Name of table to count
   * @param {Object} filters - Optional filters to apply
   * @returns {Promise} Promise resolving to row count
   */
  async getTableRowCount(tableName, filters = {}) {
    const filtersParam = Object.keys(filters).length > 0 
      ? `?filters=${encodeURIComponent(JSON.stringify(filters))}` 
      : '';
    
    const response = await api.get(`/data-viewer/tables/${tableName}/count/${filtersParam}`);
    return response.data;
  }
}

const dataViewerAPI = new DataViewerAPI();
export default dataViewerAPI;

