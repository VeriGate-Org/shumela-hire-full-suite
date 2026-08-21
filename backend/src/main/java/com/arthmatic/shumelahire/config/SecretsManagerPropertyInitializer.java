package com.arthmatic.shumelahire.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Resolves secrets from AWS Secrets Manager at startup, only when running under the
 * cloud/lambda profiles (local/dev use plain env vars from application.yml directly).
 *
 * Two shapes are supported:
 *  - SIMPLE_ARN_TO_PROPERTY: the secret's raw string is the property value verbatim
 *    (e.g. the JWT signing secret).
 *  - JSON_ARN_TO_FIELD_MAP: the secret stores a flat JSON object; each JSON field maps
 *    to one Spring property. Populate these secrets with `aws secretsmanager put-secret-value`
 *    using the field names below, e.g. for shumelahire/{env}/docusign:
 *    {"accountId":"...","integrationKey":"...","secretKey":"...","userId":"...",
 *     "privateKey":"...","webhookHmacKey":"..."}
 */
public class SecretsManagerPropertyInitializer implements EnvironmentPostProcessor {

    private static final Logger logger = LoggerFactory.getLogger(SecretsManagerPropertyInitializer.class);

    private static final Map<String, String> SIMPLE_ARN_TO_PROPERTY = Map.of(
            "ENCRYPTION_KEY_ARN", "encryption.key",
            "JWT_SECRET_ARN", "jwt.secret"
    );

    private static final Map<String, Map<String, String>> JSON_ARN_TO_FIELD_MAP = Map.of(
            "AI_KEYS_SECRET_ARN", Map.of(
                    "openaiApiKey", "ai.openai.api-key",
                    "claudeApiKey", "ai.claude.api-key"
            ),
            "DOCUSIGN_SECRET_ARN", Map.of(
                    "accountId", "docusign.account-id",
                    "integrationKey", "docusign.integration-key",
                    "secretKey", "docusign.secret-key",
                    "userId", "docusign.user-id",
                    "privateKey", "docusign.private-key",
                    "webhookHmacKey", "docusign.webhook-hmac-key"
            ),
            "MICROSOFT_SECRET_ARN", Map.of(
                    "tenantId", "microsoft.tenant-id",
                    "clientId", "microsoft.client-id",
                    "clientSecret", "microsoft.client-secret",
                    "teamsWebhookUrl", "microsoft.teams.webhook-url",
                    "outlookCalendarUser", "microsoft.outlook.calendar-user"
            ),
            "JOB_BOARDS_SECRET_ARN", Map.ofEntries(
                    Map.entry("linkedinApiKey", "job-boards.linkedin.api-key"),
                    Map.entry("linkedinApiSecret", "job-boards.linkedin.api-secret"),
                    Map.entry("linkedinOrgId", "job-boards.linkedin.org-id"),
                    Map.entry("indeedEmployerId", "job-boards.indeed.employer-id"),
                    Map.entry("indeedApiToken", "job-boards.indeed.api-token"),
                    Map.entry("pnetApiKey", "job-boards.pnet.api-key"),
                    Map.entry("careerJunctionApiKey", "job-boards.career-junction.api-key"),
                    Map.entry("careerJunctionPartnerId", "job-boards.career-junction.partner-id")
            ),
            "SAP_PAYROLL_SECRET_ARN", Map.of(
                    "baseUrl", "sap.payroll.base-url",
                    "clientId", "sap.payroll.client-id",
                    "clientSecret", "sap.payroll.client-secret",
                    "authUrl", "sap.payroll.auth-url",
                    "companyCode", "sap.payroll.company-code",
                    "payrollArea", "sap.payroll.payroll-area"
            )
    );

    private static final ObjectMapper JSON = new ObjectMapper();

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String profiles = environment.getProperty("spring.profiles.active", "");
        if (!profiles.contains("cloud") && !profiles.contains("lambda")) {
            return;
        }

        String regionStr = environment.getProperty("AWS_REGION_OVERRIDE",
                environment.getProperty("AWS_REGION", "af-south-1"));

        Map<String, Object> resolved = new HashMap<>();

        try (SecretsManagerClient client = SecretsManagerClient.builder()
                .region(Region.of(regionStr))
                .build()) {

            for (var entry : SIMPLE_ARN_TO_PROPERTY.entrySet()) {
                resolveSimple(environment, client, entry.getKey(), entry.getValue(), resolved);
            }

            for (var entry : JSON_ARN_TO_FIELD_MAP.entrySet()) {
                resolveJson(environment, client, entry.getKey(), entry.getValue(), resolved);
            }
        }

        if (!resolved.isEmpty()) {
            environment.getPropertySources().addFirst(
                    new MapPropertySource("secretsManager", resolved));
        }
    }

    private void resolveSimple(ConfigurableEnvironment environment, SecretsManagerClient client,
                                String arnProperty, String targetProperty, Map<String, Object> resolved) {
        String arn = environment.getProperty(arnProperty);
        if (arn == null || arn.isBlank()) return;
        String existing = environment.getProperty(targetProperty);
        if (existing != null && !existing.isBlank()) return;

        try {
            String value = client.getSecretValue(
                    GetSecretValueRequest.builder().secretId(arn).build()
            ).secretString();
            if (value != null && !value.isBlank()) {
                resolved.put(targetProperty, value);
                logger.info("Resolved secret for {} from Secrets Manager", targetProperty);
            }
        } catch (Exception e) {
            logger.warn("Failed to resolve secret {} from {}: {}", targetProperty, arn, e.getMessage());
        }
    }

    private void resolveJson(ConfigurableEnvironment environment, SecretsManagerClient client,
                              String arnProperty, Map<String, String> fieldToProperty, Map<String, Object> resolved) {
        String arn = environment.getProperty(arnProperty);
        if (arn == null || arn.isBlank()) return;

        String secretString;
        try {
            secretString = client.getSecretValue(
                    GetSecretValueRequest.builder().secretId(arn).build()
            ).secretString();
        } catch (Exception e) {
            logger.warn("Failed to resolve secret bundle from {}: {}", arn, e.getMessage());
            return;
        }
        if (secretString == null || secretString.isBlank()) return;

        JsonNode node;
        try {
            node = JSON.readTree(secretString);
        } catch (Exception e) {
            logger.warn("Secret at {} is not valid JSON, skipping ({} expected fields: {})",
                    arn, arnProperty, fieldToProperty.keySet());
            return;
        }

        int resolvedCount = 0;
        for (Iterator<Map.Entry<String, JsonNode>> it = node.fields(); it.hasNext(); ) {
            Map.Entry<String, JsonNode> field = it.next();
            String targetProperty = fieldToProperty.get(field.getKey());
            if (targetProperty == null) {
                logger.warn("Unrecognized field '{}' in secret {}, ignoring", field.getKey(), arn);
                continue;
            }
            String existing = environment.getProperty(targetProperty);
            if (existing != null && !existing.isBlank()) continue;

            String value = field.getValue().asText(null);
            if (value != null && !value.isBlank()) {
                resolved.put(targetProperty, value);
                resolvedCount++;
            }
        }
        if (resolvedCount > 0) {
            logger.info("Resolved {} propert{} from secret {}", resolvedCount, resolvedCount == 1 ? "y" : "ies", arn);
        }
    }
}
