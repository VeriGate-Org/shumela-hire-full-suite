import { readableTextOn } from '@/hooks/useTenantBranding';

/**
 * Pins the contrast rule that tenant branding depends on.
 *
 * The bug this guards: `useTenantBranding` overrode `--secondary` from the tenant's brand colour
 * and left `--secondary-foreground` at the stylesheet default, which is chosen to contrast with
 * the DEFAULT background rather than the tenant's. IDC's dark navy against near-black text
 * measured 1.58:1 on the live offers screen — WCAG AA wants 4.5:1 — and it affected every
 * `btn-secondary` in the product for that tenant.
 *
 * It was invisible to every existing check: the components compiled, the tokens existed, the
 * classes applied, and nothing renders a contrast assertion. It was found by reading computed
 * styles off the deployed page.
 */

const luminance = (hex: string) => {
  const full = hex.replace('#', '');
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return (
    0.2126 * channel(parseInt(full.slice(0, 2), 16)) +
    0.7152 * channel(parseInt(full.slice(2, 4), 16)) +
    0.0722 * channel(parseInt(full.slice(4, 6), 16))
  );
};

const contrast = (a: string, b: string) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

describe('readableTextOn', () => {
  it('meets WCAG AA against the colour that actually shipped broken', () => {
    // IDC's --secondary. Rendered with near-black text at 1.58:1 before the fix.
    const idcNavy = '#003B71';
    const chosen = readableTextOn(idcNavy)!;

    expect(chosen).not.toBeNull();
    expect(contrast(idcNavy, chosen)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA across a spread of brand colours, light and dark', () => {
    const brands = [
      '#003B71', // IDC navy
      '#05527E', // ShumelaHire primary
      '#F1C54B', // gold — must pick dark text
      '#FFFFFF',
      '#000000',
      '#64748B', // mid grey, the awkward case
      '#7F7F7F',
      '#008C7F',
    ];

    for (const brand of brands) {
      const chosen = readableTextOn(brand)!;
      expect(chosen).not.toBeNull();
      expect({ brand, ratio: contrast(brand, chosen) }).toEqual({
        brand,
        ratio: expect.any(Number),
      });
      expect(contrast(brand, chosen)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('accepts three-digit hex and a missing leading hash', () => {
    expect(readableTextOn('#fff')).toBe('#0F172A');
    expect(readableTextOn('000')).toBe('#FFFFFF');
    // Mid-tone falls back to pure black, which clears AA where the near-black does not.
    expect(readableTextOn('#7F7F7F')).toBe('#000000');
  });

  it('returns null rather than guessing on an unparseable colour', () => {
    // The caller leaves BOTH tokens alone in this case, so a tenant with a broken brand value
    // gets the default product rather than an unreadable one.
    expect(readableTextOn('not-a-colour')).toBeNull();
    expect(readableTextOn('')).toBeNull();
    expect(readableTextOn('#12345')).toBeNull();
    expect(readableTextOn('rgb(0,59,113)')).toBeNull();
  });
});
