'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const colors: Record<ToastType, string> = {
    success: 'bg-surface-teal border-l-accent-teal text-green-800',
    error: 'bg-surface-pink border-l-accent-pink text-red-800',
    info: 'bg-surface-navy border-l-accent-navy text-foreground',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`border border-l-4 rounded-card px-4 py-3 text-sm shadow-lg animate-in slide-in-from-right ${colors[t.type]}`}
            role="alert"
          >
            <div className="flex items-start justify-between gap-2">
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 opacity-60 hover:opacity-100 text-xs leading-none"
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
