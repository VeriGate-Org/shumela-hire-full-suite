'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Which section's panel is showing, and whether it stays.
 *
 * <p>Split out of the sidebar so the opening rules can be read — and tested — without a DOM. The
 * rules are fussier than they look:
 *
 * <ul>
 *   <li><b>Hover opens, but not instantly.</b> Dragging the pointer down the rail past six icons
 *       must not flash six panels. A short delay before opening, and a longer one before closing,
 *       so crossing the gap between rail and panel does not dismiss it.</li>
 *   <li><b>Only where hovering is real.</b> On a touch screen the first tap would open a panel the
 *       user then has to dismiss. Guarded on the pointer being fine.</li>
 *   <li><b>Pinned means pinned.</b> When the panel is pinned it never closes on mouse-out; the
 *       pointer merely switches which section it shows.</li>
 * </ul>
 */

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 240;

export function canHover(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export function useSectionPanel(activeSection: string | null, pinned: boolean) {
  // The panel follows the route, so landing on an Applications link shows the Recruitment panel.
  const [openSection, setOpenSection] = useState<string | null>(activeSection);
  const [floating, setFloating] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  // A single-item section navigates rather than opening a panel, so it passes null and the panel
  // keeps whatever it was showing. Otherwise the panel would blank out on every visit to Dashboard.
  useEffect(() => {
    if (activeSection) setOpenSection(activeSection);
  }, [activeSection]);

  const hoverSection = useCallback((section: string | null) => {
    if (!canHover() || !section) return;
    clear();
    openTimer.current = setTimeout(() => {
      setOpenSection(section);
      if (!pinned) setFloating(true);
    }, OPEN_DELAY_MS);
  }, [clear, pinned]);

  const hoverAway = useCallback(() => {
    if (!canHover() || pinned) return;
    clear();
    closeTimer.current = setTimeout(() => setFloating(false), CLOSE_DELAY_MS);
  }, [clear, pinned]);

  /** Clicking a rail button is unconditional — it works on touch, and it wins over any pending timer. */
  const selectSection = useCallback((section: string) => {
    clear();
    setOpenSection((current) => {
      if (!pinned && current === section) {
        setFloating((wasOpen) => !wasOpen);
        return section;
      }
      setFloating(true);
      return section;
    });
  }, [clear, pinned]);

  const closePanel = useCallback(() => {
    clear();
    setFloating(false);
  }, [clear]);

  return {
    openSection,
    /** Pinned panels are always rendered; floating ones only while hovered or opened. */
    isPanelVisible: pinned || floating,
    isFloating: !pinned && floating,
    hoverSection,
    hoverAway,
    selectSection,
    closePanel,
  };
}
