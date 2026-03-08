package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.LeaveAnalyticsAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LeaveAnalyticsAiService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveAnalyticsAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public LeaveAnalyticsAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public LeavePatternResult analyzeLeavePatterns(String userId, LeavePatternRequest request) {
        String systemPrompt = "You are an HR analytics specialist analysing employee leave patterns. " +
                "Identify trends, burnout risks, and staffing coverage issues from leave data. " +
                "Return JSON with: " +
                "overallAnalysis (string - 2-3 sentence summary of leave patterns), " +
                "patterns (array of strings - identified leave patterns and trends), " +
                "burnoutWarnings (array of strings - employees or groups at burnout risk), " +
                "coverageRisks (array of strings - periods/teams at risk of insufficient coverage), " +
                "forecast (array of objects with: month (string), expectedLeaveLevel (string - Low, Normal, High, Critical), " +
                "recommendation (string - staffing recommendation for that month)), " +
                "policyRecommendations (array of strings - leave policy improvement suggestions), " +
                "staffingRecommendations (array of strings - staffing adjustments needed). " +
                "Consider South African public holidays and labour law (BCEA) leave entitlements. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse leave patterns for:\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Total Employees: ").append(request.getTotalEmployees()).append("\n");
        userPrompt.append("Year: ").append(request.getYear()).append("\n");
        userPrompt.append("Avg Leave Days/Employee: ").append(request.getAvgLeaveDaysPerEmployee()).append("\n");

        if (request.getPeakMonths() != null && !request.getPeakMonths().isEmpty()) {
            userPrompt.append("Peak Months: ").append(String.join(", ", request.getPeakMonths())).append("\n");
        }

        if (request.getLeaveData() != null && !request.getLeaveData().isEmpty()) {
            userPrompt.append("\nLeave Data:\n");
            for (LeaveDataPoint dp : request.getLeaveData()) {
                userPrompt.append("- ").append(dp.getLeaveType())
                        .append(" | Month: ").append(dp.getMonth())
                        .append(" | Days: ").append(dp.getTotalDays())
                        .append(" | Requests: ").append(dp.getRequestCount())
                        .append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "LEAVE_ANALYTICS",
                systemPrompt, userPrompt.toString(), 0.4, 2048);

        try {
            return objectMapper.readValue(response.getContent(), LeavePatternResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse leave analytics AI response", e);
            LeavePatternResult result = new LeavePatternResult();
            result.setOverallAnalysis(response.getContent());
            return result;
        }
    }
}
