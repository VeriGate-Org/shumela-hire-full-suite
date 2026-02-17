import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import ModernSidebar from './ModernSidebar';
import NotificationCenter from './NotificationCenter';
import UserProfile from './UserProfile';
import { useAuth } from '../contexts/AuthContext';
import { Bars3Icon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ModernLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

const ModernLayout: React.FC<ModernLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { showOverlay, setShowOverlay, shortcutList } = useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav — fixed full width */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border">
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

            <div className="flex items-center gap-2.5">
              <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="h-8 w-8" />
              <span className="font-extrabold text-sm tracking-[-0.03em] hidden sm:block">
                <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
              </span>
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

            <button
              aria-label="Open keyboard shortcuts"
              onClick={() => setShowOverlay(true)}
              className="p-2 rounded-control hover:bg-accent"
            >
              <QuestionMarkCircleIcon className="h-4 w-4 text-muted-foreground" />
            </button>

            <UserProfile user={user ? { name: user.name, email: user.email, role: user.role } : undefined} />
          </div>
        </div>
      </header>

      {/* Sidebar — below top nav */}
      <div className="hidden lg:block">
        <ModernSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="fixed inset-0 bg-black/30" />
          <div
            className="fixed left-0 top-14 bottom-0 w-60 bg-card border-r border-border shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ModernSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`
        pt-14 transition-all duration-200 ease-in-out
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}
      `}>
        <main className="min-h-[calc(100vh-3.5rem)]" style={{ padding: 'var(--density-padding)' }}>
          {(title || subtitle || actions) && (
            <section className="enterprise-card p-4 md:p-5 mb-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                  )}
                </div>
                {actions && (
                  <div className="shrink-0">{actions}</div>
                )}
              </div>
            </section>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--density-gap)' }}>
            {children}
          </div>
        </main>

        <footer className="border-t border-border bg-card">
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
            <p>&copy; 2026 <span className="text-primary">Shumela</span><span className="text-cta">Hire</span></p>
            <div className="flex gap-4 mt-2 sm:mt-0">
              <Link href="/privacy" className="idc-link">Privacy</Link>
              <Link href="/terms" className="idc-link">Terms</Link>
              <Link href="/support" className="idc-link">Support</Link>
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
