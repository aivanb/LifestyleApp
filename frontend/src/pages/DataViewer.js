import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dataViewerAPI from '../services/dataViewerApi';
import DataTable from '../components/DataTable';
import DataFilters from '../components/DataFilters';

/**
 * DataViewer Page
 * 
 * Main interface for viewing database data with comprehensive filtering,
 * sorting, and searching capabilities. Implements role-based access control.
 */
const DataViewer = () => {
  const { user } = useAuth();
  
  // State for tables list
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loadingTables, setLoadingTables] = useState(true);
  
  // State for table data
  const [schema, setSchema] = useState({});
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  
  // State for filters and search
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for errors
  const [error, setError] = useState('');

  // Load available tables on mount
  useEffect(() => {
    loadTables();
  }, []);

  // Load table data when table selection or filters change
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
    }
  }, [selectedTable, currentPage]);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const response = await dataViewerAPI.getAvailableTables();
      
      if (response.data && response.data.tables) {
        setTables(response.data.tables);
        setError('');
      }
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError(err.response?.data?.error?.message || 'Failed to load tables');
    } finally {
      setLoadingTables(false);
    }
  };

  const loadTableSchema = async (tableName) => {
    try {
      const response = await dataViewerAPI.getTableSchema(tableName);
      
      if (response.data) {
        setSchema(response.data);
        setError('');
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(err.response?.data?.error?.message || 'Failed to load table schema');
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;

    try {
      setLoadingData(true);
      const response = await dataViewerAPI.getTableData(selectedTable, {
        filters,
        sortBy,
        sortOrder,
        search,
        page: currentPage,
        pageSize: 20
      });

      if (response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination);
        setError('');
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load table data');
      setData([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTableSelect = async (tableName) => {
    setSelectedTable(tableName);
    setData([]);
    setFilters({});
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setCurrentPage(1);
    setPagination({});
    setError('');
    
    // Load schema for the selected table
    await loadTableSchema(tableName);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (newSearch) => {
    setSearch(newSearch);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadTableData();
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearch('');
    setSortBy(null);
    setSortOrder('asc');
    setCurrentPage(1);
    loadTableData();
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
    loadTableData();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getTablesByApp = () => {
    const grouped = {};
    tables.forEach(table => {
      if (!grouped[table.app]) {
        grouped[table.app] = [];
      }
      grouped[table.app].push(table);
    });
    return grouped;
  };

  return (
    <div className="data-viewer">
      <h1>Database Viewer</h1>
      
      <div className="card" style={{ marginBottom: '20px', backgroundColor: '#e7f3ff' }}>
        <h3 style={{ marginTop: 0 }}>👤 Access Level: {user?.access_level || 'guest'}</h3>
        <p style={{ marginBottom: 0 }}>
          {user?.access_level === 'admin' && 
            'You have full access to all tables and all user data.'}
          {user?.access_level === 'user' && 
            'You can view your own data and public data. Internal tables are hidden.'}
          {(!user?.access_level || user?.access_level === 'guest') && 
            'You can only view public data. User-specific data is hidden.'}
        </p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: '#f8d7da', marginBottom: '20px' }}>
          <p style={{ color: '#721c24', margin: 0 }}>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        {/* Tables List Sidebar */}
        <div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Available Tables</h3>
            
            {loadingTables ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading tables...</p>
              </div>
            ) : (
              <div className="tables-list">
                {Object.entries(getTablesByApp()).map(([app, appTables]) => (
                  <div key={app} className="table-group">
                    <div className="table-group-header">
                      {app}
                    </div>
                    {appTables.map(table => (
                      <div
                        key={table.name}
                        className={`table-item ${selectedTable === table.name ? 'active' : ''}`}
                        onClick={() => handleTableSelect(table.name)}
                      >
                        <div className="table-name">{table.name}</div>
                        <div className="table-info">
                          {table.field_count} fields
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div>
          {!selectedTable ? (
            <div className="card">
              <p style={{ textAlign: 'center', color: '#666' }}>
                Select a table from the sidebar to view its data
              </p>
            </div>
          ) : (
            <>
              {/* Table Info */}
              <div className="card" style={{ marginBottom: '20px' }}>
                <h2 style={{ marginTop: 0 }}>{selectedTable}</h2>
                {schema.description && (
                  <p style={{ color: '#666', marginBottom: '10px' }}>
                    {schema.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
                  <span>
                    <strong>Fields:</strong> {schema.fields?.length || 0}
                  </span>
                  <span>
                    <strong>Rows:</strong> {pagination.total || 0}
                  </span>
                  {schema.has_user_field && (
                    <span style={{ color: '#007bff' }}>
                      🔒 User-specific data
                    </span>
                  )}
                  {schema.has_public_field && (
                    <span style={{ color: '#28a745' }}>
                      🌐 Public data available
                    </span>
                  )}
                </div>
              </div>

              {/* Filters */}
              <DataFilters
                schema={schema}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
              />

              {/* Data Table */}
              <DataTable
                data={data}
                schema={schema}
                pagination={pagination}
                onSort={handleSort}
                onPageChange={handlePageChange}
                sortBy={sortBy}
                sortOrder={sortOrder}
                loading={loadingData}
              />
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .data-viewer {
          padding: 20px 0;
        }

        .tables-list {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .table-group {
          margin-bottom: 20px;
        }

        .table-group-header {
          font-weight: bold;
          color: #495057;
          padding: 8px;
          background-color: #f8f9fa;
          border-radius: 4px;
          margin-bottom: 5px;
          text-transform: capitalize;
        }

        .table-item {
          padding: 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 5px;
        }

        .table-item:hover {
          background-color: #f8f9fa;
        }

        .table-item.active {
          background-color: #007bff;
          color: white;
        }

        .table-name {
          font-weight: 500;
          margin-bottom: 3px;
        }

        .table-info {
          font-size: 12px;
          opacity: 0.8;
        }

        .table-item.active .table-info {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default DataViewer;

