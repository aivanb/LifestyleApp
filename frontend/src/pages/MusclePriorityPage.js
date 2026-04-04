import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import MusclePriority from '../components/MusclePriority';
import { useTheme } from '../contexts/ThemeContext';

/**
 * /personalization/muscle-priority
 *
 * Route wrapper for the existing MusclePriority component.
 */
const MusclePriorityPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`muscle-priority-page muscle-priority-page--shell${theme === 'light' ? ' muscle-priority-page--shell-light' : ''}`}>
      <div className="page-actions">
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

      <MusclePriority onPrioritiesUpdated={() => {}} showHeader={false} enableTooltips={true} />

      <style>{`
        .muscle-priority-page {
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

        .muscle-priority-page--shell {
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

        .muscle-priority-page--shell-light {
          --profile-shell-tint: rgba(0, 0, 0, 0.04);
          --profile-shell-strong: rgba(0, 0, 0, 0.1);
          --profile-card-bg: #ffffff;
          --profile-card-border: #d8dce8;
          background-color: #e8eaf2;
        }

        .page-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-4);
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
          .muscle-priority-page {
            padding: var(--space-3);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
          }
        }
      `}</style>
    </div>
  );
};

export default MusclePriorityPage;

