package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.OfferPredictionDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OfferPredictionAiService {

    private static final Logger logger = LoggerFactory.getLogger(OfferPredictionAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public OfferPredictionAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public OfferPredictionResult predictAcceptance(String userId, OfferPredictionRequest request) {
        String systemPrompt = "You are an offer acceptance prediction specialist. " +
                "Analyse the offer details and predict the likelihood of candidate acceptance. " +
                "Return JSON with: acceptanceProbability (0-100), riskLevel (LOW/MEDIUM/HIGH), " +
                "positiveFactors (array of strings), riskFactors (array of strings), " +
                "recommendations (array of strings). Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Predict offer acceptance:\n");
        userPrompt.append("Application ID: ").append(request.getApplicationId()).append("\n");
        userPrompt.append("Proposed Salary: R").append(String.format("%.0f", request.getProposedSalary())).append("\n");
        if (request.getAdditionalBenefits() != null && !request.getAdditionalBenefits().isEmpty()) {
            userPrompt.append("Benefits: ").append(String.join(", ", request.getAdditionalBenefits())).append("\n");
        }

        AiCompletionResponse response = aiService.complete(userId, "OFFER_PREDICTION", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), OfferPredictionResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse offer prediction AI response", e);
            OfferPredictionResult result = new OfferPredictionResult();
            result.setRiskLevel("UNKNOWN");
            result.setRecommendations(List.of(response.getContent()));
            return result;
        }
    }
}
