import { requisitionService } from '@/services/requisitionService';

const mockApiFetch = jest.fn();
jest.mock('@/lib/api-fetch', () => ({ apiFetch: (...a: unknown[]) => mockApiFetch(...a) }));

const respond = (body: unknown) =>
  mockApiFetch.mockResolvedValue({ ok: true, json: async () => body });

/**
 * The rows out of a list response.
 *
 * <p>GET /api/requisitions returns ResponseEntity&lt;Page&lt;Requisition&gt;&gt; — a Spring page,
 * serialised as {@code { content: [...] }}. This service looked only for {@code result.data}, so it
 * fell through to returning the page <em>object</em> while its signature promised an array.
 *
 * <p>TypeScript could not catch it: the function is annotated {@code Promise<RequisitionData[]>} and
 * the value is never checked against that. Nothing failed until a component called
 * {@code .map()} on it — which is what threw the error boundary on
 * /job-templates?view=generate, where the generate step lists requisitions to build an ad from.
 */
describe('a list response, whatever shape it arrives in', () => {
  beforeEach(() => mockApiFetch.mockReset());

  it('reads the rows out of a Spring page', async () => {
    respond({ content: [{ id: '1' }, { id: '2' }], totalElements: 2 });

    const rows = await requisitionService.getAllRequisitions();

    expect(Array.isArray(rows)).toBe(true);
    expect(rows).toHaveLength(2);
  });

  it('still handles a bare array', async () => {
    respond([{ id: '1' }]);

    expect(await requisitionService.getAllRequisitions()).toHaveLength(1);
  });

  it('still handles a data envelope', async () => {
    respond({ data: [{ id: '1' }, { id: '2' }, { id: '3' }] });

    expect(await requisitionService.getAllRequisitions()).toHaveLength(3);
  });

  it('returns an array, never the envelope, so callers can map over it', async () => {
    // The specific failure: returning the page object satisfied the type annotation and threw at
    // the first .map().
    respond({ content: [], totalElements: 0, number: 0, size: 20 });

    const rows = await requisitionService.getAllRequisitions();

    expect(() => rows.map((r) => r)).not.toThrow();
    expect(rows).toEqual([]);
  });

  it('applies to the filtered lists too', async () => {
    respond({ content: [{ id: '1' }] });
    expect(await requisitionService.getRequisitionsByStatus('DRAFT' as never)).toHaveLength(1);

    respond({ content: [{ id: '1' }, { id: '2' }] });
    expect(await requisitionService.getPendingRequisitionsForRole('ADMIN')).toHaveLength(2);
  });
});
