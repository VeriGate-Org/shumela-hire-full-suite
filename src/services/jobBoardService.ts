import { JobBoardPosting, JobBoardType, AvailableBoard, BatchPostResult } from '@/types/jobBoard';
import { apiFetch } from '@/lib/api-fetch';

/**
 * The list endpoints below are typed as arrays, and their callers treat them as arrays —
 * JobBoardManager calls .filter() on the result the moment it lands. A 200 carrying anything
 * else (a paged `{ content: [] }`, a `{}` from an error handler, a bare null) therefore threw
 * a TypeError straight through to the error boundary and took the whole /job-postings route
 * down with it: every request "succeeded" while the page rendered "Something went wrong".
 *
 * A declared return type is a promise to the caller, not a guarantee about the wire. This
 * makes the promise true.
 */
async function readArray<T>(response: Response): Promise<T[]> {
  if (!response.ok) return [];
  try {
    const body = await response.json();
    if (Array.isArray(body)) return body as T[];
    // Spring pages this shape; accept it rather than discarding real data.
    if (body && Array.isArray(body.content)) return body.content as T[];
    return [];
  } catch {
    // A 200 with an empty or non-JSON body.
    return [];
  }
}

export const jobBoardService = {
  async postToBoard(jobPostingId: string, boardType: JobBoardType, boardConfig?: string): Promise<JobBoardPosting> {
    const response = await apiFetch('/api/job-boards/postings', {
      method: 'POST',
      body: JSON.stringify({ jobPostingId, boardType, boardConfig }),
    });
    if (!response.ok) throw new Error('Failed to post to board');
    return response.json();
  },

  async syncPosting(id: number): Promise<JobBoardPosting> {
    const response = await apiFetch(`/api/job-boards/postings/${id}/sync`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to sync posting');
    return response.json();
  },

  async removePosting(id: number): Promise<JobBoardPosting> {
    const response = await apiFetch(`/api/job-boards/postings/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to remove posting');
    return response.json();
  },

  async getPostingsByJob(jobId: string): Promise<JobBoardPosting[]> {
    return readArray<JobBoardPosting>(await apiFetch(`/api/job-boards/postings/job/${jobId}`));
  },

  async getAvailableBoards(): Promise<AvailableBoard[]> {
    return readArray<AvailableBoard>(await apiFetch('/api/job-boards/available-boards'));
  },

  async postToMultipleBoards(
    jobPostingId: string,
    boards: { boardType: JobBoardType; boardConfig?: string }[]
  ): Promise<BatchPostResult[]> {
    const response = await apiFetch('/api/job-boards/postings/batch', {
      method: 'POST',
      body: JSON.stringify({ jobPostingId, boards }),
    });
    if (!response.ok) throw new Error('Batch posting failed');
    return readArray<BatchPostResult>(response);
  },
};
