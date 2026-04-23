package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PipMilestone extends TenantAwareEntity {

    private String id;

    private PerformanceImprovementPlan pip;

    private String title;

    private String description;

    private LocalDate targetDate;

    private PipMilestoneStatus status = PipMilestoneStatus.PENDING;

    private String evidence;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public PerformanceImprovementPlan getPip() { return pip; }
    public void setPip(PerformanceImprovementPlan pip) { this.pip = pip; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public PipMilestoneStatus getStatus() { return status; }
    public void setStatus(PipMilestoneStatus status) { this.status = status; }
    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
