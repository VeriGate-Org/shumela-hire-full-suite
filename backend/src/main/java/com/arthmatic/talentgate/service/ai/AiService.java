package com.arthmatic.talentgate.service.ai;

import com.arthmatic.talentgate.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiService {

    private static final Logger logger = LoggerFactory.getLogger(AiService.class);

    private final AiProvider aiProvider;
    private final AuditLogService auditLogService;

    @Value("${ai.enabled:false}")
    private boolean enabled;

    public AiService(AiProvider aiProvider, AuditLogService auditLogService) {
        this.aiProvider = aiProvider;
        this.auditLogService = auditLogService;
    }

    public AiCompletionResponse complete(String userId, String featureName, String systemPrompt, String userPrompt) {
        if (!enabled) {
            throw new IllegalStateException("AI features are not enabled. Set ai.enabled=true to activate.");
        }

        logger.info("AI request: user={}, feature={}, provider={}", userId, featureName, aiProvider.getProviderName());

        AiCompletionRequest request = new AiCompletionRequest(systemPrompt, userPrompt);
        AiCompletionResponse response = aiProvider.complete(request);

        try {
            auditLogService.saveLog(userId, "AI_" + featureName.toUpperCase(),
                    "AI_FEATURE", featureName,
                    String.format("provider=%s, model=%s, inputTokens=%d, outputTokens=%d",
                            response.getProvider(), response.getModel(),
                            response.getInputTokens(), response.getOutputTokens()));
        } catch (Exception e) {
            logger.warn("Failed to audit AI call for feature {}", featureName, e);
        }

        return response;
    }

    public AiCompletionResponse complete(String userId, String featureName, String systemPrompt, String userPrompt, double temperature, int maxTokens) {
        if (!enabled) {
            throw new IllegalStateException("AI features are not enabled. Set ai.enabled=true to activate.");
        }

        logger.info("AI request: user={}, feature={}, provider={}", userId, featureName, aiProvider.getProviderName());

        AiCompletionRequest request = new AiCompletionRequest(systemPrompt, userPrompt, temperature, maxTokens);
        AiCompletionResponse response = aiProvider.complete(request);

        try {
            auditLogService.saveLog(userId, "AI_" + featureName.toUpperCase(),
                    "AI_FEATURE", featureName,
                    String.format("provider=%s, model=%s, inputTokens=%d, outputTokens=%d",
                            response.getProvider(), response.getModel(),
                            response.getInputTokens(), response.getOutputTokens()));
        } catch (Exception e) {
            logger.warn("Failed to audit AI call for feature {}", featureName, e);
        }

        return response;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public String getProviderName() {
        return aiProvider.getProviderName();
    }

    public boolean isProviderAvailable() {
        return aiProvider.isAvailable();
    }
}
