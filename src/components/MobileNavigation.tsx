'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, ROLE_DISPLAY_NAMES } from '../contexts/AuthContext';
import { navigationRegistry, sectionLabels, NavSection, NavigationEntry } from '@/config/navigationRegistry';
import { Bars3Icon, XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const navigationItems = useMemo(() => {
    if (!user) return [];
    const userPermissions = user.permissions || [];
    return navigationRegistry.filter((entry) =>
      entry.requiredPermissions.every((permission) => userPermissions.includes(permission))
    );
  }, [user]);

  const groupedItems = useMemo(() => {
    const groups: Partial<Record<NavSection, NavigationEntry[]>> = {};
    for (const item of navigationItems) {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section]!.push(item);
    }
    return groups;
  }, [navigationItems]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Slide-out menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-card text-foreground border-r border-border shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-primary rounded-card flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">SH</span>
            </div>
            <h2 className="text-sm font-bold tracking-tight">ShumelaHire</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close mobile navigation"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-control transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {Object.entries(groupedItems).map(([section, items]) => (
              <div key={section}>
                <p className="text-[11px] text-muted-foreground uppercase tracking-[0.12em] mb-2 font-semibold px-2.5">
                  {sectionLabels[section as NavSection] || section}
                </p>
                <div className="space-y-1">
                  {items?.map((item) => {
                    const IconComponent = isActive(item.href) && item.iconSolid ? item.iconSolid : item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-control text-sm transition-colors ${
                          active
                            ? 'bg-cta/10 text-primary border-l-[3px] border-l-cta'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <IconComponent className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-cta text-cta-foreground ml-auto">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRightIcon className="h-3.5 w-3.5 ml-auto opacity-60" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-cta rounded-full flex items-center justify-center">
              <span className="text-cta-foreground font-medium">
                {user?.name
                  ? user.name.split(' ').map((part) => part[0]).join('')
                  : 'SH'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'ShumelaHire User'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role ? ROLE_DISPLAY_NAMES[user.role] : 'No role'}
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-foreground bg-muted rounded-control hover:bg-accent transition-colors"
            >
              <span>Home</span>
            </Link>
            <Link
              href="/reports"
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-foreground bg-muted rounded-control hover:bg-accent transition-colors"
            >
              <span>Reports</span>
            </Link>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => {
              onClose();
              logout();
              router.push('/login');
            }}
            className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-control hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Mobile header component
export const MobileHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const currentPage = useMemo(() => {
    const active = navigationRegistry
      .filter((item) => pathname.startsWith(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return active?.label || 'ShumelaHire';
  }, [pathname]);

  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') return 'Dashboard';

    const pageTitles: Record<string, string> = {
      'applications': 'Applications',
      'interviews': 'Interviews',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'visualization': 'Visualization',
      'pipeline': 'Pipeline',
      'job-postings': 'Job Postings',
      'job-templates': 'Templates',
      'workflow': 'Workflow',
      'offers': 'Offers'
    };

    return pageTitles[pathSegments[0]] || currentPage;
  };

  return (
    <>
      {/* Mobile header - only shown on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-control transition-colors"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              aria-label="Open notifications"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-control transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9a6 6 0 00-12 0v.75A8.967 8.967 0 013.69 15.772a23.848 23.848 0 005.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
};

export default MobileNavigation;
