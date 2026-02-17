package com.arthmatic.shumelahire.entity.performance;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "performance_reviews")
public class PerformanceReview {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id", nullable = false)
    @NotNull(message = "Performance contract is required")
    private PerformanceContract contract;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false)
    private ReviewType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReviewStatus status = ReviewStatus.PENDING;
    
    // Self-assessment data
    @Column(name = "self_assessment_notes", columnDefinition = "TEXT")
    private String selfAssessmentNotes;
    
    @Column(name = "self_rating", precision = 3, scale = 2)
    private BigDecimal selfRating;
    
    @Column(name = "self_submitted_at")
    private LocalDateTime selfSubmittedAt;
    
    // Manager assessment data
    @Column(name = "manager_assessment_notes", columnDefinition = "TEXT")
    private String managerAssessmentNotes;
    
    @Column(name = "manager_rating", precision = 3, scale = 2)
    private BigDecimal managerRating;
    
    @Column(name = "manager_submitted_at")
    private LocalDateTime managerSubmittedAt;
    
    // Final scores (post-moderation)
    @Column(name = "final_rating", precision = 3, scale = 2)
    private BigDecimal finalRating;
    
    @Column(name = "moderated_at")
    private LocalDateTime moderatedAt;
    
    @Column(name = "moderated_by", length = 50)
    private String moderatedBy;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    // Review period dates
    @Column(name = "review_period_start")
    private LocalDateTime reviewPeriodStart;
    
    @Column(name = "review_period_end")
    private LocalDateTime reviewPeriodEnd;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @Column(name = "tenant_id", nullable = false, length = 50)
    private String tenantId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReviewGoalScore> goalScores;
    
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ReviewEvidence> evidenceFiles;
    
    // Constructors
    public PerformanceReview() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceReview(PerformanceContract contract, ReviewType type, String tenantId) {
        this();
        this.contract = contract;
        this.type = type;
        this.tenantId = tenantId;
    }
    
    // Lifecycle callbacks
    @PreUpdate
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
    
    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<ReviewGoalScore> getGoalScores() { return goalScores; }
    public void setGoalScores(List<ReviewGoalScore> goalScores) { this.goalScores = goalScores; }
    
    public List<ReviewEvidence> getEvidenceFiles() { return evidenceFiles; }
    public void setEvidenceFiles(List<ReviewEvidence> evidenceFiles) { this.evidenceFiles = evidenceFiles; }
}