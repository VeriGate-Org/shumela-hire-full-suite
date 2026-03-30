package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class CustomFieldValue extends TenantAwareEntity {

    private Long id;

    @NotNull
    private CustomField customField;

    @NotNull
    private Long entityId;

    @NotNull
    private CustomFieldEntityType entityType;

    private String fieldValue;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CustomField getCustomField() { return customField; }
    public void setCustomField(CustomField customField) { this.customField = customField; }

    public Long getEntityId() { return entityId; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }

    public CustomFieldEntityType getEntityType() { return entityType; }
    public void setEntityType(CustomFieldEntityType entityType) { this.entityType = entityType; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
