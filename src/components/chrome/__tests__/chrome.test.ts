import fs from 'fs';
import path from 'path';
import { ATTENTION, NEUTRAL, POSITIVE, formatRelativeTime, partition, toneFor } from '../notifications';

const src = (...p: string[]) => path.join(process.cwd(), 'src', ...p);
const read = (...p: string[]) => fs.readFileSync(src(...p), 'utf8');

/**
 * Source with its commentary removed.
 *
 * <p>These files explain what they replaced, and the explanations quote the old values verbatim —
 * "Version 2.1.0", bg-red-500, text-red-800. A rule that reads the raw file therefore fails on the
 * note describing the fix rather than on any shipped code.
 */
const code = (...p: string[]) =>
  read(...p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

const ENUM = path.join(
  process.cwd(),
  'backend/src/main/java/com/arthmatic/shumelahire/entity/NotificationType.java',
);

/** The enum members, read from the entity rather than copied into the test. */
function backendTypes(): string[] {
  const java = fs.readFileSync(ENUM, 'utf8');
  const body = java.slice(java.indexOf('{') + 1);
  // Members are `NAME("display", …),` at the head of the declaration; methods and javadoc are not.
  return [...body.matchAll(/^\s{4}([A-Z][A-Z_]+)\s*\(/gm)].map((m) => m[1]);
}

describe('the notification classification is exhaustive over the backend enum', () => {
  it('found the enum', () => {
    // A parser that silently matched nothing would make every assertion below vacuous.
    expect(backendTypes().length).toBeGreaterThanOrEqual(30);
  });

  it('classifies every type the backend can send', () => {
    // This is the guard the old severity map never had. It covered 9 of 37 members and nothing
    // failed as the backend grew, so everything unnamed silently became "info".
    const classified = new Set([...ATTENTION, ...POSITIVE, ...NEUTRAL]);
    const unclassified = backendTypes().filter((type) => !classified.has(type));

    expect(unclassified).toEqual([]);
  });

  it('classifies nothing that does not exist', () => {
    const real = new Set(backendTypes());
    const invented = [...ATTENTION, ...POSITIVE, ...NEUTRAL].filter((type) => !real.has(type));

    expect(invented).toEqual([]);
  });

  it('puts each type in exactly one list', () => {
    const all = [...ATTENTION, ...POSITIVE, ...NEUTRAL];

    expect(all.length).toBe(new Set(all).size);
  });

  it('agrees with the backend about what requires action', () => {
    // NotificationType.requiresAction() is the entity's own judgement. A frontend list is free to
    // be finer-grained but not to contradict it — TASK_ASSIGNED was classified neutral here on
    // first writing while the backend called it action-required.
    const java = fs.readFileSync(ENUM, 'utf8');
    const method = java.slice(java.indexOf('public boolean requiresAction()'));
    const body = method.slice(0, method.indexOf('}'));
    const requiresAction = [...body.matchAll(/this == ([A-Z_]+)/g)].map((m) => m[1]);

    expect(requiresAction.length).toBeGreaterThan(0);
    expect(requiresAction.filter((type) => toneFor(type) !== 'attention')).toEqual([]);
  });

  it('reads an unknown type as neutral rather than throwing', () => {
    expect(toneFor('SOMETHING_NEW')).toBe('neutral');
    expect(toneFor(undefined)).toBe('neutral');
  });
});

describe('how old a notification reads', () => {
  const now = new Date('2026-08-26T12:00:00Z').getTime();
  const ago = (ms: number) => formatRelativeTime(new Date(now - ms), now);
  const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  it('uses the largest unit that is still true', () => {
    expect(ago(30_000)).toBe('Just now');
    expect(ago(5 * MIN)).toBe('5 minutes ago');
    expect(ago(3 * HOUR)).toBe('3 hours ago');
    expect(ago(2 * DAY)).toBe('2 days ago');
  });

  it('does not report a year as 400 days', () => {
    // The previous formatter had no bucket above days.
    expect(ago(400 * DAY)).toBe('1 year ago');
    expect(ago(10 * DAY)).toBe('1 week ago');
    expect(ago(60 * DAY)).toBe('2 months ago');
  });

  it('says one thing singular', () => {
    expect(ago(1 * MIN)).toBe('1 minute ago');
    expect(ago(1 * DAY)).toBe('1 day ago');
  });
});

describe('ordering', () => {
  const at = (iso: string, read: boolean) => ({ read, timestamp: new Date(iso) });

  it('puts unread first and newest first within each part', () => {
    const { unread, earlier } = partition([
      at('2026-08-01T00:00:00Z', false),
      at('2026-08-20T00:00:00Z', true),
      at('2026-08-10T00:00:00Z', false),
      at('2026-08-25T00:00:00Z', true),
    ]);

    expect(unread.map((n) => n.timestamp.toISOString().slice(0, 10)))
      .toEqual(['2026-08-10', '2026-08-01']);
    expect(earlier.map((n) => n.timestamp.toISOString().slice(0, 10)))
      .toEqual(['2026-08-25', '2026-08-20']);
  });
});

describe('the header chrome uses one icon system', () => {
  const FILES: Array<[string, string]> = [
    ['NotificationCenter.tsx', code('components', 'NotificationCenter.tsx')],
    ['UserProfile.tsx', code('components', 'UserProfile.tsx')],
    ['Toast.tsx', code('components', 'Toast.tsx')],
    ['HeaderPopover.tsx', code('components', 'chrome', 'HeaderPopover.tsx')],
  ];

  // Pictographs, dingbats, geometric shapes used as carets, and the variation selector.
  // U+2192 (→) is deliberately not covered: it is punctuation in "View all notifications →".
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{25B0}-\u{25FF}\u{2139}\u{FE0F}]/u;

  it.each(FILES)('%s uses heroicons, not emoji', (_name, source) => {
    // The bell was a bell emoji, the account menu had three more with a text caret and text
    // closers — while the header rendering them was already on heroicons.
    expect(source).not.toMatch(EMOJI);
  });

  it.each(FILES)('%s uses theme-aware colour only', (_name, source) => {
    // gray and slate are redefined as CSS variables that invert in dark mode. red, green, violet
    // and the raw palettes are not — which is how the toast ended up at 2.14:1.
    const offenders = source.match(
      /\b(?:text|bg|border)-(?:red|green|violet|blue|emerald|amber|yellow|purple)-\d{2,3}\b|\bbg-white\b/g,
    );

    expect(offenders ?? []).toEqual([]);
  });
});

describe('toasts', () => {
  const toast = read('components', 'Toast.tsx');
  const toastCode = code('components', 'Toast.tsx');

  it('keeps the call signature every caller uses', () => {
    // ~95 files call this. The redesign is inside the provider.
    expect(toast).toContain('toast: (message: string, type?: ToastType, action?: ToastAction) => void');
  });

  it('does not time out an error', () => {
    expect(toast).toContain("const persists = toast.type === 'error'");
    expect(toast).toContain('if (persists || paused) return;');
  });

  it('pauses the timer while the toast is read', () => {
    expect(toast).toContain('onMouseEnter');
    expect(toast).toContain('onFocus');
  });

  it('separates urgent from routine announcements', () => {
    // One assertive region would make "Draft saved" interrupt a screen reader mid-sentence.
    expect(toast).toContain('aria-live="assertive"');
    expect(toast).toContain('aria-live="polite"');
  });

  it('caps how many can stack', () => {
    expect(toast).toContain('slice(-MAX_VISIBLE)');
  });

  it('does not reach for the animation plugin that is not installed', () => {
    // animate-in / slide-in-from-right came from tailwindcss-animate, which is absent, so the
    // classes were inert.
    expect(toastCode).not.toContain('animate-in');
    expect(toastCode).not.toContain('slide-in-from');

    const pkg = JSON.parse(read('..', 'package.json'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(deps['tailwindcss-animate']).toBeUndefined();
  });
});

describe('the popover both dropdowns share', () => {
  const popover = read('components', 'chrome', 'HeaderPopover.tsx');

  it('closes on Escape and returns focus to its trigger', () => {
    // The old backdrop was a click-only div: a keyboard user could open either panel with no way
    // to close it.
    expect(popover).toContain("event.key !== 'Escape'");
    expect(popover).toContain('triggerRef.current?.focus()');
  });

  it('scrolls in one place, bounded by the viewport', () => {
    // An outer max-h-96 against an inner max-h-64 clipped the empty state behind the footer.
    expect(popover).toContain('calc(100dvh - 6rem)');
    expect(popover).toContain('flex-1 overflow-y-auto');
  });

  it('is used by both dropdowns', () => {
    expect(read('components', 'NotificationCenter.tsx')).toContain('<HeaderPopover');
    expect(read('components', 'UserProfile.tsx')).toContain('<HeaderPopover');
  });
});

describe('the account menu version', () => {
  it('is never a hardcoded string', () => {
    const profile = code('components', 'UserProfile.tsx');

    expect(profile).not.toContain('Version 2.1.0');
    expect(profile).toContain('appVersion()');
  });

  it('is absent rather than wrong when nothing supplies it', () => {
    const lib = read('lib', 'app-version.ts');

    expect(lib).toContain('if (!value) return null');
  });

  it('is passed in by the deploy', () => {
    const workflow = fs.readFileSync(
      path.join(process.cwd(), '.github/workflows/deploy.yml'),
      'utf8',
    );

    expect(workflow).toContain('NEXT_PUBLIC_APP_VERSION');
  });
});

describe('the tenant logo', () => {
  it('lives in the top bar, which is the one surface that is always visible', () => {
    // It used to sit at the top of the sidebar. The rail that replaced the sidebar is 64px and
    // cannot hold a wordmark, and the panel beside it can be unpinned and closed — so a logo there
    // would come and go. The top bar carried nothing but a breadcrumb on desktop.
    expect(read('components', 'ModernLayout.tsx')).toContain('<TenantLogo');
  });

  it('is plated against the dark theme', () => {
    // The bar sits on --card: white in light mode, #1E293B in dark. 63% of the IDC mark's opaque
    // pixels measure below 3:1 on a dark ground, so the plate is what keeps it legible.
    expect(read('components', 'ModernLayout.tsx')).toContain('plate="dark"');
  });

  it('is not drawn unplated on the rail', () => {
    // The rail is #0B1929 in both themes. Putting the tenant logo back there without a plate is
    // exactly the regression this guards.
    expect(read('components', 'ModernSidebar.tsx')).not.toContain('TenantLogo');
  });

  it('falls back when the URL fails', () => {
    const logo = read('components', 'chrome', 'TenantLogo.tsx');

    expect(logo).toContain('onError');
    expect(read('components', 'ModernLayout.tsx')).toContain('fallback=');
  });
});
