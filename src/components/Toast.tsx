'use client';

import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let nextId = 0;

/** How long a dismissible toast lives. Errors do not use this. */
const DWELL_MS = 4000;

/** Beyond this the oldest is dropped, so a loop cannot bury the screen. */
const MAX_VISIBLE = 3;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Presentation of a toast.
 *
 * <p><b>The colours are the fix.</b> This used text-red-800 and text-green-800. The Tailwind theme
 * redefines gray and slate as CSS variables that invert in dark mode, but not red or green — those
 * stay at their light-mode values, so both landed as dark text on a dark surface: <b>2.14:1</b> for
 * errors and <b>2.17:1</b> for successes, against the 4.5:1 WCAG AA needs.
 *
 * <p>The design system already had the answer. The *-on-tint tokens exist for exactly this — text
 * on a tinted surface — and pair with the matching *-bg: 5.77:1 dark and 4.53:1 light for errors,
 * 6.36:1 and 4.51:1 for successes. Both pass in both themes.
 */
const TONE: Record<ToastType, { box: string; icon: typeof CheckCircleIcon }> = {
  success: {
    box: 'bg-success-bg text-success-on-tint border-border shadow-[inset_3px_0_0_var(--accent-teal)]',
    icon: CheckCircleIcon,
  },
  error: {
    box: 'bg-error-bg text-error-on-tint border-border shadow-[inset_3px_0_0_var(--accent-pink)]',
    icon: ExclamationTriangleIcon,
  },
  info: {
    box: 'bg-surface-navy text-foreground border-border shadow-[inset_3px_0_0_var(--accent-navy)]',
    icon: InformationCircleIcon,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const { box, icon: Icon } = TONE[toast.type];

  // An error stays until it is dismissed. The one that prompted this work — "Tell us why this move
  // before submitting" — was a validation error the reader had four seconds to finish.
  const persists = toast.type === 'error';

  useEffect(() => {
    if (persists || paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), DWELL_MS);
    return () => clearTimeout(timer);
  }, [persists, paused, toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto rounded-card border px-3 py-2.5 shadow-lg ${box}`}
      // Pausing on hover and on keyboard focus, so a toast cannot expire mid-read or while its
      // action button is focused.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="flex items-start gap-2">
        {/* A glyph as well as a colour: severity carried by hue alone is invisible to roughly one
            in twelve men. */}
        <Icon className="mt-0.5 h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-sm leading-snug">
          {toast.message}
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); onDismiss(toast.id); }}
              className="ml-2 font-semibold underline transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info', action?: ToastAction) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type, action }].slice(-MAX_VISIBLE));
  }, []);

  // Two regions, because urgency differs. An error interrupts; "Draft saved" waits its turn rather
  // than cutting across whatever the screen reader is currently saying.
  const urgent = toasts.filter(t => t.type === 'error');
  const routine = toasts.filter(t => t.type !== 'error');

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex max-w-sm flex-col gap-2">
        <div role="alert" aria-live="assertive" className="flex flex-col gap-2">
          {urgent.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </div>
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          {routine.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
