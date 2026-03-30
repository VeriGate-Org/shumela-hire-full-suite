package com.arthmatic.shumelahire.entity.integration;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import java.time.LocalDateTime;

public class SageConnectorConfig extends TenantAwareEntity {

    private Long id;

    private String name;

    private SageConnectorType connectorType;

    private SageAuthMethod authMethod = SageAuthMethod.API_KEY;

    private String baseUrl;

    private String credentials;

    private Boolean isActive = false;

    private LocalDateTime lastTestedAt;

    private Boolean lastTestSuccess;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public SageConnectorConfig() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public SageConnectorType getConnectorType() { return connectorType; }
    public void setConnectorType(SageConnectorType connectorType) { this.connectorType = connectorType; }

    public SageAuthMethod getAuthMethod() { return authMethod; }
    public void setAuthMethod(SageAuthMethod authMethod) { this.authMethod = authMethod; }

    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }

    public String getCredentials() { return credentials; }
    public void setCredentials(String credentials) { this.credentials = credentials; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getLastTestedAt() { return lastTestedAt; }
    public void setLastTestedAt(LocalDateTime lastTestedAt) { this.lastTestedAt = lastTestedAt; }

    public Boolean getLastTestSuccess() { return lastTestSuccess; }
    public void setLastTestSuccess(Boolean lastTestSuccess) { this.lastTestSuccess = lastTestSuccess; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
