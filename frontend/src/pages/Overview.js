import React from 'react';

const Overview = () => {
  return (
    <div
      className="card"
      style={{
        width: '100%',
        margin: 0,
        padding: 'var(--space-8)',
        lineHeight: 'var(--leading-relaxed)',
      }}
    >
      <h2 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-6)' }}>What you can do in Tracking App</h2>

      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Profile + goals</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Maintain a centralized profile (height, birthday, activity level, unit preferences) and define goals that
            drive the rest of the app. Goals are stored over time so you can adjust targets without losing history, and
            your profile view combines your latest inputs with calculated metrics to give you an “at-a-glance” snapshot.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Workout tracker</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Log workouts with weight, reps, RIR, rest time, and training attributes. The tracker is designed for repeat
            use: it can surface recent performance so you can progress consistently, and it keeps your training history
            structured so it’s usable for analysis and planning.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Splits + planning</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Build and edit workout splits (for example PPL or upper/lower), define days, and set per-day muscle targets.
            This gives you a plan you can follow week-to-week, and creates a shared structure that connects your logging,
            your muscle priorities, and your long-term training direction.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Muscle priorities</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Set a priority for each muscle group (default priorities are created automatically on registration). These
            priorities provide a consistent “signal” for what you care about most right now—helping inform split choices,
            guiding adjustments, and keeping your training focused when you’re balancing multiple goals.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Food log + additional trackers</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Track nutrition alongside training so you can connect performance with intake. Optional trackers (sleep,
            steps, water, cardio, and other health metrics) let you capture recovery and lifestyle variables that
            meaningfully influence results—without forcing you to track everything if you don’t want to.
          </p>
        </section>

        <section>
          <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>Analytics + data viewer</h3>
          <p style={{ fontSize: 'var(--text-lg)', marginBottom: 0 }}>
            Review trends across workouts, goals, and logs. The analytics and data viewer are designed to make your data
            inspectable—so you can verify what’s changing, spot consistency issues early, and make practical adjustments
            based on evidence rather than guesswork.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Overview;

