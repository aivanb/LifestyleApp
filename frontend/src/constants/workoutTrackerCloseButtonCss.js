/**
 * Shared close (X) control styles for `/workout-tracker` UI.
 * Use with Heroicons `XMarkIcon` and classes `wk-track-close-btn` + `wk-track-close-icon`.
 */
export const WORKOUT_TRACKER_CLOSE_BTN_CSS = `
  .wk-track-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: var(--radius-md);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    line-height: 1;
    -webkit-tap-highlight-color: transparent;
    transition: color 0.2s ease, background 0.2s ease;
  }
  .wk-track-close-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }
  .wk-track-close-btn:focus-visible {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
  .wk-track-close-btn .wk-track-close-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }
  .wk-track-close-btn--compact {
    width: 1.375rem;
    height: 1.375rem;
    border-radius: var(--radius-sm);
  }
  .wk-track-close-btn--compact .wk-track-close-icon {
    width: 0.8125rem;
    height: 0.8125rem;
  }
`;
