'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Carries a label for the current page up to the persistent chrome.
 *
 * <p>The top bar shows it as a breadcrumb. That bar now lives in the app layout so it survives
 * navigation, which means it can no longer be handed a prop by the page beneath it — a layout
 * renders before its children and does not see their props. This is the one piece of information
 * that has to travel upward.
 *
 * <p><b>Two sources, deliberately kept apart.</b> A page states its own title through PageWrapper,
 * and a page built around IdentityBand states a section through its eyebrow. Some pages do both:
 * the dashboard passes "Administrator Dashboard" and nests an AdminDashboard whose band eyebrow is
 * "System". With a single slot the winner is decided by effect order — React runs child effects
 * before the parent's, so the nested band won and the page's own title never showed. Separate slots
 * make the precedence a stated rule instead of an accident of the tree.
 */

interface PageHeadingValue {
  /** What the chrome should display: the page's own title, else the section label. */
  heading?: string;
  /** Set by PageWrapper. Wins, because it is the page's own declaration. */
  setPageTitle: (title?: string) => void;
  /** Set by IdentityBand's eyebrow. Used when the page states no title of its own. */
  setSectionLabel: (label?: string) => void;
  /**
   * Clear a slot only if it still holds the caller's value.
   *
   * <p>During a route change both pages are briefly mounted and React can run the outgoing page's
   * cleanup after the incoming page's effect. An unconditional clear then wipes the value that was
   * just set, and the breadcrumb goes blank on every navigation.
   */
  clearPageTitle: (expected?: string) => void;
  clearSectionLabel: (expected?: string) => void;
}

const noop = () => {};

const PageHeadingContext = createContext<PageHeadingValue>({
  heading: undefined,
  setPageTitle: noop,
  setSectionLabel: noop,
  clearPageTitle: noop,
  clearSectionLabel: noop,
});

export function PageHeadingProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitleState] = useState<string | undefined>(undefined);
  const [sectionLabel, setSectionLabelState] = useState<string | undefined>(undefined);

  // Stable identities, so the effects that publish do not re-run on every render above them.
  const setPageTitle = useCallback((next?: string) => {
    setPageTitleState((current) => (current === next ? current : next));
  }, []);
  const setSectionLabel = useCallback((next?: string) => {
    setSectionLabelState((current) => (current === next ? current : next));
  }, []);
  const clearPageTitle = useCallback((expected?: string) => {
    setPageTitleState((current) => (current === expected ? undefined : current));
  }, []);
  const clearSectionLabel = useCallback((expected?: string) => {
    setSectionLabelState((current) => (current === expected ? undefined : current));
  }, []);

  const value = useMemo(
    () => ({
      heading: pageTitle ?? sectionLabel,
      setPageTitle,
      setSectionLabel,
      clearPageTitle,
      clearSectionLabel,
    }),
    [pageTitle, sectionLabel, setPageTitle, setSectionLabel, clearPageTitle, clearSectionLabel],
  );

  return <PageHeadingContext.Provider value={value}>{children}</PageHeadingContext.Provider>;
}

export function usePageHeading(): PageHeadingValue {
  return useContext(PageHeadingContext);
}
