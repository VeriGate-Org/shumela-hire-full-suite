import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate } from '@/contexts/FeatureGateContext';
import { useTenant } from '@/contexts/TenantContext';
import { navigationRegistry, sectionLabels, NavSection, NavigationEntry, SECTION_ORDER, SECTION_ICONS, SINGLE_LINK_SECTIONS } from '@/config/navigationRegistry';
import { FEATURE_MINIMUM_PLAN } from '@/config/featurePlanMap';
import {
  ChevronRightIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';


interface SidebarNavItem extends NavigationEntry {
  locked: boolean;
  lockedPlanLabel?: string;
}

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

  // All group sections start collapsed (matching mock default state)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const isWhiteLabelled = !!tenant && tenant.subdomain !== 'default' && !!branding?.logoUrl;
  const hasModules = !!tenant?.modules;
  const sidebarRef = useRef<HTMLElement>(null);

  // Persist sidebar scroll position across navigations
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem('sidebar-scroll');
    if (saved) {
      requestAnimationFrame(() => { el.scrollTop = parseInt(saved, 10); });
    }
    const onScroll = () => { sessionStorage.setItem('sidebar-scroll', String(el.scrollTop)); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-expand the section that contains the active route
  useEffect(() => {
    for (const entry of navigationRegistry) {
      if (pathname.startsWith(entry.href) && entry.href !== '/') {
        setExpandedSections(prev => {
          if (prev.has(entry.section)) return prev;
          const next = new Set(prev);
          next.add(entry.section);
          return next;
        });
        break;
      }
    }
  }, [pathname]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

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
      })
      .filter(item => !(isWhiteLabelled || hasModules) || !item.locked);
  }, [user, isFeatureEnabled, isWhiteLabelled, hasModules]);

  // Group items by section, ordered by SECTION_ORDER
  const orderedSections = useMemo(() => {
    const groups: Partial<Record<NavSection, SidebarNavItem[]>> = {};
    for (const item of navigationItems) {
      const section = item.section || 'recruitment';
      if (!groups[section]) groups[section] = [];
      groups[section]!.push(item);
    }
    return SECTION_ORDER
      .filter(s => groups[s] && groups[s]!.length > 0)
      .map(s => ({ section: s, items: groups[s]! }));
  }, [navigationItems]);

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href) && href !== '/';
  };

  const renderLockedItem = (item: SidebarNavItem) => (
    <div key={item.id} className="relative group">
      <span className="sidebar-link" style={{ opacity: 0.35, cursor: 'not-allowed' }}>
        <span className="flex items-center justify-between">
          <span className="truncate">{item.label}</span>
          <LockClosedIcon className="h-3 w-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </span>
      </span>
      {item.lockedPlanLabel && (
        <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap rounded bg-popover text-popover-foreground border border-border shadow-md px-2 py-1 text-[11px]">
          Requires {item.lockedPlanLabel} plan
        </div>
      )}
    </div>
  );

  const renderChildItem = (item: SidebarNavItem) => {
    if (item.locked) return renderLockedItem(item);

    const isActive = isActiveRoute(item.href) && !navigationItems.some(other =>
      other.href !== item.href && other.href.startsWith(item.href) && pathname.startsWith(other.href)
    );

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
        >
          <span className="flex items-center justify-between">
            <span className="truncate">{item.label}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-cta text-cta-foreground">
                {item.badge}
              </span>
            )}
          </span>
        </Link>
      </div>
    );
  };

  const renderSingleLinkSection = (section: NavSection, items: SidebarNavItem[]) => {
    const item = items[0];
    if (!item) return null;
    if (item.locked) return renderLockedItem(item);

    const isActive = isActiveRoute(item.href);
    const SectionIcon = SECTION_ICONS[section];

    return (
      <Link
        key={item.id}
        href={item.href}
        className={`sidebar-single-link ${isActive ? 'sidebar-single-link-active' : ''}`}
      >
        {SectionIcon && <SectionIcon className="h-5 w-5 flex-shrink-0" />}
        {!isCollapsed && <span className="truncate">{item.label}</span>}
        {!isCollapsed && item.badge && (
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-cta text-cta-foreground ml-auto">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  const renderGroupSection = (section: NavSection, items: SidebarNavItem[]) => {
    const isExpanded = expandedSections.has(section);
    const SectionIcon = SECTION_ICONS[section];

    return (
      <div key={section}>
        {!isCollapsed ? (
          <>
            <button
              onClick={() => toggleSection(section)}
              className="sidebar-group-header w-full"
            >
              {SectionIcon && <SectionIcon className="h-5 w-5 flex-shrink-0" />}
              <span className="flex-1 text-left truncate">
                {sectionLabels[section] || section}
              </span>
              <ChevronRightIcon
                className="h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200"
                style={{
                  color: 'rgba(255,255,255,0.3)',
                  transform: isExpanded ? 'rotate(90deg)' : undefined,
                }}
              />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <nav>
                {items.map(item => renderChildItem(item))}
              </nav>
            </div>
          </>
        ) : (
          <nav>
            {items.slice(0, 1).map(item => (
              <div key={item.id}>
                {item.locked ? renderLockedItem(item) : (
                  <Link
                    href={item.href}
                    className="sidebar-single-link justify-center"
                    title={sectionLabels[section]}
                  >
                    {SectionIcon && <SectionIcon className="h-5 w-5" />}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        )}
      </div>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={`
        fixed left-0 top-0 bottom-0 flex flex-col overflow-y-auto sidebar-scroll transition-all duration-200 ease-in-out z-50
        ${isCollapsed ? 'w-16' : 'w-[260px]'}
      `}
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* Logo / Branding */}
      {!isCollapsed && (
        <div className="px-5 pt-6 pb-2">
          {isWhiteLabelled && branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Organization logo" className="h-8 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="font-extrabold text-xl tracking-[-0.03em]">
              <span style={{ color: '#F1C54B' }}>Shumela</span>
              <span style={{ color: '#5B9BD5' }}>Hire</span>
            </span>
          )}
        </div>
      )}
      {isCollapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-7 w-7" />
        </div>
      )}

      {/* Navigation sections */}
      <div className="flex-1">
        {orderedSections.map(({ section, items }, index) => {
          const isSingleLink = SINGLE_LINK_SECTIONS.has(section);

          return (
            <React.Fragment key={section}>
              {index > 0 && (
                <div className="sidebar-divider" />
              )}
              {isSingleLink
                ? renderSingleLinkSection(section, items)
                : renderGroupSection(section, items)
              }
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom: Settings */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link
          href="/settings"
          className={`sidebar-single-link ${isActiveRoute('/settings') ? 'sidebar-single-link-active' : ''}`}
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </Link>

        {!isCollapsed && isWhiteLabelled && (
          <div className="px-5 pb-4 pt-1">
            <p className="flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
