import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BoltIcon,
  Squares2X2Icon,
  ChartBarIcon,
  CircleStackIcon,
  RectangleGroupIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';

const AUTH_LINKS = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/profile', label: 'Profile', Icon: UserCircleIcon },
  { to: '/personalization', label: 'Personalization', Icon: Cog6ToothIcon },
  { to: '/food-log', label: 'Food log', Icon: Squares2X2Icon },
  { to: '/workout-tracker', label: 'Workout', Icon: BoltIcon },
  { to: '/additional-trackers', label: 'Trackers', Icon: RectangleGroupIcon },
  { to: '/analytics', label: 'Analytics', Icon: ChartBarIcon },
  { to: '/data-viewer', label: 'Data', Icon: CircleStackIcon },
];

const GUEST_LINKS = [
  { to: '/login', label: 'Login', Icon: ArrowRightOnRectangleIcon },
  { to: '/register', label: 'Register', Icon: UserPlusIcon },
];

const PAGE_SIZE = 3;

/** Mobile: [0]=left of hub, [1]=above hub, [2]=right of hub (anchor: bottom-center of arc). */
function hubTripodOffsets(n) {
  if (n <= 1) return [{ x: 0, y: -70 }];
  if (n === 2) {
    return [
      { x: -88, y: 2 },
      { x: 88, y: 2 },
    ];
  }
  return [
    { x: -94, y: 4 },
    { x: 0, y: -76 },
    { x: 94, y: 4 },
  ];
}

function chunkLinks(links, page) {
  const start = page * PAGE_SIZE;
  return links.slice(start, start + PAGE_SIZE);
}

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobilePage, setMobilePage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const location = useLocation();
  const links = isAuthenticated ? AUTH_LINKS : GUEST_LINKS;

  const numPages = Math.max(1, Math.ceil(links.length / PAGE_SIZE));

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  useEffect(() => {
    if (!open) setMobilePage(0);
  }, [open]);

  useEffect(() => {
    setMobilePage((p) => Math.min(p, numPages - 1));
  }, [numPages]);

  const mobileChunk = useMemo(() => chunkLinks(links, mobilePage), [links, mobilePage]);
  const hubOffsets = useMemo(() => hubTripodOffsets(mobileChunk.length), [mobileChunk.length]);

  const onTouchStart = useCallback((e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      if (touchStartX == null) return;
      const x = e.changedTouches[0].clientX;
      const dx = x - touchStartX;
      setTouchStartX(null);
      if (dx < -48) {
        setMobilePage((p) => (p + 1) % numPages);
      } else if (dx > 48) {
        setMobilePage((p) => (p - 1 + numPages) % numPages);
      }
    },
    [touchStartX, numPages]
  );

  return (
    <>
      {open && (
        <button
          type="button"
          className="nav-hub-overlay"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="nav-hub-root">
        <div
          className={`nav-hub-fan ${open ? 'nav-hub-fan--open' : ''}`}
          aria-hidden={!open}
        >
          {/* Desktop: single row, large light-blue icons */}
          <div className="nav-hub-fan-desktop">
            {links.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-hub-link nav-hub-link--desktop${isActive ? ' nav-hub-link--active' : ''}`
                }
                style={{ animationDelay: open ? `${index * 45}ms` : '0ms' }}
                onClick={() => setOpen(false)}
              >
                <span className="nav-hub-link-icon-wrap nav-hub-link-icon-wrap--desktop">
                  <item.Icon className="nav-hub-icon nav-hub-icon--desktop" aria-hidden />
                </span>
                <span className="nav-hub-link-label">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Mobile: one icon above hub, two on left/right; swipe changes page (wraps) */}
          <div
            className="nav-hub-fan-mobile"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="presentation"
          >
            <div className="nav-hub-arc">
              {mobileChunk.map((item, i) => {
                const off = hubOffsets[i] ?? { x: 0, y: -88 };
                return (
                <NavLink
                  key={`${mobilePage}-${item.to}`}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-hub-arc-link${isActive ? ' nav-hub-arc-link--active' : ''}`
                  }
                  style={{
                    '--hub-x': `${off.x}px`,
                    '--hub-y': `${off.y}px`,
                    animationDelay: open ? `${i * 60}ms` : '0ms',
                  }}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-hub-arc-icon-wrap">
                    <item.Icon className="nav-hub-icon nav-hub-icon--mobile" aria-hidden />
                  </span>
                </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="nav-hub-trigger"
          aria-expanded={open}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="nav-hub-trigger-inner-ring" aria-hidden />
        </button>
      </div>

      <style>{`
        .nav-hub-overlay {
          position: fixed;
          inset: 0;
          z-index: 1040;
          background: rgba(0, 0, 0, 0.45);
          border: none;
          cursor: pointer;
          animation: navHubFade 0.25s ease-out both;
        }
        @keyframes navHubFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .nav-hub-root {
          position: fixed;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        }

        .nav-hub-root .nav-hub-trigger {
          pointer-events: auto;
        }

        .nav-hub-root .nav-hub-fan {
          pointer-events: none;
          visibility: hidden;
        }

        .nav-hub-root .nav-hub-fan--open {
          pointer-events: auto;
          visibility: visible;
        }

        /* Semicircles: outer & inner share the same width:height ratio (2:1) and corner radii = half inner width */
        .nav-hub-trigger {
          /* Solid blue hub trigger (applies to all pages) */
          --nav-outer: #2563eb;
          --nav-inner: #2563eb;
          --hub-w: 120px;
          --hub-h: 60px;
          --inner-scale: 0.7;
          width: var(--hub-w);
          height: var(--hub-h);
          padding: 0;
          border: none;
          border-radius: calc(var(--hub-w) / 2) calc(var(--hub-w) / 2) 0 0;
          background: var(--nav-outer);
          box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.28);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          user-select: none;
          transition: transform 0.2s var(--ease-out-cubic), filter 0.2s;
        }
        .nav-hub-trigger:focus,
        .nav-hub-trigger:focus-visible {
          outline: none;
          box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.28);
        }
        .nav-hub-trigger:hover {
          filter: brightness(1.05);
        }
        .nav-hub-trigger[aria-expanded="true"] {
          transform: translateY(2px);
        }
        .nav-hub-trigger-inner-ring {
          width: calc(var(--hub-w) * var(--inner-scale));
          height: calc(var(--hub-h) * var(--inner-scale));
          border-radius: calc(var(--hub-w) * var(--inner-scale) / 2)
            calc(var(--hub-w) * var(--inner-scale) / 2) 0 0;
          background: var(--nav-inner);
          box-shadow: 0 0 0 4px #000000;
          display: block;
          flex-shrink: 0;
        }

        /* Bottom line icon */
        .nav-hub-trigger::after {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 10px;
          transform: translateX(-50%);
          width: 40px;
          height: 4px;
          border-radius: 999px;
          background: #ffffff;
          opacity: 0.95;
          pointer-events: none;
        }

        /* No inner circle/glow */
        .nav-hub-trigger-inner-ring {
          display: none;
          box-shadow: none;
        }

        .nav-hub-fan {
          width: min(100vw - 16px, 720px);
          max-height: 0;
          opacity: 0;
          overflow: visible;
          transition: max-height 0.35s var(--ease-out-cubic), opacity 0.25s ease;
          margin-bottom: 2px;
        }
        .nav-hub-fan--open {
          max-height: 300px;
          opacity: 1;
        }

        .nav-hub-fan-desktop {
          display: none;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: flex-end;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-3) var(--space-2);
        }

        .nav-hub-fan-mobile {
          display: none;
          flex-direction: column;
          align-items: center;
          padding: var(--space-2) 0 var(--space-1);
          touch-action: pan-y;
        }

        .nav-hub-arc {
          position: relative;
          width: min(92vw, 360px);
          height: 92px;
          margin: 0 auto;
        }

        .nav-hub-arc-link {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 64px;
          height: 64px;
          margin-left: -32px;
          margin-bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transform-origin: 50% 100%;
          transform: translate(var(--hub-x, 0px), var(--hub-y, -80px));
          opacity: 0;
          pointer-events: none;
        }
        .nav-hub-fan--open .nav-hub-arc-link {
          animation: navHubTripodIn 0.38s var(--ease-out-cubic) forwards;
          pointer-events: auto;
        }
        @keyframes navHubTripodIn {
          from {
            opacity: 0;
            transform: translate(var(--hub-x, 0px), calc(var(--hub-y, -80px) + 20px));
          }
          to {
            opacity: 1;
            transform: translate(var(--hub-x, 0px), var(--hub-y, -80px));
          }
        }

        .nav-hub-arc-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid rgba(125, 211, 252, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .nav-hub-arc-link--active .nav-hub-arc-icon-wrap {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 2px rgba(125, 211, 252, 0.4);
        }

        .nav-hub-icon--mobile {
          width: 36px;
          height: 36px;
          color: #7dd3fc;
          display: block;
        }
        .nav-hub-arc-link--active .nav-hub-icon--mobile {
          color: #e0f2fe;
        }

        .nav-hub-link--desktop {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          text-decoration: none;
          color: var(--text-primary);
          padding: var(--space-2);
          border-radius: var(--radius-lg);
          opacity: 0;
          transform: translateX(28px);
          pointer-events: none;
        }
        .nav-hub-fan--open .nav-hub-link--desktop {
          animation: navHubFromRight 0.38s var(--ease-out-cubic) forwards;
          pointer-events: auto;
        }
        @keyframes navHubFromRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .nav-hub-link-icon-wrap--desktop {
          width: 78px;
          height: 78px;
          border-radius: 50%;
          background: var(--bg-secondary);
          border: 1px solid rgba(125, 211, 252, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-md);
        }
        .nav-hub-link--active .nav-hub-link-icon-wrap--desktop {
          background: var(--bg-secondary);
          border-color: var(--accent-primary);
          box-shadow: var(--shadow-md), 0 0 0 1px var(--accent-primary);
        }

        .nav-hub-icon--desktop {
          width: 42px;
          height: 42px;
          color: #7dd3fc;
          display: block;
        }
        .nav-hub-link--active .nav-hub-icon--desktop {
          color: #e0f2fe;
        }

        .nav-hub-link-label {
          font-size: var(--text-xs);
          font-weight: var(--font-weight-medium);
          text-align: center;
          max-width: 92px;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .nav-hub-fan-mobile {
            display: flex;
          }
          .nav-hub-fan-desktop {
            display: none !important;
          }
        }

        @media (min-width: 769px) {
          .nav-hub-fan-desktop {
            display: flex;
          }
          .nav-hub-fan-mobile {
            display: none !important;
          }

          /* Larger hub trigger on desktop */
          .nav-hub-trigger {
            --hub-w: 152px;
            --hub-h: 76px;
          }
          .nav-hub-trigger::after {
            width: 48px;
            bottom: 12px;
            height: 5px;
          }
        }

      `}</style>
    </>
  );
};

export default Navbar;
