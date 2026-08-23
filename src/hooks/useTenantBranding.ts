'use client';

import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useFeatureGate } from '@/contexts/FeatureGateContext';

/**
 * Candidate text colours, in order of preference.
 *
 * `#0F172A` is the product's own near-black and is preferred where it is legible, so a tenant's
 * buttons still look like the rest of the product. But it is a weak dark: against a mid-tone like
 * `#7F7F7F` it reaches only 4.46:1, below the 4.5:1 AA floor, where pure black reaches 5.24:1. So
 * pure black is kept as a fallback for exactly those mid-tones rather than used everywhere.
 */
const BRAND_DARK_TEXT = '#0F172A';
const PURE_DARK_TEXT = '#000000';
const LIGHT_TEXT = '#FFFFFF';

/** WCAG AA for normal-size text. */
const AA_CONTRAST = 4.5;

/**
 * Relative luminance per WCAG 2.1, for #rgb / #rrggbb.
 * Returns null for anything unparseable so the caller can leave the token alone.
 */
function luminance(colour: string): number | null {
  const hex = colour.trim().replace(/^#/, '');
  const full =
    hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(full.slice(0, 2), 16));
  const g = channel(parseInt(full.slice(2, 4), 16));
  const b = channel(parseInt(full.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The most legible text colour for `background`, preferring the product's near-black.
 *
 * Returns null for an unparseable colour so the caller can leave the token pair alone entirely.
 */
export function readableTextOn(background: string): string | null {
  const bg = luminance(background);
  if (bg === null) return null;

  const ratio = (fg: string) => {
    const l = luminance(fg)!;
    return (Math.max(bg, l) + 0.05) / (Math.min(bg, l) + 0.05);
  };

  // Keep the product's near-black wherever it is genuinely legible.
  if (ratio(BRAND_DARK_TEXT) >= AA_CONTRAST) return BRAND_DARK_TEXT;

  // Otherwise take whichever extreme is strongest. On mid-tones neither reaches a comfortable
  // margin, but this is the best available with a two-ended scale and it still clears AA.
  return ratio(PURE_DARK_TEXT) >= ratio(LIGHT_TEXT) ? PURE_DARK_TEXT : LIGHT_TEXT;
}

/**
 * Applies a tenant's brand colours to the CSS custom properties.
 *
 * <p>Each of these tokens is half of a pair: `--secondary` is the background and
 * `--secondary-foreground` is the text drawn on it, and the button classes in globals.css use
 * them together. Overriding only the background leaves the foreground at whatever the stylesheet
 * declared for the default palette, which is chosen to contrast with the DEFAULT background — not
 * with the tenant's.</p>
 *
 * <p>That is not hypothetical. IDC's brand sets `--secondary` to a dark navy while
 * `--secondary-foreground` stayed near-black, so the "Letter" button on the offers screen rendered
 * at a measured **1.58:1** contrast — WCAG AA wants 4.5:1. Every `btn-secondary` in the product was
 * affected for that tenant, and any tenant picking a dark brand colour would hit the same thing.</p>
 *
 * <p>So each override now also sets its paired foreground, picked by luminance rather than
 * hardcoded: whichever of near-black or white contrasts better with the colour the tenant chose.
 * An unparseable colour leaves both tokens untouched rather than guessing — a tenant with a broken
 * brand value should look like the default product, not like an accident.</p>
 */
export function useTenantBranding() {
  const { branding } = useTenant();
  const { isFeatureEnabled } = useFeatureGate();
  const enabled = isFeatureEnabled('CUSTOM_BRANDING');

  useEffect(() => {
    if (!enabled || !branding) return;

    const root = document.documentElement;
    const overrides: [string, string, string | undefined][] = [
      ['--primary', '--primary-foreground', branding.primaryColor],
      ['--secondary', '--secondary-foreground', branding.secondaryColor],
      ['--cta', '--cta-foreground', branding.accentColor],
    ];

    const applied: string[] = [];
    for (const [prop, foregroundProp, value] of overrides) {
      if (!value) continue;

      const foreground = readableTextOn(value);
      if (foreground === null) {
        // Unparseable brand colour — leave the pair at the product defaults.
        continue;
      }

      root.style.setProperty(prop, value);
      root.style.setProperty(foregroundProp, foreground);
      applied.push(prop, foregroundProp);
    }

    return () => {
      for (const prop of applied) {
        root.style.removeProperty(prop);
      }
    };
  }, [branding, enabled]);

  return { branding: enabled ? branding : null, enabled };
}
