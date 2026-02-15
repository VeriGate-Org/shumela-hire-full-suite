'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ShortcutEntry {
  keys: string;
  description: string;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const pendingPrefix = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const shortcutList: ShortcutEntry[] = [
    { keys: 'g d', description: 'Go to Dashboard' },
    { keys: 'g p', description: 'Go to Pipeline' },
    { keys: 'g a', description: 'Go to Applications' },
    { keys: 'g j', description: 'Go to Job Postings' },
    { keys: 'g i', description: 'Go to Interviews' },
    { keys: 'g r', description: 'Go to Reports' },
    { keys: '?', description: 'Show keyboard shortcuts' },
  ];

  const routeMap: Record<string, string> = {
    'g+d': '/dashboard',
    'g+p': '/pipeline',
    'g+a': '/applications',
    'g+j': '/job-postings',
    'g+i': '/interviews',
    'g+r': '/reports',
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    if (key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowOverlay(prev => !prev);
      return;
    }

    if (key === 'escape') {
      setShowOverlay(false);
      pendingPrefix.current = null;
      return;
    }

    if (pendingPrefix.current) {
      const combo = `${pendingPrefix.current}+${key}`;
      pendingPrefix.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const route = routeMap[combo];
      if (route) {
        e.preventDefault();
        router.push(route);
      }
      return;
    }

    if (key === 'g') {
      pendingPrefix.current = 'g';
      timeoutRef.current = setTimeout(() => {
        pendingPrefix.current = null;
      }, 1500);
      return;
    }
  }, [router]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [handleKeyDown]);

  return { showOverlay, setShowOverlay, shortcutList };
}
