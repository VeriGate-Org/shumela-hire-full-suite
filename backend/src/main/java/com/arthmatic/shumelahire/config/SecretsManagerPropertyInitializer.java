package com.arthmatic.shumelahire.config;

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
import java.util.Map;

/**
 * Resolves secrets from AWS Secrets Manager at startup.
 * Maps *_ARN environment variables to the actual secret values
 * that the application expects (e.g. ENCRYPTION_KEY_ARN -> encryption.key).
 */
public class SecretsManagerPropertyInitializer implements EnvironmentPostProcessor {

    private static final Logger logger = LoggerFactory.getLogger(SecretsManagerPropertyInitializer.class);

    private static final Map<String, String> ARN_TO_PROPERTY = Map.of(
            "ENCRYPTION_KEY_ARN", "encryption.key",
            "JWT_SECRET_ARN", "jwt.secret",
            "AI_KEYS_SECRET_ARN", "ai.api.key"
    );

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

            for (var entry : ARN_TO_PROPERTY.entrySet()) {
                String arn = environment.getProperty(entry.getKey());
                String property = entry.getValue();

                // Skip if no ARN configured or property already has a value
                if (arn == null || arn.isBlank()) continue;
                String existing = environment.getProperty(property);
                if (existing != null && !existing.isBlank()) continue;

                try {
                    String value = client.getSecretValue(
                            GetSecretValueRequest.builder().secretId(arn).build()
                    ).secretString();
                    resolved.put(property, value);
                    logger.info("Resolved secret for {} from Secrets Manager", property);
                } catch (Exception e) {
                    logger.warn("Failed to resolve secret {} from {}: {}", property, arn, e.getMessage());
                }
            }
        }

        if (!resolved.isEmpty()) {
            environment.getPropertySources().addFirst(
                    new MapPropertySource("secretsManager", resolved));
        }
    }
}
