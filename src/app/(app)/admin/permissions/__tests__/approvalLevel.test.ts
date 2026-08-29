import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf8');
const src = (...p: string[]) => read('src', ...p);
const strip = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const PAGE = ['app', '(app)', 'admin', 'permissions', 'page.tsx'] as const;
const AUTHORITY = 'backend/src/main/java/com/arthmatic/shumelahire/security/ApprovalAuthority.java';
const DTO = 'backend/src/main/java/com/arthmatic/shumelahire/dto/UserAdminResponse.java';
const ADMIN = 'backend/src/main/java/com/arthmatic/shumelahire/controller/AdminController.java';

/**
 * Approval authority can be assigned from the product.
 *
 * <p>{@code PUT /admin/users/{userId}/approval-level} has existed since the approvals queue was
 * built, and nothing in the frontend called it. So every user ran on their role's default with no
 * way to change it: a department head could not be granted level 1, and an executive could not be
 * explicitly held at zero. The mechanism was correct and unreachable.
 */
describe('the approval level is settable from the admin screen', () => {
  const page = strip(src(...PAGE));

  it('calls the endpoint that grants it', () => {
    expect(page).toContain('`/api/admin/users/${userId}/approval-level`');
    expect(page).toContain("method: 'PUT'");
    expect(page).toContain('JSON.stringify({ approvalLevel: level })');
  });

  it('offers a way to revoke that is not the same as granting zero', () => {
    // Null returns the user to their role default; zero explicitly holds them at none. Both stop
    // offers reaching them, so only the administrator's screen can tell them apart.
    expect(page).toContain("raw === '' ? null : Number(raw)");
    expect(page).toContain('Role default');
    expect(page).toContain('Nothing (0)');
  });

  it('puts the change back when the server refuses it', () => {
    expect(page).toContain('approvalLevel: previous');
  });
});

describe('the screen can show the level it is setting', () => {
  it('reads it off the user record rather than assuming', () => {
    expect(strip(src(...PAGE))).toContain("value={user.approvalLevel ?? ''}");
  });

  it('the users endpoint actually returns it', () => {
    // A control that writes a field the list does not return is write-only: it would show the same
    // thing before and after a change, and after a reload would forget what was set.
    const dto = read(DTO);

    expect(dto).toContain('private Integer approvalLevel;');
    expect(dto).toContain('r.setApprovalLevel(user.getApprovalLevel());');
  });

  it('keeps it nullable, because unset and zero are different states', () => {
    const dto = read(DTO);

    expect(dto).not.toContain('private int approvalLevel');
    expect(dto).toContain('public Integer getApprovalLevel()');
  });
});

/**
 * The defaults shown match the defaults applied.
 *
 * <p>The screen names a role's default so an unset level does not read as "no authority" when it
 * is really level 2. That figure is duplicated from the backend, and a duplicated figure that
 * drifts tells an administrator something the server does not do.
 */
describe('the role defaults on screen are the ones the backend applies', () => {
  it('agrees with ApprovalAuthority.ROLE_DEFAULTS', () => {
    const java = read(AUTHORITY);
    const block = java.slice(java.indexOf('ROLE_DEFAULTS = Map.of('));
    const backend = Object.fromEntries(
      [...block.slice(0, block.indexOf(');')).matchAll(/User\.Role\.([A-Z_]+),\s*(\d+)/g)].map(
        (m) => [m[1].toLowerCase(), Number(m[2])],
      ),
    );

    const page = src(...PAGE);
    const uiBlock = page.slice(
      page.indexOf('const ROLE_DEFAULT_APPROVAL'),
      page.indexOf('};', page.indexOf('const ROLE_DEFAULT_APPROVAL')),
    );
    const ui = Object.fromEntries(
      [...uiBlock.matchAll(/^\s*([a-z_]+):\s*(\d+),/gm)].map((m) => [m[1], Number(m[2])]),
    );

    expect(Object.keys(backend).length).toBeGreaterThanOrEqual(3);
    expect(ui).toEqual(backend);
  });
});

describe('only an administrator can change it', () => {
  it('the endpoint sits behind the admin guard', () => {
    const java = read(ADMIN);
    const guard = java.slice(0, java.indexOf('public class AdminController'));

    expect(guard).toContain("@PreAuthorize(\"hasRole('ADMIN')\")");
    expect(java).toContain('@PutMapping("/users/{userId}/approval-level")');
  });

  it('refuses a negative level rather than storing it', () => {
    expect(read(ADMIN)).toContain('approvalLevel cannot be negative');
  });
});

/**
 * The second axis: who may hold the permission at all.
 *
 * <p>`LOCKED_PERMISSIONS` stops a permission being removed. Nothing stopped one being *granted*:
 * `effectivePermissions` added any granted override unconditionally, so an administrator could
 * switch `view_approvals` on for an interviewer, the Approvals entry would appear in their menu,
 * and GET /api/approvals/pending would answer 403 — it is guarded by its own role list. The menu
 * said yes and the server said no, with nothing on screen admitting the grant could not take
 * effect.
 */
describe('a permission cannot be granted where the server would refuse it', () => {
  const CONTROLLER =
    'backend/src/main/java/com/arthmatic/shumelahire/controller/PendingApprovalsController.java';

  /** The roles the endpoint's own @PreAuthorize admits. */
  function admittedByEndpoint(): string[] {
    const java = read(CONTROLLER);
    const at = java.indexOf('@GetMapping("/pending")');
    expect(at).toBeGreaterThan(-1);
    const guard = java.slice(at, java.indexOf(')', java.indexOf('hasAnyRole', at)));
    return [...guard.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]).sort();
  }

  it('gates view_approvals on exactly the roles the endpoint admits', () => {
    const { ROLE_GATED_PERMISSIONS } = jest.requireActual('@/config/permissions');

    expect(admittedByEndpoint()).toHaveLength(5);
    expect([...ROLE_GATED_PERMISSIONS.view_approvals].sort()).toEqual(admittedByEndpoint());
  });

  it('refuses the grant rather than recording one that cannot work', () => {
    const { effectivePermissions, canRoleHold } = jest.requireActual('@/config/permissions');

    expect(canRoleHold('INTERVIEWER', 'view_approvals')).toBe(false);
    expect(canRoleHold('HIRING_MANAGER', 'view_approvals')).toBe(true);

    // Including an override already sitting in the database from before the gate existed.
    const granted = effectivePermissions('INTERVIEWER', [
      { role: 'INTERVIEWER', permissionId: 'view_approvals', granted: true },
    ]);
    expect(granted).not.toContain('view_approvals');
  });

  it('leaves every permission that is not role-gated alone', () => {
    // Most endpoints check the permission, not the role. This must not quietly narrow them.
    const { canRoleHold, effectivePermissions } = jest.requireActual('@/config/permissions');

    expect(canRoleHold('INTERVIEWER', 'view_applications')).toBe(true);
    expect(
      effectivePermissions('INTERVIEWER', [
        { role: 'INTERVIEWER', permissionId: 'view_applications', granted: true },
      ]),
    ).toContain('view_applications');
  });

  it('says on screen why the toggle will not move', () => {
    const page = strip(src(...PAGE));

    expect(page).toContain('canRoleHold(roleId, permission.id)');
    expect(page).toContain('cannot be granted to');
    expect(page).toContain('would add the menu entry and nothing else');
  });

  it('does not disable a permission the role already holds', () => {
    // Freezing a granted-and-working toggle would make a real permission look unremovable.
    expect(strip(src(...PAGE))).toContain('!hasIt && !canRoleHold(roleId, permission.id)');
  });
});
