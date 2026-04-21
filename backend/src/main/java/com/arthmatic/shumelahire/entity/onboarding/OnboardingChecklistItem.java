package com.arthmatic.shumelahire.entity.onboarding;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class OnboardingChecklistItem {

    private Long id;

    @NotNull
    private Long checklistId;

    private Long templateItemId;

    @NotBlank
    private String title;

    private String description;

    @NotNull
    private String category;

    private LocalDate dueDate;

    private Boolean isRequired = true;

    private String status = "PENDING";

    private LocalDateTime completedAt;

    private String completedBy;

    private String notes;

    private Integer sortOrder = 0;

    public boolean isOverdue() {
        return dueDate != null && dueDate.isBefore(LocalDate.now()) && !"COMPLETED".equals(status);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getChecklistId() { return checklistId; }
    public void setChecklistId(Long checklistId) { this.checklistId = checklistId; }

    public Long getTemplateItemId() { return templateItemId; }
    public void setTemplateItemId(Long templateItemId) { this.templateItemId = templateItemId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public String getCompletedBy() { return completedBy; }
    public void setCompletedBy(String completedBy) { this.completedBy = completedBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
