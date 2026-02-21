import { tryApi } from '@/services/aiService';
import { EmailDraftRequest, EmailDraftResult } from '@/types/ai';

export const aiEmailService = {
  async draft(request: EmailDraftRequest): Promise<EmailDraftResult> {
    const data = await tryApi<EmailDraftResult>('/api/ai/email/draft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
