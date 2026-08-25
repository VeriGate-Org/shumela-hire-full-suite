'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DraftEnvelope<T> {
  formData: T;
  currentStep: number;
  savedAt: number;
  version: 1;
}

interface UseWizardDraftOptions<T> {
  wizardType: string;
  entityId?: string | number;
  initialData: T;
  currentStep: number;
  debounceMs?: number;
  maxAgeDays?: number;
  onDraftRestored?: (data: T, step: number) => void;
  backendSave?: (data: T) => Promise<void>;
  enabled?: boolean;
}

interface UseWizardDraftReturn {
  draftRestored: boolean;
  discardDraft: () => void;
  clearDraft: () => void;
  saveDraftToBackend: () => Promise<void>;
  isSavingToBackend: boolean;
  statusText: string;
}

/** Prefix every draft key shares, so a sign-out can clear the lot without knowing their names. */
export const WIZARD_DRAFT_PREFIX = 'wizard-draft:';

/**
 * Where a draft is kept.
 *
 * <p>The key used to be `wizard-draft:{type}:{entityId ?? 'new'}` — no owner, no tenant. Drafts
 * live in localStorage, which survives sign-out, so on a shared workstation the next person to
 * open the same wizard restored the previous person's half-written record: a vacancy's salary band,
 * a requisition's motivation. Scoping it to the owner is what stops that; clearing on sign-out is
 * what stops it lingering.
 *
 * <p>`'anon'` when nobody is signed in. A draft written before sign-in cannot be attributed, so it
 * is never restored into an authenticated session.
 */
function storageKey(
  wizardType: string,
  ownerKey: string,
  entityId?: string | number,
): string {
  return `${WIZARD_DRAFT_PREFIX}${ownerKey}:${wizardType}:${entityId ?? 'new'}`;
}

/** Removes every wizard draft on this device. Called when a session ends. */
export function clearAllWizardDrafts(): void {
  if (typeof localStorage === 'undefined') return;
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(WIZARD_DRAFT_PREFIX)) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}

export function useWizardDraft<T>(
  formData: T,
  options: UseWizardDraftOptions<T>,
): UseWizardDraftReturn {
  const {
    wizardType,
    entityId,
    currentStep,
    debounceMs = 2000,
    maxAgeDays = 7,
    onDraftRestored,
    backendSave,
    enabled = true,
  } = options;

  const [draftRestored, setDraftRestored] = useState(false);
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);
  const [statusText, setStatusText] = useState('');
  const mountedRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Tenant as well as user: the same person may hold accounts in two tenants, and a draft written
  // in one must not surface in the other.
  const { user } = useAuth();
  const ownerKey = user?.id
    ? `${(user as { tenantId?: string }).tenantId ?? 't'}#${user.id}`
    : 'anon';
  const key = storageKey(wizardType, ownerKey, entityId);

  // --- Restore on mount ---
  useEffect(() => {
    if (!enabled) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const envelope: DraftEnvelope<T> = JSON.parse(raw);
      if (envelope.version !== 1) return;
      const ageMs = Date.now() - envelope.savedAt;
      if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
        return;
      }
      onDraftRestored?.(envelope.formData, envelope.currentStep);
      setDraftRestored(true);
    } catch {
      localStorage.removeItem(key);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Debounced autosave ---
  useEffect(() => {
    if (!enabled) return;
    // Skip autosave on mount to avoid overwriting just-restored data
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      try {
        const envelope: DraftEnvelope<T> = {
          formData,
          currentStep,
          savedAt: Date.now(),
          version: 1,
        };
        localStorage.setItem(key, JSON.stringify(envelope));
        setStatusText('Draft saved');
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setStatusText(''), 10000);
      } catch {
        // localStorage full or unavailable — silently ignore
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [formData, currentStep, key, debounceMs, enabled]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    setStatusText('');
  }, [key]);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(key);
    setDraftRestored(false);
    setStatusText('');
  }, [key]);

  const saveDraftToBackend = useCallback(async () => {
    if (!backendSave) return;
    setIsSavingToBackend(true);
    setStatusText('Saving...');
    try {
      await backendSave(formData);
      // Also save to localStorage
      try {
        const envelope: DraftEnvelope<T> = {
          formData,
          currentStep,
          savedAt: Date.now(),
          version: 1,
        };
        localStorage.setItem(key, JSON.stringify(envelope));
      } catch {
        // ignore
      }
      setStatusText('Draft saved');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setStatusText(''), 10000);
    } catch {
      setStatusText('');
    } finally {
      setIsSavingToBackend(false);
    }
  }, [backendSave, formData, currentStep, key]);

  // When disabled, return inert values
  if (!enabled) {
    return {
      draftRestored: false,
      discardDraft: () => {},
      clearDraft: () => {},
      saveDraftToBackend: async () => {},
      isSavingToBackend: false,
      statusText: '',
    };
  }

  return {
    draftRestored,
    discardDraft,
    clearDraft,
    saveDraftToBackend,
    isSavingToBackend,
    statusText,
  };
}
