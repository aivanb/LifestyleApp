import React, { useState, useEffect } from 'react';

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
        <h3>Filters & Search</h3>

        {/* Search */}
        <div className="filter-section">
          <div className="form-group">
            <label className="form-label">Search (full-text)</label>
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
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            className="btn btn-primary"
            onClick={handleApply}
          >
            Apply Filters
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
          >
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

