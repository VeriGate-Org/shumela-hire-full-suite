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

/** The list a record came from, shown in the chrome as a link before the heading. */
export interface HeadingParent {
  label: string;
  href: string;
}

interface PageHeadingValue {
  /** What the chrome should display: the page's own title, else the section label. */
  heading?: string;
  /**
   * The listing this page sits under, if it sits under one.
   *
   * <p>The breadcrumb was a single label, so a record page read as "/ Application record" with
   * no statement of what it belonged to and nothing to click. Record screens carry their own
   * Back button, but it is the only route back — and it sits in a different place on each
   * screen, which is what made navigation feel inconsistent from page to page. This gives every
   * record the same second way back, in the same place, on every page.
   */
  parent?: HeadingParent;
  /** Set by PageWrapper. Wins, because it is the page's own declaration. */
  setPageTitle: (title?: string) => void;
  /** Set by IdentityBand's eyebrow. Used when the page states no title of its own. */
  setSectionLabel: (label?: string) => void;
  /** Set by IdentityBand's `parent` prop. */
  setParent: (parent?: HeadingParent) => void;
  clearParent: (expectedHref?: string) => void;
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
  parent: undefined,
  setPageTitle: noop,
  setSectionLabel: noop,
  setParent: noop,
  clearPageTitle: noop,
  clearSectionLabel: noop,
  clearParent: noop,
});

export function PageHeadingProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitleState] = useState<string | undefined>(undefined);
  const [sectionLabel, setSectionLabelState] = useState<string | undefined>(undefined);
  const [parent, setParentState] = useState<HeadingParent | undefined>(undefined);

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
  const setParent = useCallback((next?: HeadingParent) => {
    setParentState((current) =>
      current?.href === next?.href && current?.label === next?.label ? current : next,
    );
  }, []);
  // Compared on href for the same reason the two label slots compare on value: during a route
  // change the outgoing page's cleanup can run after the incoming page's effect.
  const clearParent = useCallback((expectedHref?: string) => {
    setParentState((current) => (current?.href === expectedHref ? undefined : current));
  }, []);

  const value = useMemo(
    () => ({
      heading: pageTitle ?? sectionLabel,
      parent,
      setPageTitle,
      setSectionLabel,
      setParent,
      clearPageTitle,
      clearSectionLabel,
      clearParent,
    }),
    [pageTitle, sectionLabel, parent, setPageTitle, setSectionLabel, setParent, clearPageTitle, clearSectionLabel, clearParent],
  );

  return <PageHeadingContext.Provider value={value}>{children}</PageHeadingContext.Provider>;
}

export function usePageHeading(): PageHeadingValue {
  return useContext(PageHeadingContext);
}
