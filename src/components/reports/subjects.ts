/**
 * What a custom report can be about, and what it can show.
 *
 * <p>Every entry here is a case label {@code ReportingService} actually projects. That matters more
 * than it sounds: the picker this replaces offered a flat list of about twenty-one fields, of which
 * the backend recognised <b>three</b> — and the names were near-misses rather than nonsense.
 * {@code candidate_name} where the service says {@code applicant_name}, {@code position_title} where
 * it says {@code job_title}, {@code application_date} where it says {@code submitted_date}. An
 * unrecognised field falls to {@code default: values.add("")}, so the column arrived with a heading
 * and nothing under it, silently.
 *
 * <p>The fields also belong to the subject rather than to the product as a whole, which is why the
 * wizard asks what the report is about before it asks for columns: the answer decides the question.
 *
 * <p>Filters are the same story. Applications takes three, interviews takes one, analytics takes
 * none at all — so the step says so rather than offering inputs that are read and discarded.
 */

export type SubjectId = 'applications' | 'interviews' | 'analytics';

export interface ReportColumn {
  /** The name the backend switches on. Sent verbatim. */
  id: string;
  /** What it is called on screen. */
  label: string;
}

export interface ReportFilter {
  /** The key the backend reads out of the filters map. */
  id: string;
  label: string;
  /** Free text, or a fixed set the backend compares against. */
  options?: string[];
}

export interface ReportSubject {
  id: SubjectId;
  /** Singular, because the wizard asks "each row is one…". */
  noun: string;
  description: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
  /** Analytics returns measures rather than rows of people; the wording changes with it. */
  aggregate?: boolean;
}

export const REPORT_SUBJECTS: ReportSubject[] = [
  {
    id: 'applications',
    noun: 'Application',
    description: 'One row per application received',
    columns: [
      { id: 'applicant_name', label: 'Candidate' },
      { id: 'job_title', label: 'Role applied for' },
      { id: 'status', label: 'Stage' },
      { id: 'submitted_date', label: 'Received' },
      { id: 'email', label: 'Email' },
      { id: 'rating', label: 'Rating' },
      { id: 'source', label: 'Source' },
      { id: 'id', label: 'Reference' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Stage',
        options: ['SUBMITTED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'],
      },
      { id: 'jobTitle', label: 'Role contains' },
      { id: 'keyword', label: 'Keyword' },
    ],
  },
  {
    id: 'interviews',
    noun: 'Interview',
    description: 'One row per interview scheduled',
    columns: [
      { id: 'applicant_name', label: 'Candidate' },
      { id: 'job_title', label: 'Role' },
      { id: 'scheduled_date', label: 'Scheduled for' },
      { id: 'interview_type', label: 'Type' },
      { id: 'status', label: 'Status' },
      { id: 'interviewer', label: 'Interviewer' },
      { id: 'rating', label: 'Rating' },
      { id: 'recommendation', label: 'Recommendation' },
      { id: 'id', label: 'Reference' },
    ],
    filters: [{ id: 'interviewType', label: 'Type' }],
  },
  {
    id: 'analytics',
    noun: 'Measure',
    description: 'Aggregate figures, not rows of people',
    aggregate: true,
    columns: [
      { id: 'time_to_hire', label: 'Time to hire' },
      { id: 'conversion_rate', label: 'Conversion rate' },
      { id: 'cost_per_hire', label: 'Cost per hire' },
      { id: 'interview_completion', label: 'Interview completion' },
      { id: 'applications', label: 'Applications' },
      { id: 'interviews', label: 'Interviews' },
      { id: 'performance', label: 'Performance' },
      { id: 'executive', label: 'Executive summary' },
      { id: 'trends', label: 'Trends' },
    ],
    filters: [],
  },
];

export function subjectFor(id: SubjectId | undefined): ReportSubject {
  return REPORT_SUBJECTS.find((s) => s.id === id) ?? REPORT_SUBJECTS[0];
}

/** The columns a report opens with, so the first run is useful without any choosing. */
export function defaultColumns(subject: ReportSubject): string[] {
  return subject.columns.slice(0, 4).map((c) => c.id);
}

/**
 * The rows out of the CSV the endpoint returns.
 *
 * <p>{@code /api/reports/custom/csv} answers with text, not JSON, and it prefixes three lines of
 * preamble — a title, the period and a generated-at stamp — before the header row. Those are useful
 * in a downloaded file and noise in a table, so they are skipped by finding the header line rather
 * than by counting lines, which would break the moment the preamble changes.
 */
export function parseReportCsv(csv: string, expectedColumns: string[]): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];

  const headerIndex = lines.findIndex((line) => {
    const cells = splitCsvLine(line).map((c) => c.trim());
    return expectedColumns.every((col) => cells.includes(col));
  });
  if (headerIndex === -1) return [];

  const headers = splitCsvLine(lines[headerIndex]).map((h) => h.trim());
  return lines.slice(headerIndex + 1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

/** A CSV line, respecting quoted cells that contain commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') { cell += '"'; i += 1; }
      else if (char === '"') inQuotes = false;
      else cell += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      out.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  out.push(cell);
  return out;
}
