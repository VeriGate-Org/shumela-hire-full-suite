import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsPage from '../page';

/**
 * The Result tab is a consequence, not a destination.
 *
 * <p>`reportResults` is component state. It starts empty on every page load and is never fetched
 * from anywhere, so a permanent fourth tab said "No results yet" to every user on arrival, every
 * time — and a link to `?tab=results` could not land anywhere else. It now appears once a run has
 * produced something and carries the row count.
 */

// Every member is a no-op. Naming them individually is how the first attempt failed: IdentityBand
// calls clearSectionLabel on unmount, which a hand-listed mock had not declared.
const pageHeading = new Proxy({} as Record<string, jest.Mock>, {
  get: (target, key: string) => (target[key] ??= jest.fn()),
});
jest.mock('@/contexts/PageHeadingContext', () => ({
  usePageHeading: () => pageHeading,
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// The AI panels reach for feature flags and their own endpoints; neither is what is under test.
jest.mock('@/components/ai/AiAssistPanel', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
jest.mock('@/components/ai/AiReportNarrative', () => ({
  __esModule: true,
  default: () => null,
}));

const apiFetch = jest.fn();
jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  refusalMessage: async () => 'refused',
}));

const CSV = [
  'CUSTOM REPORT: APPLICATIONS',
  'Period: 2026-06-01 to 2026-08-31',
  'Generated: 2026-08-29T09:14:22',
  '',
  'applicant_name,job_title,status,submitted_date',
  'David Ndlovu,Financial Accountant,SUBMITTED,2026-07-02',
  'Nomsa Dlamini,Senior Investment Analyst,SCREENING,2026-07-09',
].join('\n');

/** Empty saved reports and schedules, so nothing but a run can put a Result tab on screen. */
function stubLoad() {
  apiFetch.mockImplementation(async (url: string) => {
    if (url === '/api/reports/custom/csv') {
      return { ok: true, status: 200, text: async () => CSV };
    }
    return { ok: true, status: 200, json: async () => [] };
  });
}

const tab = (name: RegExp) => screen.queryByRole('button', { name });

beforeEach(() => {
  apiFetch.mockReset();
  stubLoad();
  window.history.replaceState({}, '', '/reports');
});

describe('the Result tab appears only once there is a result', () => {
  it('is absent on arrival', async () => {
    render(<ReportsPage />);

    await waitFor(() => expect(tab(/^Build/)).toBeInTheDocument());
    expect(tab(/^Result/)).not.toBeInTheDocument();
  });

  it('appears after a run, carrying the row count', async () => {
    const user = userEvent.setup();
    render(<ReportsPage />);

    await waitFor(() => expect(tab(/^Build/)).toBeInTheDocument());
    await runTheReport(user);

    await waitFor(() => expect(tab(/^Result/)).toBeInTheDocument());
    expect(tab(/^Result/)).toHaveTextContent('2');
  });

  it('shows a zero-row result rather than hiding it', async () => {
    // A run that matched nothing is an answer. Every other tab hides a zero count, because
    // there "nothing yet" and "none" are the same thing; here they are not.
    apiFetch.mockImplementation(async (url: string) => {
      if (url === '/api/reports/custom/csv') {
        return {
          ok: true,
          status: 200,
          text: async () => CSV.split('\n').slice(0, 5).join('\n'),
        };
      }
      return { ok: true, status: 200, json: async () => [] };
    });

    const user = userEvent.setup();
    render(<ReportsPage />);
    await waitFor(() => expect(tab(/^Build/)).toBeInTheDocument());
    await runTheReport(user);

    await waitFor(() => expect(tab(/^Result/)).toBeInTheDocument());
    expect(tab(/^Result/)).toHaveTextContent('0');
  });

  it('ignores ?tab=results, because that tab cannot exist on a fresh load', async () => {
    window.history.replaceState({}, '', '/reports?tab=results');
    render(<ReportsPage />);

    await waitFor(() => expect(tab(/^Build/)).toBeInTheDocument());
    expect(tab(/^Result/)).not.toBeInTheDocument();
    // Landed on the builder — the only tab from which a result can be obtained.
    expect(tab(/^Build/)).toHaveAttribute('class', expect.stringContaining('bg-card'));
  });

  it('still honours a tab that does exist', async () => {
    window.history.replaceState({}, '', '/reports?tab=scheduler');
    render(<ReportsPage />);

    await waitFor(() =>
      expect(tab(/^Scheduled/)).toHaveAttribute('class', expect.stringContaining('bg-card')),
    );
  });
});

/**
 * Subject, then columns, then filters. Run lives in the footer of the last step only, and the
 * builder opens with columns already chosen, so no choosing is needed on the way through.
 */
async function runTheReport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^next$/i }));
  await user.click(screen.getByRole('button', { name: /^next$/i }));
  await user.click(screen.getByRole('button', { name: /^run report$/i }));
}
