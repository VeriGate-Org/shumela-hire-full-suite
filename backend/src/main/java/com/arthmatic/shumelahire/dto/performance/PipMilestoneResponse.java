package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.PipMilestone;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PipMilestoneResponse {

    private Long id;
    private Long pipId;
    private String title;
    private String description;
    private LocalDate targetDate;
    private String status;
    private String evidence;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public PipMilestoneResponse() {}

    public static PipMilestoneResponse fromEntity(PipMilestone entity) {
        PipMilestoneResponse r = new PipMilestoneResponse();
        r.id = entity.getId();
        r.pipId = entity.getPip() != null ? entity.getPip().getId() : null;
        r.title = entity.getTitle();
        r.description = entity.getDescription();
        r.targetDate = entity.getTargetDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.evidence = entity.getEvidence();
        r.reviewedAt = entity.getReviewedAt();
        r.createdAt = entity.getCreatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPipId() { return pipId; }
    public void setPipId(Long pipId) { this.pipId = pipId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
