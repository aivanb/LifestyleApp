import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import SplitCreator from '../components/SplitCreator';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SplitsHome
 *
 * Hub page for /personalization/splits. Shows the updated "Manage Splits" UI
 * and routes users to /personalization/splits/new for creation.
 */
const SplitsHome = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`splits-home-page splits-home-page--shell${theme === 'light' ? ' splits-home-page--shell-light' : ''}`}>
      <div className="splits-home-actions">
        <button
          type="button"
          className="btn btn-primary splits-home-new-btn"
          onClick={() => navigate('/personalization/splits/new')}
        >
          New Split
        </button>
        <button
          type="button"
          className="nav-back-btn"
          onClick={() => navigate('/personalization')}
          aria-label="Back"
          title="Back"
        >
          <ArrowLeftIcon className="nav-back-icon" aria-hidden="true" />
        </button>
      </div>
      <SplitCreator editorMode={false} uiVariant="splitsPage" />

      <style>{`
        .splits-home-page {
          flex: 1;
          width: 100%;
          max-width: none;
          margin: 0;
          padding: var(--space-4);
          font-size: var(--text-lg);
          font-family: var(--font-primary);
          box-sizing: border-box;
          min-height: 100dvh;
          min-height: 100svh;
          overflow-x: hidden;
          padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px));
        }

        .splits-home-page--shell {
          --profile-shell-tint: rgba(255, 255, 255, 0.045);
          --profile-shell-strong: rgba(255, 255, 255, 0.11);
          --profile-card-bg: #171c24;
          --profile-card-border: #2a3140;
          background-color: #040508;
          background-image:
            linear-gradient(var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-tint) 1px, transparent 1px),
            linear-gradient(var(--profile-shell-strong) 1px, transparent 1px),
            linear-gradient(90deg, var(--profile-shell-strong) 1px, transparent 1px);
          background-size: 20px 20px, 20px 20px, 80px 80px, 80px 80px;
          background-position: 0 0, 0 0, 0 0, 0 0;
        }

        .splits-home-page--shell-light {
          --profile-shell-tint: rgba(0, 0, 0, 0.04);
          --profile-shell-strong: rgba(0, 0, 0, 0.1);
          --profile-card-bg: #ffffff;
          --profile-card-border: #d8dce8;
          background-color: #e8eaf2;
        }

        .splits-home-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-4);
          gap: var(--space-3);
        }

        .splits-home-new-btn {
          padding: var(--space-3) var(--space-6);
          min-height: 56px;
          font-size: var(--text-lg);
          font-weight: var(--font-weight-bold);
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
        }

        .splits-home-new-btn:hover,
        .splits-home-new-btn:focus {
          background: #79b5fb;
          border-color: #79b5fb;
          color: #040508;
          filter: brightness(0.95);
        }

        .nav-back-btn {
          padding: var(--space-3);
          background: transparent;
          border: none;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nav-back-icon {
          width: 30px;
          height: 30px;
        }

        .nav-back-btn:hover {
          color: var(--accent-primary);
        }

        @media (max-width: 768px) {
          .splits-home-page {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            padding: var(--space-3);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
            box-sizing: border-box;
          }

          .splits-home-page .split-creator .split-creator-section,
          .splits-home-page .split-creator .split-creator-split-list {
            padding-left: var(--space-2);
            padding-right: var(--space-2);
            margin-left: 0;
            margin-right: 0;
          }

          .splits-home-actions {
            justify-content: stretch;
            width: 100%;
          }

          .splits-home-new-btn {
            width: 100%;
            min-height: 64px;
          }

          .splits-home-page .split-creator {
            width: 100%;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            align-items: stretch;
          }

          .splits-home-page .split-creator .split-creator-days-list,
          .splits-home-page .split-creator [class*="split-creator"] {
            width: 100%;
            max-width: 100%;
          }

          .splits-home-page .split-creator .split-creator-days {
            width: 100%;
            max-width: 100%;
          }

          .splits-home-page .split-creator .split-creator-split-list {
            width: 100%;
            padding: 0;
          }

          .splits-home-page .split-creator .split-creator-split-card-wrap,
          .splits-home-page .split-creator .split-creator-split-card {
            max-width: 100%;
            box-sizing: border-box;
          }

          .splits-home-page .split-creator .split-creator-split-card-wrap {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SplitsHome;

