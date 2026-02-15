package com.arthmatic.talentgate.service.ai.features;

import com.arthmatic.talentgate.dto.ai.EmailDraftDto.*;
import com.arthmatic.talentgate.service.ai.AiCompletionResponse;
import com.arthmatic.talentgate.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class EmailDraftingAiService {

    private static final Logger logger = LoggerFactory.getLogger(EmailDraftingAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public EmailDraftingAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public EmailDraftResult draftEmail(String userId, EmailDraftRequest request) {
        String systemPrompt = "You are a professional HR email drafter. Write a recruitment email " +
                "appropriate for the specified type and tone. The email should be professional, clear, and empathetic. " +
                "Return JSON with: subject (string) and body (string — the email body with appropriate greeting and sign-off). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Draft an email:\n");
        userPrompt.append("Type: ").append(request.getEmailType()).append("\n");
        userPrompt.append("Candidate Name: ").append(request.getCandidateName()).append("\n");
        userPrompt.append("Job Title: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Tone: ").append(request.getTone()).append("\n");

        if (request.getContext() != null && !request.getContext().isEmpty()) {
            userPrompt.append("Additional Context:\n");
            for (Map.Entry<String, String> entry : request.getContext().entrySet()) {
                userPrompt.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "EMAIL_DRAFT", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), EmailDraftResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse email draft AI response", e);
            EmailDraftResult result = new EmailDraftResult();
            result.setSubject("Regarding Your Application");
            result.setBody(response.getContent());
            return result;
        }
    }
}
