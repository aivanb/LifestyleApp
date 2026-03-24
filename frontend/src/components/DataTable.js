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
    <div className="data-table-container card">
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {displayFields.map(field => (
                <th key={field.name}>
                  <div 
                    className="table-header"
                    onClick={() => handleSort(field.name)}
                  >
                    {field.name}
                    {sortBy === field.name && (
                      <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                        {sortOrder === 'asc' ? (
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        )}
                      </svg>
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
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="hide-mobile">Previous</span>
          </button>

          <span className="pagination-info">
            Page {pagination.current_page} of {pagination.pages}
            <span className="hide-mobile"> ({pagination.total} total rows)</span>
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(pagination.current_page + 1)}
            disabled={!pagination.has_next}
          >
            <span className="hide-mobile">Next</span>
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <style jsx>{`
        .data-table-container {
          margin-top: var(--space-6);
        }

        .table-header {
          cursor: pointer;
          user-select: none;
          transition: color 0.2s var(--ease-out-cubic);
        }

        .table-header:hover {
          color: var(--accent-primary);
        }

        .pagination-info {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }
      `}</style>
    </div>
  );
};

export default DataTable;

