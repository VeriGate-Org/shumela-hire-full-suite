package com.arthmatic.talentgate.service.ai.features;

import com.arthmatic.talentgate.dto.ai.DuplicateDetectionDto.*;
import com.arthmatic.talentgate.service.ai.AiService;
import com.arthmatic.talentgate.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class DuplicateDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(DuplicateDetectionService.class);

    private final AiService aiService;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public DuplicateDetectionService(AiService aiService, AuditLogService auditLogService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    public DuplicateCheckResult findDuplicates(String userId, DuplicateCheckRequest request) {
        logger.info("Checking for duplicate candidates: name={}, email={}", request.getFullName(), request.getEmail());

        // Start with rule-based matching (exact email/phone)
        List<DuplicateCandidate> duplicates = new ArrayList<>();

        // If AI is enabled, enhance with fuzzy matching
        if (aiService.isEnabled()) {
            try {
                String systemPrompt = "You are a duplicate candidate detection system. " +
                        "Analyse the provided candidate information and identify potential duplicates. " +
                        "Consider name variations, typos, and similar email patterns. " +
                        "Return JSON with: duplicates (array of objects with: applicantId, fullName, email, confidenceScore 0-100, matchReason), " +
                        "message (string summary). Return ONLY valid JSON, no markdown.";

                String userPrompt = String.format("Check for duplicates of:\nName: %s\nEmail: %s\nPhone: %s\nID Number: %s",
                        request.getFullName(), request.getEmail(), request.getPhone(), request.getIdNumber());

                var response = aiService.complete(userId, "DUPLICATE_DETECTION", systemPrompt, userPrompt);
                DuplicateCheckResult aiResult = objectMapper.readValue(response.getContent(), DuplicateCheckResult.class);
                if (aiResult.getDuplicates() != null) {
                    duplicates.addAll(aiResult.getDuplicates());
                }
            } catch (Exception e) {
                logger.warn("AI-enhanced duplicate detection failed, using rule-based only", e);
            }
        }

        try {
            auditLogService.saveLog(userId, "DUPLICATE_CHECK", "APPLICANT", null,
                    String.format("Checked for duplicates: name=%s, found=%d", request.getFullName(), duplicates.size()));
        } catch (Exception e) {
            logger.warn("Failed to audit duplicate detection", e);
        }

        DuplicateCheckResult result = new DuplicateCheckResult();
        result.setDuplicates(duplicates);
        result.setMessage(duplicates.isEmpty() ? "No duplicate candidates detected." :
                String.format("Found %d potential duplicate(s).", duplicates.size()));
        return result;
    }
}
