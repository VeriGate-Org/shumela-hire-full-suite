package com.arthmatic.shumelahire.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "claude")
public class ClaudeAiProvider implements AiProvider {

    private static final Logger logger = LoggerFactory.getLogger(ClaudeAiProvider.class);
    private static final String API_URL = "https://api.anthropic.com/v1/messages";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.claude.api-key:}")
    private String apiKey;

    @Value("${ai.claude.model:claude-sonnet-4-20250514}")
    private String model;

    public ClaudeAiProvider(@Qualifier("aiRestTemplate") RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public AiCompletionResponse complete(AiCompletionRequest request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", apiKey);
            headers.set("anthropic-version", "2023-06-01");

            ObjectNode body = objectMapper.createObjectNode();
            body.put("model", model);
            body.put("max_tokens", request.getMaxTokens());
            body.put("temperature", request.getTemperature());

            if (request.getSystemPrompt() != null && !request.getSystemPrompt().isEmpty()) {
                body.put("system", request.getSystemPrompt());
            }

            ArrayNode messages = body.putArray("messages");
            ObjectNode userMessage = messages.addObject();
            userMessage.put("role", "user");
            userMessage.put("content", request.getUserPrompt());

            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
            ResponseEntity<String> response = restTemplate.exchange(API_URL, HttpMethod.POST, entity, String.class);

            JsonNode responseBody = objectMapper.readTree(response.getBody());
            String content = responseBody.path("content").get(0).path("text").asText();
            int inputTokens = responseBody.path("usage").path("input_tokens").asInt();
            int outputTokens = responseBody.path("usage").path("output_tokens").asInt();

            return new AiCompletionResponse(content, model, inputTokens, outputTokens, "claude");
        } catch (Exception e) {
            logger.error("Claude API call failed", e);
            throw new RuntimeException("Claude API call failed: " + e.getMessage(), e);
        }
    }

    @Override
    public String getProviderName() {
        return "claude";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isEmpty();
    }
}
