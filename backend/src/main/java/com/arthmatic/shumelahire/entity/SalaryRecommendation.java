package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryRecommendation extends TenantAwareEntity {

    private Long id;

    private String recommendationNumber;

    private SalaryRecommendationStatus status = SalaryRecommendationStatus.DRAFT;

    // Position details
    private String positionTitle;

    private String department;

    private String jobGrade;

    private String positionLevel;

    // Request details
    private String requestedBy;

    private String candidateName;

    private BigDecimal candidateCurrentSalary;

    private BigDecimal candidateExpectedSalary;

    private String marketDataReference;

    // Proposed salary range
    private BigDecimal proposedMinSalary;

    private BigDecimal proposedMaxSalary;

    private BigDecimal proposedTargetSalary;

    // Recommendation
    private BigDecimal recommendedSalary;

    private String recommendedBy;

    private LocalDateTime recommendedAt;

    private String recommendationJustification;

    // Additional compensation
    private String bonusRecommendation;

    private String equityRecommendation;

    private String benefitsNotes;

    // Approval
    private Boolean requiresApproval = true;

    private Integer approvalLevelRequired;

    private String approvedBy;

    private LocalDateTime approvedAt;

    private String approvalNotes;

    private String rejectedBy;

    private String rejectionReason;

    // Currency (defaults to ZAR)
    private String currency = "ZAR";

    // Links
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Application application;

    private Long offerId;

    // Timestamps
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public SalaryRecommendation() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

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
