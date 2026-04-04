import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SplitCreator from '../components/SplitCreator';
import { useTheme } from '../contexts/ThemeContext';

/**
 * SplitEditor Page
 *
 * UI-only wrapper around the existing SplitCreator editor mode.
 * Reached via the "Edit" button in SplitCreator's Manage Splits tab.
 */
const SplitEditor = () => {
  const { splitId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const splitFromState = location?.state?.split || null;

  return (
    <div className={`split-editor-page split-editor-page--shell${theme === 'light' ? ' split-editor-page--shell-light' : ''}`}>
      <div className="page-actions">
        <button
          type="button"
          className="nav-back-btn"
          onClick={() => navigate('/personalization/splits')}
          aria-label="Back"
          title="Back"
        >
          <ArrowLeftIcon className="nav-back-icon" aria-hidden="true" />
        </button>
      </div>
      <SplitCreator
        editorMode={true}
        editorKind="edit"
        uiVariant="splitsPage"
        editorSplitId={splitId}
        editorSplit={splitFromState}
      />

      <style>{`
        .split-editor-page {
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

        .split-editor-page--shell {
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

        .split-editor-page--shell-light {
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
          .split-editor-page {
            padding: var(--space-3);
            padding-top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
            padding-bottom: calc(110px + env(safe-area-inset-bottom, 0px));
          }

          .split-editor-page .page-actions {
            padding-left: 0;
            padding-right: 0;
            margin-bottom: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
};

export default SplitEditor;

