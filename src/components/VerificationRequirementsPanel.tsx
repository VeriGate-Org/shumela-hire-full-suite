'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';

export interface CheckType {
  code: string;
  name: string;
  description?: string;
  turnaround?: string;
  price?: number;
  currency?: string;
}

/**
 * The verification catalogue the provider offers.
 *
 * <p>Shared with the create wizard so the two places that configure requirements offer the same
 * codes. A hard-coded second list would drift from the provider and produce requirements no check
 * can ever satisfy.</p>
 */
export function useCheckTypeCatalogue() {
  const [catalogue, setCatalogue] = useState<CheckType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch('/api/background-checks/check-types');
        if (!response.ok) throw new Error(await refusalMessage(response));
        const data = await response.json();
        if (!cancelled) setCatalogue(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setCatalogue([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalogue, loading };
}

interface VerificationRequirementsPanelProps {
  jobPostingId: string;
  /** Raw value off the posting — the API stores this as a JSON array in a string column. */
  requiredCheckTypes?: string | string[] | null;
  enforceCheckCompletion?: boolean | null;
  /** Only ADMIN and HR_MANAGER may change this; everyone else sees what the rule is. */
  canEdit: boolean;
  updatedBy: string;
  onSaved?: (next: { enforceCheckCompletion: boolean; requiredCheckTypes: string[] }) => void;
}

function parseRequired(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Sets what must be verified before a candidate may progress past Background Check.
 *
 * <p>This is the configuration side of the only requirement the pipeline actually enforces. It
 * lives on the requisition rather than in global settings because the answer differs per role —
 * a driver needs a licence check, a financial manager needs a credit check — and it belongs
 * alongside the vacancy it governs.</p>
 */
export default function VerificationRequirementsPanel({
  jobPostingId,
  requiredCheckTypes,
  enforceCheckCompletion,
  canEdit,
  updatedBy,
  onSaved,
}: VerificationRequirementsPanelProps) {
  const { toast } = useToast();

  const initialSelected = useMemo(() => parseRequired(requiredCheckTypes), [requiredCheckTypes]);
  const initialEnforce = !!enforceCheckCompletion;

  // A missing catalogue must not hide a rule already in force: the render falls back to whatever
  // the requisition already requires.
  const { catalogue, loading } = useCheckTypeCatalogue();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [enforce, setEnforce] = useState<boolean>(initialEnforce);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(initialSelected);
    setEnforce(initialEnforce);
  }, [initialSelected, initialEnforce]);

  const dirty =
    enforce !== initialEnforce ||
    selected.length !== initialSelected.length ||
    selected.some((c) => !initialSelected.includes(c));

  // The server refuses this too. Saying so here means the reason arrives before the click, not after.
  const enforcingNothing = enforce && selected.length === 0;

  const toggle = (code: string) => {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await apiFetch(
        `/api/job-postings/${jobPostingId}/verification-requirements?updatedBy=${encodeURIComponent(updatedBy)}`,
        {
          method: 'PUT',
          body: JSON.stringify({ enforceCheckCompletion: enforce, requiredCheckTypes: selected }),
        }
      );
      if (!response.ok) throw new Error(await refusalMessage(response));
      toast(
        enforce
          ? `Saved. Candidates on this vacancy cannot pass Background Check until ${selected.length} check${selected.length === 1 ? '' : 's'} come back clear.`
          : 'Saved. Verification is recorded on this vacancy but does not block progression.',
        'success'
      );
      onSaved?.({ enforceCheckCompletion: enforce, requiredCheckTypes: selected });
    } catch (error: any) {
      toast(error.message || 'Could not save the verification requirements', 'error');
    } finally {
      setSaving(false);
    }
  };

  const rows: CheckType[] = catalogue.length
    ? catalogue
    : selected.map((code) => ({ code, name: code.replace(/_/g, ' ') }));

  return (
    <div data-testid="verification-requirements-panel">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Verification requirements</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            What must be verified on this vacancy before a candidate can move past Background Check.
          </p>
        </div>
        {initialEnforce && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Enforced
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading check types…</p>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((ct) => {
              const checked = selected.includes(ct.code);
              return (
                <label
                  key={ct.code}
                  className={`flex items-start gap-2.5 p-3 border rounded-[2px] transition-colors ${
                    checked ? 'border-primary/40 bg-primary/5' : 'border-border'
                  } ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    disabled={!canEdit || saving}
                    onChange={() => toggle(ct.code)}
                    aria-label={ct.name}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{ct.name}</span>
                    {ct.turnaround && (
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {ct.turnaround}
                        {typeof ct.price === 'number' ? ` · ${ct.currency || 'ZAR'} ${ct.price.toFixed(2)}` : ''}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>

          <label className={`flex items-start gap-2.5 mt-4 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}>
            <input
              type="checkbox"
              className="mt-0.5"
              checked={enforce}
              disabled={!canEdit || saving}
              onChange={() => setEnforce((v) => !v)}
              aria-label="Block progression until every required check is clear"
            />
            <span>
              <span className="block text-sm font-medium text-foreground">
                Block progression until every required check is clear
              </span>
              <span className="block text-xs text-muted-foreground mt-0.5">
                With this off, the checks above are still tracked and reported — they simply do not stop
                anyone moving forward.
              </span>
            </span>
          </label>

          {enforcingNothing && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">
              Select at least one check. Enforcing an empty list would block nobody while showing a control
              that is not there.
            </p>
          )}

          {canEdit ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={!dirty || enforcingNothing || saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wider rounded-full transition-all hover:bg-cta-hover hover:border-cta-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save requirements'}
              </button>
              {dirty && !saving && (
                <span className="text-xs text-muted-foreground">Unsaved changes</span>
              )}
            </div>
          ) : (
            <p className="mt-5 text-xs text-muted-foreground">
              Only an Administrator or HR Manager can change these requirements.
            </p>
          )}
        </>
      )}
    </div>
  );
}
