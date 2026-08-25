'use client';

import React, { ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type ModalSize = 'sm' | 'md' | 'lg';

/** Three, not eleven. Anything that needs more room than `lg` is a page. */
const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-[360px]',
  md: 'max-w-[520px]',
  lg: 'max-w-[760px]',
};

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Names the object and the act — "Schedule interview", not "Interview". */
  title: string;
  /** One line of context. The candidate, the vacancy, whatever identifies this one. */
  subtitle?: ReactNode;
  size?: ModalSize;
  children: ReactNode;
  /** Buttons. The last one is the commit, because it is the last thing read before committing. */
  footer?: ReactNode;
  /**
   * Set while the modal holds input the user would lose. Backdrop clicks then ask instead of
   * closing; Escape still works, because a keyboard user must never be trapped.
   */
  dirty?: boolean;
  /** Asked before discarding when `dirty`. Returning false keeps the modal open. */
  onRequestClose?: () => boolean;
}

/**
 * The focused-task dialog.
 *
 * <p>Sixty-three files in this product render their own overlay and each re-invented the parts it
 * happened to think of: fifteen announce themselves to a screen reader, eight close on Escape, two
 * stop the page scrolling behind. That is not a design problem so much as a missing component —
 * ConfirmDialog covers one decision and SlideOverDrawer covers detail beside a list, and there was
 * nothing for the case in between, which is the case most of those sixty-three are.
 *
 * <p>Use it for a short task that must finish before anything else. If it has more than about eight
 * fields, or can be saved half-done, or someone might want to link to it, it is a page.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  dirty = false,
  onRequestClose,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // Whatever had focus when this opened. Returning there is the difference between closing a
  // dialog and being dumped at the top of the document.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const requestClose = useCallback(() => {
    if (dirty && onRequestClose && !onRequestClose()) return;
    onClose();
  }, [dirty, onRequestClose, onClose]);

  // Escape always closes, even when dirty. A guard that can trap a keyboard user is worse than the
  // loss it is guarding against — the confirm, if any, belongs to the backdrop.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  // Focus in on open, back out on close.
  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    // The body first, not the panel: the close button precedes it in DOM order, and landing a
    // keyboard user on "dismiss" invites them to leave the task they just opened.
    const target =
      bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current;
    target?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, [open]);

  // The page behind must not scroll. Restores the previous value rather than assuming it was
  // empty, so nested or rapid opens cannot leave the page permanently locked.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onMouseDown={(e) => {
        // mousedown, not click: a drag that starts inside the panel and releases on the backdrop
        // is not a request to close.
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${SIZE_CLASS[size]} overflow-hidden rounded-card border border-border bg-card shadow-xl outline-none`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[0.9375rem] font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="flex-none rounded p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div ref={bodyRef} className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-muted/40 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
