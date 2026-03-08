package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.EngagementAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EngagementAiService {

    private static final Logger logger = LoggerFactory.getLogger(EngagementAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public EngagementAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public SentimentAnalysisResult analyzeSentiment(String userId, SentimentAnalysisRequest request) {
        String systemPrompt = "You are an HR engagement specialist analysing employee survey data and sentiment. " +
                "Provide deep insights into employee sentiment, key themes, and actionable recommendations. " +
                "Return JSON with: " +
                "overallSentiment (string - VERY_POSITIVE, POSITIVE, NEUTRAL, NEGATIVE, VERY_NEGATIVE), " +
                "sentimentScore (number 0.0-1.0 where 1.0 is most positive), " +
                "executiveSummary (string - 3-4 sentence executive summary), " +
                "keyThemes (array of strings - recurring themes in responses), " +
                "concerns (array of strings - top employee concerns/pain points), " +
                "positives (array of strings - what employees appreciate most), " +
                "actionItems (array of strings - prioritised actions for leadership), " +
                "eNpsTrendAnalysis (string - analysis of eNPS score and what it indicates), " +
                "departmentBreakdown (array of objects with: department (string), " +
                "sentiment (string - POSITIVE/NEUTRAL/NEGATIVE), keyIssue (string - main concern)). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse engagement survey results:\n");
        userPrompt.append("Survey: ").append(request.getSurveyName()).append("\n");
        userPrompt.append("Type: ").append(request.getSurveyType()).append("\n");
        userPrompt.append("Total Responses: ").append(request.getTotalResponses()).append("\n");
        userPrompt.append("eNPS Score: ").append(request.geteNpsScore()).append("\n");

        if (request.getResponses() != null && !request.getResponses().isEmpty()) {
            userPrompt.append("\nSurvey Responses:\n");
            for (SurveyResponseEntry entry : request.getResponses()) {
                userPrompt.append("\nQuestion: ").append(entry.getQuestion());
                userPrompt.append(" | Avg Rating: ").append(entry.getAvgRating()).append("/5\n");
                if (entry.getFreeTextResponses() != null) {
                    for (String text : entry.getFreeTextResponses()) {
                        userPrompt.append("  - \"").append(text).append("\"\n");
                    }
                }
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "ENGAGEMENT_SENTIMENT",
                systemPrompt, userPrompt.toString(), 0.4, 2048);

        try {
            return objectMapper.readValue(response.getContent(), SentimentAnalysisResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse engagement sentiment AI response", e);
            SentimentAnalysisResult result = new SentimentAnalysisResult();
            result.setExecutiveSummary(response.getContent());
            return result;
        }
    }
}
