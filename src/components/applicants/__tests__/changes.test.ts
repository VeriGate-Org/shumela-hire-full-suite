import fs from 'fs';
import path from 'path';
import {
  ApplicantSnapshot,
  changeCount,
  hasChanged,
  previousValue,
  summarise,
  summaryLine,
} from '../changes';

const base = (over: Partial<ApplicantSnapshot> = {}): ApplicantSnapshot => ({
  name: 'Lerato',
  surname: 'Dlamini',
  email: 'lerato@example.co.za',
  phone: '+27 83 447 2219',
  address: '12 Rivonia Road',
  idPassportNumber: '*********1234',
  education: [
    { institution: 'UJ', degree: 'BCom', fieldOfStudy: 'Finance', graduationYear: 2014 },
  ],
  experience: [
    { company: 'Transnet', position: 'PM', startDate: '2019', endDate: '2024', description: 'x' },
  ],
  skills: ['Programme delivery', 'Jira'],
  ...over,
});

describe('nothing changed', () => {
  it('reports nothing when the two snapshots match', () => {
    expect(summarise(base(), base())).toEqual([]);
  });

  it('reports nothing before the record has loaded', () => {
    // No baseline means no comparison. Treating "not loaded yet" as "everything changed" would
    // open the form with a full save bar.
    expect(summarise(null, base())).toEqual([]);
  });
});

describe('scalar fields', () => {
  it('names the field that changed and keeps the old value', () => {
    const changes = summarise(base(), base({ phone: '+27 82 000 0000' }));

    expect(changes).toHaveLength(1);
    expect(changes[0].label).toBe('phone');
    expect(changes[0].from).toBe('+27 83 447 2219');
  });

  it('describes a previously blank field as blank, not as nothing', () => {
    const changes = summarise(base({ address: '' }), base({ address: '1 New Street' }));

    expect(previousValue(changes, 'address')).toBe('blank');
  });

  it('reports several at once', () => {
    const changes = summarise(base(), base({ name: 'Lee', email: 'l@example.co.za' }));

    expect(changes.map((c) => c.label)).toEqual(['first name', 'email']);
  });
});

describe('the identity number is never compared', () => {
  it('ignores a difference in the masked field', () => {
    // The server masks it on read, so the loaded value is "*********1234" rather than the number.
    // Comparing it would report a change on every record where a replacement was typed and nothing
    // useful where one was not — replacing it is its own action with its own control.
    const changes = summarise(base(), base({ idPassportNumber: '8503125678901' }));

    expect(changes).toEqual([]);
  });

  it('counts a replacement separately, through replacingId', () => {
    expect(changeCount([], true)).toBe(1);
    expect(summaryLine([], true)).toBe('identity number replaced');
  });
});

describe('skills', () => {
  it('counts additions and removals separately', () => {
    const changes = summarise(base(), base({ skills: ['Programme delivery', 'PFMA'] }));

    expect(changes.map((c) => c.label)).toEqual(['one skill added', 'one skill removed']);
  });

  it('pluralises', () => {
    const changes = summarise(base(), base({ skills: [] }));

    expect(changes.map((c) => c.label)).toEqual(['2 skills removed']);
  });

  it('does not report a reordering as a change', () => {
    const changes = summarise(base(), base({ skills: ['Jira', 'Programme delivery'] }));

    expect(changes).toEqual([]);
  });
});

describe('structured lists', () => {
  it('reports a qualification added', () => {
    const changes = summarise(
      base(),
      base({
        education: [
          ...base().education,
          { institution: 'Wits', degree: 'PGDip', fieldOfStudy: 'PM', graduationYear: 2020 },
        ],
      }),
    );

    expect(changes.map((c) => c.label)).toEqual(['one qualification added']);
  });

  it('reports a qualification removed', () => {
    const changes = summarise(base(), base({ education: [] }));

    expect(changes.map((c) => c.label)).toEqual(['one qualification removed']);
  });

  it('reports an edit to an entry that stayed in place', () => {
    const edited = base().education.map((e) => ({ ...e, graduationYear: 2015 }));
    const changes = summarise(base(), base({ education: edited }));

    expect(changes.map((c) => c.label)).toEqual(['one qualification edited']);
  });

  it('reports roles, which the form did not previously show at all', () => {
    const changes = summarise(base(), base({ experience: [] }));

    expect(changes.map((c) => c.label)).toEqual(['one role removed']);
  });
});

describe('the sentence the save bar shows', () => {
  it('reads as the design wrote it', () => {
    const changes = summarise(
      base(),
      base({
        phone: '+27 82 000 0000',
        skills: [...base().skills, 'PFMA'],
        education: [],
      }),
    );

    expect(changeCount(changes, false)).toBe(3);
    expect(summaryLine(changes, false)).toBe('phone, one skill added, one qualification removed');
  });
});

describe('marking a changed field', () => {
  it('knows which fields to mark', () => {
    const changes = summarise(base(), base({ email: 'new@example.co.za' }));

    expect(hasChanged(changes, 'email')).toBe(true);
    expect(hasChanged(changes, 'phone')).toBe(false);
  });
});

describe('the form', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src', 'components', 'ApplicantProfile.tsx'),
    'utf8',
  );

  const code = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  it('renders work experience', () => {
    // The field was parsed on load, held in state and written back on every save, but never
    // rendered — and its add handler was named _addExperience so the unused-variable lint would
    // stay quiet. A recruiter could not see or correct a candidate's work history.
    expect(code).toContain('formData.experience.map');
    expect(code).toContain('addExperience');
    expect(code).not.toContain('_addExperience');
  });

  it('lets entries be removed, not only added', () => {
    expect(code).toContain('removeEducation');
    expect(code).toContain('removeExperience');
  });

  it('does not mutate a list entry in place', () => {
    // `const copy = [...list]; copy[i].field = value` copies the array but not the objects inside
    // it, so the assignment writes through to the original too — which breaks any comparison held
    // against a previous snapshot.
    expect(code).not.toMatch(/newEducation\[index\]\.\w+ =/);
    expect(code).toContain('editEntry');
  });

  it('does not edit employment-equity answers', () => {
    // Given by the candidate under consent, and they feed statutory reporting. Staff read them.
    expect(code).not.toMatch(/setFormData\([^)]*gender:/);
    expect(code).not.toMatch(/demographicsConsent: e\.target\.checked/);
  });

  it('does not claim a candidate self-service screen that does not exist', () => {
    // ApplicantProfile is the only surface in the product that writes these fields. Saying the
    // candidate maintains them elsewhere would be a comfortable lie.
    expect(code).not.toMatch(/maintained on (her|his|their) own profile/i);
  });

  it('leads with the band and states what is unsaved', () => {
    expect(code).toContain('IdentityBand');
    expect(code).toContain('DecisionBar');
    expect(code).toContain('summaryLine');
  });

  it('uses tokens, not light-only colour', () => {
    expect(code.match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
    // The success and error banners were literal green and red, which do not theme either.
    expect(code.match(/\b(bg|text|border)-(red|green)-\d+\b/g) ?? []).toEqual([]);
  });
});
