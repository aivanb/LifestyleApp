import React from 'react';

const FoodMetadataModal = ({ food, onClose }) => {
  // Define all metadata fields with their units
  const metadataFields = [
    { key: 'serving_size', label: 'Serving Size', unit: '' },
    { key: 'unit', label: 'Unit', unit: '' },
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'fat', label: 'Fat', unit: 'g' },
    { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
    { key: 'fiber', label: 'Fiber', unit: 'g' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'sugar', label: 'Sugar', unit: 'g' },
    { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
    { key: 'trans_fat', label: 'Trans Fat', unit: 'g' },
    { key: 'calcium', label: 'Calcium', unit: 'mg' },
    { key: 'iron', label: 'Iron', unit: 'mg' },
    { key: 'magnesium', label: 'Magnesium', unit: 'mg' },
    { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
    { key: 'vitamin_a', label: 'Vitamin A', unit: 'IU' },
    { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg' },
    { key: 'vitamin_d', label: 'Vitamin D', unit: 'IU' },
    { key: 'caffeine', label: 'Caffeine', unit: 'mg' },
    { key: 'brand', label: 'Brand', unit: '' },
    { key: 'cost', label: 'Cost', unit: '$' },
    { key: 'make_public', label: 'Public', unit: '' },
    { key: 'created_at', label: 'Created At', unit: '' },
    { key: 'updated_at', label: 'Updated At', unit: '' }
  ];

  const getFoodData = () => {
    // Use food_details if available (from food log), otherwise use food object directly
    return food.food_details || food;
  };

  const foodData = getFoodData();

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    if (key === 'make_public') {
      return value ? 'Yes' : 'No';
    }
    if (key === 'created_at' || key === 'updated_at') {
      return new Date(value).toLocaleString();
    }
    if (typeof value === 'number') {
      return value;
    }
    return value;
  };

  return (
    <div className="modal-backdrop food-metadata-modal-wrapper" onClick={onClose} style={{ zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto', zIndex: 10001, position: 'relative', transform: 'none', top: 'auto', left: 'auto', right: 'auto', bottom: 'auto' }}>
        <div className="food-metadata-modal">
          <div className="modal-header">
            <h2>{foodData?.food_name || 'Food Metadata'}</h2>
            <button className="btn-close" onClick={onClose} aria-label="Close">
              <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <table className="metadata-table">
            <thead>
              <tr>
                <th>Label</th>
                <th>Value</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {metadataFields.map((field, index) => {
                const value = foodData?.[field.key];
                const displayValue = formatValue(field.key, value);
                const unit = field.key === 'unit' ? (displayValue !== 'N/A' ? displayValue : '') : field.unit;
                const showUnit = unit && displayValue !== 'N/A' && field.key !== 'unit' && field.key !== 'make_public' && field.key !== 'created_at' && field.key !== 'updated_at' && field.key !== 'brand';
                
                return (
                  <tr key={field.key} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td className="metadata-label-cell">{field.label}</td>
                    <td className="metadata-value-cell">{field.key === 'unit' ? (displayValue !== 'N/A' ? displayValue : '') : displayValue}</td>
                    <td className="metadata-unit-cell">{showUnit ? unit : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        .food-metadata-modal-wrapper .modal {
          position: relative !important;
          transform: none !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
        }

        .food-metadata-modal {
          padding: var(--space-6);
        }

        .food-metadata-modal .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .food-metadata-modal .modal-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }


        .metadata-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: var(--space-4);
        }

        .metadata-table thead {
          background: var(--bg-tertiary);
        }

        .metadata-table th {
          padding: var(--space-3) var(--space-4);
          text-align: left;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metadata-table tbody tr {
          transition: background 0.2s var(--ease-out-cubic);
        }

        .metadata-table tbody tr.even-row {
          background: var(--bg-secondary);
        }

        .metadata-table tbody tr.odd-row {
          background: var(--bg-tertiary);
        }

        .metadata-table tbody tr:hover {
          background: var(--bg-hover);
        }

        .metadata-table td {
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-primary);
        }

        .metadata-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          width: 40%;
        }

        .metadata-value-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          width: 35%;
        }

        .metadata-unit-cell {
          font-weight: var(--font-weight-regular);
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          width: 25%;
        }
      `}</style>
    </div>
  );
};

export default FoodMetadataModal;

