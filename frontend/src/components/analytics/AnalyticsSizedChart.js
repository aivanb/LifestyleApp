import React, { useLayoutEffect, useRef, useState } from 'react';
import { ResponsiveContainer } from 'recharts';

/**
 * Measures container width and passes numeric width + height into ResponsiveContainer.
 * Recharts v3 uses a 0-width inner wrapper when width is "100%" and height is a number;
 * WebKit on mobile often fails to paint the SVG. Fixed numeric dimensions use the
 * direct context path and render reliably.
 */
const AnalyticsSizedChart = ({ height, debounce = 50, className = '', children }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth((prev) => {
        const next = Math.max(0, Math.floor(w));
        return prev === next ? prev : next;
      });
    };

    measure();
    requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`analytics-sized-chart-host${className ? ` ${className}` : ''}`}
      style={{
        width: '100%',
        height,
        minHeight: height,
        minWidth: 0,
        position: 'relative',
      }}
    >
      {width > 0 ? (
        <ResponsiveContainer width={width} height={height} debounce={debounce}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

export default AnalyticsSizedChart;
