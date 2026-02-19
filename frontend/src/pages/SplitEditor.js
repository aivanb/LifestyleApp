import React from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SplitCreator from '../components/SplitCreator';

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
  const splitFromState = location?.state?.split || null;

  return (
    <div className="split-editor-page">
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
          width: 100%;
          max-width: none;
          margin: 0;
          padding: var(--space-4);
          font-size: var(--text-lg);
          font-family: var(--font-primary);
        }

        .page-actions {
          display: flex;
          justify-content: flex-end;
          margin-bottom: var(--space-4);
        }

        .nav-back-btn {
          padding: var(--space-3) var(--space-4);
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
          width: 22px;
          height: 22px;
        }

        .nav-back-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-secondary);
        }
      `}</style>
    </div>
  );
};

export default SplitEditor;

