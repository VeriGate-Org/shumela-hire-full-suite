package com.arthmatic.shumelahire.entity.onboarding;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OnboardingChecklist extends TenantAwareEntity {

    private String id;

    @NotNull
    private String employeeId;

    @NotNull
    private String templateId;

    @NotNull
    private LocalDate startDate;

    private LocalDate dueDate;

    private ChecklistStatus status = ChecklistStatus.IN_PROGRESS;

    private String assignedHrId;

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
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public ChecklistStatus getStatus() { return status; }
    public void setStatus(ChecklistStatus status) { this.status = status; }

    public String getAssignedHrId() { return assignedHrId; }
    public void setAssignedHrId(String assignedHrId) { this.assignedHrId = assignedHrId; }

    public List<OnboardingChecklistItem> getItems() { return items; }
    public void setItems(List<OnboardingChecklistItem> items) { this.items = items; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
