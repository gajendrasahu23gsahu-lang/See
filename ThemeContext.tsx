
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { themes, ThemeMode, ThemeColors } from '../utils/theme';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const theme = themes[themeMode];

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Handle HTML class for Tailwind dark mode
    if (themeMode === 'light') {
      root.classList.remove('dark');
      // Set global body styles for overscroll areas
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#000000';
    } else {
      root.classList.add('dark');
      if (themeMode === 'dim') {
        body.style.backgroundColor = '#15202b';
      } else {
        body.style.backgroundColor = '#000000';
      }
      body.style.color = '#ffffff';
    }
  }, [themeMode]);

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
