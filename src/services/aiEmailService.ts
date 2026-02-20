import { tryApi } from '@/services/aiService';
import { EmailDraftRequest, EmailDraftResult } from '@/types/ai';

const mockEmails: any = {}; // TODO: Remove mock fallback

export const aiEmailService = {
  async draft(request: EmailDraftRequest): Promise<EmailDraftResult> {
    const data = await tryApi<EmailDraftResult>('/api/ai/email/draft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockEmails[request.emailType] ?? mockEmails.FOLLOW_UP;
  },
};
