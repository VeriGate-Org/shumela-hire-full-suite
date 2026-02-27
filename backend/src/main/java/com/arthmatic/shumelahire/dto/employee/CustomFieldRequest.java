package com.arthmatic.shumelahire.dto.employee;

import com.arthmatic.shumelahire.entity.CustomFieldDataType;
import com.arthmatic.shumelahire.entity.CustomFieldEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CustomFieldRequest {

    @NotBlank(message = "Field name is required")
    private String fieldName;

    @NotBlank(message = "Field label is required")
    private String fieldLabel;

    @NotNull(message = "Entity type is required")
    private CustomFieldEntityType entityType;

    @NotNull(message = "Data type is required")
    private CustomFieldDataType dataType;

    private Boolean isRequired;
    private Boolean isActive;
    private Integer displayOrder;
    private String options; // JSON array for SELECT/MULTI_SELECT
    private String defaultValue;
    private String validationRegex;
    private String helpText;

    public CustomFieldRequest() {}

    // Getters and Setters
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
}
