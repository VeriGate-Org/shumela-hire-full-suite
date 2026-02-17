package com.arthmatic.shumelahire.service.ai.features;

import com.arthmatic.shumelahire.dto.ai.JobDescriptionDto.*;
import com.arthmatic.shumelahire.service.ai.AiCompletionResponse;
import com.arthmatic.shumelahire.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class JobDescriptionAiService {

    private static final Logger logger = LoggerFactory.getLogger(JobDescriptionAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public JobDescriptionAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public JobDescriptionResult generateJobDescription(String userId, JobDescriptionRequest request) {
        String systemPrompt = "You are a professional job description writer for a corporate HR department. " +
                "Generate a structured job description in JSON format with these fields: " +
                "title (string), intro (string — a compelling opening paragraph), " +
                "responsibilities (array of strings), requirements (array of strings), " +
                "benefits (array of strings), biasWarnings (array of strings — flag any potentially biased language). " +
                "Use inclusive, gender-neutral language. Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Generate a job description for:\n");
        userPrompt.append("Title: ").append(request.getTitle()).append("\n");
        userPrompt.append("Department: ").append(request.getDepartment()).append("\n");
        userPrompt.append("Level: ").append(request.getLevel()).append("\n");
        userPrompt.append("Employment Type: ").append(request.getEmploymentType()).append("\n");
        userPrompt.append("Location: ").append(request.getLocation()).append("\n");

        if (request.getKeyResponsibilities() != null && !request.getKeyResponsibilities().isEmpty()) {
            userPrompt.append("Key Responsibilities to include: ").append(String.join(", ", request.getKeyResponsibilities())).append("\n");
        }
        if (request.getKeyRequirements() != null && !request.getKeyRequirements().isEmpty()) {
            userPrompt.append("Key Requirements to include: ").append(String.join(", ", request.getKeyRequirements())).append("\n");
        }

        AiCompletionResponse response = aiService.complete(userId, "JOB_DESCRIPTION_GENERATE", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), JobDescriptionResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse job description AI response", e);
            JobDescriptionResult result = new JobDescriptionResult();
            result.setTitle(request.getTitle());
            result.setIntro(response.getContent());
            return result;
        }
    }

    public BiasCheckResult checkForBias(String userId, String text) {
        String systemPrompt = "You are an HR compliance specialist focused on detecting bias in job descriptions and recruitment text. " +
                "Analyse the provided text for exclusionary, gendered, age-biased, or culturally insensitive language. " +
                "Return JSON with: biasWarnings (array of strings describing each issue found) and " +
                "overallAssessment (string summary). Return ONLY valid JSON, no markdown.";

        AiCompletionResponse response = aiService.complete(userId, "JOB_DESCRIPTION_BIAS_CHECK", systemPrompt, text);

        try {
            return objectMapper.readValue(response.getContent(), BiasCheckResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse bias check AI response", e);
            BiasCheckResult result = new BiasCheckResult();
            result.setOverallAssessment(response.getContent());
            return result;
        }
    }
}
