import fs from 'fs';
import path from 'path';

const SCREEN = path.join(
  process.cwd(), 'src', 'app', '(app)', 'candidate', 'profile', 'page.tsx',
);

const source = (): string => fs.readFileSync(SCREEN, 'utf8');

/** Source with comments stripped — the notes name the very things asserted absent. */
const code = (): string =>
  source()
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

/**
 * The candidate's own profile.
 *
 * <p>This screen became load-bearing when employment-equity answers went read-only for staff: it is
 * the only place a candidate can correct one or withdraw consent. It was not in a state to carry
 * that — three of its sections were invented, and one was rendering stored data as broken text.
 */
describe('nothing on this screen is invented', () => {
  it('does not claim a work authorisation nobody recorded', () => {
    // Set to 'authorized' for every candidate at load and rendered as a green badge, which is a
    // claim about a person's right to work in the country made up by the page.
    expect(code()).not.toContain('workAuthorization');
    expect(code()).not.toContain('Authorized to Work');
    expect(code()).not.toContain('Requires Sponsorship');
  });

  it('does not show a salary expectation of zero as a figure', () => {
    expect(code()).not.toContain('salaryExpectation');
  });

  it('does not show job preferences nobody set', () => {
    // availability, noticePeriod, preferredJobTypes, willingToRelocate and remoteWork were all
    // constants rendered as this person's answers.
    for (const invented of [
      'preferredJobTypes',
      'willingToRelocate',
      'remoteWork',
      'noticePeriod',
    ]) {
      expect(code()).not.toContain(invented);
    }
  });
});

describe('stored data reaches the screen', () => {
  it('parses skills as the array they are stored as', () => {
    // The record holds JSON.stringify(skills). Splitting that on commas rendered
    // ["Programme delivery","Jira"] as two entries reading ["Programme delivery" and "Jira"] —
    // brackets and quotes included — on the screen a candidate is most likely to look at.
    const text = code();

    expect(text).toContain('parseList(applicantData.skills)');
    expect(text).not.toMatch(/applicantData\.skills\s*\.split\(','\)/);
  });

  it('populates experience and education', () => {
    // Both tabs rendered an empty list on every profile while the data sat on the record. The
    // setters were named _setExperiences and _setEducation so the unused-variable lint stayed
    // quiet — the same trick as _addExperience on the staff form.
    const text = code();

    expect(text).toContain('setExperiences(');
    expect(text).toContain('setEducation(');
    expect(text).not.toContain('_setExperiences');
    expect(text).not.toContain('_setEducation');
  });
});

describe('employment equity is answerable here', () => {
  it('offers the four answers and the consent', () => {
    const text = code();

    for (const field of ['gender', 'race', 'disabilityStatus', 'citizenshipStatus']) {
      expect(text).toContain(field);
    }
    expect(text).toContain('demographicsConsent');
  });

  it('sends the whole record, not a patch', () => {
    // ApplicantService.updateApplicant assigns every field from the request, so a body carrying
    // only the demographic fields would blank the person's name, email and address.
    const service = fs.readFileSync(
      path.join(process.cwd(), 'src', 'services', 'candidateService.ts'),
      'utf8',
    );

    expect(service).toContain('...loaded, ...change');
    expect(code()).toContain('loadedApplicant');
  });

  it('says that withdrawing consent does not delete anything', () => {
    // Stopping the answers being used and erasing them are different acts, and the control must
    // not let one look like the other.
    expect(source()).toContain('does not delete');
  });

  it('does not leave a failed save looking like it worked', () => {
    expect(code()).toContain('could not be saved');
  });
});

describe('the screen uses tokens', () => {
  it('has no light-only colour classes', () => {
    expect(code().match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
  });
});
