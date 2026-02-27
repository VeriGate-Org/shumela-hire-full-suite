package com.arthmatic.shumelahire.dto.employee;

import jakarta.validation.constraints.NotNull;

public class CustomFieldValueRequest {

    @NotNull(message = "Custom field ID is required")
    private Long customFieldId;

    private String fieldValue;

    public CustomFieldValueRequest() {}

    public Long getCustomFieldId() { return customFieldId; }
    public void setCustomFieldId(Long customFieldId) { this.customFieldId = customFieldId; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }
}
