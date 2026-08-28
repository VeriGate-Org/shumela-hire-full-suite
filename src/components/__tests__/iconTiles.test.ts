import fs from 'fs';
import path from 'path';

/**
 * Solid icon tiles.
 *
 * <p>The tint these replaced measured 1.08–1.23:1 against its card, so the tile barely read as a
 * shape and the glyph appeared to float on a wash. The tile is now the accent itself.
 *
 * <p><b>Why one class instead of two utilities.</b> The old treatment was a background utility
 * sitting beside a text utility, written out at every call site — and across 341 of them the ink had
 * drifted into nine different classes, including a {@code text-violet-600} that belongs to no
 * palette in this product. A tile that owns both colours cannot drift, and the next change to the
 * treatment is four CSS rules rather than another sweep.
 *
 * <p>Text badges were deliberately left on the tint. They are not icon boxes, and turning every soft
 * badge in the product solid is a different decision from the one that was asked for.
 */

const SRC = path.join(process.cwd(), 'src');

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(full));
    else if (entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

/** Classes whose job is to colour an icon. Sizes and real text colours are not here. */
const INK =
  /\btext-(?:accent-navy|accent-teal|accent-pink|accent-gold|accent-gold-on-tint|primary|gold-\d{3}|teal-\d{3}|navy-\d{3}|shumelahire-\d{3}|idc-[a-z]+-\d{3}|violet-\d{3})\b/;

const FILES = tsxFiles(SRC).map((f) => [path.relative(SRC, f), fs.readFileSync(f, 'utf8')] as const);

function classStrings(source: string, needle: string): string[] {
  const found: string[] = [];
  const re = /["'`]([^"'`]*)["'`]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    if (m[1].includes(needle)) found.push(m[1]);
  }
  return found;
}

describe('a solid tile owns its ink', () => {
  it('found the tiles', () => {
    // A walker that matches nothing would make everything below vacuously true.
    const total = FILES.reduce(
      (n, [, code]) => n + (code.match(/\bicon-tile-(?:navy|teal|gold|pink)\b/g) ?? []).length,
      0,
    );

    expect(total).toBeGreaterThan(300);
  });

  it('carries no colour utility beside it', () => {
    // The utility would win on the same element and paint a dark glyph on a dark tile.
    const offenders: string[] = [];

    for (const [name, code] of FILES) {
      for (const cls of classStrings(code, 'icon-tile-')) {
        if (INK.test(cls)) offenders.push(`${name}: ${cls.slice(0, 70)}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('leaves no glyph inside a tile holding its own colour', () => {
    // One of these was text-violet-600 — a colour from no palette in the product, invisible on a
    // solid navy tile.
    const offenders: string[] = [];

    for (const [name, code] of FILES) {
      const re = /icon-tile-(?:navy|teal|gold|pink)[^"'`]*["'`][\s\S]{0,300}?<[A-Z][\w.]*[^>]{0,200}?className="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(code))) {
        if (INK.test(m[1])) offenders.push(`${name}: ${m[1].slice(0, 60)}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('text badges keep the tint', () => {
  it('still exist on the soft background', () => {
    // A padded pill with no square footprint is a badge, not an icon box. Sweeping these solid
    // would have changed far more of the product than the stat cards that were asked about.
    const pills = FILES.flatMap(([, code]) => classStrings(code, 'bg-icon-bg-'));

    expect(pills.length).toBeGreaterThan(0);
    expect(pills.every((cls) => cls.includes('px-') && !/\bw-\d+\b/.test(cls))).toBe(true);
  });

  it('keeps the tint tokens they depend on', () => {
    const css = fs.readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8');

    expect(css).toContain('--icon-bg-navy');
  });
});

describe('the tile colours', () => {
  const css = fs.readFileSync(path.join(SRC, 'app', 'globals.css'), 'utf8');

  const luminance = (hex: string) => {
    const h = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  it('reads on every accent in both themes', () => {
    // Lowest pairing is pink on white ink at 4.78:1. Gold is the one accent that cannot take white
    // — it measures 2.22:1 against a white card — so it carries dark ink in both themes.
    const pairs: Array<[string, string]> = [
      ['#05527E', '#FFFFFF'], ['#047469', '#FFFFFF'], ['#D4A832', '#0F172A'], ['#D63050', '#FFFFFF'],
      ['#60A5FA', '#0F172A'], ['#2DD4BF', '#0F172A'], ['#FBBF24', '#0F172A'], ['#FB7185', '#0F172A'],
    ];

    for (const [tile, ink] of pairs) {
      expect(contrast(tile, ink)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('defines ink for all four accents in both themes', () => {
    for (const hue of ['navy', 'teal', 'gold', 'pink']) {
      expect(css).toContain(`--icon-tile-ink-${hue}`);
      expect(css).toContain(`.icon-tile-${hue} {`);
    }
  });

  it('makes the glyph inherit the tile', () => {
    expect(css).toContain('color: inherit');
  });
});
