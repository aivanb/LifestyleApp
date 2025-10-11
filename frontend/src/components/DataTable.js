import React, { useState, useEffect } from 'react';

/**
 * DataTable Component
 * 
 * Reusable table component with sorting, filtering, and pagination.
 * This component should be used as the foundation for displaying database data.
 */
const DataTable = ({ 
  data = [], 
  schema = {}, 
  pagination = {}, 
  onSort, 
  onPageChange,
  sortBy,
  sortOrder,
  loading = false
}) => {
  const [displayFields, setDisplayFields] = useState([]);

  useEffect(() => {
    if (schema.fields && schema.fields.length > 0) {
      // Filter out system fields and limit display fields
      const fields = schema.fields
        .filter(field => !field.name.endsWith('_id') && field.name !== 'password_hash')
        .slice(0, 10); // Limit to 10 fields for better UX
      
      setDisplayFields(fields);
    }
  }, [schema]);

  const handleSort = (fieldName) => {
    if (onSort) {
      const newOrder = sortBy === fieldName && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(fieldName, newOrder);
    }
  };

  const formatValue = (value, field) => {
    if (value === null || value === undefined) {
      return <span style={{ color: '#999', fontStyle: 'italic' }}>null</span>;
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (field.type === 'DateTimeField' || field.type === 'DateField') {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }

    return value;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#666' }}>
          No data to display
        </p>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {displayFields.map(field => (
                <th key={field.name}>
                  <div 
                    className="table-header"
                    onClick={() => handleSort(field.name)}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {field.name}
                    {sortBy === field.name && (
                      <span style={{ marginLeft: '5px' }}>
                        {sortOrder === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {displayFields.map(field => (
                  <td key={field.name}>
                    {formatValue(row[field.name], field)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(pagination.current_page - 1)}
            disabled={!pagination.has_previous}
          >
            Previous
          </button>

          <span style={{ margin: '0 15px' }}>
            Page {pagination.current_page} of {pagination.pages}
            {' '}({pagination.total} total rows)
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(pagination.current_page + 1)}
            disabled={!pagination.has_next}
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .data-table-container {
          margin-top: 20px;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .data-table th,
        .data-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        .data-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          position: sticky;
          top: 0;
        }

        .data-table tbody tr:hover {
          background-color: #f5f5f5;
        }

        .table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
          padding: 20px 0;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default DataTable;

