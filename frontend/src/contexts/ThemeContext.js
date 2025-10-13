import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load saved theme from localStorage or default to 'dark'
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const themes = [
    { id: 'dark', name: 'Dark Mode', preview: '#0F1419' },
    { id: 'light', name: 'Light Mode', preview: '#FFFFFF' },
    { id: 'high-contrast', name: 'High Contrast', preview: '#000000' },
    { id: 'warm', name: 'Warm Minimal', preview: '#FBF8F3' },
  ];

  const value = {
    theme,
    setTheme,
    themes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

