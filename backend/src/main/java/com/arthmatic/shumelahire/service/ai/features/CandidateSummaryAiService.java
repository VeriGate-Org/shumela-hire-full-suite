package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.CandidateSummaryDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class CandidateSummaryAiService {

    private static final Logger logger = LoggerFactory.getLogger(CandidateSummaryAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public CandidateSummaryAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public CandidateSummaryResult summarizeCandidate(String userId, String applicationId,
                                                      String candidateName, String profileText) {
        String systemPrompt = "You are an HR candidate summariser. Create a concise, structured summary of the candidate. " +
                "Return JSON with: executiveSummary (string — 2-3 sentences), educationSummary (string), " +
                "experienceSummary (string), keyStrengths (array of strings), " +
                "potentialGaps (array of strings), fitAssessment (string). " +
                "Be factual and objective. Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Summarize this candidate:\n");
        userPrompt.append("Application ID: ").append(applicationId).append("\n");
        userPrompt.append("Name: ").append(candidateName).append("\n\n");
        userPrompt.append("Profile Information:\n").append(profileText != null ? profileText : "No profile text available");

        AiCompletionResponse response = aiService.complete(userId, "CANDIDATE_SUMMARY", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), CandidateSummaryResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse candidate summary AI response", e);
            CandidateSummaryResult result = new CandidateSummaryResult();
            result.setExecutiveSummary(response.getContent());
            return result;
        }
    }
}
