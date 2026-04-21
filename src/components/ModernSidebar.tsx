import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate } from '@/contexts/FeatureGateContext';
import { useTenant } from '@/contexts/TenantContext';
import { navigationRegistry, sectionLabels, NavSection, NavigationEntry } from '@/config/navigationRegistry';
import { FEATURE_MINIMUM_PLAN } from '@/config/featurePlanMap';
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  XMarkIcon,
  LockClosedIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import ThemeToggle from './ThemeToggle';

interface SidebarNavItem extends NavigationEntry {
  locked: boolean;
  lockedPlanLabel?: string;
}

const ADMIN_SECTIONS = new Set<NavSection>(['administration', 'system', 'platform']);

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureGate();
  const { tenant, branding } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const isWhiteLabelled = !!tenant && tenant.subdomain !== 'default' && !!branding?.logoUrl;

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  // Filter navigation entries by user permissions; feature-gated items stay visible but locked
  const navigationItems = useMemo((): SidebarNavItem[] => {
    if (!user) return [];
    const userPermissions = user.permissions || [];
    return navigationRegistry
      .filter(entry => entry.requiredPermissions.every(p => userPermissions.includes(p)))
      .map(entry => {
        const featureEnabled = !entry.requiredFeature || isFeatureEnabled(entry.requiredFeature);
        return {
          ...entry,
          locked: !featureEnabled,
          lockedPlanLabel: entry.requiredFeature ? FEATURE_MINIMUM_PLAN[entry.requiredFeature] : undefined,
        };
      });
  }, [user, isFeatureEnabled]);

  // Apply search filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery) return navigationItems;
    return navigationItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navigationItems]);

  // Group items by section
  const groupedNavItems = useMemo(() => {
    const groups: Partial<Record<NavSection, SidebarNavItem[]>> = {};
    for (const item of filteredItems) {
      const section = item.section || 'recruitment';
      if (!groups[section]) groups[section] = [];
      groups[section]!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const keyShortcutMap: Record<string, string> = {
    '/dashboard': 'g d',
    '/pipeline': 'g p',
    '/applications': 'g a',
    '/job-postings': 'g j',
    '/interviews': 'g i',
    '/reports': 'g r',
  };

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/';
  };

  const renderNavigationItem = (item: SidebarNavItem) => {
    const IconComponent = item.icon;

    // Locked items render as non-interactive spans
    if (item.locked) {
      return (
        <div key={item.id} className="relative group">
          <span
            className={`
              flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded border border-transparent
              opacity-50 cursor-not-allowed
              ${isCollapsed ? 'justify-center px-2' : ''}
            `}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors" />

            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate text-muted-foreground">{item.label}</span>
                <LockClosedIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              </>
            )}
          </span>

          {/* Tooltip */}
          {item.lockedPlanLabel && (
            <div className={`
              pointer-events-none absolute top-1/2 -translate-y-1/2 z-50
              opacity-0 group-hover:opacity-100 transition-opacity
              whitespace-nowrap rounded bg-popover text-popover-foreground border border-border shadow-md px-2 py-1 text-[11px]
              ${isCollapsed ? 'left-full ml-2' : 'left-full ml-2'}
            `}>
              Requires {item.lockedPlanLabel} plan
            </div>
          )}
        </div>
      );
    }

    // Check for more specific nav match — if a sibling route better matches, don't highlight this one
    const isActive = isActiveRoute(item.href) && !filteredItems.some(other =>
      other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)
    );
    const ActiveIcon = isActive && item.iconSolid ? item.iconSolid : item.icon;

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          aria-keyshortcuts={keyShortcutMap[item.href]}
          className={`
            group flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded transition-colors border border-transparent
            ${isActive
              ? 'bg-cta/10 text-primary border-l-[3px] border-l-cta border-y-transparent border-r-transparent pl-[7px]'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
        >
          <ActiveIcon className={`
            h-4 w-4 flex-shrink-0
            ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}
            transition-colors
          `} />

          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-cta text-cta-foreground">
                  {item.badge}
                </span>
              )}

              {keyShortcutMap[item.href] && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground ml-auto">
                  {keyShortcutMap[item.href]}
                </span>
              )}
            </>
          )}
        </Link>
      </div>
    );
  };

  // Track whether we've rendered the admin divider
  const sectionEntries = Object.entries(groupedNavItems);
  let adminDividerRendered = false;

  return (
    <aside className={`
      fixed left-0 top-14 bottom-0 bg-card border-r border-border overflow-y-auto transition-all duration-200 ease-in-out z-40
      ${isCollapsed ? 'w-16' : 'w-60'}
    `}>
      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-border rounded-control bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear navigation search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
              >
                <XMarkIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section-grouped Navigation */}
      <div className="px-3 py-1">
        {sectionEntries.map(([section, items]) => {
          const isSectionCollapsed = collapsedSections.has(section);
          const isAdminSection = ADMIN_SECTIONS.has(section as NavSection);
          const hasActiveItem = items?.some(item =>
            isActiveRoute(item.href) && !filteredItems.some(other =>
              other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)
            )
          );

          // Render admin divider before the first admin section
          let showAdminDivider = false;
          if (isAdminSection && !adminDividerRendered && !searchQuery) {
            adminDividerRendered = true;
            showAdminDivider = true;
          }

          return (
            <React.Fragment key={section}>
              {showAdminDivider && (
                <div className="my-2 mx-2.5 border-t border-border" />
              )}
              <div className={`mb-1 ${isAdminSection && !isCollapsed && !searchQuery ? 'ml-1 pl-2 border-l border-border/50' : ''}`}>
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors hover:bg-accent/50 group/section"
                  >
                    <span className={`text-[11px] uppercase tracking-[0.12em] font-semibold ${hasActiveItem && isSectionCollapsed ? 'text-cta' : 'text-muted-foreground'}`}>
                      {sectionLabels[section as NavSection] || section}
                    </span>
                    <ChevronDownIcon className={`h-3 w-3 text-muted-foreground opacity-0 group-hover/section:opacity-100 transition-all duration-200 ${isSectionCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                )}
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isSectionCollapsed && !isCollapsed && !searchQuery ? 'max-h-0 opacity-0' : 'max-h-[1000px] opacity-100'}`}>
                  <nav className="space-y-0.5 mt-0.5">
                    {items?.map(item => renderNavigationItem(item))}
                  </nav>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {searchQuery && filteredItems.length === 0 && !isCollapsed && (
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-muted-foreground">No pages matching &ldquo;{searchQuery}&rdquo;</p>
            <button onClick={() => setSearchQuery('')} className="text-xs text-cta mt-1 hover:underline">Clear search</button>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card p-2 space-y-1">
        {/* Pinned Settings link */}
        <Link
          href="/settings"
          className={`
            group flex items-center gap-2 py-1.5 rounded-control text-xs transition-colors
            ${isActiveRoute('/settings')
              ? 'bg-cta/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }
            ${isCollapsed ? 'justify-center px-2' : 'px-2.5'}
          `}
        >
          <Cog6ToothIcon className={`h-3.5 w-3.5 flex-shrink-0 ${isActiveRoute('/settings') ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} transition-colors`} />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        <ThemeToggle collapsed={isCollapsed} />
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-control text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ChevronRightIcon className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        )}
        {!isCollapsed && isWhiteLabelled && (
          <div className="border-t border-border pt-2 mt-1">
            <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
              Powered by
              <img src="/icons/shumelahire-icon.svg" alt="" className="h-3.5 w-3.5" />
              <span className="font-semibold">ShumelaHire</span>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ModernSidebar;
