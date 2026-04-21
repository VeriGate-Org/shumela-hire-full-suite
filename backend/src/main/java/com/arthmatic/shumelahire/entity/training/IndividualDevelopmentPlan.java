package com.arthmatic.shumelahire.entity.training;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class IndividualDevelopmentPlan extends TenantAwareEntity {

    private Long id;

    @NotNull
    private Long employeeId;

    @NotBlank
    private String title;

    private String description;

    private LocalDate startDate;

    private LocalDate targetDate;

    private IDPStatus status = IDPStatus.DRAFT;

    private Long managerId;

    private List<IDPGoal> goals;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum IDPStatus {
        DRAFT, ACTIVE, COMPLETED, CANCELLED
    }

    public IndividualDevelopmentPlan() {
        this.createdAt = LocalDateTime.now();
    }

    public double getProgressPercent() {
        if (goals == null || goals.isEmpty()) return 0;
        long completed = goals.stream().filter(g -> g.getStatus() == IDPGoal.GoalStatus.COMPLETED).count();
        return (completed * 100.0) / goals.size();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public IDPStatus getStatus() { return status; }
    public void setStatus(IDPStatus status) { this.status = status; }

    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }

    public List<IDPGoal> getGoals() { return goals; }
    public void setGoals(List<IDPGoal> goals) { this.goals = goals; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
