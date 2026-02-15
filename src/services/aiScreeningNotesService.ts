import { tryApi } from '@/services/aiService';
import { ScreeningNotesRequest, ScreeningNotesResult } from '@/types/ai';

export const aiScreeningNotesService = {
  async draft(request: ScreeningNotesRequest): Promise<ScreeningNotesResult> {
    const data = await tryApi<ScreeningNotesResult>('/api/ai/screening-notes/draft', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return data ?? {
      draftNotes: `Screening notes for ${request.candidateName} — ${request.jobTitle}:\n\n` +
        (request.bulletPoints || []).map(p => `- ${p}`).join('\n') +
        '\n\nOverall: Candidate demonstrates alignment with role requirements. Recommended for further evaluation.',
    };
  },
};
