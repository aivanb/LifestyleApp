import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

/**
 * Authenticated home dashboard: today’s split & activation, macros, calorie budget,
 * missing trackers, and quick links. Layout splits mobile vs desktop.
 */
const Home = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analytics/home/dashboard/');
      const body = res.data;
      if (body?.success === false) {
        setError(body?.error?.message || 'Failed to load dashboard');
        setData(null);
        return;
      }
      setData(body?.data ?? null);
    } catch (e) {
      setError('Could not load dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (v, suffix = '') => {
    if (v == null || Number.isNaN(v)) return '—';
    return `${typeof v === 'number' ? v : v}${suffix}`;
  };

  const split = data?.split;
  const day = split?.current_split_day;
  const muscles = split?.muscle_rows || [];

  if (loading) {
    return (
      <div className="home-page home-page--loading">
        <div className="loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page">
        <p className="home-error">{error}</p>
        <button type="button" className="home-retry" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="home-title">Today</h1>
        <p className="home-date">{data?.date}</p>
      </header>

      {/* Desktop: multi-column grid */}
      <div className="home-grid home-grid--desktop">
        <section className="home-card">
          <h2 className="home-card-title">Workout split</h2>
          {!split?.active_split ? (
            <p className="home-muted">No active split for this date.</p>
          ) : (
            <>
              <p className="home-split-name">{split.active_split.split_name}</p>
              {day ? (
                <p className="home-day-label">
                  Today: <strong>{day.day_name}</strong>
                </p>
              ) : (
                <p className="home-muted">No days defined for this split.</p>
              )}
              {muscles.length === 0 ? (
                <p className="home-muted">No muscle targets for this day.</p>
              ) : (
                <ul className="home-muscle-list">
                  {muscles.map((m) => (
                    <li key={m.muscle_id}>
                      <span className="home-muscle-name">{m.muscle_name}</span>
                      <span className="home-muscle-stats">
                        {m.done_activation} / {m.target_activation} activation
                        {m.remaining_activation > 0 ? (
                          <span className="home-remain">
                            {' '}
                            ({m.remaining_activation} left)
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="home-card">
          <h2 className="home-card-title">Macros remaining</h2>
          <p className="home-macro-line">
            Protein:{' '}
            <strong>{fmt(data?.macro_remaining?.protein, ' g')}</strong>
            <span className="home-muted home-goal-hint">
              {' '}
              (goal {fmt(data?.goals?.protein, ' g')}, eaten{' '}
              {fmt(data?.consumed?.protein, ' g')})
            </span>
          </p>
          <p className="home-macro-line">
            Carbs:{' '}
            <strong>{fmt(data?.macro_remaining?.carbohydrates, ' g')}</strong>
            <span className="home-muted home-goal-hint">
              {' '}
              (goal {fmt(data?.goals?.carbohydrates, ' g')}, eaten{' '}
              {fmt(data?.consumed?.carbohydrates, ' g')})
            </span>
          </p>
          <p className="home-macro-line">
            Fat: <strong>{fmt(data?.macro_remaining?.fat, ' g')}</strong>
            <span className="home-muted home-goal-hint">
              {' '}
              (goal {fmt(data?.goals?.fat, ' g')}, eaten{' '}
              {fmt(data?.consumed?.fat, ' g')})
            </span>
          </p>
        </section>

        <section className="home-card">
          <h2 className="home-card-title">Calorie budget</h2>
          <p className="home-cal-main">
            Remaining:{' '}
            <strong>{fmt(data?.calorie_remaining, ' kcal')}</strong>
          </p>
          <p className="home-muted home-cal-detail">
            Goal {fmt(data?.goals?.calories, ' kcal')} − eaten{' '}
            {fmt(data?.consumed?.calories, ' kcal')} + cardio{' '}
            {fmt(data?.cardio_calories_burned, ' kcal')} + steps (~
            {fmt(data?.steps_calories_estimate, ' kcal')})
          </p>
          <p className="home-muted home-cal-detail">
            Steps today: {data?.steps_today ?? 0}
          </p>
        </section>

        <section className="home-card">
          <h2 className="home-card-title">Trackers not logged yet</h2>
          {!data?.trackers_not_logged?.length ? (
            <p className="home-muted">All additional trackers have an entry today.</p>
          ) : (
            <ul className="home-tracker-miss">
              {data.trackers_not_logged.map((t) => (
                <li key={t.id}>{t.label}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="home-card home-card--actions">
          <h2 className="home-card-title">Quick links</h2>
          <div className="home-actions">
            <Link to="/workout-tracker" className="home-action-btn">
              Workout logger
            </Link>
            <Link to="/food-log" className="home-action-btn">
              Food logger
            </Link>
            <Link to="/additional-trackers" className="home-action-btn">
              Additional trackers
            </Link>
          </div>
        </section>
      </div>

      {/* Mobile: single column, same sections */}
      <div className="home-stack home-stack--mobile">
        <section className="home-card">
          <h2 className="home-card-title">Workout split</h2>
          {!split?.active_split ? (
            <p className="home-muted">No active split.</p>
          ) : (
            <>
              <p className="home-split-name">{split.active_split.split_name}</p>
              {day ? <p className="home-day-label">Today: {day.day_name}</p> : null}
              <ul className="home-muscle-list">
                {muscles.map((m) => (
                  <li key={`m-${m.muscle_id}`}>
                    <span className="home-muscle-name">{m.muscle_name}</span>
                    <span className="home-muscle-stats">
                      {m.done_activation}/{m.target_activation}
                      {m.remaining_activation > 0 ? ` · ${m.remaining_activation} left` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="home-card">
          <h2 className="home-card-title">Macros left</h2>
          <p>
            P <strong>{fmt(data?.macro_remaining?.protein, 'g')}</strong> · C{' '}
            <strong>{fmt(data?.macro_remaining?.carbohydrates, 'g')}</strong> · F{' '}
            <strong>{fmt(data?.macro_remaining?.fat, 'g')}</strong>
          </p>
        </section>
        <section className="home-card">
          <h2 className="home-card-title">Calories</h2>
          <p className="home-cal-main">
            <strong>{fmt(data?.calorie_remaining, ' kcal')}</strong> left
          </p>
          <p className="home-muted home-cal-detail">
            −{fmt(data?.consumed?.calories)} eaten +{fmt(data?.cardio_calories_burned)} cardio +~
            {fmt(data?.steps_calories_estimate)} steps
          </p>
        </section>
        <section className="home-card">
          <h2 className="home-card-title">Still to log</h2>
          {!data?.trackers_not_logged?.length ? (
            <p className="home-muted">All caught up.</p>
          ) : (
            <p>{data.trackers_not_logged.map((t) => t.label).join(', ')}</p>
          )}
        </section>
        <div className="home-actions home-actions--mobile">
          <Link to="/workout-tracker" className="home-action-btn">
            Workouts
          </Link>
          <Link to="/food-log" className="home-action-btn">
            Food
          </Link>
          <Link to="/additional-trackers" className="home-action-btn">
            Trackers
          </Link>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 0 var(--space-8);
        }
        .home-page--loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          min-height: 40vh;
          justify-content: center;
        }
        .home-error {
          color: var(--accent-danger);
        }
        .home-retry {
          margin-top: var(--space-3);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-primary);
          background: var(--bg-tertiary);
          color: var(--text-primary);
          cursor: pointer;
        }
        .home-header {
          margin-bottom: var(--space-6);
        }
        .home-title {
          font-size: var(--text-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          margin: 0;
        }
        .home-date {
          color: var(--text-secondary);
          margin: var(--space-2) 0 0;
        }
        .home-grid--desktop {
          display: none;
        }
        .home-stack--mobile {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }
        .home-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
        }
        .home-card-title {
          font-size: var(--text-sm);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          margin: 0 0 var(--space-4);
        }
        .home-muted {
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }
        .home-split-name {
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin: 0 0 var(--space-2);
        }
        .home-day-label {
          margin: 0 0 var(--space-3);
          color: var(--text-primary);
        }
        .home-muscle-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .home-muscle-list li {
          display: flex;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-2) 0;
          border-bottom: 1px solid var(--border-primary);
          font-size: var(--text-sm);
        }
        .home-muscle-name {
          color: var(--text-primary);
        }
        .home-muscle-stats {
          color: var(--text-secondary);
          text-align: right;
        }
        .home-remain {
          color: var(--accent-primary);
        }
        .home-macro-line {
          margin: 0 0 var(--space-3);
          color: var(--text-primary);
        }
        .home-goal-hint {
          display: block;
          margin-top: var(--space-1);
        }
        .home-cal-main {
          font-size: var(--text-xl);
          margin: 0 0 var(--space-2);
          color: var(--text-primary);
        }
        .home-cal-detail {
          margin: 0 0 var(--space-1);
          font-size: var(--text-xs);
        }
        .home-tracker-miss {
          margin: 0;
          padding-left: var(--space-5);
          color: var(--text-primary);
        }
        .home-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
        }
        .home-actions--mobile {
          flex-direction: column;
        }
        .home-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-md);
          background: var(--accent-primary);
          color: #fff;
          text-decoration: none;
          font-weight: var(--font-weight-semibold);
          font-size: var(--text-sm);
          transition: filter 0.2s var(--ease-out-cubic);
        }
        .home-action-btn:hover {
          filter: brightness(1.08);
          color: #fff;
        }
        @media (min-width: 900px) {
          .home-grid--desktop {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--space-5);
          }
          .home-stack--mobile {
            display: none;
          }
          .home-card--actions {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
