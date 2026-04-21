package com.arthmatic.shumelahire.entity.training;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class IDPGoal {

    private Long id;

    @NotNull
    private Long planId;

    @NotBlank
    private String title;

    private String description;

    private LocalDate targetDate;

    private GoalStatus status = GoalStatus.NOT_STARTED;

    private Long linkedCourseId;

    private Long linkedCertificationId;

    private Integer sortOrder = 0;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public enum GoalStatus {
        NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
    }

    public IDPGoal() {
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }

    public GoalStatus getStatus() { return status; }
    public void setStatus(GoalStatus status) { this.status = status; }

    public Long getLinkedCourseId() { return linkedCourseId; }
    public void setLinkedCourseId(Long linkedCourseId) { this.linkedCourseId = linkedCourseId; }

    public Long getLinkedCertificationId() { return linkedCertificationId; }
    public void setLinkedCertificationId(Long linkedCertificationId) { this.linkedCertificationId = linkedCertificationId; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
