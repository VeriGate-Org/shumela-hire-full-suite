'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth, UserRole, ALL_ROLES, ROLE_DISPLAY_NAMES } from '../contexts/AuthContext';
import { roleConfigurations } from '../config/roleConfig';
import { ChevronDownIcon, CheckIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

/**
 * Lets an administrator view the product as another role without signing out.
 *
 * The component and `AuthContext.switchRole` both already existed; nothing ever rendered it, so
 * the only way to see another role's screens was to log out and back in as somebody else.
 *
 * **This changes the view, not the session.** `apiFetch` sends the real Cognito token, which still
 * says ADMIN, so the backend keeps authorising as an administrator no matter what is selected
 * here. It is a fast way to reach another role's navigation and screens — it is not impersonation,
 * and it must not be used to show that a control refuses somebody. That needs a real account.
 *
 * Hence the gold "Viewing as" treatment while a switch is active: whoever is driving should never
 * be in any doubt about which of the two they are looking at.
 */
export default function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  // switchRole itself refuses anyone whose original role is not ADMIN; this keeps the control
  // out of the chrome for everybody else rather than offering a button that does nothing.
  const originalRole = user.originalRole || user.role;
  if (originalRole !== 'ADMIN') return null;

  const viewingAs = user.role !== originalRole;
  const current = roleConfigurations[user.role];

  const select = (role: UserRole) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="role-switcher"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={
          viewingAs
            ? `Viewing as ${ROLE_DISPLAY_NAMES[user.role]} — the session is still ${ROLE_DISPLAY_NAMES[originalRole]}`
            : 'View as another role'
        }
        className={`flex items-center gap-2 rounded-control border px-2.5 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          viewingAs
            ? 'border-cta bg-cta/15 text-cta-foreground dark:text-[#F1C54B]'
            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
        }`}
      >
        <span aria-hidden="true">{current.logo}</span>
        <span className="hidden sm:inline max-w-[14rem] truncate">
          {viewingAs ? `Viewing as ${ROLE_DISPLAY_NAMES[user.role]}` : ROLE_DISPLAY_NAMES[user.role]}
        </span>
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-[60] mt-2 w-72 overflow-hidden rounded-card border border-border bg-card shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              View as another role
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Changes the screens you see. Your session stays{' '}
              <span className="font-semibold text-foreground">{ROLE_DISPLAY_NAMES[originalRole]}</span>,
              so the API still answers as one.
            </p>
          </div>

          {viewingAs && (
            <button
              type="button"
              role="menuitem"
              onClick={() => select(originalRole)}
              className="flex w-full items-center gap-2 border-b border-border bg-surface-gold px-4 py-2.5 text-xs font-semibold text-cta-foreground transition-colors hover:brightness-95"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              Return to {ROLE_DISPLAY_NAMES[originalRole]}
            </button>
          )}

          <div className="max-h-80 overflow-y-auto py-1">
            {ALL_ROLES.map((role) => {
              const config = roleConfigurations[role];
              const active = role === user.role;
              return (
                <button
                  key={role}
                  type="button"
                  role="menuitem"
                  onClick={() => select(role)}
                  className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    active ? 'bg-surface-navy' : 'hover:bg-muted'
                  }`}
                >
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">
                    {config.logo}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {ROLE_DISPLAY_NAMES[role]}
                      {role === originalRole && (
                        <span className="ml-1.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          your role
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  </span>
                  {active && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
