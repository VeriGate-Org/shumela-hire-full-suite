package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SageAuthMethod;
import com.arthmatic.shumelahire.entity.integration.SageConnectorConfig;
import com.arthmatic.shumelahire.entity.integration.SageConnectorType;

import java.time.LocalDateTime;

public class SageConnectorConfigResponse {

    private String id;
    private String name;
    private SageConnectorType connectorType;
    private SageAuthMethod authMethod;
    private String baseUrl;
    private String credentials;
    private Boolean isActive;
    private LocalDateTime lastTestedAt;
    private Boolean lastTestSuccess;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SageConnectorConfigResponse() {}

    public SageConnectorConfigResponse(SageConnectorConfig entity) {
        this.id = entity.getId();
        this.name = entity.getName();
        this.connectorType = entity.getConnectorType();
        this.authMethod = entity.getAuthMethod();
        this.baseUrl = entity.getBaseUrl();
        this.credentials = "********";
        this.isActive = entity.getIsActive();
        this.lastTestedAt = entity.getLastTestedAt();
        this.lastTestSuccess = entity.getLastTestSuccess();
        this.createdAt = entity.getCreatedAt();
        this.updatedAt = entity.getUpdatedAt();
    }

    public static SageConnectorConfigResponse fromEntity(SageConnectorConfig entity) {
        return new SageConnectorConfigResponse(entity);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

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
