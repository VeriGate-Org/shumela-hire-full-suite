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
