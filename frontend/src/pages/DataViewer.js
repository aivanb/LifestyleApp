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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="data-viewer animate-fade-in" style={{ padding: 0 }}>
      <div className="flex items-center gap-4 mb-6">
        <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--accent-primary)">
          <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
          <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
          <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
        </svg>
        <h1 style={{ margin: 0 }}>Database Viewer</h1>
      </div>
      
      <div className="card" style={{ background: 'var(--accent-primary-alpha)', borderColor: 'var(--accent-primary)' }}>
        <div className="flex items-center gap-3">
          <svg className="icon" viewBox="0 0 20 20" fill="var(--accent-primary)">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
              Access Level: {user?.access_level || 'guest'}
            </h3>
            <p style={{ marginBottom: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {user?.access_level === 'admin' && 
                'Full access to all tables and all user data.'}
              {user?.access_level === 'user' && 
                'View your own data and public data. Internal tables are hidden.'}
              {(!user?.access_level || user?.access_level === 'guest') && 
                'View public data only. User-specific data is hidden.'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card animate-slide-in-up" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--accent-danger)' }}>
          <div className="flex items-center gap-3">
            <svg className="icon" viewBox="0 0 20 20" fill="var(--accent-danger)">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ color: 'var(--accent-danger)', margin: 0 }}>
              <strong>Error:</strong> {error}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 350px) 1fr', gap: 'var(--space-6)', minHeight: 'calc(100vh - 200px)' }}>
        {/* Tables List Sidebar */}
        <div>
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <svg className="icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <h3 style={{ margin: 0 }}>Available Tables</h3>
            </div>
            
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
            <div className="card text-center">
              <svg className="icon icon-xl" viewBox="0 0 20 20" fill="var(--text-tertiary)" style={{ margin: '0 auto var(--space-4)' }}>
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                Select a table from the sidebar to view its data
              </p>
            </div>
          ) : (
            <>
              {/* Table Info */}
              <div className="card animate-slide-in-right">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="icon" viewBox="0 0 20 20" fill="var(--accent-primary)">
                    <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                  </svg>
                  <h2 style={{ margin: 0 }}>{selectedTable}</h2>
                </div>
                {schema.description && (
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                    {schema.description}
                  </p>
                )}
                <div className="flex gap-6 text-sm" style={{ flexWrap: 'wrap' }}>
                  <div className="flex items-center gap-2">
                    <svg className="icon icon-sm" viewBox="0 0 20 20" fill="var(--text-tertiary)">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    <strong>Fields:</strong> {schema.fields?.length || 0}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="icon icon-sm" viewBox="0 0 20 20" fill="var(--text-tertiary)">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <strong>Rows:</strong> {pagination.total || 0}
                  </div>
                  {schema.has_user_field && (
                    <div className="badge badge-primary flex items-center gap-2">
                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      User-specific
                    </div>
                  )}
                  {schema.has_public_field && (
                    <div className="badge badge-success flex items-center gap-2">
                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                      </svg>
                      Public data
                    </div>
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
          padding: var(--space-6) 0;
        }

        .tables-list {
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .table-group {
          margin-bottom: var(--space-5);
        }

        .table-group-header {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          padding: var(--space-2) var(--space-3);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          margin-bottom: var(--space-2);
          text-transform: capitalize;
          font-size: var(--text-sm);
          letter-spacing: 0.05em;
        }

        .table-item {
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          margin-bottom: var(--space-2);
          border: 1px solid transparent;
        }

        .table-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-primary);
          transform: translateX(4px);
        }

        .table-item.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md);
        }

        .table-name {
          font-weight: var(--font-weight-medium);
          margin-bottom: var(--space-1);
          font-size: var(--text-base);
        }

        .table-info {
          font-size: var(--text-xs);
          opacity: 0.8;
        }

        .table-item.active .table-info {
          opacity: 1;
        }

        .form-input {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          font-family: var(--font-primary);
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.1);
        }

        .form-input::placeholder {
          color: var(--text-tertiary);
        }

        @media (max-width: 1024px) {
          .data-viewer > div:first-of-type {
            grid-template-columns: 1fr !important;
            gap: var(--space-4) !important;
          }
          
          .data-viewer > div:first-of-type > div:first-child {
            order: 2;
          }
          
          .data-viewer > div:first-of-type > div:last-child {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default DataViewer;

