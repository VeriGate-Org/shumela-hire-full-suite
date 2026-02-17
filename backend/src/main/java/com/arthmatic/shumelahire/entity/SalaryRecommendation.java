package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity(name = "TgSalaryRecommendation")
@Table(name = "tg_salary_recommendations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recommendation_number", unique = true, nullable = false)
    private String recommendationNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SalaryRecommendationStatus status = SalaryRecommendationStatus.DRAFT;

    // Position details
    @Column(name = "position_title", nullable = false)
    private String positionTitle;

    @Column(name = "department")
    private String department;

    @Column(name = "job_grade")
    private String jobGrade;

    @Column(name = "position_level")
    private String positionLevel;

    // Request details
    @Column(name = "requested_by")
    private String requestedBy;

    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "candidate_current_salary", precision = 15, scale = 2)
    private BigDecimal candidateCurrentSalary;

    @Column(name = "candidate_expected_salary", precision = 15, scale = 2)
    private BigDecimal candidateExpectedSalary;

    @Column(name = "market_data_reference", columnDefinition = "TEXT")
    private String marketDataReference;

    // Proposed salary range
    @Column(name = "proposed_min_salary", precision = 15, scale = 2)
    private BigDecimal proposedMinSalary;

    @Column(name = "proposed_max_salary", precision = 15, scale = 2)
    private BigDecimal proposedMaxSalary;

    @Column(name = "proposed_target_salary", precision = 15, scale = 2)
    private BigDecimal proposedTargetSalary;

    // Recommendation
    @Column(name = "recommended_salary", precision = 15, scale = 2)
    private BigDecimal recommendedSalary;

    @Column(name = "recommended_by")
    private String recommendedBy;

    @Column(name = "recommended_at")
    private LocalDateTime recommendedAt;

    @Column(name = "recommendation_justification", columnDefinition = "TEXT")
    private String recommendationJustification;

    // Additional compensation
    @Column(name = "bonus_recommendation", columnDefinition = "TEXT")
    private String bonusRecommendation;

    @Column(name = "equity_recommendation", columnDefinition = "TEXT")
    private String equityRecommendation;

    @Column(name = "benefits_notes", columnDefinition = "TEXT")
    private String benefitsNotes;

    // Approval
    @Column(name = "requires_approval")
    private Boolean requiresApproval = true;

    @Column(name = "approval_level_required")
    private Integer approvalLevelRequired;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "rejected_by")
    private String rejectedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Currency (defaults to ZAR)
    @Column(name = "currency")
    private String currency = "ZAR";

    // Links
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Application application;

    @Column(name = "offer_id")
    private Long offerId;

    // Timestamps
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public SalaryRecommendation() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecommendationNumber() { return recommendationNumber; }
    public void setRecommendationNumber(String recommendationNumber) { this.recommendationNumber = recommendationNumber; }

    public SalaryRecommendationStatus getStatus() { return status; }
    public void setStatus(SalaryRecommendationStatus status) { this.status = status; }

    public String getPositionTitle() { return positionTitle; }
    public void setPositionTitle(String positionTitle) { this.positionTitle = positionTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getJobGrade() { return jobGrade; }
    public void setJobGrade(String jobGrade) { this.jobGrade = jobGrade; }

    public String getPositionLevel() { return positionLevel; }
    public void setPositionLevel(String positionLevel) { this.positionLevel = positionLevel; }

    public String getRequestedBy() { return requestedBy; }
    public void setRequestedBy(String requestedBy) { this.requestedBy = requestedBy; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public BigDecimal getCandidateCurrentSalary() { return candidateCurrentSalary; }
    public void setCandidateCurrentSalary(BigDecimal candidateCurrentSalary) { this.candidateCurrentSalary = candidateCurrentSalary; }

    public BigDecimal getCandidateExpectedSalary() { return candidateExpectedSalary; }
    public void setCandidateExpectedSalary(BigDecimal candidateExpectedSalary) { this.candidateExpectedSalary = candidateExpectedSalary; }

    public String getMarketDataReference() { return marketDataReference; }
    public void setMarketDataReference(String marketDataReference) { this.marketDataReference = marketDataReference; }

    public BigDecimal getProposedMinSalary() { return proposedMinSalary; }
    public void setProposedMinSalary(BigDecimal proposedMinSalary) { this.proposedMinSalary = proposedMinSalary; }

    public BigDecimal getProposedMaxSalary() { return proposedMaxSalary; }
    public void setProposedMaxSalary(BigDecimal proposedMaxSalary) { this.proposedMaxSalary = proposedMaxSalary; }

    public BigDecimal getProposedTargetSalary() { return proposedTargetSalary; }
    public void setProposedTargetSalary(BigDecimal proposedTargetSalary) { this.proposedTargetSalary = proposedTargetSalary; }

    public BigDecimal getRecommendedSalary() { return recommendedSalary; }
    public void setRecommendedSalary(BigDecimal recommendedSalary) { this.recommendedSalary = recommendedSalary; }

    public String getRecommendedBy() { return recommendedBy; }
    public void setRecommendedBy(String recommendedBy) { this.recommendedBy = recommendedBy; }

    public LocalDateTime getRecommendedAt() { return recommendedAt; }
    public void setRecommendedAt(LocalDateTime recommendedAt) { this.recommendedAt = recommendedAt; }

    public String getRecommendationJustification() { return recommendationJustification; }
    public void setRecommendationJustification(String recommendationJustification) { this.recommendationJustification = recommendationJustification; }

    public String getBonusRecommendation() { return bonusRecommendation; }
    public void setBonusRecommendation(String bonusRecommendation) { this.bonusRecommendation = bonusRecommendation; }

    public String getEquityRecommendation() { return equityRecommendation; }
    public void setEquityRecommendation(String equityRecommendation) { this.equityRecommendation = equityRecommendation; }

    public String getBenefitsNotes() { return benefitsNotes; }
    public void setBenefitsNotes(String benefitsNotes) { this.benefitsNotes = benefitsNotes; }

    public Boolean getRequiresApproval() { return requiresApproval; }
    public void setRequiresApproval(Boolean requiresApproval) { this.requiresApproval = requiresApproval; }

    public Integer getApprovalLevelRequired() { return approvalLevelRequired; }
    public void setApprovalLevelRequired(Integer approvalLevelRequired) { this.approvalLevelRequired = approvalLevelRequired; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }

    public Long getOfferId() { return offerId; }
    public void setOfferId(Long offerId) { this.offerId = offerId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
