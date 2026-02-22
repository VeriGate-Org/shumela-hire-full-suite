'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserRole } from './AuthContext';

type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isHighContrast: boolean;
  currentRole?: UserRole;
  setCurrentRole: (role: UserRole) => void;
  enableHighContrast: (enabled: boolean) => void;
  colorMode: ColorMode;
  resolvedTheme: 'light' | 'dark';
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  const root = document.documentElement;
  if (resolved === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('HR_MANAGER');
  const [colorMode, setColorModeState] = useState<ColorMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Initialize from localStorage
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('high-contrast') === 'true';
    if (savedHighContrast) setIsHighContrast(true);

    const savedMode = localStorage.getItem('color-mode') as ColorMode | null;
    const mode = savedMode || 'system';
    setColorModeState(mode);

    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  // Listen for system preference changes when mode is 'system'
  useEffect(() => {
    if (colorMode !== 'system') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [colorMode]);

  // Apply high contrast
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('high-contrast', isHighContrast);
    localStorage.setItem('high-contrast', isHighContrast.toString());
  }, [isHighContrast]);

  const enableHighContrast = useCallback((enabled: boolean) => {
    setIsHighContrast(enabled);
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem('color-mode', mode);
    const resolved = mode === 'system' ? getSystemTheme() : mode;
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  const value: ThemeContextType = {
    isHighContrast,
    currentRole,
    setCurrentRole,
    enableHighContrast,
    colorMode,
    resolvedTheme,
    setColorMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
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
