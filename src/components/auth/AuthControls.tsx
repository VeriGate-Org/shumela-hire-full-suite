'use client';

import React from 'react';

/**
 * Form primitives shared by the authentication screens.
 *
 * Consolidated because the four pages had drifted into four copies of the same input class string,
 * and because the primary button was unreadable: gold #F1C54B text on white is roughly 1.6:1,
 * far under the 4.5:1 needed for body text. The design system already defines the right pairing —
 * `--cta` gold with `--cta-foreground` deep navy — which is what the rest of the product uses.
 */

const CONTROL =
  'w-full rounded-control border border-border bg-card px-3.5 py-2.5 text-sm text-foreground ' +
  'placeholder:text-muted-foreground/60 transition-colors ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  /** Rendered in the label, un-uppercased, e.g. "(optional)". */
  hint?: string;
}

export function Field({ id, label, hint, className = '', ...input }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground"
      >
        {label}
        {hint && (
          <span className="ml-1 font-medium normal-case tracking-normal text-muted-foreground/70">
            {hint}
          </span>
        )}
      </label>
      <input id={id} className={`${CONTROL} ${className}`} {...input} />
    </div>
  );
}

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export function AuthButton({
  variant = 'primary',
  className = '',
  children,
  ...button
}: AuthButtonProps) {
  const base =
    'w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm ' +
    'font-bold uppercase tracking-[0.08em] transition-all ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-55';

  const styles =
    variant === 'primary'
      ? 'bg-cta text-cta-foreground hover:bg-cta-hover focus-visible:ring-cta ' +
        'shadow-[0_1px_2px_rgba(3,46,73,0.16)] hover:shadow-[0_4px_12px_rgba(241,197,75,0.35)]'
      : 'border border-border bg-card text-foreground hover:bg-muted focus-visible:ring-primary';

  return (
    <button className={`${base} ${styles} ${className}`} {...button}>
      {children}
    </button>
  );
}

type AlertTone = 'error' | 'success';

export function AuthAlert({ tone, children }: { tone: AlertTone; children: React.ReactNode }) {
  const styles =
    tone === 'error'
      ? 'border-l-[3px] border-l-[#D63050] bg-[#FFF1F2] text-[#9F1239] dark:bg-[#D63050]/10 dark:text-[#FDA4AF]'
      : 'border-l-[3px] border-l-[#047469] bg-[#EFFEFB] text-[#065F52] dark:bg-[#047469]/10 dark:text-[#5EEAD4]';

  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-control px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

/** The four bands mirror getPasswordStrength's labels. */
export function PasswordStrength({ score, label }: { score: number; label: string }) {
  const colour =
    label === 'Strong' ? 'bg-[#047469]'
      : label === 'Good' ? 'bg-[#F1C54B]'
      : label === 'Fair' ? 'bg-[#D4A832]'
      : 'bg-[#D63050]';

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colour}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-12 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/** Full-page spinner used by the auth routes while they resolve. */
export function AuthSpinner({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-border border-t-[#F1C54B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F1C54B]" />
      </span>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
