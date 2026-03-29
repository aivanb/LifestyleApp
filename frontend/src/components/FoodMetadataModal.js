import React from 'react';

/**
 * @param {object} props
 * @param {object} props.food
 * @param {() => void} props.onClose
 * @param {boolean} [props.embedded] — no second backdrop; render body only for use inside Food Logger
 * @param {boolean} [props.hideHeader] — table only (parent supplies title / back)
 */
const FoodMetadataModal = ({ food, onClose, embedded = false, hideHeader = false }) => {
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

  const headerRow = !hideHeader && (
    <div className="modal-header food-metadata-modal-header modal-app-header modal-app-header--compact">
      <h2 className="modal-app-header__title">{foodData?.food_name || 'Food Metadata'}</h2>
      <button type="button" className="btn-close modal-app-header__close" onClick={onClose} aria-label="Close">
        <svg className="icon icon-md" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  const tableBlock = (
    <div className="metadata-table-wrap">
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
            const showUnit =
              unit &&
              displayValue !== 'N/A' &&
              field.key !== 'unit' &&
              field.key !== 'make_public' &&
              field.key !== 'created_at' &&
              field.key !== 'updated_at' &&
              field.key !== 'brand';

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
  );

  if (embedded) {
    return (
      <div
        className={`food-metadata-modal food-metadata-modal--embedded${hideHeader ? ' food-metadata-modal--embedded-nohead' : ''}${hideHeader ? ' food-logger-overlay-pane' : ''}`}
      >
        {headerRow}
        {tableBlock}
        <style>{embeddedStyles}</style>
      </div>
    );
  }

  return (
    <div
      className="modal-backdrop food-metadata-modal-wrapper"
      onClick={onClose}
      style={{
        zIndex: 10000,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal food-metadata-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '860px',
          width: '100%',
          maxHeight: 'min(94vh, 100dvh)',
          overflow: 'auto',
          zIndex: 10001,
          position: 'relative',
          boxSizing: 'border-box',
          transform: 'none',
          top: 'auto',
          left: 'auto',
          right: 'auto',
          bottom: 'auto'
        }}
      >
        {headerRow}
        {tableBlock}
      </div>
      <style>{standaloneStyles}</style>
    </div>
  );
};

const embeddedStyles = `
        .food-metadata-modal--embedded {
          padding: 0;
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
          background: var(--bg-secondary);
        }
        .food-metadata-modal--embedded-nohead .metadata-table-wrap {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .food-metadata-modal--embedded .food-metadata-modal-header.modal-app-header {
          margin: 0 0 var(--space-2) 0;
          padding: var(--space-3) var(--space-4);
          position: relative;
          justify-content: center;
          align-items: center;
        }
        .food-metadata-modal--embedded .food-metadata-modal-header .modal-app-header__title {
          flex: 1;
          margin: 0;
          text-align: center;
          font-weight: var(--font-weight-bold);
        }
        .food-metadata-modal--embedded .food-metadata-modal-header .modal-app-header__close {
          position: absolute;
          right: var(--space-2);
          top: 50%;
          transform: translateY(-50%);
          margin-left: 0;
        }
        .food-metadata-modal--embedded .metadata-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          margin-top: 0;
        }
        .food-metadata-modal--embedded .metadata-table thead {
          background: var(--bg-tertiary);
        }
        .food-metadata-modal--embedded .metadata-table th {
          padding: 0.5rem var(--space-3);
          text-align: center;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          border-bottom: 2px solid var(--border-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .food-metadata-modal--embedded .metadata-table tbody tr.even-row {
          background: var(--bg-secondary);
        }
        .food-metadata-modal--embedded .metadata-table tbody tr.odd-row {
          background: var(--bg-tertiary);
        }
        .food-metadata-modal--embedded .metadata-table td {
          padding: 0.55rem var(--space-3);
          text-align: center;
          font-size: var(--text-sm);
          line-height: 1.35;
          color: var(--text-primary);
          border-bottom: 1px solid var(--input-border);
        }
        .food-metadata-modal--embedded .metadata-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          width: 28%;
          text-align: center;
        }
        .food-metadata-modal--embedded .metadata-value-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          width: 45%;
          text-align: center;
        }
        .food-metadata-modal--embedded .metadata-unit-cell {
          font-weight: var(--font-weight-regular);
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          width: 27%;
          text-align: center;
        }
`;

const standaloneStyles = `
        .food-metadata-modal-wrapper {
          padding: max(var(--space-4), env(safe-area-inset-top, 0px)) var(--space-4) var(--space-4);
          box-sizing: border-box;
        }
        .food-metadata-modal-wrapper .modal.food-metadata-modal {
          position: relative !important;
          transform: none !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
        }
        .food-metadata-modal.modal {
          padding: 0;
        }
        .food-metadata-modal .food-metadata-modal-header.modal-app-header {
          margin: 0;
          padding: var(--space-3) var(--space-4);
          position: relative;
          justify-content: center;
          align-items: center;
        }
        .food-metadata-modal .food-metadata-modal-header .modal-app-header__title {
          flex: 1;
          margin: 0;
          text-align: center;
          font-size: var(--text-base);
          line-height: 1.25;
          font-weight: var(--font-weight-bold);
        }
        .food-metadata-modal .food-metadata-modal-header .modal-app-header__close {
          position: absolute;
          right: var(--space-2);
          top: 50%;
          transform: translateY(-50%);
          margin-left: 0;
        }
        .food-metadata-modal .metadata-table-wrap {
          overflow-x: auto;
          margin: 0;
          padding: 0;
        }
        .food-metadata-modal .metadata-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          margin-top: 0;
        }
        .food-metadata-modal .metadata-table thead {
          background: var(--bg-tertiary);
        }
        .food-metadata-modal .metadata-table th {
          padding: 0.5rem var(--space-3);
          text-align: center;
          font-size: var(--text-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          border-bottom: 2px solid var(--input-border);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .food-metadata-modal .metadata-table tbody tr {
          transition: background 0.2s var(--ease-out-cubic);
        }
        .food-metadata-modal .metadata-table tbody tr.even-row {
          background: var(--bg-secondary);
        }
        .food-metadata-modal .metadata-table tbody tr.odd-row {
          background: var(--bg-tertiary);
        }
        .food-metadata-modal .metadata-table tbody tr:hover {
          background: var(--bg-hover);
        }
        .food-metadata-modal .metadata-table td {
          padding: 0.55rem var(--space-3);
          text-align: center;
          font-size: var(--text-sm);
          line-height: 1.35;
          color: var(--text-primary);
          border-bottom: 1px solid var(--input-border);
        }
        .food-metadata-modal .metadata-label-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-secondary);
          width: 28%;
          text-align: center;
        }
        .food-metadata-modal .metadata-value-cell {
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          width: 45%;
          text-align: center;
        }
        .food-metadata-modal .metadata-unit-cell {
          font-weight: var(--font-weight-regular);
          color: var(--text-tertiary);
          font-size: var(--text-xs);
          width: 27%;
          text-align: center;
        }

        /* Mobile: more gutter on backdrop; table stays flush inside card */
        @media (max-width: 768px) {
          .food-metadata-modal-wrapper {
            padding: max(var(--space-5), env(safe-area-inset-top, 0px)) var(--space-5) var(--space-5) !important;
            align-items: center;
            box-sizing: border-box;
          }

          .food-metadata-modal-wrapper .modal.food-metadata-modal {
            max-height: min(94vh, 100dvh) !important;
            min-height: 0;
            border-radius: var(--radius-lg);
            padding: 0 !important;
          }

          .food-metadata-modal .food-metadata-modal-header.modal-app-header {
            padding: var(--space-3) var(--space-4);
          }

          .food-metadata-modal .food-metadata-modal-header .modal-app-header__title {
            font-size: var(--text-lg);
          }

          .food-metadata-modal .metadata-table th {
            font-size: var(--text-base);
            padding: 0.55rem var(--space-3);
            text-align: center;
          }

          .food-metadata-modal .metadata-table td {
            font-size: var(--text-base);
            padding: 0.6rem var(--space-3);
            text-align: center;
          }

          .food-metadata-modal .metadata-label-cell,
          .food-metadata-modal .metadata-value-cell,
          .food-metadata-modal .metadata-unit-cell {
            text-align: center;
          }

          .food-metadata-modal .metadata-unit-cell {
            font-size: var(--text-sm);
          }
        }

        /* Desktop: larger info page + larger type */
        @media (min-width: 769px) {
          .food-metadata-modal-wrapper .modal.food-metadata-modal {
            max-width: 1120px !important;
          }

          .food-metadata-modal .food-metadata-modal-header.modal-app-header {
            padding: var(--space-4) var(--space-5);
          }

          .food-metadata-modal .food-metadata-modal-header .modal-app-header__title {
            font-size: var(--text-2xl);
          }

          .food-metadata-modal .metadata-table th {
            font-size: var(--text-xl);
            padding: 0.65rem var(--space-3);
            text-align: center;
          }

          .food-metadata-modal .metadata-table td {
            font-size: var(--text-xl);
            padding: 0.7rem var(--space-3);
            line-height: 1.35;
            text-align: center;
          }

          .food-metadata-modal .metadata-label-cell,
          .food-metadata-modal .metadata-value-cell {
            font-size: var(--text-xl);
          }

          .food-metadata-modal .metadata-label-cell,
          .food-metadata-modal .metadata-value-cell,
          .food-metadata-modal .metadata-unit-cell {
            text-align: center;
          }

          .food-metadata-modal .metadata-unit-cell {
            font-size: var(--text-lg);
          }
        }
`;

export default FoodMetadataModal;
