package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.AttritionRiskAiDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AttritionRiskAiService {

    private static final Logger logger = LoggerFactory.getLogger(AttritionRiskAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public AttritionRiskAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public AttritionAnalysisResult analyzeAttritionRisk(String userId, AttritionAnalysisRequest request) {
        String systemPrompt = "You are an HR analytics specialist predicting employee attrition risk. " +
                "Analyse the employee's data points and provide a risk assessment. " +
                "Return JSON with: " +
                "riskScore (integer 0-100 - overall attrition risk), " +
                "riskLevel (string - LOW, MODERATE, HIGH, or CRITICAL), " +
                "summary (string - 2-3 sentence risk assessment), " +
                "riskFactors (array of strings - factors increasing attrition risk), " +
                "protectiveFactors (array of strings - factors reducing risk), " +
                "retentionRecommendations (array of strings - specific actions to retain this employee), " +
                "predictedTimeframe (string - e.g. 'Within 3 months', 'Within 6 months', 'Within 12 months'), " +
                "confidence (number 0.0-1.0 - confidence in the prediction). " +
                "Consider South African labour market context. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse attrition risk for:\n");
        userPrompt.append("Employee: ").append(request.getEmployeeName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Tenure: ").append(request.getTenureMonths()).append(" months\n");
        userPrompt.append("Performance Rating: ").append(request.getRecentPerformanceRating()).append("/5\n");
        userPrompt.append("Leave Days Taken: ").append(request.getLeaveDaysTaken()).append("\n");
        userPrompt.append("Overtime Hours (Last Quarter): ").append(request.getOvertimeHoursLastQuarter()).append("\n");
        userPrompt.append("Recent Promotion: ").append(request.isHadRecentPromotion() ? "Yes" : "No").append("\n");
        userPrompt.append("Recent Salary Increase: ").append(request.isHadSalaryIncrease() ? "Yes" : "No").append("\n");
        userPrompt.append("Salary Percentile: ").append(request.getSalaryPercentile()).append("%\n");
        userPrompt.append("Training Hours (Last Year): ").append(request.getTrainingHoursLastYear()).append("\n");
        if (request.getLastEngagementScore() != null) {
            userPrompt.append("Last Engagement Score: ").append(request.getLastEngagementScore()).append("\n");
        }

        if (request.getAdditionalFactors() != null && !request.getAdditionalFactors().isEmpty()) {
            userPrompt.append("\nAdditional Factors:\n");
            for (String factor : request.getAdditionalFactors()) {
                userPrompt.append("- ").append(factor).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "ATTRITION_RISK",
                systemPrompt, userPrompt.toString(), 0.3, 1536);

        try {
            return objectMapper.readValue(response.getContent(), AttritionAnalysisResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse attrition risk AI response", e);
            AttritionAnalysisResult result = new AttritionAnalysisResult();
            result.setSummary(response.getContent());
            return result;
        }
    }

    public WorkforceAnalysisResult analyzeWorkforce(String userId, WorkforceAnalysisRequest request) {
        String systemPrompt = "You are an HR workforce planning specialist assessing department health. " +
                "Analyse the department's workforce data and provide strategic insights. " +
                "Return JSON with: " +
                "overallHealthAssessment (string - 2-3 sentence department health summary), " +
                "keyRisks (array of strings - top workforce risks), " +
                "strengths (array of strings - department strengths), " +
                "hiringRecommendations (array of strings - staffing recommendations), " +
                "retentionStrategies (array of strings - strategies to reduce turnover), " +
                "forecastSummary (string - 6-12 month workforce forecast). " +
                "Consider South African labour market context. " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Analyse workforce health for:\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Total Headcount: ").append(request.getTotalHeadcount()).append("\n");
        userPrompt.append("Average Tenure: ").append(request.getAvgTenureMonths()).append(" months\n");
        userPrompt.append("Turnover Rate (Last 12 Months): ").append(request.getTurnoverRateLast12Months()).append("%\n");
        userPrompt.append("Open Positions: ").append(request.getOpenPositions()).append("\n");
        userPrompt.append("Avg Performance Rating: ").append(request.getAvgPerformanceRating()).append("/5\n");
        userPrompt.append("Avg Engagement Score: ").append(request.getAvgEngagementScore()).append("\n");

        if (request.getRecentDepartures() != null && !request.getRecentDepartures().isEmpty()) {
            userPrompt.append("\nRecent Departures:\n");
            for (String departure : request.getRecentDepartures()) {
                userPrompt.append("- ").append(departure).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "WORKFORCE_ANALYSIS",
                systemPrompt, userPrompt.toString(), 0.4, 1536);

        try {
            return objectMapper.readValue(response.getContent(), WorkforceAnalysisResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse workforce analysis AI response", e);
            WorkforceAnalysisResult result = new WorkforceAnalysisResult();
            result.setOverallHealthAssessment(response.getContent());
            return result;
        }
    }
}
