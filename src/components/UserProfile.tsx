'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import HeaderPopover from '@/components/chrome/HeaderPopover';
import { appVersion } from '@/lib/app-version';
import { UserRole, ROLE_DISPLAY_NAMES, useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
}

const MENU_ITEMS = [
  { label: 'Profile', href: '/profile', icon: UserIcon },
  { label: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { label: 'Help centre', href: '/help', icon: QuestionMarkCircleIcon },
];

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setIsOpen(false), []);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  // Show loading skeleton when user data hasn't resolved yet
  if (!user) {
    return (
      <div className="flex items-center space-x-3 p-2">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="hidden min-w-0 flex-1 space-y-1.5 md:block">
          <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const currentUser = user;
  const roleName = ROLE_DISPLAY_NAMES[currentUser.role as UserRole] || currentUser.role;
  const version = appVersion();

  const avatar = (size: string, text: string) =>
    currentUser.avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={currentUser.avatar}
        alt=""
        className={`${size} rounded-full object-cover`}
      />
    ) : (
      <div
        className={`${size} ${text} flex items-center justify-center rounded-full bg-cta font-semibold text-cta-foreground`}
        aria-hidden="true"
      >
        {getInitials(currentUser.name)}
      </div>
    );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-control p-1 pr-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {avatar('h-8 w-8', 'text-sm')}

        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-medium text-foreground">
            {currentUser.name}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{roleName}</span>
        </span>

        <ChevronDownIcon
          className={`hidden h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform md:block ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <HeaderPopover
        open={isOpen}
        onClose={close}
        label="Account"
        as="menu"
        width="w-72"
        triggerRef={triggerRef}
        header={
          <div className="flex items-center gap-3 px-4 py-3">
            {avatar('h-10 w-10', 'text-sm')}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{currentUser.name}</p>
              <p className="break-all text-xs text-muted-foreground">{currentUser.email}</p>
              <p className="text-xs text-muted-foreground">{roleName}</p>
            </div>
          </div>
        }
        footer={
          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            {/* Absent rather than wrong. This read "Version 2.1.0" for as long as it has existed:
                package.json says 0.1.0 and production was on v2.7.0. It is now the release tag the
                build was cut from, and nothing at all when that is unknown. */}
            <span className="font-mono">{version ? `v${version.replace(/^v/, '')}` : ''}</span>
            <span className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
            </span>
          </div>
        }
      >
        <div className="py-1">
          {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <Icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t border-border py-1">
          <button
            onClick={async () => {
              close();
              await logout();
              router.push('/login');
            }}
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-error transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </HeaderPopover>
    </div>
  );
};

export default UserProfile;
