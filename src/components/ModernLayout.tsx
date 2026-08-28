import React, { useCallback, useEffect, useState, ReactNode } from 'react';
import Link from 'next/link';
import ModernSidebar from './ModernSidebar';
import NotificationCenter from './NotificationCenter';
import UserProfile from './UserProfile';
import { HEADER_TRIGGER } from './chrome/HeaderPopover';
import TenantLogo from './chrome/TenantLogo';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { Bars3Icon, QuestionMarkCircleIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import RoleSwitcher from './RoleSwitcher';
import { usePageHeading } from '@/contexts/PageHeadingContext';

/**
 * The application chrome: top bar, sidebar, footer and the shortcuts overlay.
 *
 * <p>This is mounted once by the app layout and must stay mounted. It used to be rendered by
 * PageWrapper, which meant every page rendered its own copy — so each navigation unmounted the
 * whole shell and built a new one. Measured on a production build: a fresh <aside> node per click,
 * the previous one detached. Nothing reloaded, but the sidebar was rebuilt every time, which
 * collapsed its open groups, reset its scroll position and replayed its transition. It read as a
 * full page refresh because visually it was indistinguishable from one.
 *
 * <p>The page's own heading block is NOT here — that belongs to the page and should change with
 * it. Only the title travels up, for the breadcrumb, via PageHeadingContext.
 */
interface ModernLayoutProps {
  children: ReactNode;
}

/** Shown when the tenant has no logo, and when the one it has fails to load. */
function ProductMark({ logoText }: { logoText?: string }) {
  return (
    <>
      <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-8 w-8" />
      {!logoText && (
        <span className="font-extrabold text-sm tracking-[-0.03em] hidden sm:block">
          <span data-logotype className="text-primary">Shumela</span><span data-logotype className="text-cta">Hire</span>
        </span>
      )}
    </>
  );
}

const ModernLayout: React.FC<ModernLayoutProps> = ({ children }) => {
  const { heading: title } = usePageHeading();
  // Rail is always there; the panel beside it is what pins. Persisted, because whether the menu
  // stays open is a working preference, not a per-page one.
  const [panelPinned, setPanelPinned] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('shumelahire-nav-pinned');
    if (saved !== null) setPanelPinned(saved === 'true');
  }, []);

  const togglePin = useCallback(() => {
    setPanelPinned(prev => {
      localStorage.setItem('shumelahire-nav-pinned', String(!prev));
      return !prev;
    });
  }, []);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { branding } = useTenant();
  const { showOverlay, setShowOverlay, shortcutList } = useKeyboardShortcuts();
  const { colorMode, setColorMode } = useTheme();
  const ThemeIcon = colorMode === 'light' ? SunIcon : colorMode === 'dark' ? MoonIcon : ComputerDesktopIcon;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav — fixed full width */}
      <header className={`fixed top-0 right-0 z-40 h-14 bg-card border-b border-border shadow-sm left-0 ${panelPinned ? 'lg:left-[260px]' : 'lg:left-16'} transition-all duration-200 ease-in-out`}>
        <div className="flex h-full items-center justify-between px-4">
          {/* Left: hamburger + logo + breadcrumb */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-control hover:bg-accent"
            >
              <Bars3Icon className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* A tenant's own logo earns a place on every size; the product mark does not need one
                on desktop, where the rail already carries it. */}
            <div className={`flex items-center gap-2.5 ${branding?.logoUrl ? '' : 'lg:hidden'}`}>
              {branding?.logoUrl ? (
                // This bar sits on --card, which is white in light mode, so the plate is only
                // needed in the dark. The sidebar's copy of this is dark on both and says 'always'.
                <TenantLogo src={branding.logoUrl} plate="dark" fallback={<ProductMark logoText={branding?.logoText} />} />
              ) : (
                <ProductMark logoText={branding?.logoText} />
              )}
              {branding?.logoText && (
                <span className="text-xs font-medium text-muted-foreground tracking-wide hidden sm:block">{branding.logoText}</span>
              )}
            </div>

            {title && (
              <div className="hidden md:flex items-center gap-1 pl-4 border-l border-border text-xs">
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">{title}</span>
              </div>
            )}
          </div>

          {/* Right: notifications, help, avatar */}
          <div className="flex items-center gap-1">
            <NotificationCenter />

            {/* Same trigger as the bell beside them: one size, one hover, one focus ring. These
                were 16px icons in a differently-sized box with no visible focus state at all. */}
            <Link href="/help" aria-label="Help centre" className={HEADER_TRIGGER}>
              <QuestionMarkCircleIcon className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() => {
                const next = colorMode === 'light' ? 'dark' : colorMode === 'dark' ? 'system' : 'light';
                setColorMode(next);
              }}
              aria-label={`Theme: ${colorMode}`}
              className={HEADER_TRIGGER}
            >
              <ThemeIcon className="h-5 w-5" />
            </button>

            <RoleSwitcher />

            <UserProfile user={user ? { name: user.name, email: user.email, role: user.role } : undefined} />
          </div>
        </div>
      </header>

      {/* Sidebar — below top nav */}
      <div className="hidden lg:block">
        <ModernSidebar panelPinned={panelPinned} onTogglePin={togglePin} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-black/30" />
          <div
            className="fixed left-0 top-0 bottom-0 w-[260px] shadow-lg overflow-y-auto"
            style={{ backgroundColor: 'var(--sidebar-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModernSidebar forcePinned />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`
        pt-14 transition-all duration-200 ease-in-out
        ${panelPinned ? 'lg:ml-[260px]' : 'lg:ml-16'}
      `}>
        <main className="min-h-[calc(100vh-3.5rem)]" style={{ padding: 'var(--density-padding)' }}>
          {children}
        </main>

        <footer className="border-t border-border bg-surface-navy">
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
            <p>&copy; 2026 <span data-logotype className="text-primary">Shumela</span><span data-logotype className="text-cta">Hire</span></p>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <Link href="/privacy" className="idc-link">Privacy</Link>
              <Link href="/terms" className="idc-link">Terms</Link>
              <Link href="/help" className="idc-link">Help</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Keyboard shortcuts overlay */}
      {showOverlay && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowOverlay(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-card rounded-card shadow-xl p-6 z-50 w-96 border border-border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
              <button
                aria-label="Close keyboard shortcuts"
                onClick={() => setShowOverlay(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {shortcutList.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.split(' ').map((key, j) => (
                      <span key={j}>
                        {j > 0 && <span className="text-xs text-muted-foreground mx-0.5">then</span>}
                        <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded-control">{key}</kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Press <kbd className="px-1 py-0.5 text-[10px] bg-muted border border-border rounded-control">?</kbd> to toggle this overlay
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ModernLayout;
