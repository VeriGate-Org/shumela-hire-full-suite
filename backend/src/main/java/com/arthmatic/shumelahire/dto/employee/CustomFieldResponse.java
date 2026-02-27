package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.CustomField;
import com.arthmatic.shumelahire.entity.CustomFieldDataType;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;

import java.time.LocalDateTime;

public class CustomFieldResponse {

    private Long id;
    private String fieldName;
    private String fieldLabel;
    private CustomFieldEntityType entityType;
    private CustomFieldDataType dataType;
    private Boolean isRequired;
    private Boolean isActive;
    private Integer displayOrder;
    private String options;
    private String defaultValue;
    private String validationRegex;
    private String helpText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public CustomFieldResponse() {}

    public static CustomFieldResponse fromEntity(CustomField field) {
        CustomFieldResponse response = new CustomFieldResponse();
        response.setId(field.getId());
        response.setFieldName(field.getFieldName());
        response.setFieldLabel(field.getFieldLabel());
        response.setEntityType(field.getEntityType());
        response.setDataType(field.getDataType());
        response.setIsRequired(field.getIsRequired());
        response.setIsActive(field.getIsActive());
        response.setDisplayOrder(field.getDisplayOrder());
        response.setOptions(field.getOptions());
        response.setDefaultValue(field.getDefaultValue());
        response.setValidationRegex(field.getValidationRegex());
        response.setHelpText(field.getHelpText());
        response.setCreatedAt(field.getCreatedAt());
        response.setUpdatedAt(field.getUpdatedAt());
        return response;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFieldName() { return fieldName; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }

    public String getFieldLabel() { return fieldLabel; }
    public void setFieldLabel(String fieldLabel) { this.fieldLabel = fieldLabel; }

    public CustomFieldEntityType getEntityType() { return entityType; }
    public void setEntityType(CustomFieldEntityType entityType) { this.entityType = entityType; }

    public CustomFieldDataType getDataType() { return dataType; }
    public void setDataType(CustomFieldDataType dataType) { this.dataType = dataType; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }

    public String getOptions() { return options; }
    public void setOptions(String options) { this.options = options; }

    public String getDefaultValue() { return defaultValue; }
    public void setDefaultValue(String defaultValue) { this.defaultValue = defaultValue; }

    public String getValidationRegex() { return validationRegex; }
    public void setValidationRegex(String validationRegex) { this.validationRegex = validationRegex; }

    public String getHelpText() { return helpText; }
    public void setHelpText(String helpText) { this.helpText = helpText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
