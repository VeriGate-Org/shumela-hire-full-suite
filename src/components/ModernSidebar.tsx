'use client';

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate } from '@/contexts/FeatureGateContext';
import { useTenant } from '@/contexts/TenantContext';
import { useSectionPanel } from './chrome/useSectionPanel';
import {
  navigationRegistry,
  sectionLabels,
  NavSection,
  NavigationEntry,
  SECTION_ORDER,
  SECTION_ICONS,
  SINGLE_LINK_SECTIONS,
  getHiddenSectionsForRole,
} from '@/config/navigationRegistry';
import { FEATURE_MINIMUM_PLAN } from '@/config/featurePlanMap';
import {
  AdjustmentsHorizontalIcon,
  LockClosedIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

interface SidebarNavItem extends NavigationEntry {
  locked: boolean;
  lockedPlanLabel?: string;
}

interface ModernSidebarProps {
  /** Whether the section panel stays open. Unpinned, it floats over the content on hover. */
  panelPinned?: boolean;
  onTogglePin?: () => void;
  /**
   * The mobile overlay is 260px — exactly rail plus panel — and has no hover, so it always shows
   * both and offers no pin control.
   */
  forcePinned?: boolean;
}

const RAIL_PX = 64;

/**
 * Rail plus panel.
 *
 * <p><b>Why.</b> An IDC administrator sees 29 entries across 9 sections, and 13 of them are
 * Recruitment while six sections hold one or two items — yet every section carried the same
 * accordion furniture. Sections now live permanently on a 64px rail and a section's items get a
 * column of their own.
 *
 * <p>This also retires two defects in the old arrangement. Collapsing the sidebar rendered
 * {@code items.slice(0, 1)} per group, so twelve of Recruitment's thirteen entries were simply
 * unreachable behind an icon that looked like a section but navigated to one child. And the
 * {@code aside} was itself the scroll container with the footer inside it, so once the active
 * section auto-expanded, Settings and the "Powered by" attribution sat below the fold. The rail and
 * both footers are now fixed; only the lists scroll.
 */
const ModernSidebar: React.FC<ModernSidebarProps> = ({
  panelPinned = true,
  onTogglePin,
  forcePinned = false,
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isFeatureEnabled } = useFeatureGate();
  const { tenant, branding } = useTenant();
  const listRef = useRef<HTMLDivElement>(null);

  const pinned = forcePinned || panelPinned;
  const isWhiteLabelled = !!tenant && tenant.subdomain !== 'default' && !!branding?.logoUrl;
  const hasModules = !!tenant?.modules;

  const navigationItems = useMemo((): SidebarNavItem[] => {
    if (!user) return [];
    const userPermissions = user.permissions || [];
    const hiddenSections = getHiddenSectionsForRole(user.role);
    return navigationRegistry
      .filter(entry => !hiddenSections.includes(entry.section))
      .filter(entry => !entry.allowedRoles || entry.allowedRoles.includes(user.role))
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

  const isActiveRoute = useCallback(
    (href: string) => pathname.startsWith(href) && href !== '/',
    [pathname],
  );

  /**
   * The section the current route belongs to — but only when it is one with a panel. A single-item
   * section returns null so the panel keeps showing what it had, rather than blanking every time
   * someone visits the Dashboard.
   */
  const activeSection = useMemo(() => {
    const match = navigationItems
      .filter(item => isActiveRoute(item.href))
      .sort((a, b) => b.href.length - a.href.length)[0];
    if (!match || SINGLE_LINK_SECTIONS.has(match.section)) return null;
    return match.section;
  }, [navigationItems, isActiveRoute]);

  const firstPanelSection = orderedSections.find(s => !SINGLE_LINK_SECTIONS.has(s.section))?.section;
  const {
    openSection,
    isPanelVisible,
    isFloating,
    hoverSection,
    hoverAway,
    selectSection,
    closePanel,
  } = useSectionPanel(activeSection ?? null, pinned);

  const shownSection = (openSection ?? firstPanelSection) as NavSection | undefined;
  const shownItems = orderedSections.find(s => s.section === shownSection)?.items ?? [];

  // Scroll position is kept for the item list, which is the part that scrolls now.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem('sidebar-scroll');
    if (saved) requestAnimationFrame(() => { el.scrollTop = parseInt(saved, 10); });
    const onScroll = () => sessionStorage.setItem('sidebar-scroll', String(el.scrollTop));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // A floating panel closes on Escape, like every other transient surface in the product.
  useEffect(() => {
    if (!isFloating) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFloating, closePanel]);

  const lockedRow = (item: SidebarNavItem) => (
    <div key={item.id} className="group relative">
      <span className="sidebar-link" style={{ opacity: 0.35, cursor: 'not-allowed' }}>
        <span className="flex items-center justify-between">
          <span className="truncate">{item.label}</span>
          <LockClosedIcon className="h-3 w-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </span>
      </span>
      {item.lockedPlanLabel && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded border border-border bg-popover px-2 py-1 text-[11px] text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
          Requires {item.lockedPlanLabel} plan
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* ── Rail: every section, always ─────────────────────────────────── */}
      <aside
        aria-label="Sections"
        className="fixed bottom-0 left-0 top-0 z-50 flex w-16 flex-col"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
        onMouseLeave={hoverAway}
      >
        <div className="flex h-14 flex-none items-center justify-center">
          <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-7 w-7" />
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto py-1">
          {orderedSections.map(({ section, items }) => {
            const Icon = SECTION_ICONS[section];
            const label = sectionLabels[section] || section;
            const single = SINGLE_LINK_SECTIONS.has(section);
            const here = items.some(item => isActiveRoute(item.href));

            // A one-item section is a destination, not a container. It navigates, and never
            // opens a panel — which is the whole reason six of nine sections stop costing a
            // disclosure triangle they had no use for.
            if (single) {
              const item = items[0];
              if (!item) return null;
              return (
                <Link
                  key={section}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={here ? 'page' : undefined}
                  onMouseEnter={hoverAway}
                  className={`rail-item ${here ? 'rail-item-active' : ''}`}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </Link>
              );
            }

            return (
              <button
                key={section}
                type="button"
                title={label}
                aria-label={label}
                aria-expanded={isPanelVisible && shownSection === section}
                onMouseEnter={() => hoverSection(section)}
                onFocus={() => hoverSection(section)}
                onClick={() => selectSection(section)}
                className={`rail-item ${here ? 'rail-item-active' : ''} ${
                  shownSection === section && isPanelVisible ? 'rail-item-open' : ''
                }`}
              >
                {Icon && <Icon className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        <div className="flex-none" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Link
            href="/settings"
            title="Settings"
            aria-label="Settings"
            onMouseEnter={hoverAway}
            className={`rail-item ${isActiveRoute('/settings') ? 'rail-item-active' : ''}`}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </Link>
        </div>
      </aside>

      {/* ── Panel: one section's items ──────────────────────────────────── */}
      {isPanelVisible && shownSection && (
        <nav
          aria-label={`${sectionLabels[shownSection] || shownSection} pages`}
          className={`fixed bottom-0 z-50 flex w-[196px] flex-col ${isFloating ? 'shadow-2xl' : ''}`}
          // A floating panel starts below the header. Unpinned, the header begins at the rail's
          // edge, so a full-height panel would cover its left end — and the tenant logo with it.
          style={{
            left: RAIL_PX,
            top: isFloating ? '3.5rem' : 0,
            backgroundColor: 'var(--nav-panel-bg)',
            borderRight: '1px solid var(--nav-panel-border)',
          }}
          onMouseEnter={() => hoverSection(shownSection)}
          onMouseLeave={hoverAway}
        >
          <div className="flex h-14 flex-none items-center justify-between gap-1 pl-4 pr-2">
            <span className="truncate text-[13px] font-semibold" style={{ color: 'var(--nav-fg-strong)' }}>
              {sectionLabels[shownSection] || shownSection}
            </span>
            {!forcePinned && onTogglePin && (
              <button
                type="button"
                onClick={onTogglePin}
                title={pinned ? 'Unpin menu' : 'Keep menu open'}
                aria-label={pinned ? 'Unpin menu' : 'Keep menu open'}
                aria-pressed={pinned}
                className="rounded-control p-1.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                style={{ color: pinned ? 'var(--cta)' : 'rgba(255,255,255,0.45)' }}
              >
                <MapPinIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          <div ref={listRef} className="sidebar-scroll flex-1 overflow-y-auto pb-2">
            {shownItems.map(item =>
              item.locked ? lockedRow(item) : (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActiveRoute(item.href) ? 'page' : undefined}
                  onClick={() => { if (isFloating) closePanel(); }}
                  className={`sidebar-link ${isActiveRoute(item.href) ? 'sidebar-link-active' : ''}`}
                  style={{ paddingLeft: '1rem' }}
                >
                  <span className="flex items-center justify-between">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="rounded bg-cta px-1.5 py-0.5 text-[10px] text-cta-foreground">
                        {item.badge}
                      </span>
                    )}
                  </span>
                </Link>
              )
            )}
          </div>

          {/* Fixed, so it is present whatever the list is doing. This block used to live inside the
              scrolling element and dropped below the fold as soon as a section expanded. */}
          {isWhiteLabelled && (
            <div className="flex-none px-4 py-3" style={{ borderTop: '1px solid var(--nav-panel-border)' }}>
              <p className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--nav-fg)' }}>
                Powered by
                <img src="/icons/shumelahire-icon.svg" alt="" className="h-3.5 w-3.5" />
                <span className="font-semibold">ShumelaHire</span>
              </p>
            </div>
          )}
        </nav>
      )}
    </>
  );
};

export default ModernSidebar;
