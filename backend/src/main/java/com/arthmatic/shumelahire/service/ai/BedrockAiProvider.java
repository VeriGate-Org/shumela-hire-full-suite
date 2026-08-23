package com.arthmatic.shumelahire.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelResponse;
import software.amazon.awssdk.services.bedrockruntime.model.ThrottlingException;

import java.nio.charset.StandardCharsets;

/**
 * Anthropic models through AWS Bedrock.
 *
 * <p>Ported from TextGate's {@code BedrockAiClient}, which has been running this way in production.
 * Bedrock authenticates by IAM, so unlike {@link ClaudeAiProvider} and {@link OpenAiProvider} there
 * is no API key to store, rotate or leak — which matters here specifically, because
 * {@code shumelahire/prod/ai-keys} turned out to hold a CDK-generated random string rather than a
 * credential. Nobody had ever put a real key in it.</p>
 *
 * <p><b>Model ids are cross-region inference profiles</b>, not bare model ids. In af-south-1 the
 * bare form is rejected: on-demand invocation of a foundation model is not supported there, and the
 * {@code global.anthropic.*} profile is what actually resolves. This is the single detail most
 * likely to be "simplified" by someone reading the AWS docs for another region, so it is stated
 * here rather than left to be rediscovered.</p>
 *
 * <p>Requires {@code bedrock:InvokeModel} on both the foundation-model and inference-profile ARNs,
 * plus the AWS Marketplace permissions Bedrock uses to check model subscription. See the CDK.</p>
 */
@Service
@ConditionalOnProperty(name = "ai.provider", havingValue = "bedrock")
public class BedrockAiProvider implements AiProvider {

    private static final Logger logger = LoggerFactory.getLogger(BedrockAiProvider.class);

    private static final int MAX_ATTEMPTS = 3;
    private static final String ANTHROPIC_VERSION = "bedrock-2023-05-31";

    private final ObjectMapper objectMapper;
    private final BedrockRuntimeClient bedrock;

    @Value("${ai.bedrock.model:global.anthropic.claude-sonnet-4-5-20250929-v1:0}")
    private String modelId;

    public BedrockAiProvider(ObjectMapper objectMapper,
                             @Value("${aws.region:af-south-1}") String region) {
        this.objectMapper = objectMapper;
        this.bedrock = BedrockRuntimeClient.builder()
                .region(Region.of(region))
                .build();
    }

    @Override
    public AiCompletionResponse complete(AiCompletionRequest request) {
        String payload = buildPayload(request);

        ThrottlingException lastThrottle = null;
        for (int attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            try {
                InvokeModelResponse response = bedrock.invokeModel(InvokeModelRequest.builder()
                        .modelId(modelId)
                        .contentType("application/json")
                        .accept("application/json")
                        .body(SdkBytes.fromString(payload, StandardCharsets.UTF_8))
                        .build());
                return parse(response);

            } catch (ThrottlingException e) {
                // Bedrock throttles on shared capacity. Backing off is the documented remedy and
                // costs a second; failing the screening outright costs the recruiter their run.
                lastThrottle = e;
                long waitMs = (long) Math.pow(2, attempt) * 500L;
                logger.warn("Bedrock throttled (attempt {}/{}), retrying in {}ms",
                        attempt + 1, MAX_ATTEMPTS, waitMs);
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrupted while backing off from Bedrock", ie);
                }
            }
        }
        throw new IllegalStateException("Bedrock throttled after " + MAX_ATTEMPTS + " attempts", lastThrottle);
    }

    private String buildPayload(AiCompletionRequest request) {
        try {
            ObjectNode body = objectMapper.createObjectNode();
            body.put("anthropic_version", ANTHROPIC_VERSION);
            body.put("max_tokens", request.getMaxTokens() > 0 ? request.getMaxTokens() : 2048);
            if (request.getTemperature() > 0) {
                body.put("temperature", request.getTemperature());
            }
            if (request.getSystemPrompt() != null && !request.getSystemPrompt().isBlank()) {
                body.put("system", request.getSystemPrompt());
            }
            ObjectNode message = objectMapper.createObjectNode();
            message.put("role", "user");
            message.put("content", request.getUserPrompt() == null ? "" : request.getUserPrompt());
            body.putArray("messages").add(message);
            return objectMapper.writeValueAsString(body);
        } catch (Exception e) {
            throw new IllegalStateException("Could not build the Bedrock request body", e);
        }
    }

    private AiCompletionResponse parse(InvokeModelResponse response) {
        try {
            JsonNode root = objectMapper.readTree(response.body().asUtf8String());

            // content is an array of blocks; concatenate the text ones and ignore the rest, so a
            // future block type does not turn a good answer into an exception.
            StringBuilder text = new StringBuilder();
            for (JsonNode block : root.path("content")) {
                if ("text".equals(block.path("type").asText())) {
                    text.append(block.path("text").asText());
                }
            }

            AiCompletionResponse out = new AiCompletionResponse();
            out.setContent(text.toString());
            out.setModel(root.path("model").asText(modelId));
            out.setInputTokens(root.path("usage").path("input_tokens").asInt(0));
            out.setOutputTokens(root.path("usage").path("output_tokens").asInt(0));
            out.setProvider(getProviderName());
            return out;
        } catch (Exception e) {
            throw new IllegalStateException("Could not read the Bedrock response", e);
        }
    }

    @Override
    public String getProviderName() {
        return "bedrock";
    }

    @Override
    public boolean isAvailable() {
        // No key to check. Availability is an IAM question, answered by the first call rather than
        // guessed at here — reporting "available" on the strength of a non-empty config string is
        // how the mock provider came to look like a working one.
        return true;
    }
}
