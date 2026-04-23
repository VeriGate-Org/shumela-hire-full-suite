package com.arthmatic.shumelahire.dto.employee;

import jakarta.validation.constraints.NotNull;

public class CustomFieldValueRequest {

    @NotNull(message = "Custom field ID is required")
    private String customFieldId;

    private String fieldValue;

    public CustomFieldValueRequest() {}

    public String getCustomFieldId() { return customFieldId; }
    public void setCustomFieldId(String customFieldId) { this.customFieldId = customFieldId; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }
}
