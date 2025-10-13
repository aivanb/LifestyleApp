import React, { useState } from 'react';

/**
 * DataFilters Component
 * 
 * Reusable component for filtering data based on table schema.
 * Provides text search and field-specific filters.
 */
const DataFilters = ({ schema, onFilterChange, onSearchChange, onApply, onClear }) => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [selectedField, setSelectedField] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Get filterable fields (exclude complex types)
  const filterableFields = schema.fields ? schema.fields.filter(field => 
    !field.name.endsWith('_id') &&
    field.name !== 'password_hash' &&
    !field.many_to_many &&
    !field.one_to_many &&
    field.type !== 'JSONField'
  ) : [];

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleAddFilter = () => {
    if (selectedField && filterValue) {
      const newFilters = {
        ...filters,
        [selectedField]: filterValue
      };
      setFilters(newFilters);
      setSelectedField('');
      setFilterValue('');
      
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
    }
  };

  const handleRemoveFilter = (fieldName) => {
    const newFilters = { ...filters };
    delete newFilters[fieldName];
    setFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply({ search, filters });
    }
  };

  const handleClear = () => {
    setSearch('');
    setFilters({});
    setSelectedField('');
    setFilterValue('');
    
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="data-filters">
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <svg className="icon icon-lg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
          </svg>
          <h3 style={{ margin: 0 }}>Filters & Search</h3>
        </div>

        {/* Search */}
        <div className="filter-section">
          <div className="form-group">
            <label className="form-label">
              <svg className="icon icon-sm" viewBox="0 0 20 20" fill="currentColor" style={{ display: 'inline', marginRight: '0.5rem' }}>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Search (full-text)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Search across all text fields..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Field Filters */}
        <div className="filter-section">
          <div className="form-label">Field Filters</div>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              className="form-input"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select field...</option>
              {filterableFields.map(field => (
                <option key={field.name} value={field.name}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>

            <input
              type="text"
              className="form-input"
              placeholder="Filter value..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              style={{ flex: 1 }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFilter()}
            />

            <button
              className="btn btn-secondary"
              onClick={handleAddFilter}
              disabled={!selectedField || !filterValue}
            >
              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add
            </button>
          </div>

          {/* Active Filters */}
          {Object.keys(filters).length > 0 && (
            <div className="active-filters">
              <div className="form-label">Active Filters:</div>
              {Object.entries(filters).map(([field, value]) => (
                <div key={field} className="filter-tag">
                  <span>{field}: {value}</span>
                  <button
                    className="filter-remove"
                    onClick={() => handleRemoveFilter(field)}
                    title="Remove filter"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            className="btn btn-primary"
            onClick={handleApply}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Apply Filters
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
          >
            <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L9.586 10 5.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Clear All
          </button>
        </div>
      </div>

      <style jsx>{`
        .data-filters {
          margin-bottom: 20px;
        }

        .filter-section {
          margin-bottom: 20px;
        }

        .filter-section:last-child {
          margin-bottom: 0;
        }

        .active-filters {
          margin-top: 10px;
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          background-color: #e9ecef;
          border-radius: 4px;
          padding: 5px 10px;
          margin-right: 10px;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .filter-remove {
          margin-left: 10px;
          background: none;
          border: none;
          color: #dc3545;
          font-size: 20px;
          font-weight: bold;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .filter-remove:hover {
          color: #c82333;
        }
      `}</style>
    </div>
  );
};

export default DataFilters;

