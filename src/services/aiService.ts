import { AiFeatureStatus } from '@/types/ai';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('jwt_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function tryApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options?.headers },
    });
    if (response.ok) return response.json();
    if (response.status === 403) {
      console.warn('AI feature access denied');
      return null;
    }
  } catch {
    // API unavailable, fall through to mock
  }
  return null;
}

export const aiService = {
  async getStatus(): Promise<AiFeatureStatus> {
    const data = await tryApi<AiFeatureStatus>('/api/ai/status');
    return data ?? { enabled: false, provider: 'mock', available: true };
  },
};
