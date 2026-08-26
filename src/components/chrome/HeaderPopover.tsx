'use client';

import React, { ReactNode, RefObject, useEffect, useRef } from 'react';

/**
 * The one popover the header chrome uses.
 *
 * <p>The notification dropdown and the profile menu each grew their own surface, their own
 * dismissal behaviour and their own idea of how tall a panel may be. They are the same object with
 * different contents, so this is that object.
 *
 * <p><b>Height.</b> The panel is the scroll container's parent, not a second scroll container.
 * NotificationCenter previously capped the panel at {@code max-h-96} and the list inside it at
 * {@code max-h-64}; with a header and a footer also in the box the empty state was clipped behind
 * the footer. Here the header and footer are {@code shrink-0} and the body is the only thing that
 * scrolls, bounded by the viewport rather than by a guess.
 *
 * <p><b>Dismissal.</b> Escape closes, a click outside closes, and focus returns to the trigger. The
 * previous implementation rendered a click-only backdrop {@code div}, so a keyboard user could open
 * either panel and had no way to close it.
 */

/** The trigger button shared by every icon control in the header. */
export const HEADER_TRIGGER =
  'relative inline-flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground ' +
  'transition-colors hover:bg-muted hover:text-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-background';

interface HeaderPopoverProps {
  open: boolean;
  onClose: () => void;
  /** Announced name of the panel. */
  label: string;
  /** A notification list is a dialog; the account menu is genuinely a menu. */
  as?: 'dialog' | 'menu';
  /** Tailwind width class. */
  width?: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export default function HeaderPopover({
  open,
  onClose,
  label,
  as = 'dialog',
  width = 'w-[22rem]',
  triggerRef,
  header,
  footer,
  children,
}: HeaderPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
      // Focus has to come back to the control that opened the panel, or the keyboard user is
      // returned to the top of the document.
      triggerRef.current?.focus();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role={as}
      aria-label={label}
      // Bounded by the viewport rather than a fixed guess, so the panel cannot outgrow the screen
      // on a short window and cannot clip its own contents on a tall one.
      style={{ maxHeight: 'min(30rem, calc(100dvh - 6rem))' }}
      className={`absolute right-0 z-50 mt-2 flex flex-col overflow-hidden rounded-card border border-border bg-popover text-popover-foreground shadow-lg ${width} max-w-[calc(100vw-1.5rem)]`}
    >
      {header && <div className="shrink-0 border-b border-border">{header}</div>}
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 border-t border-border bg-muted">{footer}</div>}
    </div>
  );
}
