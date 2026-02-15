package com.arthmatic.talentgate.service.ai.features;

import com.arthmatic.talentgate.dto.ai.ScreeningNotesDto.*;
import com.arthmatic.talentgate.service.ai.AiCompletionResponse;
import com.arthmatic.talentgate.service.ai.AiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class ScreeningNotesAiService {

    private static final Logger logger = LoggerFactory.getLogger(ScreeningNotesAiService.class);

    private final AiService aiService;
    private final ObjectMapper objectMapper;

    public ScreeningNotesAiService(AiService aiService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.objectMapper = objectMapper;
    }

    public ScreeningNotesResult draftScreeningNotes(String userId, ScreeningNotesRequest request) {
        String systemPrompt = "You are an HR screening notes drafter. Write professional screening notes " +
                "based on the provided bullet points about a candidate. " +
                "The notes should be structured, objective, and suitable for inclusion in an applicant tracking system. " +
                "Return JSON with: draftNotes (string — the formatted screening notes). " +
                "Return ONLY valid JSON, no markdown.";

        StringBuilder userPrompt = new StringBuilder();
        userPrompt.append("Draft screening notes for:\n");
        userPrompt.append("Candidate: ").append(request.getCandidateName()).append("\n");
        userPrompt.append("Position: ").append(request.getJobTitle()).append("\n");
        userPrompt.append("Tone: ").append(request.getTone()).append("\n");
        userPrompt.append("Observations:\n");
        if (request.getBulletPoints() != null) {
            for (String point : request.getBulletPoints()) {
                userPrompt.append("- ").append(point).append("\n");
            }
        }

        AiCompletionResponse response = aiService.complete(userId, "SCREENING_NOTES_DRAFT", systemPrompt, userPrompt.toString());

        try {
            return objectMapper.readValue(response.getContent(), ScreeningNotesResult.class);
        } catch (Exception e) {
            logger.error("Failed to parse screening notes AI response", e);
            ScreeningNotesResult result = new ScreeningNotesResult();
            result.setDraftNotes(response.getContent());
            return result;
        }
    }
}
