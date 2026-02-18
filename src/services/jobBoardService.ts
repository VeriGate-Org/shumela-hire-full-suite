import { JobBoardPosting, JobBoardType, PostingStatus, AvailableBoard } from '@/types/jobBoard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Mock data store for development
const mockPostings: JobBoardPosting[] = [];
let nextId = 1;

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('jwt_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function tryApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (response.ok) return response.json();
  } catch {
    // API unavailable, fall through to mock
  }
  return null;
}

export const jobBoardService = {
  async postToBoard(jobPostingId: string, boardType: JobBoardType, boardConfig?: string): Promise<JobBoardPosting> {
    const data = await tryApi<JobBoardPosting>('/api/job-boards/postings', {
      method: 'POST',
      body: JSON.stringify({ jobPostingId, boardType, boardConfig }),
    });
    if (data) return data;

    const posting: JobBoardPosting = {
      id: nextId++,
      jobPostingId,
      boardType,
      status: PostingStatus.POSTED,
      externalPostId: boardType + '-' + Math.random().toString(36).substring(2, 10),
      postedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      viewCount: 0,
      clickCount: 0,
      applicationCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockPostings.push(posting);
    return { ...posting };
  },

  async syncPosting(id: number): Promise<JobBoardPosting> {
    const data = await tryApi<JobBoardPosting>(`/api/job-boards/postings/${id}/sync`, { method: 'POST' });
    if (data) return data;

    const posting = mockPostings.find(p => p.id === id);
    if (!posting) throw new Error('Posting not found');
    posting.viewCount += Math.floor(Math.random() * 50);
    posting.clickCount += Math.floor(Math.random() * 10);
    posting.applicationCount += Math.floor(Math.random() * 3);
    posting.updatedAt = new Date().toISOString();
    return { ...posting };
  },

  async removePosting(id: number): Promise<JobBoardPosting> {
    const data = await tryApi<JobBoardPosting>(`/api/job-boards/postings/${id}`, { method: 'DELETE' });
    if (data) return data;

    const posting = mockPostings.find(p => p.id === id);
    if (!posting) throw new Error('Posting not found');
    posting.status = PostingStatus.REMOVED;
    posting.updatedAt = new Date().toISOString();
    return { ...posting };
  },

  async getPostingsByJob(jobId: string): Promise<JobBoardPosting[]> {
    const data = await tryApi<JobBoardPosting[]>(`/api/job-boards/postings/job/${jobId}`);
    return data ?? mockPostings.filter(p => p.jobPostingId === jobId);
  },

  async getAvailableBoards(): Promise<AvailableBoard[]> {
    const data = await tryApi<AvailableBoard[]>('/api/job-boards/available-boards');
    return data ?? [
      { type: 'LINKEDIN', displayName: 'LinkedIn', requiresApiIntegration: true },
      { type: 'INDEED', displayName: 'Indeed', requiresApiIntegration: true },
      { type: 'PNET', displayName: 'PNet', requiresApiIntegration: true },
      { type: 'CAREER_JUNCTION', displayName: 'CareerJunction', requiresApiIntegration: true },
    ];
  },
};
