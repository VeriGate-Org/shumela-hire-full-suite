package com.arthmatic.shumelahire.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class DeploymentModeConfigTest {

    private DeploymentModeConfig createConfig(String mode) throws Exception {
        DeploymentModeConfig config = new DeploymentModeConfig();
        Field field = DeploymentModeConfig.class.getDeclaredField("deploymentMode");
        field.setAccessible(true);
        field.set(config, mode);
        return config;
    }

    @Test
    void hybridMode_IsDetectedCorrectly() throws Exception {
        DeploymentModeConfig config = createConfig("hybrid");

        assertThat(config.isHybrid()).isTrue();
        assertThat(config.isCloud()).isFalse();
        assertThat(config.getDeploymentMode()).isEqualTo("hybrid");
    }

    @Test
    void cloudMode_IsDetectedCorrectly() throws Exception {
        DeploymentModeConfig config = createConfig("cloud");

        assertThat(config.isCloud()).isTrue();
        assertThat(config.isHybrid()).isFalse();
        assertThat(config.getDeploymentMode()).isEqualTo("cloud");
    }

    @Test
    void hybridMode_HealthIndicator_ReportsLocalStorageAndSqlServer() throws Exception {
        DeploymentModeConfig config = createConfig("hybrid");
        HealthIndicator indicator = config.deploymentModeHealth();
        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails().get("mode")).isEqualTo("hybrid");
        assertThat(health.getDetails().get("storage")).isEqualTo("local");
        assertThat(health.getDetails().get("database")).isEqualTo("sqlserver");
    }

    @Test
    void cloudMode_HealthIndicator_ReportsS3StorageAndPostgresql() throws Exception {
        DeploymentModeConfig config = createConfig("cloud");
        HealthIndicator indicator = config.deploymentModeHealth();
        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails().get("mode")).isEqualTo("cloud");
        assertThat(health.getDetails().get("storage")).isEqualTo("s3");
        assertThat(health.getDetails().get("database")).isEqualTo("postgresql");
    }

    @Test
    void hybridMode_CaseInsensitive() throws Exception {
        DeploymentModeConfig config = createConfig("HYBRID");

        assertThat(config.isHybrid()).isTrue();
        assertThat(config.isCloud()).isFalse();
    }
}
