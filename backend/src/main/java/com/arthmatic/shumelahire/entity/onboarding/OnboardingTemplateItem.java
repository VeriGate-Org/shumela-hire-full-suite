package com.arthmatic.shumelahire.entity.onboarding;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class OnboardingTemplateItem {

    private Long id;

    @NotNull
    private Long templateId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private OnboardingCategory category;

    private Integer dueOffsetDays = 0;

    private Boolean isRequired = true;

    private Integer sortOrder = 0;

    public enum OnboardingCategory {
        DOCUMENTS, IT_SETUP, ORIENTATION, COMPLIANCE, BENEFITS
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public OnboardingCategory getCategory() { return category; }
    public void setCategory(OnboardingCategory category) { this.category = category; }

    public Integer getDueOffsetDays() { return dueOffsetDays; }
    public void setDueOffsetDays(Integer dueOffsetDays) { this.dueOffsetDays = dueOffsetDays; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
