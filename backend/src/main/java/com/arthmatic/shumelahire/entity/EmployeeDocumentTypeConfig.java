package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

public class EmployeeDocumentTypeConfig extends TenantAwareEntity {

    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String code;

    private String description;

    private Boolean isRequired = false;

    private Boolean requiresExpiry = false;

    private Boolean isActive = true;

    private LocalDateTime createdAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public Boolean getRequiresExpiry() { return requiresExpiry; }
    public void setRequiresExpiry(Boolean requiresExpiry) { this.requiresExpiry = requiresExpiry; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
