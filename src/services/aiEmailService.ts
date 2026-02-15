import { tryApi } from '@/services/aiService';
import { EmailDraftRequest, EmailDraftResult } from '@/types/ai';

const mockEmails: Record<string, EmailDraftResult> = {
  REJECTION: {
    subject: 'Update on Your Application',
    body: 'Dear Candidate,\n\nThank you for your interest in the position and for taking the time to apply.\n\nAfter careful consideration, we have decided to proceed with other candidates whose qualifications more closely match our current requirements.\n\nWe encourage you to apply for future positions that align with your skills and experience.\n\nKind regards,\nThe Hiring Team',
  },
  INTERVIEW_INVITATION: {
    subject: 'Interview Invitation',
    body: 'Dear Candidate,\n\nWe are pleased to invite you for an interview for the position you applied for.\n\nPlease let us know your availability for the coming week so we can arrange a suitable time.\n\nKind regards,\nThe Hiring Team',
  },
  OFFER: {
    subject: 'Employment Offer',
    body: 'Dear Candidate,\n\nWe are delighted to extend an offer of employment for the position.\n\nPlease find the details of the offer attached. We would appreciate your response within five business days.\n\nKind regards,\nThe Hiring Team',
  },
  FOLLOW_UP: {
    subject: 'Following Up on Your Application',
    body: 'Dear Candidate,\n\nWe wanted to follow up regarding your application and provide an update on the process.\n\nWe are still reviewing applications and expect to make a decision shortly.\n\nKind regards,\nThe Hiring Team',
  },
};

export const aiEmailService = {
  async draft(request: EmailDraftRequest): Promise<EmailDraftResult> {
    const data = await tryApi<EmailDraftResult>('/api/ai/email/draft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? mockEmails[request.emailType] ?? mockEmails.FOLLOW_UP;
  },
};
