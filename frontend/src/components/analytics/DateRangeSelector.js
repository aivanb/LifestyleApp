/**
 * Shared date range selector for analytics sections.
 * Options: 1 week, 2 weeks, 1 month, 6 months, 1 year, Custom.
 * Default: 2 weeks. Custom default: firstDate to today (from dateBounds).
 */
import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const RANGE_OPTIONS = [
  { value: '1week', label: '1 week' },
  { value: '2weeks', label: '2 weeks', default: true },
  { value: '1month', label: '1 month' },
  { value: '6months', label: '6 months' },
  { value: '1year', label: '1 year' },
  { value: 'custom', label: 'Custom' }
];

const DateRangeSelector = ({ section, value, onChange, dateFrom, dateTo, onCustomDatesChange }) => {
  const [customFrom, setCustomFrom] = useState(dateFrom || '');
  const [customTo, setCustomTo] = useState(dateTo || '');
  const [bounds, setBounds] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.getAnalyticsDateBounds(section).then((res) => {
      if (mounted && res.data?.success) {
        const b = res.data.data;
        setBounds(b);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, [section]);

  useEffect(() => {
    if (dateFrom) setCustomFrom(dateFrom);
    if (dateTo) setCustomTo(dateTo);
  }, [dateFrom, dateTo]);

  const handleRangeChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (v === 'custom') {
      if (bounds) {
        setCustomFrom(bounds.first_date);
        setCustomTo(bounds.today);
        onCustomDatesChange?.(bounds.first_date, bounds.today);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setCustomFrom(today);
        setCustomTo(today);
        onCustomDatesChange?.(today, today);
      }
    }
  };

  const handleCustomFromChange = (e) => {
    const v = e.target.value;
    setCustomFrom(v);
    onCustomDatesChange?.(v, customTo);
  };

  const handleCustomToChange = (e) => {
    const v = e.target.value;
    setCustomTo(v);
    onCustomDatesChange?.(customFrom, v);
  };

  return (
    <div className="analytics-date-range-selector">
      <label htmlFor="analytics-range">Date range:</label>
      <select
        id="analytics-range"
        value={value}
        onChange={handleRangeChange}
        className="analytics-range-select"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {value === 'custom' && (
        <span className="analytics-custom-dates">
          <input
            type="date"
            value={customFrom}
            onChange={handleCustomFromChange}
            className="analytics-date-input"
            aria-label="From date"
          />
          <span className="analytics-date-sep">to</span>
          <input
            type="date"
            value={customTo}
            onChange={handleCustomToChange}
            className="analytics-date-input"
            aria-label="To date"
          />
        </span>
      )}
      <style>{`
        .analytics-date-range-selector {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }
        .analytics-date-range-selector label {
          color: var(--text-secondary);
          font-weight: var(--font-weight-medium);
        }
        .analytics-range-select,
        .analytics-date-input {
          padding: var(--space-2) var(--space-3);
          border: 2px solid var(--border-primary);
          border-radius: var(--radius-md);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: var(--text-sm);
        }
        .analytics-custom-dates { display: flex; align-items: center; gap: var(--space-2); }
        .analytics-date-sep { color: var(--text-secondary); }
      `}</style>
    </div>
  );
};

export default DateRangeSelector;
export { RANGE_OPTIONS };
