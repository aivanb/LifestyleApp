import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ThemeSwitcher Component
 * 
 * Floating theme selector for switching between color themes.
 * Provides visual preview and smooth theme transitions.
 */
const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Theme button */}
      <button
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle theme menu"
        title="Change theme"
      >
        <svg className="icon icon-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </button>

      {/* Theme menu */}
      {isOpen && (
        <>
          <div 
            className="theme-backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="theme-switcher">
            <h4 style={{ marginTop: 0, marginBottom: 'var(--space-3)', color: 'var(--text-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Select Theme
            </h4>
            {themes.map((t) => (
              <button
                key={t.id}
                className={`theme-option ${theme === t.id ? 'active' : ''}`}
                onClick={() => handleThemeChange(t.id)}
              >
                <div 
                  className="theme-preview"
                  style={{ backgroundColor: t.preview }}
                />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        .theme-toggle-btn {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          width: 3.75rem;
          height: 3.75rem;
          border-radius: var(--radius-full);
          background: var(--accent-primary);
          color: white;
          border: none;
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-fixed);
          transition: transform 0.25s var(--ease-out-cubic), box-shadow 0.25s var(--ease-out-cubic);
        }

        .theme-toggle-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 22px 36px rgba(0, 0, 0, 0.45);
        }

        .theme-backdrop {
          position: fixed;
          inset: 0;
          background: transparent;
          z-index: calc(var(--z-fixed) - 1);
          animation: fadeInBackdrop 0.2s var(--ease-out-cubic);
        }

        .theme-switcher {
          position: fixed;
          bottom: calc(var(--space-6) + 4.5rem);
          right: var(--space-6);
          background: var(--bg-secondary);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
          z-index: var(--z-fixed);
          min-width: 220px;
          animation: floatIn 0.25s var(--ease-in-out-cubic);
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all 0.25s var(--ease-out-cubic);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: var(--text-base);
          margin-bottom: var(--space-2);
        }

        .theme-option:last-child {
          margin-bottom: 0;
        }

        .theme-option:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          transform: translateX(6px);
        }

        .theme-option.active {
          background: rgba(255, 255, 255, 0.08);
          color: var(--accent-primary);
          box-shadow: inset 0 0 0 1px currentColor;
        }

        .theme-preview {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          border: none;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 640px) {
          .theme-toggle-btn {
            bottom: var(--space-4);
            right: var(--space-4);
          }

          .theme-switcher {
            bottom: calc(var(--space-4) + 4.5rem);
            right: var(--space-4);
          }
        }

        @keyframes floatIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ThemeSwitcher;

