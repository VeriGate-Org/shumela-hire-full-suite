package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.PerformanceReviewAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class PerformanceReviewAiService {

    private static final Logger logger = LoggerFactory.getLogger(PerformanceReviewAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public PerformanceReviewAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public ReviewDraftResult draftReview(String userId, ReviewDraftRequest request) {
        String systemPrompt = "You are an HR performance management specialist helping managers write performance reviews. " +
                "Given the employee's goals, achievements, and feedback, draft a comprehensive review narrative. " +
                "Return JSON with: " +
                "narrative (string - 3-5 paragraph review narrative), " +
                "strengthsSummary (string - summary of key strengths demonstrated), " +
                "developmentAreas (string - constructive development areas), " +
                "suggestedGoals (array of strings - 3-5 suggested goals for next period), " +
                "overallAssessment (string - overall performance assessment), " +
                "ratingJustification (string - justification for the rating). " +
                "Write in a professional, constructive, and balanced tone. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Draft a performance review for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Review Period: ").append(request.getReviewPeriod()).append("\n");

        if (request.getOverallRating() != null) {
            userPrompt.append("Overall Rating: ").append(request.getOverallRating()).append("/5\n");
        }

        if (request.getGoals() != null && !request.getGoals().isEmpty()) {
            userPrompt.append("\nGoals:\n");
            for (String goal : request.getGoals()) {
                userPrompt.append("- ").append(goal).append("\n");
            }
        }

        if (request.getAchievements() != null && !request.getAchievements().isEmpty()) {
            userPrompt.append("\nKey Achievements:\n");
            for (String achievement : request.getAchievements()) {
                userPrompt.append("- ").append(achievement).append("\n");
            }
        }

        if (request.getFeedbackSummaries() != null && !request.getFeedbackSummaries().isEmpty()) {
            userPrompt.append("\nFeedback Summaries:\n");
            for (String feedback : request.getFeedbackSummaries()) {
                userPrompt.append("- ").append(feedback).append("\n");
            }
        }

        if (request.getManagerNotes() != null) {
            userPrompt.append("\nManager Notes: ").append(request.getManagerNotes()).append("\n");
        }

        AiCompletionResponse response = aiService.complete(userId, "PERFORMANCE_REVIEW_DRAFT",
                systemPrompt, userPrompt.toString(), 0.5, 2048);

        try {
            return objectMapper.readValue(response.getContent(), ReviewDraftResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse review draft AI response", e);
            ReviewDraftResult result = new ReviewDraftResult();
            result.setNarrative(response.getContent());
            return result;
        }
    }

    public FeedbackSummaryResult summarizeFeedback(String userId, FeedbackSummaryRequest request) {
        String systemPrompt = "You are an HR analytics specialist summarising 360-degree feedback data. " +
                "Analyse the feedback from multiple sources and provide actionable insights. " +
                "Return JSON with: " +
                "executiveSummary (string - 2-3 sentence overall summary), " +
                "consensusStrengths (array of strings - strengths agreed on by multiple sources), " +
                "consensusDevelopmentAreas (array of strings - areas multiple sources flagged), " +
                "blindSpots (array of strings - gaps between self-assessment and others' feedback), " +
                "actionableRecommendations (array of strings - 3-5 specific development actions), " +
                "sentimentOverview (string - overall sentiment analysis of the feedback). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Summarise 360 feedback for: ").append(request.getEmployeeName()).append("\n");

        if (request.getFeedbackEntries() != null && !request.getFeedbackEntries().isEmpty()) {
            userPrompt.append("\nFeedback Entries:\n");
            for (FeedbackEntry entry : request.getFeedbackEntries()) {
                userPrompt.append("\nFrom: ").append(entry.getRespondentRole()).append("\n");
                if (entry.getRatings() != null) userPrompt.append("  Ratings: ").append(entry.getRatings()).append("\n");
                if (entry.getComments() != null) userPrompt.append("  Comments: ").append(entry.getComments()).append("\n");
                if (entry.getStrengths() != null) userPrompt.append("  Strengths: ").append(entry.getStrengths()).append("\n");
                if (entry.getImprovements() != null) userPrompt.append("  Improvements: ").append(entry.getImprovements()).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "FEEDBACK_SUMMARY",
                systemPrompt, userPrompt.toString(), 0.4, 2048);

        try {
            return objectMapper.readValue(response.getContent(), FeedbackSummaryResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse feedback summary AI response", e);
            FeedbackSummaryResult result = new FeedbackSummaryResult();
            result.setExecutiveSummary(response.getContent());
            return result;
        }
    }

    public GoalSuggestionResult suggestGoals(String userId, GoalSuggestionRequest request) {
        String systemPrompt = "You are an HR performance specialist helping define SMART goals for employees. " +
                "Based on the employee's role, competency gaps, and career aspiration, suggest relevant goals. " +
                "Return JSON with: " +
                "goals (array of objects with: goal (string - the SMART goal), " +
                "category (string - e.g. Technical, Leadership, Business, Development), " +
                "measurableTarget (string - how success is measured), " +
                "timeframe (string - e.g. 'Q1 2026', '6 months'), " +
                "rationale (string - why this goal matters)). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Suggest SMART goals for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");

        if (request.getCareerAspiration() != null) {
            userPrompt.append("Career Aspiration: ").append(request.getCareerAspiration()).append("\n");
        }

        if (request.getPreviousGoals() != null && !request.getPreviousGoals().isEmpty()) {
            userPrompt.append("\nPrevious Goals:\n");
            for (String goal : request.getPreviousGoals()) {
                userPrompt.append("- ").append(goal).append("\n");
            }
        }

        if (request.getCompetencyGaps() != null && !request.getCompetencyGaps().isEmpty()) {
            userPrompt.append("\nCompetency Gaps:\n");
            for (String gap : request.getCompetencyGaps()) {
                userPrompt.append("- ").append(gap).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "GOAL_SUGGESTION",
                systemPrompt, userPrompt.toString(), 0.6, 2048);

        try {
            return objectMapper.readValue(response.getContent(), GoalSuggestionResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse goal suggestion AI response", e);
            return new GoalSuggestionResult();
        }
    }
}
