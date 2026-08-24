import { getEnumLabel } from '../enumLabels';
import { FALLBACK_LOOKUPS } from '@/services/lookupService';
import { JobBoardType, getBoardDisplayName } from '@/types/jobBoard';

/**
 * Application sources name third-party brands. Without an explicit entry
 * getEnumLabel falls back to title-casing, which renders PNET as "Pnet" and
 * CAREER_JUNCTION as "Career Junction" — wrong on the screens that make the
 * point about which boards the product integrates with.
 */
describe('application source labels', () => {
  it.each([
    ['PNET', 'PNet'],
    ['CAREER_JUNCTION', 'CareerJunction'],
    ['LINKEDIN', 'LinkedIn'],
    ['INDEED', 'Indeed'],
  ])('spells %s the way the brand does', (value, expected) => {
    expect(getEnumLabel('applicationSource', value)).toBe(expected);
  });

  it('agrees with the lookup service on every source', () => {
    for (const source of FALLBACK_LOOKUPS.applicationSources) {
      expect(getEnumLabel('applicationSource', source.value)).toBe(source.label);
    }
  });

  it('agrees with the job board display names for the shared boards', () => {
    // A board and the source it produces are the same brand; two registries
    // disagreeing would show one spelling when publishing and another when
    // reporting on what that publish returned.
    const shared: [JobBoardType, string][] = [
      [JobBoardType.PNET, 'PNET'],
      [JobBoardType.CAREER_JUNCTION, 'CAREER_JUNCTION'],
      [JobBoardType.LINKEDIN, 'LINKEDIN'],
      [JobBoardType.INDEED, 'INDEED'],
    ];
    for (const [boardType, sourceValue] of shared) {
      expect(getEnumLabel('applicationSource', sourceValue)).toBe(getBoardDisplayName(boardType));
    }
  });

  /**
   * Mirrors entity/ApplicationSource.java. That enum is the single definition
   * and the request DTO validates against it, so anything it admits can reach
   * the screen and must have a label here.
   */
  const BACKEND_SOURCES = [
    'EXTERNAL', 'INTERNAL', 'REFERRAL', 'RECRUITER', 'SOCIAL_MEDIA',
    'AGENCY', 'JOB_BOARD', 'CAREERS_PAGE',
    'LINKEDIN', 'INDEED', 'PNET', 'CAREER_JUNCTION',
    'CAREER_FAIR', 'COMPANY_WEBSITE', 'DIRECT_APPLICATION', 'OTHER',
  ];

  it.each(BACKEND_SOURCES)('labels %s, which the API can accept', (value) => {
    const label = getEnumLabel('applicationSource', value);
    // The fallback only strips underscores, so an unregistered value arrives
    // shouting. Detect that by the absence of any lowercase letter rather than
    // by a leading-capital pattern — "PNet" is the brand's own spelling and
    // must pass.
    expect(label).not.toBe(value.replace(/_/g, ' '));
    expect(label).toMatch(/[a-z]/);
  });

  it('offers every backend source in the lookup list', () => {
    const offered = FALLBACK_LOOKUPS.applicationSources.map((s) => s.value);
    expect([...offered].sort()).toEqual([...BACKEND_SOURCES].sort());
  });

  it('falls back on a source it has never seen', () => {
    // The fallback only strips underscores — it does not case-correct, so an
    // unmapped source reaches the screen shouting. That is the reason every
    // known source is registered explicitly above rather than left to it.
    expect(getEnumLabel('applicationSource', 'SOME_NEW_BOARD')).toBe('SOME NEW BOARD');
  });
});
