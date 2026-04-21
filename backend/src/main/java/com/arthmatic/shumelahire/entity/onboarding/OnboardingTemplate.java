package com.arthmatic.shumelahire.entity.onboarding;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;

public class OnboardingTemplate extends TenantAwareEntity {

    private Long id;

    @NotBlank
    private String name;

    private String description;

    private String department;

    private Boolean isActive = true;

    private List<OnboardingTemplateItem> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public OnboardingTemplate() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public List<OnboardingTemplateItem> getItems() { return items; }
    public void setItems(List<OnboardingTemplateItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
