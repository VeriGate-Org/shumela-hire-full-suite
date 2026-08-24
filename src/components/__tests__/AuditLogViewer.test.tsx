import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuditLogViewer from '../AuditLogViewer';

const apiFetch = jest.fn();
jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
}));

const REQ_ID = '1581aca9-9785-4901-95c7-ea3e32da8516';

const response = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('AuditLogViewer', () => {
  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('asks for the requisition audit trail by entity type and id', async () => {
    apiFetch.mockResolvedValue(response(200, []));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    await waitFor(() =>
      expect(apiFetch).toHaveBeenCalledWith(`/api/audit/entity/REQUISITION/${REQ_ID}`)
    );
  });

  // A 403 and a 500 need different people to fix them. Reporting both as "Failed to fetch audit
  // logs" is why this failure sat undiagnosed: the message named a symptom common to every cause.
  it('says so when the role is not permitted to read the trail', async () => {
    apiFetch.mockResolvedValue(response(403, {}));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    expect(await screen.findByText(/permission/i)).toBeInTheDocument();
    expect(screen.getByText(/403/)).toBeInTheDocument();
  });

  it('carries the status code on any other failure', async () => {
    apiFetch.mockResolvedValue(response(500, {}));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    expect(await screen.findByText(/500/)).toBeInTheDocument();
  });

  // An empty trail is a legitimate answer, and must not read as a broken screen.
  it('reports an empty trail as empty, not as an error', async () => {
    apiFetch.mockResolvedValue(response(200, []));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    expect(await screen.findByText(/No audit logs found/i)).toBeInTheDocument();
  });

  it('renders the entries it is given', async () => {
    apiFetch.mockResolvedValue(response(200, [
      {
        id: 'e6c77290',
        timestamp: '2026-08-24T08:21:10',
        userId: 'efc4d38d',
        userRole: 'HR_MANAGER',
        action: 'REQUISITION_SUBMITTED',
        entityType: 'REQUISITION',
        entityId: REQ_ID,
        details: 'Band ceiling 1100000 exceeds the 1000000 executive threshold',
      },
    ]));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    // Not "REQUISITION SUBMITTED": the action column must not read as raw enum text.
    const action = await screen.findByText('Requisition Submitted');
    expect(action).toBeInTheDocument();
    expect(screen.getByText(/exceeds the 1000000 executive threshold/)).toBeInTheDocument();
  });

  it('colours the badge by what happened, despite the actions being upper case', async () => {
    apiFetch.mockResolvedValue(response(200, [
      { id: '1', timestamp: '2026-08-24T08:00:00', userId: 'u', userRole: 'HR_MANAGER',
        action: 'REQUISITION_APPROVED', entityType: 'REQUISITION', entityId: REQ_ID, details: 'ok' },
      { id: '2', timestamp: '2026-08-24T09:00:00', userId: 'u', userRole: 'HR_MANAGER',
        action: 'REQUISITION_REJECTED', entityType: 'REQUISITION', entityId: REQ_ID, details: 'no' },
    ]));

    render(<AuditLogViewer requisitionId={REQ_ID} />);

    expect((await screen.findByText('Requisition Approved')).className).toContain('green');
    expect(screen.getByText('Requisition Rejected').className).toContain('red');
  });
});
