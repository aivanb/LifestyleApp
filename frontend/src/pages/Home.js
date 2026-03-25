import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

const MACRO_RING_R = 46;

const NUTRIENT_VBAR_COLORS = [
  '#6b8cae',
  '#8b7cba',
  '#7a9e8e',
  '#a8967a',
  '#8a8a9e',
  '#9e8a8a',
  '#7a8b9e',
  '#9e7a8a',
];

const EXTENDED_NUTRIENT_EXCLUDE = new Set(['tokens', 'caffeine', 'cost']);

/** Split array into chunks of `size` (extended nutrient cards: 6 vertical bars each). */
function chunkArray(arr, size) {
  if (!arr?.length) return [];
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
const MACRO_RING_LEN = 2 * Math.PI * MACRO_RING_R;

/**
 * Circular macro / goal ring; stroke starts from top (group rotated -90°).
 */
function HomeMacroRing({ pct, stroke, trackStroke, label, valueText, size = 112 }) {
  const clamped = Math.min(Math.max(Number(pct) || 0, 0), 100);
  const arc = (clamped / 100) * MACRO_RING_LEN;
  return (
    <div className="home-macro-circle-link">
      <div className="home-macro-circle-wrap" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="home-macro-circle-svg"
          aria-hidden
        >
          <g transform="rotate(-90 60 60)">
            <circle
              cx="60"
              cy="60"
              r={MACRO_RING_R}
              fill="none"
              stroke={trackStroke}
              strokeWidth="10"
            />
            <circle
              cx="60"
              cy="60"
              r={MACRO_RING_R}
              fill="none"
              stroke={stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${MACRO_RING_LEN}`}
            />
          </g>
        </svg>
        <div className="home-macro-value">{valueText}</div>
      </div>
      {label != null ? <div className="home-macro-label">{label}</div> : null}
    </div>
  );
}

/** Vertical progress bar (bottom-up fill) for extended nutrients on home. */
function HomeNutrientVBar({ pct, fillColor, trackColor, label, valueText }) {
  const clamped = Math.min(Math.max(Number(pct) || 0, 0), 100);
  return (
    <div className="home-nutrient-vbar">
      <div className="home-nutrient-vbar-track" style={{ background: trackColor }}>
        <div
          className="home-nutrient-vbar-fill"
          style={{ height: `${clamped}%`, background: fillColor }}
        />
      </div>
      <div className="home-nutrient-vbar-value">{valueText}</div>
      {label != null ? <div className="home-nutrient-vbar-label">{label}</div> : null}
    </div>
  );
}

/**
 * Authenticated home dashboard: today’s split & activation, macros, calorie budget,
 * missing trackers, and quick links. Layout splits mobile vs desktop.
 */
const Home = () => {
  const { theme } = useTheme();
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

  const fmtOne = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '—';
    return n.toFixed(1);
  };

  const split = data?.split;
  const day = split?.current_split_day;
  const trackersNotLogged = data?.trackers_not_logged || [];

  const caloriesGoal = Number(data?.goals?.calories) || 0;
  const caloriesEaten = Number(data?.consumed?.calories) || 0;
  const caloriesAdded =
    (Number(data?.cardio_calories_burned) || 0) +
    (Number(data?.steps_calories_estimate) || 0);
  const caloriesEffectiveBudget = Math.max(caloriesGoal + caloriesAdded, 0);
  const caloriesOver = Math.max(caloriesEaten - caloriesEffectiveBudget, 0);

  const sortedMuscles = useMemo(
    () => {
      const muscleRows = split?.muscle_rows || [];
      return [...muscleRows].sort((a, b) => {
        const aRemain = Math.max((a?.target_activation || 0) - (a?.done_activation || 0), 0);
        const bRemain = Math.max((b?.target_activation || 0) - (b?.done_activation || 0), 0);
        return bRemain - aRemain;
      });
    },
    [split?.muscle_rows]
  );

  /** Bar segments: under budget → L→R green (left), blue (burned), orange (eaten). Over → red (over), rest black (track). */
  const caloriesSegments = useMemo(() => {
    if (caloriesEffectiveBudget <= 0) {
      return {
        addedPct: 0,
        eatenPct: 0,
        leftPct: 0,
        overPct: caloriesOver > 0 ? 100 : 0,
      };
    }
    if (caloriesOver > 0) {
      const overPct = Math.min((caloriesOver / caloriesEffectiveBudget) * 100, 100);
      return { addedPct: 0, eatenPct: 0, leftPct: 0, overPct };
    }
    const addedPct = Math.min((caloriesAdded / caloriesEffectiveBudget) * 100, 100);
    const eatenPct = Math.min(
      (caloriesEaten / caloriesEffectiveBudget) * 100,
      Math.max(100 - addedPct, 0)
    );
    const leftPct = Math.max(100 - addedPct - eatenPct, 0);
    return { addedPct, eatenPct, leftPct, overPct: 0 };
  }, [caloriesAdded, caloriesEaten, caloriesEffectiveBudget, caloriesOver]);

  const macros = [
    {
      key: 'protein',
      label: 'Protein',
      consumed: Number(data?.consumed?.protein) || 0,
      goal: Number(data?.goals?.protein) || 0,
      color: '#ffe433',
      remaining: Number(data?.macro_remaining?.protein) || 0,
    },
    {
      key: 'carbohydrates',
      label: 'Carbs',
      consumed: Number(data?.consumed?.carbohydrates) || 0,
      goal: Number(data?.goals?.carbohydrates) || 0,
      color: '#3d8bff',
      remaining: Number(data?.macro_remaining?.carbohydrates) || 0,
    },
    {
      key: 'fat',
      label: 'Fat',
      consumed: Number(data?.consumed?.fat) || 0,
      goal: Number(data?.goals?.fat) || 0,
      color: '#5cff9d',
      remaining: Number(data?.macro_remaining?.fat) || 0,
    },
  ];

  const calDisplay =
    data?.calorie_remaining != null && Number.isFinite(Number(data.calorie_remaining))
      ? `${fmtOne(data.calorie_remaining)} kcal`
      : '—';

  const filteredExtendedNutrients = useMemo(
    () =>
      (data?.extended_nutrients || []).filter(
        (n) => n?.key && !EXTENDED_NUTRIENT_EXCLUDE.has(String(n.key))
      ),
    [data?.extended_nutrients]
  );

  const nutrientChunks = useMemo(
    () => chunkArray(filteredExtendedNutrients, 6),
    [filteredExtendedNutrients]
  );

  if (loading) {
    return (
      <div
        className={`home-page home-page--loading${
          theme === 'light' ? ' home-page--light' : ' home-page--dark'
        }`}
      >
        <div className="loading-spinner" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`home-page${theme === 'light' ? ' home-page--light' : ' home-page--dark'}`}
      >
        <p className="home-error">{error}</p>
        <button type="button" className="home-retry" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isLight = theme === 'light';
  const macroTrackStroke = isLight ? '#d8dce8' : '#2a3140';

  const fmtNutrientRemaining = (item) => {
    const r = fmtOne(item.remaining);
    if (item.key === 'cost' || item.unit === '$') return `$${r}`;
    if (item.unit) return `${r} ${item.unit}`;
    return r;
  };

  const trackerColorAt = (i) =>
    isLight ? `hsl(${(i * 53) % 360}, 42%, 34%)` : `hsl(${(i * 53) % 360}, 38%, 62%)`;

  const nutrientBarTrack = macroTrackStroke;

  const muscleBlock = (
    <section className="home-card home-card--muscles">
      {!split?.active_split ? (
        <p className="home-muted">No active split for this date.</p>
      ) : (
        <>
          {day?.day_name ? (
            <h2 className="home-muscle-day-title">{day.day_name}</h2>
          ) : null}
          {sortedMuscles.length === 0 ? (
            <p className="home-muted">No muscle targets for this day.</p>
          ) : (
            <ul className="home-muscle-list">
              {sortedMuscles.map((m) => {
                const complete = (m?.remaining_activation || 0) <= 0;
                const actLeft =
                  m.remaining_activation != null
                    ? Math.max(m.remaining_activation, 0)
                    : Math.max((m.target_activation || 0) - (m.done_activation || 0), 0);
                return (
                  <li key={`muscle-${m.muscle_id}`}>
                    <Link
                      to="/workout-tracker"
                      state={{
                        openWorkoutSelection: true,
                        muscleFilter: m.muscle_name,
                      }}
                      className={`home-muscle-btn ${complete ? 'home-muscle-btn--done' : 'home-muscle-btn--need'}`}
                    >
                      <span className="home-muscle-btn-row">
                        <span className="home-muscle-name">{m.muscle_name}</span>
                        {!complete && actLeft > 0 ? (
                          <span className="home-muscle-act-left">{fmtOne(actLeft)}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );

  const trackersBlock = (
    <Link to="/additional-trackers" className="home-card home-card-link home-card--trackers">
      {!trackersNotLogged.length ? (
        <p className="home-muted">All additional trackers logged.</p>
      ) : (
        <ul className="home-tracker-miss">
          {trackersNotLogged.map((t, i) => (
            <li key={t.id} style={{ color: trackerColorAt(i) }}>
              {t.label}
            </li>
          ))}
        </ul>
      )}
    </Link>
  );

  return (
    <div className={`home-page${isLight ? ' home-page--light' : ' home-page--dark'}`}>
      <header className="home-header">
        <p className="home-date">{data?.date}</p>
      </header>

      <div className="home-grid home-grid--desktop">
        <div className="home-col-left">
        <Link to="/food-log" className="home-card home-card--calories home-card-link">
          <div className="home-progress-link">
            <div
              className={`home-linear-progress${caloriesOver > 0 ? ' home-linear-progress--over' : ''}`}
              aria-label="Calorie progress"
            >
              {caloriesOver > 0 ? (
                caloriesSegments.overPct > 0 ? (
                  <>
                    <span
                      className="seg seg-over"
                      style={{ flex: `0 0 ${caloriesSegments.overPct}%` }}
                    />
                    <span className="seg seg-over-remainder" />
                  </>
                ) : null
              ) : (
                <>
                  {caloriesSegments.leftPct > 0 ? (
                    <span className="seg seg-left" style={{ width: `${caloriesSegments.leftPct}%` }} />
                  ) : null}
                  {caloriesSegments.addedPct > 0 ? (
                    <span className="seg seg-added" style={{ width: `${caloriesSegments.addedPct}%` }} />
                  ) : null}
                  {caloriesSegments.eatenPct > 0 ? (
                    <span className="seg seg-eaten" style={{ width: `${caloriesSegments.eatenPct}%` }} />
                  ) : null}
                </>
              )}
            </div>
            <p className="home-cal-main">{calDisplay}</p>
          </div>
          <p className="home-cal-detail home-cal-detail--desktop-only">
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--left">{fmtOne(data?.goals?.calories)}</span>
            {' kcal goal  '}
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--burned">{fmtOne(data?.cardio_calories_burned)}</span>
            {' cardio  '}
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--burned">{fmtOne(data?.steps_calories_estimate)}</span>
            {' steps  '}
            <span className="home-cal-op">−</span>
            <span className="home-cal-num home-cal-num--eaten">{fmtOne(data?.consumed?.calories)}</span>
            {' eaten'}
          </p>
        </Link>

        <Link to="/food-log" className="home-card home-card--macros home-card-link">
          <div className="home-macro-row home-macro-row--primary">
            {macros.map((macro) => {
              const goal = Math.max(macro.goal, 0);
              const consumed = Math.max(macro.consumed, 0);
              const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
              return (
                <HomeMacroRing
                  key={macro.key}
                  pct={pct}
                  stroke={macro.color}
                  trackStroke={macroTrackStroke}
                  label={macro.label}
                  valueText={
                    macro.remaining != null ? `${fmtOne(macro.remaining)}g` : '—'
                  }
                  size={118}
                />
              );
            })}
          </div>
        </Link>

        {nutrientChunks.map((chunk, ci) => (
          <Link
            key={`nutrient-card-${ci}`}
            to="/food-log"
            className="home-card home-card-link home-nutrient-card"
          >
            <div className="home-nutrient-grid">
              {chunk.map((item, ji) => {
                const goal = Math.max(item.goal, 0);
                const consumed = Math.max(item.consumed, 0);
                const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
                const fill =
                  NUTRIENT_VBAR_COLORS[(ci * 6 + ji) % NUTRIENT_VBAR_COLORS.length];
                return (
                  <HomeNutrientVBar
                    key={item.key}
                    pct={pct}
                    fillColor={fill}
                    trackColor={nutrientBarTrack}
                    label={item.label}
                    valueText={fmtNutrientRemaining(item)}
                  />
                );
              })}
            </div>
          </Link>
        ))}
        {trackersBlock}
        </div>

        <div className="home-col-right">
          {muscleBlock}
        </div>
      </div>

      <div className="home-stack home-stack--mobile">
        <Link to="/food-log" className="home-card home-card--calories home-card-link">
          <div className="home-progress-link">
            <div
              className={`home-linear-progress${caloriesOver > 0 ? ' home-linear-progress--over' : ''}`}
              aria-label="Calorie progress"
            >
              {caloriesOver > 0 ? (
                caloriesSegments.overPct > 0 ? (
                  <>
                    <span
                      className="seg seg-over"
                      style={{ flex: `0 0 ${caloriesSegments.overPct}%` }}
                    />
                    <span className="seg seg-over-remainder" />
                  </>
                ) : null
              ) : (
                <>
                  {caloriesSegments.leftPct > 0 ? (
                    <span className="seg seg-left" style={{ width: `${caloriesSegments.leftPct}%` }} />
                  ) : null}
                  {caloriesSegments.addedPct > 0 ? (
                    <span className="seg seg-added" style={{ width: `${caloriesSegments.addedPct}%` }} />
                  ) : null}
                  {caloriesSegments.eatenPct > 0 ? (
                    <span className="seg seg-eaten" style={{ width: `${caloriesSegments.eatenPct}%` }} />
                  ) : null}
                </>
              )}
            </div>
            <p className="home-cal-main">{calDisplay}</p>
          </div>
          <p className="home-cal-detail home-cal-detail--mobile-only">
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--left">{fmtOne(data?.goals?.calories)}</span>
            {' '}
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--burned">{fmtOne(data?.cardio_calories_burned)}</span>
            {' '}
            <span className="home-cal-op">+</span>
            <span className="home-cal-num home-cal-num--burned">{fmtOne(data?.steps_calories_estimate)}</span>
            {' '}
            <span className="home-cal-op">−</span>
            <span className="home-cal-num home-cal-num--eaten">{fmtOne(data?.consumed?.calories)}</span>
          </p>
        </Link>
        <Link to="/food-log" className="home-card home-card--macros home-card-link">
          <div className="home-macro-row home-macro-row--mobile">
            {macros.map((macro) => {
              const goal = Math.max(macro.goal, 0);
              const consumed = Math.max(macro.consumed, 0);
              const pct = goal > 0 ? Math.min((consumed / goal) * 100, 100) : 0;
              return (
                <HomeMacroRing
                  key={`m-${macro.key}`}
                  pct={pct}
                  stroke={macro.color}
                  trackStroke={macroTrackStroke}
                  label={macro.label}
                  valueText={
                    macro.remaining != null ? `${fmtOne(macro.remaining)}g` : '—'
                  }
                  size={108}
                />
              );
            })}
          </div>
        </Link>
        {muscleBlock}
        {trackersBlock}
      </div>

      <style jsx>{`
        .home-page {
          width: 100%;
          max-width: none;
          margin: 0 auto;
          padding: var(--space-5) var(--space-5) var(--space-8);
          font-family: var(--font-primary);
          min-height: 100dvh;
          box-sizing: border-box;
        }
        .home-page--dark {
          --home-shell-tint: rgba(255, 255, 255, 0.045);
          --home-shell-strong: rgba(255, 255, 255, 0.11);
          --home-card-bg: #171c24;
          --home-card-border: transparent;
          --home-muscle-btn-bg: #121820;
          --cal-bar-divider: #ffffff;
          --cal-seg-left: #34d399;
          --cal-seg-burned: #a78bfa;
          --cal-seg-eaten: #fb923c;
          --cal-seg-over: #f87171;
          background-color: #040508;
          background-image:
            linear-gradient(var(--home-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--home-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--home-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--home-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          color: var(--text-primary);
        }
        .home-page--light {
          --home-shell-tint: rgba(0, 0, 0, 0.04);
          --home-shell-strong: rgba(0, 0, 0, 0.1);
          --home-card-bg: #ffffff;
          --home-card-border: transparent;
          --home-muscle-btn-bg: #f0f1f5;
          --cal-bar-divider: #ffffff;
          --cal-seg-left: #4ade80;
          --cal-seg-burned: #a78bfa;
          --cal-seg-eaten: #fdba74;
          --cal-seg-over: #fca5a5;
          background-color: #e8eaf2;
          background-image:
            linear-gradient(var(--home-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--home-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--home-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--home-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          color: var(--text-primary);
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
          margin-bottom: var(--space-4);
          text-align: center;
        }
        .home-date {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
        }
        .home-page--dark .home-date {
          color: #ffffff;
        }
        .home-page--light .home-date {
          color: var(--text-primary);
        }
        .home-grid--desktop {
          display: none;
        }
        .home-stack--mobile {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          padding-bottom: var(--space-10);
        }
        .home-card {
          background: var(--home-card-bg);
          border: 1px solid var(--home-card-border);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-md);
        }
        .home-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .home-card-link:hover {
          text-decoration: none;
        }
        .home-muted {
          color: var(--text-tertiary);
          font-size: var(--text-sm);
        }
        .home-muscle-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .home-muscle-list li {
          padding: 3px 0;
        }
        .home-muscle-day-title {
          margin: 0 0 var(--space-4);
          font-size: clamp(1.35rem, 3vw, 1.75rem);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          text-align: center;
        }
        .home-muscle-btn {
          width: 100%;
          border: none;
          background: var(--home-muscle-btn-bg);
          border-radius: var(--radius-md);
          color: inherit;
          text-decoration: none;
          display: block;
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-lg);
          font-weight: var(--font-weight-semibold);
          -webkit-tap-highlight-color: transparent;
          transition: none;
        }
        .home-muscle-btn:hover,
        .home-muscle-btn:focus,
        .home-muscle-btn:focus-visible,
        .home-muscle-btn:active {
          text-decoration: none;
          opacity: 1;
          box-shadow: none;
          transform: none;
          filter: none;
          outline: none;
        }
        .home-muscle-btn--done,
        .home-muscle-btn--done:hover,
        .home-muscle-btn--done:focus,
        .home-muscle-btn--done:active {
          color: #50c878;
          background: var(--home-muscle-btn-bg);
        }
        .home-muscle-btn--need,
        .home-muscle-btn--need:hover,
        .home-muscle-btn--need:focus,
        .home-muscle-btn--need:active {
          color: #f87171;
          background: var(--home-muscle-btn-bg);
        }
        .home-muscle-btn-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-2);
          width: 100%;
        }
        .home-muscle-act-left {
          text-align: right;
          flex-shrink: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          opacity: 0.95;
          font-variant-numeric: tabular-nums;
        }
        .home-page--dark .home-muscle-act-left,
        .home-page--light .home-muscle-act-left {
          color: #ffffff;
        }
        .home-page--light .home-muscle-act-left {
          text-shadow: 0 1px 2px rgba(15, 23, 42, 0.45);
        }
        .home-progress-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .home-progress-link:hover {
          text-decoration: none;
        }
        .home-linear-progress {
          width: 100%;
          height: 22px;
          background: var(--cal-bar-divider);
          border-radius: 999px;
          overflow: hidden;
          display: flex;
          gap: 2px;
          box-sizing: border-box;
          margin-bottom: var(--space-3);
        }
        .home-linear-progress--over {
          background: var(--cal-bar-divider);
          gap: 0;
        }
        .seg {
          height: 100%;
          border-radius: 4px;
          min-width: 0;
        }
        .seg-left {
          background: var(--cal-seg-left);
        }
        .seg-added {
          background: var(--cal-seg-burned);
        }
        .seg-eaten {
          background: var(--cal-seg-eaten);
        }
        .seg-over {
          background: var(--cal-seg-over);
          border-radius: 4px 0 0 4px;
        }
        .home-linear-progress--over .seg-over:only-child {
          border-radius: 4px;
        }
        .seg-over-remainder {
          flex: 1 1 0;
          min-width: 0;
          background: #000000;
          border-radius: 0 4px 4px 0;
        }
        .home-cal-main {
          font-size: var(--text-xl);
          margin: 0 0 var(--space-2);
          color: var(--text-primary);
          font-weight: var(--font-weight-semibold);
          font-variant-numeric: tabular-nums;
        }
        .home-cal-detail {
          margin: 0 0 var(--space-1);
          font-size: var(--text-base);
          color: var(--text-primary);
        }
        .home-cal-detail--desktop-only {
          font-size: var(--text-lg);
          line-height: 1.5;
        }
        .home-cal-detail--mobile-only {
          font-size: var(--text-xl);
          text-align: center;
          letter-spacing: 0.02em;
        }
        .home-cal-num {
          font-weight: var(--font-weight-bold);
          font-variant-numeric: tabular-nums;
        }
        .home-cal-num--left {
          color: var(--cal-seg-left);
        }
        .home-cal-num--eaten {
          color: var(--cal-seg-eaten);
        }
        .home-cal-num--burned {
          color: var(--cal-seg-burned);
        }
        .home-cal-op {
          font-weight: var(--font-weight-bold);
          margin-right: 0.08em;
          user-select: none;
          color: inherit;
        }
        .home-nutrient-card .home-nutrient-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: var(--space-3) var(--space-2);
          align-items: end;
        }
        .home-nutrient-vbar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
          min-width: 0;
          width: 100%;
        }
        .home-nutrient-vbar-track {
          width: 20px;
          height: 104px;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          flex-shrink: 0;
        }
        .home-nutrient-vbar-fill {
          width: 100%;
          min-height: 2px;
          border-radius: 4px;
        }
        .home-nutrient-vbar-value {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          text-align: center;
          line-height: 1.2;
          max-width: 100%;
          word-break: break-word;
        }
        .home-nutrient-vbar-label {
          font-size: 10px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: var(--font-weight-semibold);
          text-align: center;
          line-height: 1.2;
          max-width: 100%;
        }
        @media (min-width: 900px) {
          .home-cal-detail--mobile-only {
            display: none;
          }
        }
        @media (max-width: 899px) {
          .home-cal-detail--desktop-only {
            display: none;
          }
        }
        .home-col-left {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          min-width: 0;
        }
        .home-col-right {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
          min-width: 0;
        }
        .home-macro-row--primary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
          justify-items: center;
        }
        .home-macro-row--mobile {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-2);
          justify-items: center;
        }
        .home-macro-circle-link {
          color: inherit;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-1);
        }
        .home-macro-circle-wrap {
          position: relative;
        }
        .home-macro-circle-svg {
          display: block;
        }
        .home-macro-value {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xl);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
          font-variant-numeric: tabular-nums;
          text-align: center;
          padding: var(--space-1);
          line-height: 1.15;
        }
        .home-macro-label {
          font-size: var(--text-xs);
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: var(--font-weight-semibold);
          text-align: center;
        }
        .home-card--trackers {
          padding-bottom: var(--space-4);
        }
        .home-tracker-miss {
          margin: 0;
          padding-left: 0;
          list-style: none;
          font-size: clamp(1.15rem, 3.5vw, 1.5rem);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: var(--font-weight-bold);
          line-height: 1.35;
        }
        .home-tracker-miss li {
          margin-bottom: var(--space-1);
        }
        .home-tracker-miss li:last-child {
          margin-bottom: 0;
        }
        @media (min-width: 900px) {
          .home-page {
            padding-bottom: max(var(--space-12), 5rem);
          }
          .home-grid--desktop {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: var(--space-5);
            align-items: start;
          }
          .home-stack--mobile {
            display: none;
          }
        }
        @media (max-width: 768px) {
          .home-page {
            padding: var(--space-4) var(--space-3) max(var(--space-12), 4rem);
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
