package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.ReportNarrativeDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ReportNarrativeAiService {

    private static final Logger logger = LoggerFactory.getLogger(ReportNarrativeAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public ReportNarrativeAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public ReportNarrativeResult generateNarrative(String userId, ReportNarrativeRequest request) {
        String systemPrompt = "You are a report narrative generator for HR recruitment reports. " +
                "Generate a professional executive summary with key findings and recommendations. " +
                "Tailor the language for the specified audience and tone. " +
                "Return JSON with: executiveSummary (string), keyFindings (array of strings), " +
                "recommendations (array of strings). Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Generate a report narrative:\n");
        userPrompt.append("Report Type: ").append(request.getReportType()).append("\n");
        userPrompt.append("Audience: ").append(request.getAudience()).append("\n");
        userPrompt.append("Tone: ").append(request.getTone()).append("\n");
        if (request.getJobId() != null) {
            userPrompt.append("Job ID: ").append(request.getJobId()).append("\n");
        }
        if (request.getReportData() != null) {
            userPrompt.append("Report Data:\n");
            for (Map.Entry<String, Object> entry : request.getReportData().entrySet()) {
                userPrompt.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "REPORT_NARRATIVE", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), ReportNarrativeResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse report narrative AI response", e);
            ReportNarrativeResult result = new ReportNarrativeResult();
            result.setExecutiveSummary(response.getContent());
            return result;
        }
    }
}
