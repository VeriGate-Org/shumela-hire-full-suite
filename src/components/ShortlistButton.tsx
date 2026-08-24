'use client';

import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';

/** Mirrors ShortlistingController's @PreAuthorize on the shortlist route. */
const SHORTLIST_ROLES = ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER'];

interface ShortlistButtonProps {
  applicationId: string | number;
  candidateName?: string;
  /** Reflects current state when known, so the control can read as a toggle rather than a one-way door. */
  shortlisted?: boolean;
  variant?: 'primary' | 'secondary' | 'icon';
  onDone?: (shortlisted: boolean) => void;
  className?: string;
}

/**
 * Include a candidate in the shortlist from wherever you happen to be looking at them.
 *
 * <p>Shortlisting used to live in exactly one place — the ShortlistingPanel on the job-postings
 * page — so the decision could only be taken from the vacancy, never from the candidate. The
 * applications detail modal did render a prominent "Shortlist" button, but it had no click
 * handler at all: it was markup. A dead control in front of an evaluation panel is worse than an
 * absent one, because the user concludes the product is broken rather than that the feature is
 * elsewhere.
 *
 * <p>The API is keyed on the application and scores on demand, so this works on a candidate whose
 * vacancy has never had scoring run.
 */
export default function ShortlistButton({
  applicationId,
  candidateName,
  shortlisted,
  variant = 'secondary',
  onDone,
  className = '',
}: ShortlistButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(Boolean(shortlisted));

  // Hide rather than refuse: the backend would reject the call anyway, and a button that always
  // errors is the dead-button problem again in a different costume.
  if (user?.role != null && !SHORTLIST_ROLES.includes(user.role)) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isShortlisted;
    setSaving(true);
    try {
      const response = await apiFetch(`/api/shortlisting/applications/${applicationId}/shortlist`, {
        method: 'POST',
        body: JSON.stringify({
          include: next,
          reason: next ? 'Shortlisted from the candidate record' : 'Removed from the shortlist',
        }),
      });
      if (!response.ok) throw new Error(await refusalMessage(response));

      setIsShortlisted(next);
      const who = candidateName || 'Candidate';
      toast(next ? `${who} added to the shortlist` : `${who} removed from the shortlist`, 'success');
      onDone?.(next);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Could not update the shortlist', 'error');
    } finally {
      setSaving(false);
    }
  };

  const label = saving ? 'Saving...' : isShortlisted ? 'Shortlisted' : 'Shortlist';
  const Icon = isShortlisted ? CheckCircleIconSolid : CheckCircleIcon;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={saving}
        title={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        aria-label={isShortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
        aria-pressed={isShortlisted}
        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-50 ${
          isShortlisted
            ? 'text-green-600 hover:bg-green-50'
            : 'text-muted-foreground hover:bg-muted hover:text-primary'
        } ${className}`}
      >
        <Icon className="w-[18px] h-[18px]" />
      </button>
    );
  }

  const base = 'inline-flex items-center gap-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  if (variant === 'primary') {
    return (
      <button
        onClick={handleClick}
        disabled={saving}
        aria-pressed={isShortlisted}
        className={`${base} px-5 py-2.5 text-[0.8125rem] uppercase tracking-wider rounded-full shadow-sm hover:shadow-md hover:-translate-y-px ${
          isShortlisted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-cta text-foreground hover:bg-cta-hover'
        } ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      aria-pressed={isShortlisted}
      className={`${base} px-3 py-1.5 text-xs rounded-full border ${
        isShortlisted
          ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
          : 'border-border bg-card text-foreground hover:border-primary hover:text-primary'
      } ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
