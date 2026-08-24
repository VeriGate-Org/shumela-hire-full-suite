/**
 * Covers the create-offer path, which had no coverage because it had no code: the endpoint
 * POST /api/offers/applications/{id} existed and worked, but nothing in the frontend called it.
 * Every offer in the system came from the DynamoDB seed script, so a full-looking Offers list
 * proved nothing about whether an offer could be created.
 *
 * The assertions worth keeping are the ones a passing build would otherwise miss: the role gate,
 * the request payload, and the two validations that stand in for server-side crashes.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferManagement from '@/components/OfferManagement';

const mockApiFetch = jest.fn();
const mockToast = jest.fn();
let mockRole = 'ADMIN';

jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: mockRole } }),
}));

jest.mock('@/services/eSignatureService', () => ({
  eSignatureService: {
    getStatus: jest.fn().mockRejectedValue(new Error('not used')),
    sendForSignature: jest.fn(),
    downloadSignedDocument: jest.fn(),
  },
}));

const APPLICATION = {
  id: 'a7f3c2e1-0000-4000-8000-000000000001',
  jobTitle: 'Senior Developer',
  department: 'Technology',
  status: 'OFFER_PENDING',
  applicant: { firstName: 'Thandi', lastName: 'Molefe', email: 'thandi@example.com' },
};

function ok(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function failure(status: number, body: unknown) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

/** Empty offer list, one eligible application, and a create endpoint that accepts. */
function routeHappyPath(createResponse = ok({ id: 'o1', status: 'DRAFT' })) {
  mockApiFetch.mockImplementation((path: string, init?: RequestInit) => {
    if (path.startsWith('/api/offers/search')) return ok({ content: [], totalPages: 0 });
    if (path.startsWith('/api/offers/dashboard')) return ok({});
    if (path.startsWith('/api/applications/manage/search')) return ok({ content: [APPLICATION] });
    if (path.startsWith('/api/applications/')) return ok(APPLICATION);
    if (path.startsWith('/api/offers/applications/') && init?.method === 'POST') {
      return createResponse;
    }
    return ok({});
  });
}

async function openCreateModal() {
  await userEvent.click(await screen.findByRole('button', { name: /new offer/i }));
  return screen.findByRole('heading', { name: /^new offer$/i });
}

/** Fills the three required fields so a submit is expected to succeed. */
async function fillRequiredFields() {
  await userEvent.selectOptions(screen.getByLabelText(/candidate/i), APPLICATION.id);
  await userEvent.type(screen.getByLabelText(/base salary/i), '750000');
  await userEvent.type(screen.getByLabelText(/start date/i), '2026-10-01');
}

function createCall() {
  return mockApiFetch.mock.calls.find(
    ([path, init]) => String(path).startsWith('/api/offers/applications/') && init?.method === 'POST',
  );
}

beforeEach(() => {
  mockApiFetch.mockReset();
  mockToast.mockReset();
  mockRole = 'ADMIN';
  window.history.replaceState({}, '', '/offers');
});

describe('Offer creation — role gate', () => {
  it.each(['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'])('offers a create entry point to %s', async (role) => {
    mockRole = role;
    routeHappyPath();
    render(<OfferManagement />);

    expect(await screen.findByRole('button', { name: /new offer/i })).toBeInTheDocument();
  });

  it.each(['RECRUITER', 'INTERVIEWER', 'APPLICANT'])('denies offer management to %s', async (role) => {
    mockRole = role;
    routeHappyPath();
    render(<OfferManagement />);

    expect(await screen.findByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new offer/i })).not.toBeInTheDocument();
  });

  it('does not load offers for a role that cannot manage them', async () => {
    mockRole = 'RECRUITER';
    routeHappyPath();
    render(<OfferManagement />);

    await screen.findByText(/access denied/i);
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});

describe('Offer creation — the request', () => {
  it('posts to the application-scoped create endpoint with the entered terms', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();

    await userEvent.selectOptions(screen.getByLabelText(/offer type/i), 'CONTRACT_FIXED_TERM');
    await userEvent.type(screen.getByLabelText(/signing bonus/i), '50000');

    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    await waitFor(() => expect(createCall()).toBeDefined());
    const [path, init] = createCall()!;

    expect(path).toBe(`/api/offers/applications/${APPLICATION.id}`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({
      offerType: 'CONTRACT_FIXED_TERM',
      baseSalary: 750000,
      signingBonus: 50000,
      currency: 'ZAR',
      startDate: '2026-10-01',
    });
  });

  it('sends baseSalary as a number, not the raw input string', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    await waitFor(() => expect(createCall()).toBeDefined());
    expect(typeof JSON.parse(createCall()![1].body).baseSalary).toBe('number');
  });

  it('omits job title and department, which createOffer overwrites from the application', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    await waitFor(() => expect(createCall()).toBeDefined());
    const payload = JSON.parse(createCall()![1].body);
    expect(payload).not.toHaveProperty('jobTitle');
    expect(payload).not.toHaveProperty('department');
  });

  it('does not send an empty expiry, so the service default applies', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    await waitFor(() => expect(createCall()).toBeDefined());
    expect(JSON.parse(createCall()![1].body)).not.toHaveProperty('offerExpiryDate');
  });

  it('closes the modal and confirms on success', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: /^new offer$/i })).not.toBeInTheDocument(),
    );
    expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/draft/i), 'success');
  });
});

describe('Offer creation — validation', () => {
  it('requires a base salary, because getTotalCompensation dereferences it server-side', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    await userEvent.selectOptions(screen.getByLabelText(/candidate/i), APPLICATION.id);
    await userEvent.type(screen.getByLabelText(/start date/i), '2026-10-01');
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/base salary greater than zero/i)).toBeInTheDocument();
    expect(createCall()).toBeUndefined();
  });

  it('rejects a zero base salary rather than posting it', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    await userEvent.selectOptions(screen.getByLabelText(/candidate/i), APPLICATION.id);
    await userEvent.type(screen.getByLabelText(/base salary/i), '0');
    await userEvent.type(screen.getByLabelText(/start date/i), '2026-10-01');
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/base salary greater than zero/i)).toBeInTheDocument();
    expect(createCall()).toBeUndefined();
  });

  it('requires a candidate', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    await userEvent.type(screen.getByLabelText(/base salary/i), '750000');
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/select the candidate/i)).toBeInTheDocument();
    expect(createCall()).toBeUndefined();
  });

  it('requires a start date', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    await userEvent.selectOptions(screen.getByLabelText(/candidate/i), APPLICATION.id);
    await userEvent.type(screen.getByLabelText(/base salary/i), '750000');
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/select a start date/i)).toBeInTheDocument();
    expect(createCall()).toBeUndefined();
  });
});

describe('Offer creation — candidate picker', () => {
  it('asks the backend only for offer-eligible applications', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    await waitFor(() =>
      expect(
        mockApiFetch.mock.calls.some(([p]) =>
          String(p).startsWith('/api/applications/manage/search'),
        ),
      ).toBe(true),
    );

    const [path] = mockApiFetch.mock.calls.find(([p]) =>
      String(p).startsWith('/api/applications/manage/search'),
    )!;
    const statuses = new URLSearchParams(String(path).split('?')[1]).getAll('statuses');

    expect(statuses.sort()).toEqual(['OFFERED', 'OFFER_PENDING', 'REFERENCE_CHECK']);
  });

  it('names the candidate rather than showing a bare id', async () => {
    routeHappyPath();
    render(<OfferManagement />);
    await openCreateModal();

    const select = screen.getByLabelText(/candidate/i);
    await waitFor(() =>
      expect(within(select).getByRole('option', { name: /Thandi Molefe/ })).toBeInTheDocument(),
    );
  });

  it('explains what to do when nothing is at an offer-ready stage', async () => {
    mockApiFetch.mockImplementation((path: string) => {
      if (path.startsWith('/api/offers/search')) return ok({ content: [], totalPages: 0 });
      if (path.startsWith('/api/applications/manage/search')) return ok({ content: [] });
      return ok({});
    });
    render(<OfferManagement />);
    await openCreateModal();

    expect(await screen.findByText(/no candidates are at an offer-ready stage/i)).toBeInTheDocument();
  });
});

describe('Offer creation — deep link from the pipeline', () => {
  it('opens the modal preselected on the linked candidate', async () => {
    routeHappyPath();
    window.history.replaceState({}, '', `/offers?create=true&applicationId=${APPLICATION.id}`);
    render(<OfferManagement />);

    await screen.findByRole('heading', { name: /^new offer$/i });
    await waitFor(() =>
      expect(screen.getByLabelText(/candidate/i)).toHaveValue(APPLICATION.id),
    );
  });

  it('clears the params so a refresh does not reopen the modal', async () => {
    routeHappyPath();
    window.history.replaceState({}, '', `/offers?create=true&applicationId=${APPLICATION.id}`);
    render(<OfferManagement />);

    await screen.findByRole('heading', { name: /^new offer$/i });
    await waitFor(() => expect(window.location.search).not.toContain('create=true'));
    expect(window.location.search).not.toContain('applicationId');
  });

  it('still names an application the eligible list does not contain', async () => {
    const stale = { ...APPLICATION, status: 'INTERVIEW' };
    mockApiFetch.mockImplementation((path: string) => {
      if (path.startsWith('/api/offers/search')) return ok({ content: [], totalPages: 0 });
      if (path.startsWith('/api/applications/manage/search')) return ok({ content: [] });
      if (path.startsWith(`/api/applications/${APPLICATION.id}`)) return ok(stale);
      return ok({});
    });
    window.history.replaceState({}, '', `/offers?create=true&applicationId=${APPLICATION.id}`);
    render(<OfferManagement />);

    await screen.findByRole('heading', { name: /^new offer$/i });
    const select = screen.getByLabelText(/candidate/i);
    await waitFor(() =>
      expect(within(select).getByRole('option', { name: /Thandi Molefe/ })).toBeInTheDocument(),
    );
  });

  it('does nothing when the role cannot manage offers', async () => {
    mockRole = 'RECRUITER';
    routeHappyPath();
    window.history.replaceState({}, '', `/offers?create=true&applicationId=${APPLICATION.id}`);
    render(<OfferManagement />);

    await screen.findByText(/access denied/i);
    expect(screen.queryByRole('heading', { name: /^new offer$/i })).not.toBeInTheDocument();
  });
});

describe('Offer creation — backend refusals', () => {
  it('shows the service reason for an ineligible application state', async () => {
    const reason = 'Cannot create offer for application in current state: INTERVIEW';
    routeHappyPath(failure(400, { error: reason }));
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(reason)).toBeInTheDocument();
  });

  it('keeps the modal open on failure so the entered terms are not lost', async () => {
    routeHappyPath(failure(400, { error: 'Application not found' }));
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/application not found/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^new offer$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/base salary/i)).toHaveValue(750000);
  });

  it('translates a 403 into a permissions message rather than a raw status', async () => {
    routeHappyPath(failure(403, {}));
    render(<OfferManagement />);
    await openCreateModal();
    await fillRequiredFields();
    await userEvent.click(screen.getByRole('button', { name: /create draft offer/i }));

    expect(await screen.findByText(/do not have permission/i)).toBeInTheDocument();
  });
});
