import { useState, useEffect } from 'react';

/** Default cartesian margins for /analytics charts (desktop). */
export const ANALYTICS_CARTESIAN_MARGIN = {
  top: 24,
  right: 24,
  left: 24,
  bottom: 24,
};

/** Narrow screens: minimal left margin so the plot uses more width. */
export const ANALYTICS_CARTESIAN_MARGIN_MOBILE = {
  top: 12,
  right: 12,
  left: 2,
  bottom: 16,
};

/**
 * Returns Recharts margin object: tight left on viewports ≤768px.
 */
export function useAnalyticsCartesianMargin() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setMobile(mq.matches);
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return mobile ? ANALYTICS_CARTESIAN_MARGIN_MOBILE : ANALYTICS_CARTESIAN_MARGIN;
}
