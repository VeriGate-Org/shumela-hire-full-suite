'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Carries the current page's title up to the persistent chrome.
 *
 * <p>The top bar shows the page title as a breadcrumb. That bar now lives in the app layout so it
 * survives navigation, which means it can no longer be handed a prop by the page beneath it — a
 * layout renders before its children and does not see their props. This context is the one piece
 * of information that has to travel upward.
 *
 * <p>Kept deliberately small: one string. Anything else the chrome needs about a page should be
 * derived from the route, not pushed up from the page.
 */

interface PageHeadingValue {
  title?: string;
  setTitle: (title?: string) => void;
  /**
   * Clear the title only if it is still the one the caller published.
   *
   * <p>During a route change both pages are briefly mounted, and React can run the outgoing page's
   * cleanup after the incoming page's effect. An unconditional clear then wipes the title that was
   * just set, and the breadcrumb goes blank on every navigation — which is exactly what happened.
   */
  clearTitle: (expected?: string) => void;
}

const PageHeadingContext = createContext<PageHeadingValue>({
  title: undefined,
  setTitle: () => {},
  clearTitle: () => {},
});

export function PageHeadingProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitleState] = useState<string | undefined>(undefined);

  // Stable identity, so the effect in PageWrapper that publishes the title does not re-run on
  // every render of the tree above it.
  const setTitle = useCallback((next?: string) => {
    setTitleState((current) => (current === next ? current : next));
  }, []);

  const clearTitle = useCallback((expected?: string) => {
    setTitleState((current) => (current === expected ? undefined : current));
  }, []);

  const value = useMemo(() => ({ title, setTitle, clearTitle }), [title, setTitle, clearTitle]);

  return <PageHeadingContext.Provider value={value}>{children}</PageHeadingContext.Provider>;
}

export function usePageHeading(): PageHeadingValue {
  return useContext(PageHeadingContext);
}
