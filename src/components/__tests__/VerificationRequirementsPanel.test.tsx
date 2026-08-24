/**
 * Covers configuring the pipeline's one real requirement gate.
 *
 * The rule shipped long before any way to switch it on: `enforceCheckCompletion` lives on the
 * requisition, was settable only through the create/update path, and that path refuses an approved
 * or published posting. It was false on all nineteen IDC postings — a control that existed, worked,
 * and applied to nothing.
 *
 * The assertions that matter are the request payload, the role gate (a recruiter blocked by the
 * rule must not be able to switch it off), and the refusal that reaches the user.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationRequirementsPanel from '@/components/VerificationRequirementsPanel';

const mockApiFetch = jest.fn();
const mockToast = jest.fn();

jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  refusalMessage: jest.requireActual('@/lib/api-fetch').refusalMessage,
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const CATALOGUE = [
  { code: 'CRIMINAL_CHECK', name: 'Criminal Record Check', turnaround: '5-7 days', price: 120, currency: 'ZAR' },
  { code: 'CREDIT_CHECK', name: 'Credit Check', turnaround: '24 hours', price: 65, currency: 'ZAR' },
];

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) });

function catalogueLoads() {
  mockApiFetch.mockImplementation((path: string) => {
    if (path.includes('check-types')) return Promise.resolve(ok(CATALOGUE));
    return Promise.resolve(ok({}));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  catalogueLoads();
});

async function renderPanel(props: Partial<React.ComponentProps<typeof VerificationRequirementsPanel>> = {}) {
  render(
    <VerificationRequirementsPanel
      jobPostingId="posting-1"
      canEdit
      updatedBy="hr-1"
      {...props}
    />
  );
  await screen.findByLabelText('Criminal Record Check');
}

it('sends the selected checks and the enforcement flag', async () => {
  const user = userEvent.setup();
  await renderPanel();

  await user.click(screen.getByLabelText('Criminal Record Check'));
  await user.click(screen.getByLabelText('Block progression until every required check is clear'));
  await user.click(screen.getByRole('button', { name: /save requirements/i }));

  await waitFor(() => {
    const call = mockApiFetch.mock.calls.find(([path]) => String(path).includes('verification-requirements'));
    expect(call).toBeDefined();
    expect(String(call![0])).toContain('/api/job-postings/posting-1/verification-requirements?updatedBy=hr-1');
    expect(call![1].method).toBe('PUT');
    expect(JSON.parse(call![1].body)).toEqual({
      enforceCheckCompletion: true,
      requiredCheckTypes: ['CRIMINAL_CHECK'],
    });
  });
});

it('will not let you enforce an empty list', async () => {
  const user = userEvent.setup();
  await renderPanel();

  await user.click(screen.getByLabelText('Block progression until every required check is clear'));

  expect(screen.getByText(/select at least one check/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /save requirements/i })).toBeDisabled();
});

it('shows what the requisition already requires, and marks it enforced', async () => {
  await renderPanel({
    requiredCheckTypes: '["CREDIT_CHECK"]',
    enforceCheckCompletion: true,
  });

  expect(screen.getByLabelText('Credit Check')).toBeChecked();
  expect(screen.getByLabelText('Criminal Record Check')).not.toBeChecked();
  expect(screen.getByText('Enforced')).toBeInTheDocument();
});

it('a recruiter sees the rule but cannot change it', async () => {
  await renderPanel({ canEdit: false, requiredCheckTypes: '["CREDIT_CHECK"]' });

  expect(screen.getByLabelText('Credit Check')).toBeDisabled();
  expect(screen.queryByRole('button', { name: /save requirements/i })).not.toBeInTheDocument();
  expect(screen.getByText(/only an administrator or hr manager/i)).toBeInTheDocument();
});

it("surfaces the server's reason for refusing, not a status code", async () => {
  const user = userEvent.setup();
  mockApiFetch.mockImplementation((path: string) => {
    if (path.includes('check-types')) return Promise.resolve(ok(CATALOGUE));
    return Promise.resolve({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Unknown verification check type(s): CRIMINAL_CHEK' }),
    });
  });

  await renderPanel();
  await user.click(screen.getByLabelText('Criminal Record Check'));
  await user.click(screen.getByRole('button', { name: /save requirements/i }));

  await waitFor(() => {
    expect(mockToast).toHaveBeenCalledWith(
      expect.stringContaining('Unknown verification check type(s)'),
      'error'
    );
  });
});

it('still renders the rule when the provider catalogue is unavailable', async () => {
  // An outage on the provider must not make a live requirement invisible.
  mockApiFetch.mockImplementation((path: string) => {
    if (path.includes('check-types')) return Promise.resolve({ ok: false, status: 503, text: async () => '' });
    return Promise.resolve(ok({}));
  });

  render(
    <VerificationRequirementsPanel
      jobPostingId="posting-1"
      canEdit
      updatedBy="hr-1"
      requiredCheckTypes='["CREDIT_CHECK"]'
      enforceCheckCompletion
    />
  );

  expect(await screen.findByLabelText('CREDIT CHECK')).toBeChecked();
  expect(screen.getByText('Enforced')).toBeInTheDocument();
});
