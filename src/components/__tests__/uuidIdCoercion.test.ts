import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every id in this product is a UUID string. `Number('0b201dbb-…')` is NaN, and every
 * comparison against NaN is false — so a coerced id does not fail loudly, it silently
 * disables whatever depends on it.
 *
 * This has now been fixed four separate times in InterviewScheduler alone: the current
 * user's id, the interviewer ids, the actor id on ?updatedBy=, and — missed by all three
 * of those passes — the application id that gates step 1 of the wizard, which left the
 * whole "schedule an interview" flow unreachable while the file carried three comments
 * explaining the exact defect.
 *
 * A source guard rather than a render test: the failure is a type/coercion decision, it is
 * visible in the source, and this catches it without mounting a five-step wizard.
 */

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

// Number(x) applied to something whose name ends in "Id" or "Ids".
const NUMERIC_ID_COERCION = /Number\(\s*[A-Za-z0-9_.?[\]]*[Ii][Dd]s?\b/;

// An id compared as if it were numeric: `somethingId > 0`, `>= 1`, `!== 0` …
const NUMERIC_ID_COMPARISON = /\b[A-Za-z0-9_.]*[Ii][Dd]\s*(?:>|>=|<|<=)\s*-?\d/;

const FILES = [
  'src/components/InterviewScheduler.tsx',
  'src/app/(app)/pipeline/page.tsx',
  'src/app/(app)/interviews/page.tsx',
];

describe('UUID ids are never coerced to numbers', () => {
  it.each(FILES)('%s does not call Number() on an id', (file) => {
    const offending = read(file)
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }) => NUMERIC_ID_COERCION.test(line) && !line.startsWith('//'));

    expect(
      offending.map(({ n, line }) => `${file}:${n}  ${line}`),
    ).toEqual([]);
  });

  it.each(FILES)('%s does not compare an id against a number', (file) => {
    const offending = read(file)
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }) => NUMERIC_ID_COMPARISON.test(line) && !line.startsWith('//'));

    expect(
      offending.map(({ n, line }) => `${file}:${n}  ${line}`),
    ).toEqual([]);
  });

  it('keeps the interview wizard gate on a truthiness check, not a numeric one', () => {
    const source = read('src/components/InterviewScheduler.tsx');
    expect(source).toContain('case 0: return !!formData.applicationId;');
  });
});
