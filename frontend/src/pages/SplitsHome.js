import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import SplitCreator from '../components/SplitCreator';

/**
 * SplitsHome
 *
 * Hub page for /personalization/splits. Shows the updated "Manage Splits" UI
 * and routes users to /personalization/splits/new for creation.
 */
const SplitsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="splits-home-page">
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
          width: 100%;
          max-width: none;
          margin: 0;
          padding: var(--space-4);
          font-size: var(--text-lg);
          font-family: var(--font-primary);
        }

        .splits-home-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-4);
          gap: var(--space-3);
        }

        .splits-home-new-btn {
          padding: var(--space-3) var(--space-6);
          font-size: var(--text-base);
          font-weight: var(--font-weight-semibold);
        }

        .nav-back-btn {
          padding: var(--space-2) var(--space-3);
          background: var(--bg-tertiary);
          border: 1px solid var(--border-primary);
          color: var(--text-primary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .nav-back-icon {
          width: 18px;
          height: 18px;
        }

        .nav-back-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-secondary);
        }

        @media (max-width: 768px) {
          .splits-home-actions {
            justify-content: stretch;
          }

          .splits-home-new-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SplitsHome;

