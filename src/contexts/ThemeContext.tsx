'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from './AuthContext';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isHighContrast: boolean;
  currentRole?: UserRole;
  setCurrentRole: (role: UserRole) => void;
  toggleTheme: () => void;
  enableHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('HR_MANAGER');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    const savedHighContrast = localStorage.getItem('high-contrast') === 'true';

    if (savedMode) {
      setMode(savedMode);
    }

    if (savedHighContrast) {
      setIsHighContrast(true);
    }
  }, []);

  // Handle dark mode
  useEffect(() => {
    const updateDarkMode = () => {
      if (mode === 'system') {
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      } else {
        setIsDark(mode === 'dark');
      }
    };

    updateDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        setIsDark(mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(isDark ? 'dark' : 'light');

    if (isHighContrast) {
      root.classList.add('high-contrast');
    }

    localStorage.setItem('theme-mode', mode);
    localStorage.setItem('high-contrast', isHighContrast.toString());
  }, [mode, isDark, isHighContrast]);

  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setMode(nextMode);
  };

  const enableHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
  };

  const value: ThemeContextType = {
    mode,
    setMode,
    isDark,
    isHighContrast,
    currentRole,
    setCurrentRole,
    toggleTheme,
    enableHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className="transition-colors duration-300">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
