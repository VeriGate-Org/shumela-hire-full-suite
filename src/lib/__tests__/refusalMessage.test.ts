import { refusalMessage } from '../api-fetch';

/**
 * The pipeline refuses transitions that would skip a mandatory check, and says why. Everything
 * between that sentence and the user is this function: the board used to call `response.text()`,
 * get the empty body the API sent at the time, and show "HTTP 400". Both server shapes are covered
 * here because both are live — controllers answer with ErrorResponse `{ message }`, the global
 * handler with `{ error, message }`.
 */
describe('refusalMessage', () => {
  const respond = (body: string, status = 400) =>
    ({ status, text: async () => body }) as unknown as Response;

  it('reads the message an ErrorResponse carries', async () => {
    const body = JSON.stringify({
      message: 'Cannot progress past Background Check stage. The following required verification checks are not completed with CLEAR result: CRIMINAL_RECORD',
      timestamp: 1756000000000,
    });
    expect(await refusalMessage(respond(body))).toContain('CRIMINAL_RECORD');
  });

  it('reads the global handler shape too', async () => {
    const body = JSON.stringify({
      error: 'Not permitted in the current state',
      message: 'Cannot move application from HIRED to FIRST_INTERVIEW',
      timestamp: '2026-08-24T10:00:00',
    });
    expect(await refusalMessage(respond(body))).toBe('Cannot move application from HIRED to FIRST_INTERVIEW');
  });

  it('prefers message over the generic error label', async () => {
    const body = JSON.stringify({ error: 'Bad request', message: 'Application is already at the final stage' });
    expect(await refusalMessage(respond(body))).toBe('Application is already at the final stage');
  });

  it('falls back to a non-JSON body rather than swallowing it', async () => {
    expect(await refusalMessage(respond('upstream timeout', 504))).toBe('upstream timeout');
  });

  it('falls back to the status when there is genuinely nothing to show', async () => {
    expect(await refusalMessage(respond('', 400))).toBe('HTTP 400');
  });

  it('does not throw when the body cannot be read', async () => {
    const broken = {
      status: 500,
      text: async () => {
        throw new Error('stream already consumed');
      },
    } as unknown as Response;
    expect(await refusalMessage(broken)).toBe('HTTP 500');
  });
});
