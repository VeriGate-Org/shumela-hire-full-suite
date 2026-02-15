'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Density = 'compact' | 'comfortable' | 'spacious';

interface LayoutContextType {
  density: Density;
  setDensity: (density: Density) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const DENSITY_KEY = 'talentgate-density';

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>('comfortable');

  useEffect(() => {
    const stored = localStorage.getItem(DENSITY_KEY);
    if (stored === 'compact' || stored === 'comfortable' || stored === 'spacious') {
      setDensityState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  const setDensity = (d: Density) => {
    setDensityState(d);
  };

  return (
    <LayoutContext.Provider value={{ density, setDensity }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
