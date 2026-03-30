package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PerformanceReview extends TenantAwareEntity {
    
    private Long id;
    
    @NotNull(message = "Performance contract is required")
    private PerformanceContract contract;
    
    private ReviewType type;
    
    private ReviewStatus status = ReviewStatus.PENDING;
    
    // Self-assessment data
    private String selfAssessmentNotes;
    
    private BigDecimal selfRating;
    
    private LocalDateTime selfSubmittedAt;
    
    // Manager assessment data
    private String managerAssessmentNotes;
    
    private BigDecimal managerRating;
    
    private LocalDateTime managerSubmittedAt;
    
    // Final scores (post-moderation)
    private BigDecimal finalRating;
    
    private LocalDateTime moderatedAt;
    
    private String moderatedBy;
    
    private LocalDateTime completedAt;
    
    // Review period dates
    private LocalDateTime reviewPeriodStart;
    
    private LocalDateTime reviewPeriodEnd;
    
    private LocalDateTime dueDate;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Relationships
    private List<ReviewGoalScore> goalScores;
    
    private List<ReviewEvidence> evidenceFiles;
    
    // Constructors
    public PerformanceReview() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceReview(PerformanceContract contract, ReviewType type) {
        this();
        this.contract = contract;
        this.type = type;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canSubmitSelfAssessment() {
        return status == ReviewStatus.PENDING;
    }
    
    public boolean canSubmitManagerAssessment() {
        return status == ReviewStatus.EMPLOYEE_SUBMITTED || status == ReviewStatus.PENDING;
    }
    
    public boolean isCompleted() {
        return status == ReviewStatus.COMPLETED;
    }
    
    public boolean isOverdue() {
        return dueDate != null && LocalDateTime.now().isAfter(dueDate) && !isCompleted();
    }
    
    public void submitSelfAssessment(String notes, BigDecimal rating) {
        if (!canSubmitSelfAssessment()) {
            throw new IllegalStateException("Self-assessment cannot be submitted in current state");
        }
        this.selfAssessmentNotes = notes;
        this.selfRating = rating;
        this.selfSubmittedAt = LocalDateTime.now();
        this.status = ReviewStatus.EMPLOYEE_SUBMITTED;
    }
    
    public void submitManagerAssessment(String notes, BigDecimal rating) {
        if (!canSubmitManagerAssessment()) {
            throw new IllegalStateException("Manager assessment cannot be submitted in current state");
        }
        this.managerAssessmentNotes = notes;
        this.managerRating = rating;
        this.managerSubmittedAt = LocalDateTime.now();
        
        if (status == ReviewStatus.EMPLOYEE_SUBMITTED) {
            this.status = ReviewStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        } else {
            this.status = ReviewStatus.MANAGER_SUBMITTED;
        }
    }
    
    public void completeReview() {
        if (selfSubmittedAt != null && managerSubmittedAt != null && !isCompleted()) {
            this.status = ReviewStatus.COMPLETED;
            this.completedAt = LocalDateTime.now();
        }
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public PerformanceContract getContract() { return contract; }
    public void setContract(PerformanceContract contract) { this.contract = contract; }
    
    public ReviewType getType() { return type; }
    public void setType(ReviewType type) { this.type = type; }
    
    public ReviewStatus getStatus() { return status; }
    public void setStatus(ReviewStatus status) { this.status = status; }
    
    public String getSelfAssessmentNotes() { return selfAssessmentNotes; }
    public void setSelfAssessmentNotes(String selfAssessmentNotes) { this.selfAssessmentNotes = selfAssessmentNotes; }
    
    public BigDecimal getSelfRating() { return selfRating; }
    public void setSelfRating(BigDecimal selfRating) { this.selfRating = selfRating; }
    
    public LocalDateTime getSelfSubmittedAt() { return selfSubmittedAt; }
    public void setSelfSubmittedAt(LocalDateTime selfSubmittedAt) { this.selfSubmittedAt = selfSubmittedAt; }
    
    public String getManagerAssessmentNotes() { return managerAssessmentNotes; }
    public void setManagerAssessmentNotes(String managerAssessmentNotes) { this.managerAssessmentNotes = managerAssessmentNotes; }
    
    public BigDecimal getManagerRating() { return managerRating; }
    public void setManagerRating(BigDecimal managerRating) { this.managerRating = managerRating; }
    
    public LocalDateTime getManagerSubmittedAt() { return managerSubmittedAt; }
    public void setManagerSubmittedAt(LocalDateTime managerSubmittedAt) { this.managerSubmittedAt = managerSubmittedAt; }
    
    public BigDecimal getFinalRating() { return finalRating; }
    public void setFinalRating(BigDecimal finalRating) { this.finalRating = finalRating; }
    
    public LocalDateTime getModeratedAt() { return moderatedAt; }
    public void setModeratedAt(LocalDateTime moderatedAt) { this.moderatedAt = moderatedAt; }
    
    public String getModeratedBy() { return moderatedBy; }
    public void setModeratedBy(String moderatedBy) { this.moderatedBy = moderatedBy; }
    
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
    
    public LocalDateTime getReviewPeriodStart() { return reviewPeriodStart; }
    public void setReviewPeriodStart(LocalDateTime reviewPeriodStart) { this.reviewPeriodStart = reviewPeriodStart; }
    
    public LocalDateTime getReviewPeriodEnd() { return reviewPeriodEnd; }
    public void setReviewPeriodEnd(LocalDateTime reviewPeriodEnd) { this.reviewPeriodEnd = reviewPeriodEnd; }
    
    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<ReviewGoalScore> getGoalScores() { return goalScores; }
    public void setGoalScores(List<ReviewGoalScore> goalScores) { this.goalScores = goalScores; }
    
    public List<ReviewEvidence> getEvidenceFiles() { return evidenceFiles; }
    public void setEvidenceFiles(List<ReviewEvidence> evidenceFiles) { this.evidenceFiles = evidenceFiles; }
}