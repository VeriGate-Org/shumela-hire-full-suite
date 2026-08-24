import { jobBoardService } from '../jobBoardService';

/**
 * These list methods are declared to return arrays and their callers believe it —
 * `JobBoardManager` calls `.filter()` on the result as soon as it lands. When the wire carried
 * anything else, that TypeError went through the error boundary and took the whole
 * /job-postings route down: every request returned 200 while the page rendered
 * "Something went wrong".
 *
 * So each case below is a body the API can actually produce, and the promise the signature
 * makes has to hold for all of them.
 */

const mockApiFetch = jest.fn();
jest.mock('@/lib/api-fetch', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

/** A Response-alike carrying whatever body the test wants. */
function respond(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => {
      if (body === undefined) throw new SyntaxError('Unexpected end of JSON input');
      return body;
    },
  } as unknown as Response;
}

beforeEach(() => mockApiFetch.mockReset());

describe.each([
  ['getPostingsByJob', () => jobBoardService.getPostingsByJob('job-1')],
  ['getAvailableBoards', () => jobBoardService.getAvailableBoards()],
])('%s always resolves to an array', (_name, call) => {
  it('passes a real array straight through', async () => {
    const rows = [{ id: 1, boardType: 'LINKEDIN', status: 'POSTED' }];
    mockApiFetch.mockResolvedValue(respond(rows));

    await expect(call()).resolves.toEqual(rows);
  });

  it('unwraps a Spring page rather than discarding the rows', async () => {
    const rows = [{ id: 2, boardType: 'INDEED', status: 'PENDING' }];
    mockApiFetch.mockResolvedValue(respond({ content: rows, totalElements: 1 }));

    await expect(call()).resolves.toEqual(rows);
  });

  it.each([
    ['an object', {}],
    ['null', null],
    ['a bare string', 'unavailable'],
    ['an error envelope', { error: 'Something went wrong' }],
  ])('survives %s in a 200 body', async (_label, body) => {
    mockApiFetch.mockResolvedValue(respond(body));

    const result = await call();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
  });

  it('survives a 200 with no parseable body', async () => {
    mockApiFetch.mockResolvedValue(respond(undefined));

    await expect(call()).resolves.toEqual([]);
  });

  it('returns an empty array when the request is refused', async () => {
    mockApiFetch.mockResolvedValue(respond({ message: 'Access denied' }, false, 403));

    await expect(call()).resolves.toEqual([]);
  });

  it('gives the caller something .filter() can be called on', async () => {
    // The exact operation JobBoardManager performs on the result.
    mockApiFetch.mockResolvedValue(respond({ notAnArray: true }));

    const result = await call();
    expect(() => (result as Array<{ status?: string }>).filter((p) => p.status === 'POSTED')).not.toThrow();
  });
});
