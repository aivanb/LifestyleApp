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
            <h4 style={{ marginTop: 0, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
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

      <style jsx>{`
        .theme-toggle-btn {
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          width: 3.5rem;
          height: 3.5rem;
          border-radius: var(--radius-full);
          background: var(--accent-primary);
          color: white;
          border: none;
          box-shadow: var(--shadow-xl);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: var(--z-fixed);
          transition: all 0.2s var(--ease-out-cubic);
        }

        .theme-toggle-btn:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.4);
        }

        .theme-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: calc(var(--z-fixed) - 1);
          animation: fadeIn 0.2s var(--ease-out-cubic);
        }

        .theme-switcher {
          position: fixed;
          bottom: calc(var(--space-6) + 4rem);
          right: var(--space-6);
          background: var(--bg-secondary);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          box-shadow: var(--shadow-2xl);
          z-index: var(--z-fixed);
          min-width: 200px;
          animation: slideUp 0.2s var(--ease-in-out-cubic);
        }

        .theme-option {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s var(--ease-out-cubic);
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
          background: var(--bg-hover);
          color: var(--text-primary);
          transform: translateX(4px);
        }

        .theme-option.active {
          background: var(--accent-primary);
          color: white;
        }

        .theme-preview {
          width: 24px;
          height: 24px;
          border-radius: var(--radius-sm);
          border: 2px solid var(--border-primary);
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 640px) {
          .theme-toggle-btn {
            bottom: var(--space-4);
            right: var(--space-4);
          }

          .theme-switcher {
            bottom: calc(var(--space-4) + 4rem);
            right: var(--space-4);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default ThemeSwitcher;

