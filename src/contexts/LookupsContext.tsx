'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { lookupService } from '@/services/lookupService';
import { FALLBACK_LOOKUPS } from '@/services/lookupService';
import type { LookupsData } from '@/types/lookups';

interface LookupsContextType {
  lookups: LookupsData;
  isLoading: boolean;
}

const LookupsContext = createContext<LookupsContextType | undefined>(undefined);

export function useLookups() {
  const context = useContext(LookupsContext);
  if (context === undefined) {
    throw new Error('useLookups must be used within a LookupsProvider');
  }
  return context;
}

interface LookupsProviderProps {
  children: ReactNode;
}

export const LookupsProvider: React.FC<LookupsProviderProps> = ({ children }) => {
  const [lookups, setLookups] = useState<LookupsData>(FALLBACK_LOOKUPS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await lookupService.getAll();
        if (!cancelled) setLookups(data);
      } catch {
        // fallback already set
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <LookupsContext.Provider value={{ lookups, isLoading }}>
      {children}
    </LookupsContext.Provider>
  );
};
