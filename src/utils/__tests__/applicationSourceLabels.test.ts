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

  it.each(['CAREERS_PAGE', 'JOB_BOARD', 'AGENCY', 'EXTERNAL', 'INTERNAL', 'REFERRAL'])(
    'covers %s, which the stored data actually uses',
    (value) => {
      // These are the six values present on the demonstration tenant. Three of
      // them are absent from entity/ApplicationSource.java, so relying on that
      // enum alone left them rendering in capitals.
      const label = getEnumLabel('applicationSource', value);
      expect(label).not.toBe(value.replace(/_/g, ' '));
      expect(label).toMatch(/^[A-Z][a-z]/);
    },
  );

  it('falls back on a source it has never seen', () => {
    // The fallback only strips underscores — it does not case-correct, so an
    // unmapped source reaches the screen shouting. That is the reason every
    // known source is registered explicitly above rather than left to it.
    expect(getEnumLabel('applicationSource', 'SOME_NEW_BOARD')).toBe('SOME NEW BOARD');
  });
});
