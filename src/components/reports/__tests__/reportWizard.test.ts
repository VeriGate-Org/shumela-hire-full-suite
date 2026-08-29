import fs from 'fs';
import path from 'path';
import { REPORT_SUBJECTS, defaultColumns, parseReportCsv, subjectFor } from '../subjects';

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), ...p), 'utf8');
const src = (...p: string[]) => read('src', ...p);
const strip = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const SERVICE = 'backend/src/main/java/com/arthmatic/shumelahire/service/ReportingService.java';

/**
 * The columns offered are the columns the backend fills.
 *
 * <p>The picker this replaces offered a flat list of about twenty-one fields against a service that
 * recognised three of them, and the names were near-misses: candidate_name where the service says
 * applicant_name, position_title where it says job_title. An unrecognised field falls through to
 * {@code default: values.add("")}, so the column arrived with a heading and nothing beneath it.
 */
describe('every offered column is one the backend projects', () => {
  const java = read(SERVICE);

  /** The case labels a given generator actually switches on. */
  function projected(generator: string): Set<string> {
    const start = java.indexOf(`${generator}(StringBuilder`);
    expect(start).toBeGreaterThan(-1);
    const after = java.indexOf('private String generate', start + 10);
    const block = java.slice(start, after === -1 ? undefined : after);
    return new Set([...block.matchAll(/case "([a-z_]+)":/g)].map((m) => m[1]));
  }

  const GENERATORS: Record<string, string> = {
    applications: 'generateCustomApplicationsReport',
    interviews: 'generateCustomInterviewsReport',
    analytics: 'generateCustomAnalyticsReport',
  };

  it.each(REPORT_SUBJECTS.map((s) => [s.id, s] as const))(
    '%s offers only fields the service knows',
    (id, subject) => {
      const known = projected(GENERATORS[id]);
      const unknown = subject.columns.map((c) => c.id).filter((c) => !known.has(c));

      expect(unknown).toEqual([]);
    },
  );

  it('found real case labels rather than an empty set', () => {
    // A parser that matched nothing would make the assertions above vacuous.
    expect(projected('generateCustomApplicationsReport').size).toBeGreaterThanOrEqual(6);
  });

  it('offers only filters the service reads', () => {
    for (const subject of REPORT_SUBJECTS) {
      const start = java.indexOf(`${GENERATORS[subject.id]}(StringBuilder`);
      const after = java.indexOf('private String generate', start + 10);
      const block = java.slice(start, after === -1 ? undefined : after);
      const read_ = new Set([...block.matchAll(/filters\.get\("(\w+)"\)/g)].map((m) => m[1]));

      for (const filter of subject.filters) {
        expect(read_.has(filter.id)).toBe(true);
      }
    }
  });

  it('says plainly when a subject takes no filters', () => {
    // Analytics accepts none. Offering inputs that are read and discarded is the defect this
    // whole exercise is about.
    expect(subjectFor('analytics').filters).toHaveLength(0);
    expect(strip(src('components', 'reports', 'ReportBuilder.tsx')))
      .toContain('This report takes no filters');
  });
});

describe('the subject is what gets sent', () => {
  const page = strip(src('app', '(app)', 'reports', 'page.tsx'));

  it('posts to the endpoint that honours fields and filters', () => {
    expect(page).toContain("apiFetch('/api/reports/custom/csv'");
    expect(page).toContain('reportType: config.subject');
  });

  it('no longer builds the endpoint out of the report name', () => {
    // `config.name.toLowerCase().replace(/\s+/g, '-')` against a backend matching UPPER_SNAKE_CASE
    // meant no run could ever succeed.
    expect(page).not.toContain("config.name?.toLowerCase()");
    expect(page).not.toContain('/api/analytics/reports/${reportType}');
  });

  it('sends the chosen columns and filters', () => {
    expect(page).toContain('fields: config.fields');
    expect(page).toContain('filters: Object.fromEntries');
  });

  it('reports a refusal instead of an empty table', () => {
    // A 400 used to arrive as zero rows next to an execution time, which reads as an answer.
    expect(page).toContain('failure = await refusalMessage(res)');
    expect(page).toContain('error: failure ?? undefined');
  });
});

describe('reading the CSV the endpoint returns', () => {
  const csv = [
    'CUSTOM REPORT: APPLICATIONS',
    'Period: 2026-06-01 to 2026-08-31',
    'Generated: 2026-08-29T09:14:22',
    '',
    'applicant_name,job_title,status',
    'David Ndlovu,Financial Accountant,SUBMITTED',
    '"Mthembu, Sipho",Senior Investment Analyst,SCREENING',
  ].join('\n');

  it('skips the preamble and reads the rows', () => {
    const rows = parseReportCsv(csv, ['applicant_name', 'job_title', 'status']);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      applicant_name: 'David Ndlovu',
      job_title: 'Financial Accountant',
      status: 'SUBMITTED',
    });
  });

  it('keeps a comma inside a quoted cell', () => {
    const rows = parseReportCsv(csv, ['applicant_name', 'job_title', 'status']);

    expect(rows[1].applicant_name).toBe('Mthembu, Sipho');
    expect(rows[1].status).toBe('SCREENING');
  });

  it('finds the header by its columns, not by counting lines', () => {
    // The preamble is three lines today. Counting them would break the moment it changes.
    const longer = csv.replace('CUSTOM REPORT: APPLICATIONS', 'CUSTOM REPORT: APPLICATIONS\nExtra: note');

    expect(parseReportCsv(longer, ['applicant_name', 'job_title', 'status'])).toHaveLength(2);
  });

  it('returns nothing rather than guessing when the header is absent', () => {
    expect(parseReportCsv('nothing useful here', ['applicant_name'])).toEqual([]);
  });
});

describe('the wizard asks in an order the backend can answer', () => {
  const builder = strip(src('components', 'reports', 'ReportBuilder.tsx'));

  it('asks for the subject first', () => {
    // The subject decides which columns and filters exist, so it cannot come second.
    const order = ['subject', 'columns', 'filters'];
    const found = [...builder.matchAll(/\{ id: '(subject|columns|filters)'/g)].map((m) => m[1]);

    expect(found).toEqual(order);
  });

  it('offers no chart type', () => {
    // Four of the five rendered a placeholder reading "Chart visualization will be displayed here".
    expect(builder).not.toContain('VISUALIZATION_TYPES');
    expect(strip(src('components', 'reports', 'ReportViewer.tsx')))
      .not.toContain('Chart visualization will be displayed here');
  });

  it('starts with columns already chosen, so a first run is useful', () => {
    expect(defaultColumns(subjectFor('applications')).length).toBeGreaterThan(0);
  });

  it('replaces the columns when the subject changes', () => {
    // The previous subject's columns do not exist on the new one.
    expect(builder).toContain('fields: defaultColumns(next)');
  });
});

describe('the backend can read the dates it is sent', () => {
  // Comments stripped: the fix's own javadoc quotes the cast it replaced, and a rule that reads the
  // raw file fails on the note describing the change rather than on any shipped code.
  const java = read(SERVICE)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  it('parses a date string instead of casting it', () => {
    // (LocalDateTime) on a value Jackson supplies as String threw ClassCastException, so every
    // request carrying a date answered 500.
    expect(java).not.toContain('(LocalDateTime) reportConfig.get("startDate")');
    expect(java).toContain('readDate(reportConfig.get("startDate"))');
  });

  it('does not assume a period was given', () => {
    expect(java).toContain('startDate == null ? "not stated"');
  });
});
