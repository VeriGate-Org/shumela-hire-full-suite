/**
 * Covers the offers tab rail: which tab opens, whether it survives a refresh, and the two headline
 * numbers above it.
 *
 * Three faults, all on the same screen:
 *
 *  1. `activeTab` was `useState('draft')` with no link to the URL, so the screen always opened on
 *     Draft. A refresh silently threw you back to the first tab and nothing could link to a state —
 *     on a component that already deep-links `?create=true`.
 *  2. "Acceptance Rate" showed `recentAcceptances / offers.length`: a *recent* count over *every*
 *     offer including drafts. With 3 accepted and 1 withdrawn it read 10% where the rate is 75%,
 *     directly above a tab badge reading "Accepted 3".
 *  3. "Active Offers" showed `offers.length` — the rows on the current page — so with a page size
 *     of 10 it read 10 on any tenant with more offers than that.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferManagement from '@/components/OfferManagement';

const mockApiFetch = jest.fn();
const mockToast = jest.fn();

jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'ADMIN' } }),
}));

jest.mock('@/services/eSignatureService', () => ({
  eSignatureService: {
    getStatus: jest.fn().mockRejectedValue(new Error('not used')),
    getProvider: jest.fn().mockResolvedValue({ provider: 'local', simulated: true }),
    sendForSignature: jest.fn(),
    simulateSign: jest.fn(),
    downloadSignedDocument: jest.fn(),
  },
}));

function ok(body: unknown) {
  return Promise.resolve({
    ok: true, status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

const offer = (id: string, status: string, fullName: string) => ({
  id, status, jobTitle: 'Project Manager', department: 'Post-Investment Monitoring',
  baseSalary: 950000, currency: 'ZAR', version: 1,
  offerNumber: `OFF-${id}`,
  application: { id: Number(id), applicant: { fullName } },
});

/** The IDC tenant's real spread on 24 Aug: 2 draft, 2 pending, 2 sent, 3 accepted, 1 withdrawn. */
const OFFERS = [
  offer('1', 'DRAFT', 'Nomsa Mahlangu'),
  offer('2', 'DRAFT', 'Sipho Ndlovu'),
  offer('3', 'PENDING_APPROVAL', 'Sarah van Wyk'),
  offer('4', 'PENDING_APPROVAL', 'Bongani Zwane'),
  offer('5', 'SENT', 'Michael Botha'),
  offer('6', 'SENT', 'Thandi Nkosi'),
  offer('7', 'ACCEPTED', 'Lerato Dlamini'),
  offer('8', 'ACCEPTED', 'Ayanda Nkosi'),
  offer('9', 'ACCEPTED', 'Bongani Zwane'),
  offer('10', 'WITHDRAWN', 'Pieter du Toit'),
];

function routeOffers(offers = OFFERS, totalElements = offers.length) {
  mockApiFetch.mockImplementation((path: string) => {
    if (path.startsWith('/api/offers/search')) {
      return ok({ content: offers, totalPages: Math.ceil(totalElements / 10), totalElements });
    }
    // The server dashboard used to win and drive the rate. Deliberately non-zero and *wrong*
    // so a regression to the old behaviour is visible rather than silent.
    if (path.startsWith('/api/offers/dashboard')) {
      return ok({ pendingApproval: 2, nearExpiry: 2, activeNegotiations: 0, recentAcceptances: 1 });
    }
    // Chip counts now describe the whole set rather than the loaded page.
    if (path.startsWith('/api/offers/summary')) {
      const countsByStatus: Record<string, number> = {};
      offers.forEach((o) => { countsByStatus[o.status] = (countsByStatus[o.status] ?? 0) + 1; });
      return ok({
        countsByStatus,
        total: totalElements,
        withCandidate: offers.filter((o) => ['SENT', 'AWAITING_SIGNATURE', 'SIGNED', 'UNDER_NEGOTIATION'].includes(o.status)).length,
        expiringSoon: 0,
        expiringImminently: 0,
        lapsed: countsByStatus.EXPIRED ?? 0,
        soonestExpiryDays: null,
        soonestExpiryId: null,
        withoutExpiry: 0,
        committedAnnualValue: 0,
        committedValueExcluded: 0,
      });
    }
    return ok({});
  });
}

function setUrl(search: string) {
  window.history.replaceState({}, '', `/offers${search}`);
}

const tab = (name: RegExp) => screen.getByRole('button', { name });

beforeEach(() => {
  mockApiFetch.mockReset();
  mockToast.mockReset();
  setUrl('');
});

describe('which tab opens', () => {
  it('opens on Expiring when the URL says nothing', async () => {
    routeOffers();
    render(<OfferManagement />);
    await waitFor(() => expect(tab(/^Expiring/)).toHaveAttribute('aria-pressed', 'true'));
  });

  it('opens on the tab named in the URL — the refresh case', async () => {
    setUrl('?tab=accepted');
    routeOffers();
    render(<OfferManagement />);

    await waitFor(() => expect(tab(/^Accepted/)).toHaveAttribute('aria-pressed', 'true'));
    expect(await screen.findByText('Lerato Dlamini')).toBeInTheDocument();
    // and not the draft rows
    expect(screen.queryByText('Nomsa Mahlangu')).not.toBeInTheDocument();
  });

  it('ignores an unrecognised tab rather than blanking the list', async () => {
    setUrl('?tab=nonsense');
    routeOffers();
    render(<OfferManagement />);

    await waitFor(() => expect(tab(/^Expiring/)).toHaveAttribute('aria-pressed', 'true'));
    // Falls back to the default rather than blanking the screen: the chips are all still there
    // and the offers are still reachable.
    expect(tab(/^Draft/)).toBeInTheDocument();
  });
});

describe('the URL follows the tab', () => {
  it('records the tab so a refresh returns to it', async () => {
    routeOffers();
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    await userEvent.click(tab(/^Accepted/));

    await waitFor(() => expect(window.location.search).toBe('?tab=accepted'));
  });

  it('drops the parameter on the default tab so the canonical URL stays /offers', async () => {
    setUrl('?tab=accepted');
    routeOffers();
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Expiring/ });

    await userEvent.click(tab(/^Expiring/));

    await waitFor(() => expect(window.location.search).toBe(''));
    expect(window.location.pathname).toBe('/offers');
  });

  it('preserves other query parameters', async () => {
    setUrl('?ref=email');
    routeOffers();
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    await userEvent.click(tab(/^Accepted/));

    await waitFor(() => expect(window.location.search).toContain('ref=email'));
    expect(window.location.search).toContain('tab=accepted');
  });
});

describe('the counts above the rail', () => {
  it('each chip count matches the offers in it', async () => {
    routeOffers();
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    // Draft covers DRAFT, PENDING_APPROVAL and APPROVED — everything not yet put to anyone.
    expect(within(tab(/^Draft/)).getByText('4')).toBeInTheDocument();
    expect(within(tab(/^Out with candidate/)).getByText('2')).toBeInTheDocument();
    expect(within(tab(/^Accepted/)).getByText('3')).toBeInTheDocument();
    expect(within(tab(/^Closed/)).getByText('1')).toBeInTheDocument();
  });

  it('acceptance rate is accepted over decided, not over everything', async () => {
    routeOffers();
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    // 3 accepted of 4 decided (3 accepted + 1 withdrawn) = 75%.
    // The old computation gave recentAcceptances(1) / offers.length(10) = 10%.
    expect(await screen.findByText('75%')).toBeInTheDocument();
    expect(screen.queryByText('10%')).not.toBeInTheDocument();
  });

  it('shows a dash rather than 0% when nothing has been decided yet', async () => {
    routeOffers([offer('1', 'DRAFT', 'Nomsa Mahlangu'), offer('2', 'SENT', 'Michael Botha')], 2);
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    expect(await screen.findByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('the band reports the server total, not the number of rows on this page', async () => {
    routeOffers(OFFERS, 37); // one page of 10, 37 in total
    render(<OfferManagement />);
    await screen.findByRole('button', { name: /^Draft/ });

    // The band reports the server's total, not the ten rows this page happens to hold.
    expect(await screen.findByText(/37 offers/)).toBeInTheDocument();
  });
});
