'use client';

import React, { ReactNode, useEffect } from 'react';
import { usePageHeading } from '@/contexts/PageHeadingContext';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * A page's heading and its content.
 *
 * <p>The props are unchanged, so the 151 pages using this needed no edits. What changed is what
 * sits above them: this used to render ModernLayout, which meant every page carried its own copy
 * of the sidebar, top bar and footer, and each navigation tore the whole shell down and built a
 * new one. The shell is now mounted once by the app layout and stays put; this renders only the
 * part that genuinely belongs to the page.
 *
 * <p>The title is published upward for the breadcrumb in the persistent top bar, which can no
 * longer receive it as a prop.
 */
export default function PageWrapper({
  children,
  title,
  subtitle,
  actions,
}: PageWrapperProps) {
  const { setTitle, clearTitle } = usePageHeading();

  useEffect(() => {
    setTitle(title);
    // Clear on unmount so a page without a title does not inherit the previous one's breadcrumb —
    // but only if this page's title is still the one showing. Both pages are briefly mounted during
    // a route change, and an unconditional clear here wiped the incoming title every time.
    return () => clearTitle(title);
  }, [title, setTitle, clearTitle]);

  return (
    <>
      {(title || subtitle || actions) && (
        <section className="enterprise-card border-l-4 border-l-cta p-4 md:p-5 mb-4">
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
              <div className="shrink-0 flex flex-wrap gap-2 items-center">{actions}</div>
            )}
          </div>
        </section>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--density-gap)' }}>
        {children}
      </div>
    </>
  );
}
