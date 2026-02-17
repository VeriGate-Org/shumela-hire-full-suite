'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from './AuthContext';

interface ThemeContextType {
  isHighContrast: boolean;
  currentRole?: UserRole;
  setCurrentRole: (role: UserRole) => void;
  enableHighContrast: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('HR_MANAGER');

  useEffect(() => {
    const savedHighContrast = localStorage.getItem('high-contrast') === 'true';
    if (savedHighContrast) {
      setIsHighContrast(true);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('high-contrast');
    if (isHighContrast) {
      root.classList.add('high-contrast');
    }
    localStorage.setItem('high-contrast', isHighContrast.toString());
  }, [isHighContrast]);

  const enableHighContrast = (enabled: boolean) => {
    setIsHighContrast(enabled);
  };

  const value: ThemeContextType = {
    isHighContrast,
    currentRole,
    setCurrentRole,
    enableHighContrast,
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
