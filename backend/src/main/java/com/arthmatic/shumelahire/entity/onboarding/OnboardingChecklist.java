package com.arthmatic.shumelahire.entity.onboarding;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OnboardingChecklist extends TenantAwareEntity {

    private Long id;

    @NotNull
    private Long employeeId;

    @NotNull
    private Long templateId;

    @NotNull
    private LocalDate startDate;

    private LocalDate dueDate;

    private ChecklistStatus status = ChecklistStatus.IN_PROGRESS;

    private Long assignedHrId;

    private List<OnboardingChecklistItem> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum ChecklistStatus {
        IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
    }

    public OnboardingChecklist() {
        this.createdAt = LocalDateTime.now();
    }

    public int getCompletedCount() {
        if (items == null) return 0;
        return (int) items.stream().filter(i -> "COMPLETED".equals(i.getStatus())).count();
    }

    public int getTotalCount() {
        return items == null ? 0 : items.size();
    }

    public double getProgressPercent() {
        int total = getTotalCount();
        return total == 0 ? 0 : (getCompletedCount() * 100.0) / total;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public ChecklistStatus getStatus() { return status; }
    public void setStatus(ChecklistStatus status) { this.status = status; }

    public Long getAssignedHrId() { return assignedHrId; }
    public void setAssignedHrId(Long assignedHrId) { this.assignedHrId = assignedHrId; }

    public List<OnboardingChecklistItem> getItems() { return items; }
    public void setItems(List<OnboardingChecklistItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
