package com.arthmatic.shumelahire.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Exposes deployment mode (cloud or hybrid) for runtime introspection.
 * Used by health endpoints and conditional feature toggles.
 */
@Configuration
public class DeploymentModeConfig {

    @Value("${deployment.mode:cloud}")
    private String deploymentMode;

    @Bean
    public HealthIndicator deploymentModeHealth() {
        return () -> Health.up()
                .withDetail("mode", deploymentMode)
                .withDetail("storage", isHybrid() ? "local" : "s3")
                .withDetail("database", isHybrid() ? "sqlserver" : "postgresql")
                .build();
    }

    public String getDeploymentMode() {
        return deploymentMode;
    }

    public boolean isHybrid() {
        return "hybrid".equalsIgnoreCase(deploymentMode);
    }

    public boolean isCloud() {
        return "cloud".equalsIgnoreCase(deploymentMode);
    }
}
