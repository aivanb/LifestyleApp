import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AnalyticsChartBase from './AnalyticsChartBase';
import api from '../../services/api';
import { ANALYTICS_SERIES } from './analyticsChartColors';

const TOOLTIP_STYLE = { color: '#1a1a1a', fontWeight: 500 };

/**
 * Single doughnut with header "Food Group" or "Brand", larger pie chart, and legend to the right.
 */
const Doughnut = ({ data, title, dataKey = 'name', valueKey = 'percentage' }) => {
  const hasData = data && data.length > 0;
  const chartData = hasData
    ? data.map((d, i) => ({ ...d, fill: ANALYTICS_SERIES[i % ANALYTICS_SERIES.length] }))
    : [];

  return (
    <div className="doughnut-wrap">
      <h3 className="doughnut-title">{title}</h3>
      {!hasData ? (
        <div className="chart-no-data">No data</div>
      ) : (
        <div className="doughnut-row">
          <div className="doughnut-pie-only">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={chartData}
                  dataKey={valueKey}
                  nameKey={dataKey}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={130}
                  paddingAngle={2}
                  label={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="doughnut-legend-list" aria-label={`${title} legend`}>
            {chartData.map((entry, index) => (
              <li key={index} className="doughnut-legend-row">
                <span className="doughnut-legend-swatch" style={{ backgroundColor: entry.fill }} />
                <span className="doughnut-legend-label" title={entry[dataKey]}>
                  {entry[dataKey]}
                </span>
                <span className="doughnut-legend-pct">{entry[valueKey]}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <style>{`
        .doughnut-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
          padding: var(--space-4);
          width: 100%;
          max-width: 480px;
        }
        .doughnut-title {
          font-size: var(--text-base);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0 0 var(--space-3) 0;
          text-align: center;
        }
        .doughnut-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--space-6);
          width: 100%;
        }
        .doughnut-pie-only {
          flex: 0 0 260px;
          height: 300px;
        }
        .doughnut-legend-list {
          list-style: none;
          margin: 0;
          padding: 0;
          flex: 1;
          min-width: 0;
          max-height: 300px;
          overflow-y: auto;
        }
        .doughnut-legend-row {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-1) 0;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }
        .doughnut-legend-swatch {
          width: 12px;
          height: 12px;
          flex-shrink: 0;
          border-radius: 2px;
        }
        .doughnut-legend-label {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .doughnut-legend-pct {
          flex-shrink: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

const FoodFrequencyChart = ({ dateRangeParams = {} }) => {
  const [foodGroups, setFoodGroups] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await api.getFoodFrequency({ ...dateRangeParams, entry_type: 'both' });
        if (response.data?.success) {
          setFoodGroups(response.data.data.food_groups || []);
          setBrands(response.data.data.brands || []);
        } else {
          setFoodGroups([]);
          setBrands([]);
        }
      } catch {
        setFoodGroups([]);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [dateRangeParams]);

  return (
    <AnalyticsChartBase title="">
      {loading ? (
        <div className="chart-loading">Loading...</div>
      ) : (
        <div className="food-frequency-doughnuts">
          <Doughnut data={foodGroups} title="Food Group" />
          <Doughnut data={brands} title="Brand" />
        </div>
      )}
      <style>{`
        .food-frequency-doughnuts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-8);
          align-items: start;
          justify-items: center;
        }
        @media (max-width: 768px) {
          .food-frequency-doughnuts {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </AnalyticsChartBase>
  );
};

export default FoodFrequencyChart;
