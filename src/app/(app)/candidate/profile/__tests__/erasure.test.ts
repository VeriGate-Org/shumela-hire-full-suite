import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), 'src', ...p), 'utf8');

const strip = (s: string) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

/**
 * A candidate can ask for their own data to be erased.
 *
 * <p>Withdrawing consent stopped the answers being used in reporting; nothing let the person they
 * belong to ask for them to be removed. The POPIA request endpoint admits only ADMIN and
 * HR_MANAGER, so a candidate had to ask somebody to log it on their behalf — from the one screen
 * where they manage their own consent.
 */
describe('requesting erasure', () => {
  const profile = () => strip(read('app', '(app)', 'candidate', 'profile', 'page.tsx'));

  it('is offered on the profile', () => {
    expect(profile()).toContain('requestOwnErasure');
  });

  it('is a separate act from withdrawing consent', () => {
    // Clearing the box stops the answers being used; this asks for them to be removed. The screen
    // must not let one look like the other.
    const source = read('app', '(app)', 'candidate', 'profile', 'page.tsx');

    expect(source).toContain('does not delete');
    expect(source).toContain('Request erasure');
  });

  it('confirms before raising it', () => {
    // A request somebody then has to carry out across systems is not something to trigger by
    // mis-clicking beside a checkbox.
    expect(profile()).toContain('window.confirm');
  });

  it('says nothing was submitted when it fails', () => {
    expect(profile()).toContain('could not be raised');
  });

  it('names the statutory clock', () => {
    expect(read('app', '(app)', 'candidate', 'profile', 'page.tsx')).toContain('30 days');
  });
});

describe('the request is about the person asking', () => {
  it('sends no requester name or email', () => {
    // The staff endpoint takes requesterName and requesterEmail because staff log requests for
    // other people. Accepting them here would let anybody raise an erasure request in somebody
    // else's name — a deletion request against another person's record.
    const service = read('services', 'candidateService.ts');
    const call = service.slice(service.indexOf('export async function requestOwnErasure'));
    const body = call.slice(0, call.indexOf('\n}'));

    expect(body).toContain("requestType: 'ERASURE'");
    expect(body).not.toContain('requesterEmail');
    expect(body).not.toContain('requesterName');
    expect(body).toContain('/dsar/mine');
  });
});

describe('reports and extracts are told apart', () => {
  it('the menu names the difference', () => {
    // Both produce files, and "Reports" and "Report Export" said nothing about which is which.
    const nav = read('config', 'navigationRegistry.ts');

    expect(nav).toContain("label: 'Standard extracts'");
    expect(nav).not.toContain("label: 'Report Export'");
  });

  it('each screen points at the other', () => {
    expect(read('app', '(app)', 'reports', 'export', 'page.tsx')).toContain('Build your own on Reports');
    expect(read('app', '(app)', 'reports', 'page.tsx')).toContain('Ready-made extracts are on');
  });
});
