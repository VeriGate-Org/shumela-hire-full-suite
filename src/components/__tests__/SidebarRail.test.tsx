/**
 * The rail-and-panel navigation.
 *
 * <p>What it replaced, and what each test is holding in place:
 *
 * <ol>
 *   <li><b>Collapsing hid most of the menu.</b> The old collapsed mode rendered
 *       {@code items.slice(0, 1)} for each group, so twelve of Recruitment's thirteen entries were
 *       unreachable — behind an icon that looked like a section but navigated to one child.</li>
 *   <li><b>The footer sat below the fold.</b> The {@code aside} was itself the scroll container with
 *       Settings and the "Powered by" attribution inside it, so once the active section
 *       auto-expanded, both scrolled out of reach.</li>
 *   <li><b>One-item sections carried an accordion.</b> Six of nine sections hold one or two entries
 *       and still cost a disclosure triangle.</li>
 * </ol>
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModernSidebar from '@/components/ModernSidebar';
import { rolePermissions } from '@/config/permissions';

let pathname = '/applications';
jest.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: jest.fn() }),
}));

// The real ADMIN grant, not a hand-written subset. A short list silently shrinks the menu and
// would have made the "every item, not just the first" assertion pass on three links.
const permissions = rolePermissions.ADMIN;

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'ADMIN', permissions } }),
  ROLE_DISPLAY_NAMES: { ADMIN: 'Administrator' },
}));

jest.mock('@/contexts/FeatureGateContext', () => ({
  useFeatureGate: () => ({ isFeatureEnabled: () => true }),
}));

jest.mock('@/contexts/TenantContext', () => ({
  useTenant: () => ({
    tenant: { subdomain: 'idc', modules: null },
    branding: { logoUrl: '/idc-logo.png' },
  }),
}));

/** jsdom reports no pointer at all, so hover-to-open is inert unless this says otherwise. */
function setHover(supported: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: supported && query.includes('hover'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    }),
  });
}

beforeEach(() => {
  pathname = '/applications';
  setHover(false);
  sessionStorage.clear();
});

describe('the rail', () => {
  it('offers every section at once', () => {
    render(<ModernSidebar panelPinned />);
    const rail = screen.getByRole('complementary', { name: 'Sections' });

    // Recruitment, Analytics and the single-item sections are all reachable without opening
    // anything. Nothing is hidden behind a collapsed group.
    expect(within(rail).getByRole('button', { name: 'Recruitment' })).toBeInTheDocument();
    expect(within(rail).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('sends a one-item section straight to its page', () => {
    render(<ModernSidebar panelPinned />);
    const rail = screen.getByRole('complementary', { name: 'Sections' });

    // Six of the nine sections hold one or two entries. A destination is a link, not a container
    // with a disclosure triangle.
    const dashboard = within(rail).getByRole('link', { name: 'Dashboard' });
    expect(dashboard).toHaveAttribute('href', '/dashboard');
  });

  it('keeps Settings reachable regardless of how long the menu is', () => {
    // This is the fix for the footer that scrolled out of view: the rail's last block is fixed.
    render(<ModernSidebar panelPinned />);
    const rail = screen.getByRole('complementary', { name: 'Sections' });

    expect(within(rail).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });
});

describe('the panel', () => {
  it('shows every item of the section, not just the first', () => {
    render(<ModernSidebar panelPinned />);
    const panel = screen.getByRole('navigation', { name: 'Recruitment pages' });

    // The specific regression: the old collapsed rail showed items.slice(0, 1).
    // Recruitment holds 13 entries for an administrator. The old collapsed rail showed one.
    const links = within(panel).getAllByRole('link');
    expect(links.length).toBeGreaterThan(8);
    expect(within(panel).getByRole('link', { name: /Applications/ })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /Job Postings/ })).toBeInTheDocument();
  });

  it('opens on the section the current route belongs to', () => {
    render(<ModernSidebar panelPinned />);

    expect(screen.getByRole('navigation', { name: 'Recruitment pages' })).toBeInTheDocument();
  });

  it('switches section when a rail button is clicked', async () => {
    const user = userEvent.setup();
    render(<ModernSidebar panelPinned />);

    await user.click(screen.getByRole('button', { name: 'Analytics' }));

    expect(screen.getByRole('navigation', { name: 'Analytics pages' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Recruitment pages' })).not.toBeInTheDocument();
  });

  it('keeps its section when the route moves to a one-item section', () => {
    // Visiting the Dashboard must not blank the panel — a single-item section navigates and
    // deliberately does not claim the panel.
    pathname = '/dashboard';
    render(<ModernSidebar panelPinned />);

    expect(screen.getByRole('navigation', { name: 'Recruitment pages' })).toBeInTheDocument();
  });

  it('carries the attribution where it cannot scroll away', () => {
    render(<ModernSidebar panelPinned />);
    const panel = screen.getByRole('navigation', { name: 'Recruitment pages' });

    expect(within(panel).getByText('Powered by')).toBeInTheDocument();
  });
});

describe('pinning', () => {
  it('is hidden until asked for when unpinned', () => {
    render(<ModernSidebar panelPinned={false} />);

    expect(screen.queryByRole('navigation', { name: 'Recruitment pages' })).not.toBeInTheDocument();
  });

  it('opens on click even where there is no hover', async () => {
    // Touch has no hover. Clicking has to work on its own or the rail is unusable on a tablet.
    const user = userEvent.setup();
    render(<ModernSidebar panelPinned={false} />);

    await user.click(screen.getByRole('button', { name: 'Recruitment' }));

    expect(screen.getByRole('navigation', { name: 'Recruitment pages' })).toBeInTheDocument();
  });

  it('closes again on Escape', async () => {
    const user = userEvent.setup();
    render(<ModernSidebar panelPinned={false} />);
    await user.click(screen.getByRole('button', { name: 'Recruitment' }));

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('navigation', { name: 'Recruitment pages' })).not.toBeInTheDocument();
  });

  it('does not offer a pin control on the mobile overlay', () => {
    // The overlay is 260px — exactly rail plus panel — and pinning there would mean nothing.
    render(<ModernSidebar forcePinned />);

    expect(screen.queryByRole('button', { name: /pin|keep menu/i })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Recruitment pages' })).toBeInTheDocument();
  });

  it('offers the pin control otherwise', () => {
    render(<ModernSidebar panelPinned onTogglePin={jest.fn()} />);

    expect(screen.getByRole('button', { name: /unpin menu/i })).toBeInTheDocument();
  });
});

/**
 * The navigation must survive a merge.
 *
 * <p>It did not, once. The rail shipped as v2.9.0 and reached production; a branch that had forked
 * from the same commit then landed with an older copy of these files, and the merge resolved in its
 * favour. <b>main lost the entire rail — component, hook, tests and 77 lines of CSS — while
 * production still ran it</b>, so the next release would have quietly reverted the navigation.
 *
 * <p>Nothing failed, because deleting a feature and its tests together leaves a green suite. These
 * assertions live in a file the deletion would also have taken, so they are a ratchet rather than a
 * proof: what they add is that the CSS and the component cannot drift apart from each other.
 */
describe('the rail is wired end to end', () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), 'src', 'app', 'globals.css'),
    'utf8',
  );
  const sidebar = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'ModernSidebar.tsx'),
    'utf8',
  );

  it('has styling for every state the component asks for', () => {
    // The component sets these three classes. Without the rules they are inert attributes.
    for (const cls of ['rail-item', 'rail-item-active', 'rail-item-open']) {
      expect(sidebar).toContain(cls);
      expect(css).toContain(`.${cls}`);
    }
  });

  it('marks the current page with an indicator, not a one-percent wash', () => {
    expect(css).toContain('inset 3px 0 0 var(--cta)');
    expect(css).toContain('inset 3px 0 0 var(--nav-hover-rail)');
  });

  it('draws keyboard focus', () => {
    expect(css).toContain('.rail-item:focus-visible');
    expect(css).toContain('.sidebar-link:focus-visible');
  });
});

describe('the panel follows the theme, the rail does not', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');
  const sidebar = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'ModernSidebar.tsx'),
    'utf8',
  );

  it('paints the panel from its own tokens', () => {
    // --sidebar-bg is #0B1929 in both themes. The panel is all text, so it needs a surface that
    // flips; the rail is all icons and keeps the dark ground the gold marker depends on.
    // Both surfaces live in this file, so a file-level negative cannot tell them apart: the rail
    // is *supposed* to use --sidebar-bg. Exactly one element may, and it is the rail.
    expect(sidebar).toContain('var(--nav-panel-bg)');
    expect(sidebar.match(/var\(--sidebar-bg\)/g) ?? []).toHaveLength(1);
  });

  it('defines every panel token in both themes', () => {
    const root = css.slice(css.indexOf(':root'), css.indexOf('.dark {'));
    const dark = css.slice(css.indexOf('.dark {'));

    for (const token of [
      '--nav-panel-bg', '--nav-panel-border', '--nav-fg', '--nav-fg-strong',
      '--nav-hover-bg', '--nav-hover-rail', '--nav-active-bg', '--nav-active-fg', '--nav-active-rail',
    ]) {
      expect(root).toContain(token);
      expect(dark).toContain(token);
    }
  });

  it('does not mark the current page in a gold that fails on a light panel', () => {
    // --cta measures 1.64:1 on white. The light panel uses --accent-gold-on-tint's value at 4.90:1,
    // so gold still means "you are here" without becoming invisible.
    const root = css.slice(css.indexOf(':root'), css.indexOf('.dark {'));
    const active = /--nav-active-rail:\s*([^;]+);/.exec(root)?.[1]?.trim();

    expect(active).toBe('#8A6D21');
  });

  it('keeps the rail dark in both themes', () => {
    expect(css).toContain('--sidebar-bg: #0B1929');
    expect(sidebar).toContain("backgroundColor: 'var(--sidebar-bg)'");
  });
});
