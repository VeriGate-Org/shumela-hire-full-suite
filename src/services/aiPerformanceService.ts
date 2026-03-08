import { tryApi } from '@/services/aiService';
import {
  ReviewDraftRequest, ReviewDraftResult,
  FeedbackSummaryRequest, FeedbackSummaryResult,
  GoalSuggestionRequest, GoalSuggestionResult,
} from '@/types/ai';

export const aiPerformanceService = {
  async draftReview(request: ReviewDraftRequest): Promise<ReviewDraftResult> {
    const data = await tryApi<ReviewDraftResult>('/api/ai/performance/draft-review', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async summarizeFeedback(request: FeedbackSummaryRequest): Promise<FeedbackSummaryResult> {
    const data = await tryApi<FeedbackSummaryResult>('/api/ai/performance/summarize-feedback', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },

  async suggestGoals(request: GoalSuggestionRequest): Promise<GoalSuggestionResult> {
    const data = await tryApi<GoalSuggestionResult>('/api/ai/performance/suggest-goals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    if (!data) throw new Error('AI service unavailable');
    return data;
  },
};
