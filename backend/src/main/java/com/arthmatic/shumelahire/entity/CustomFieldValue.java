package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class CustomFieldValue extends TenantAwareEntity {

    private String id;

    @NotNull
    private CustomField customField;

    @NotNull
    private String entityId;

    @NotNull
    private CustomFieldEntityType entityType;

    private String fieldValue;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public CustomField getCustomField() { return customField; }
    public void setCustomField(CustomField customField) { this.customField = customField; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public CustomFieldEntityType getEntityType() { return entityType; }
    public void setEntityType(CustomFieldEntityType entityType) { this.entityType = entityType; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
