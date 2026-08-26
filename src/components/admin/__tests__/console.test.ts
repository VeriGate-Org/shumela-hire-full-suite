import fs from 'fs';
import path from 'path';
import {
  ConsoleTile,
  OMITTED,
  complianceDetail,
  countDetail,
  openRequests,
  orderTiles,
  overdueRequests,
} from '../console';

const NOW = new Date('2026-08-26T09:00:00Z').getTime();
const req = (status: string, dueDate: string | null) => ({ status, dueDate });

describe('open and overdue requests', () => {
  it('counts only requests still open', () => {
    const rows = [
      req('RECEIVED', null),
      req('IN_PROGRESS', null),
      req('COMPLETED', null),
      req('REJECTED', null),
    ];

    expect(openRequests(rows)).toHaveLength(2);
  });

  it('counts an open request past its due date', () => {
    const rows = [req('RECEIVED', '2026-08-01T00:00:00Z'), req('RECEIVED', '2026-09-30T00:00:00Z')];

    expect(overdueRequests(rows, NOW)).toHaveLength(1);
  });

  it('does not count a completed request as overdue', () => {
    // A request answered late is not an open breach; it is history.
    expect(overdueRequests([req('COMPLETED', '2026-08-01T00:00:00Z')], NOW)).toHaveLength(0);
  });

  it('does not treat a missing due date as overdue', () => {
    expect(overdueRequests([req('RECEIVED', null)], NOW)).toHaveLength(0);
  });
});

describe('what the compliance tile says', () => {
  it('leads with the breach count when there is one', () => {
    // POPIA sets a 30-day deadline. "7 open" is a workload; "3 past the deadline" is a finding.
    const rows = [req('RECEIVED', '2026-08-01T00:00:00Z'), req('RECEIVED', '2026-09-30T00:00:00Z')];
    const { detail, state } = complianceDetail(rows, false, NOW);

    expect(detail).toContain('past the 30-day statutory deadline');
    expect(state).toBe('wrong');
  });

  it('says a count is a floor when more requests exist than were read', () => {
    const rows = [req('RECEIVED', '2026-08-01T00:00:00Z')];

    expect(complianceDetail(rows, true, NOW).detail).toContain('at least');
  });

  it('reports open-but-not-late plainly', () => {
    const { detail, state } = complianceDetail(
      [req('RECEIVED', '2026-09-30T00:00:00Z')],
      false,
      NOW,
    );

    expect(detail).toContain('none past its deadline');
    expect(state).toBe('attention');
  });

  it('says nothing is open rather than showing a zero', () => {
    expect(complianceDetail([], false, NOW).detail).toBe('No open requests');
  });
});

describe('a count that could not be read', () => {
  it('is not rendered as zero', () => {
    // "0 departments" and "we could not reach the department service" look identical otherwise.
    const { detail, state } = countDetail(null, 'department', 'departments');

    expect(detail).toBeNull();
    expect(state).toBe('unknown');
  });

  it('distinguishes a genuine zero', () => {
    expect(countDetail(0, 'policy', 'policies').detail).toBe('No policies');
  });
});

describe('tile order', () => {
  it('puts what is wrong first and what is settled last', () => {
    const tile = (id: string, state: ConsoleTile['state']): ConsoleTile => ({
      id,
      label: id,
      href: '/',
      permission: 'manage_permissions',
      description: '',
      detail: null,
      state,
    });
    const ordered = orderTiles([
      tile('settled', 'settled'),
      tile('wrong', 'wrong'),
      tile('unknown', 'unknown'),
      tile('attention', 'attention'),
    ]);

    expect(ordered.map((t) => t.id)).toEqual(['wrong', 'attention', 'unknown', 'settled']);
  });
});

describe('figures the console deliberately does not show', () => {
  it('records why each is absent', () => {
    // The design drew all three. Each is omitted for a reason worth keeping, not dropped.
    expect(Object.keys(OMITTED)).toHaveLength(3);
    expect(OMITTED['role permissions — last changed']).toContain('2024-01-01');
  });

  it('does not show a date the API hardcodes', () => {
    // AdminController sets createdAt and lastModified to "2024-01-01T00:00:00" for every role, so
    // a "last changed" figure would be fabricated by the API rather than read from anything.
    const page = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'admin', 'page.tsx'),
      'utf8',
    );

    expect(page).not.toContain('lastModified');
  });
});

describe('the admin screens', () => {
  const ADMIN = path.join(process.cwd(), 'src', 'app', '(app)', 'admin');
  const screens = (fs.readdirSync(ADMIN, { recursive: true } as never) as unknown as string[])
    .filter((f) => typeof f === 'string' && f.endsWith('page.tsx'));

  it('found every admin screen', () => {
    // A suite that silently iterates nothing proves nothing.
    expect(screens.length).toBeGreaterThanOrEqual(12);
  });

  it.each(screens)('%s opens with the band', (screen) => {
    expect(fs.readFileSync(path.join(ADMIN, screen), 'utf8')).toContain('IdentityBand');
  });

  it.each(screens)('%s uses tokens, not light-only colour', (screen) => {
    const code = fs.readFileSync(path.join(ADMIN, screen), 'utf8');

    expect(code.match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
  });
});

describe('the console is offered to both roles that can use it', () => {
  const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), 'src', ...p), 'utf8');

  it('is gated on a permission ADMIN and HR_MANAGER both hold', () => {
    // It was gated on manage_permissions, which is ADMIN-only — while four of the seven areas it
    // gathers are reachable by an HR_MANAGER, and the DSAR breach count is most relevant to
    // whoever owns compliance.
    const perms = read('config', 'permissions.ts');
    const admin = perms.slice(perms.indexOf('ADMIN:'), perms.indexOf('EXECUTIVE:'));
    const hr = perms.slice(perms.indexOf('HR_MANAGER:'), perms.indexOf('HR_MANAGER:') + 900);

    expect(admin).toContain('view_admin_console');
    expect(hr).toContain('view_admin_console');
    expect(read('config', 'navigationRegistry.ts')).toContain(
      "href: '/admin', icon: Cog6ToothIcon, section: 'administration', requiredPermissions: ['view_admin_console']",
    );
  });

  it('shows each role only the areas it can reach', () => {
    // An HR Manager seeing a Role Permissions tile would be sent to a refusal.
    const page = read('app', '(app)', 'admin', 'page.tsx');

    expect(page).toContain('hasPermission(tile.permission)');
  });

  it('does not request what the viewer may not see', () => {
    // A 403 here would report as "could not be read" when the truth is "not yours to read".
    const page = read('app', '(app)', 'admin', 'page.tsx');

    expect(page).toContain("hasPermission('manage_permissions')");
    expect(page).toContain("hasPermission('manage_compliance')");
  });
});

describe('controls that did nothing', () => {
  const read = (...p: string[]) =>
    fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(app)', 'admin', ...p), 'utf8');

  it('the branding preview no longer takes focus', () => {
    // The swatches were real <button> elements with no handler: focusable, activatable, inert.
    const code = read('branding', 'page.tsx');
    const buttons = (code.match(/<button/g) ?? []).length;
    const handlers = (code.match(/onClick/g) ?? []).length;

    expect(buttons).toBeLessThanOrEqual(handlers);
  });

  it('the compliance list no longer draws a paginator it does not have', () => {
    // Two permanently disabled arrows and a page number hardcoded to 1 — a picture of a control.
    expect(read('compliance', 'page.tsx')).not.toContain('{/* Pagination */}');
  });
});
