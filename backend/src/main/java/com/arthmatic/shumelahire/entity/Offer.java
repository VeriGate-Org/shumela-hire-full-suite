package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Offer extends TenantAwareEntity {

    private String id;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @NotNull(message = "Application is required")
    private Application application;

    private String offerNumber;

    private Integer version = 1;

    private OfferStatus status = OfferStatus.DRAFT;

    private OfferType offerType = OfferType.FULL_TIME_PERMANENT;

    private NegotiationStatus negotiationStatus = NegotiationStatus.NOT_STARTED;

    // Position Details
    private String jobTitle;

    private String department;

    private String reportingManager;

    private String workLocation;

    private Boolean remoteWorkAllowed = false;

    // Compensation Details
    @DecimalMin(value = "0.0", message = "Base salary must be positive")
    private BigDecimal baseSalary;

    private String currency = "ZAR";

    private String salaryFrequency = "ANNUALLY"; // ANNUALLY, MONTHLY, HOURLY

    private Boolean bonusEligible = false;

    private BigDecimal bonusTargetPercentage;

    private BigDecimal bonusMaximumPercentage;

    private Boolean commissionEligible = false;

    private String commissionStructure;

    private Boolean equityEligible = false;

    private String equityDetails;

    private BigDecimal signingBonus;

    private BigDecimal relocationAllowance;

    // Benefits
    private String benefitsPackage;

    private Integer vacationDaysAnnual;

    private Integer sickDaysAnnual;

    private Boolean healthInsurance = false;

    private Boolean retirementPlan = false;

    private BigDecimal retirementContributionPercentage;

    private String otherBenefits;

    // Contract Terms
    private String employmentType; // PERMANENT, CONTRACT, TEMPORARY

    private Integer contractDurationMonths;

    private LocalDate contractEndDate;

    private Integer probationaryPeriodDays;

    private Integer noticePeriodDays = 30;

    private LocalDate startDate;

    private Boolean startDateFlexible = false;

    private LocalDate earliestStartDate;

    private LocalDate latestStartDate;

    // Offer Lifecycle
    private LocalDateTime offerExpiryDate;

    private LocalDateTime offerSentAt;

    private LocalDateTime candidateViewedAt;

    private LocalDateTime candidateResponseAt;

    private LocalDateTime acceptedAt;

    private LocalDateTime declinedAt;

    private LocalDateTime withdrawnAt;

    // Approval Workflow
    private Boolean requiresApproval = true;

    private Integer approvalLevelRequired = 1;

    private String approvedBy;

    private LocalDateTime approvedAt;

    private String approvalNotes;

    private String rejectedBy;

    private LocalDateTime rejectedAt;

    private String rejectionReason;

    // Negotiation Details
    private Integer negotiationRounds = 0;

    private LocalDateTime lastNegotiationAt;

    private String negotiationNotes;

    private String candidateCounterOffer;

    private String companyResponse;

    // Additional Terms
    private String specialConditions;

    private Boolean confidentialityAgreement = false;

    private Boolean nonCompeteAgreement = false;

    private Integer nonCompeteDurationMonths;

    private Boolean intellectualPropertyAgreement = false;

    // Document References
    private String offerLetterTemplateId;

    private String contractTemplateId;

    private String offerDocumentPath;

    private String signedDocumentPath;

    // E-Signature
    private String eSignatureEnvelopeId;

    private String eSignatureStatus;

    private LocalDateTime eSignatureSentAt;

    private LocalDateTime eSignatureCompletedAt;

    private String eSignatureProvider;

    private String eSignatureSignerEmail;

    // Tracking
    private String createdBy;

    private LocalDateTime createdAt;

    private String updatedBy;

    private LocalDateTime updatedAt;

    private String supersededByOfferId;

    private String supersedesOfferId;

    // Constructors
    public Offer() {
        this.createdAt = LocalDateTime.now();
        this.offerNumber = generateOfferNumber();
    }

    public Offer(Application application, String jobTitle, BigDecimal baseSalary, String createdBy) {
        this();
        this.application = application;
        this.jobTitle = jobTitle;
        this.department = application.getDepartment();
        this.baseSalary = baseSalary;
        this.createdBy = createdBy;
        
        // Set default expiry to 7 days from creation
        this.offerExpiryDate = LocalDateTime.now().plusDays(7);
    }

    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Business methods
    public boolean canBeEdited() {
        return status.canBeEdited();
    }

    public boolean canBeApproved() {
        return status == OfferStatus.PENDING_APPROVAL;
    }

    public boolean canBeSent() {
        return status.canBeSent();
    }

    public boolean canBeWithdrawn() {
        return status.canBeWithdrawn();
    }

    public boolean canBeNegotiated() {
        return status.canBeNegotiated();
    }

    public boolean isExpired() {
        return offerExpiryDate != null && LocalDateTime.now().isAfter(offerExpiryDate);
    }

    public boolean isNearExpiry(int hours) {
        return offerExpiryDate != null && 
               LocalDateTime.now().plusHours(hours).isAfter(offerExpiryDate);
    }

    public boolean hasBeenViewed() {
        return candidateViewedAt != null;
    }

    public boolean hasBeenResponded() {
        return candidateResponseAt != null;
    }

    public long getHoursUntilExpiry() {
        if (offerExpiryDate == null) return -1;
        return java.time.Duration.between(LocalDateTime.now(), offerExpiryDate).toHours();
    }

    public long getDaysSinceCreated() {
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    public long getDaysSinceSent() {
        if (offerSentAt == null) return -1;
        return java.time.temporal.ChronoUnit.DAYS.between(offerSentAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }

    public BigDecimal getTotalCompensation() {
        BigDecimal total = baseSalary;
        
        if (signingBonus != null) {
            total = total.add(signingBonus);
        }
        
        if (bonusEligible && bonusTargetPercentage != null) {
            BigDecimal bonusAmount = baseSalary.multiply(bonusTargetPercentage.divide(BigDecimal.valueOf(100)));
            total = total.add(bonusAmount);
        }
        
        return total;
    }

    public String getStatusDisplayName() {
        return status.getDisplayName();
    }

    public String getStatusIcon() {
        return status.getStatusIcon();
    }

    public String getStatusCssClass() {
        return status.getCssClass();
    }

    public String getNegotiationStatusDisplayName() {
        return negotiationStatus.getDisplayName();
    }

    public String getNegotiationStatusIcon() {
        return negotiationStatus.getIcon();
    }

    public String getNegotiationStatusCssClass() {
        return negotiationStatus.getCssClass();
    }

    private String generateOfferNumber() {
        // Generate unique offer number - in production, this should be more sophisticated
        return "OFF-" + System.currentTimeMillis();
    }

    public boolean requiresHigherApproval(BigDecimal threshold) {
        return getTotalCompensation().compareTo(threshold) > 0;
    }

    public boolean isVersionSuperseded() {
        return supersededByOfferId != null;
    }

    public boolean isAwaitingSignature() {
        return status == OfferStatus.AWAITING_SIGNATURE;
    }

    public boolean isSigned() {
        return status == OfferStatus.SIGNED;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public String getOfferNumber() {
        return offerNumber;
    }

    public void setOfferNumber(String offerNumber) {
        this.offerNumber = offerNumber;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus status) {
        this.status = status;
    }

    public OfferType getOfferType() {
        return offerType;
    }

    public void setOfferType(OfferType offerType) {
        this.offerType = offerType;
    }

    public NegotiationStatus getNegotiationStatus() {
        return negotiationStatus;
    }

    public void setNegotiationStatus(NegotiationStatus negotiationStatus) {
        this.negotiationStatus = negotiationStatus;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getReportingManager() {
        return reportingManager;
    }

    public void setReportingManager(String reportingManager) {
        this.reportingManager = reportingManager;
    }

    public String getWorkLocation() {
        return workLocation;
    }

    public void setWorkLocation(String workLocation) {
        this.workLocation = workLocation;
    }

    public Boolean getRemoteWorkAllowed() {
        return remoteWorkAllowed;
    }

    public void setRemoteWorkAllowed(Boolean remoteWorkAllowed) {
        this.remoteWorkAllowed = remoteWorkAllowed;
    }

    public BigDecimal getBaseSalary() {
        return baseSalary;
    }

    public void setBaseSalary(BigDecimal baseSalary) {
        this.baseSalary = baseSalary;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getSalaryFrequency() {
        return salaryFrequency;
    }

    public void setSalaryFrequency(String salaryFrequency) {
        this.salaryFrequency = salaryFrequency;
    }

    public Boolean getBonusEligible() {
        return bonusEligible;
    }

    public void setBonusEligible(Boolean bonusEligible) {
        this.bonusEligible = bonusEligible;
    }

    public BigDecimal getBonusTargetPercentage() {
        return bonusTargetPercentage;
    }

    public void setBonusTargetPercentage(BigDecimal bonusTargetPercentage) {
        this.bonusTargetPercentage = bonusTargetPercentage;
    }

    public BigDecimal getBonusMaximumPercentage() {
        return bonusMaximumPercentage;
    }

    public void setBonusMaximumPercentage(BigDecimal bonusMaximumPercentage) {
        this.bonusMaximumPercentage = bonusMaximumPercentage;
    }

    public Boolean getCommissionEligible() {
        return commissionEligible;
    }

    public void setCommissionEligible(Boolean commissionEligible) {
        this.commissionEligible = commissionEligible;
    }

    public String getCommissionStructure() {
        return commissionStructure;
    }

    public void setCommissionStructure(String commissionStructure) {
        this.commissionStructure = commissionStructure;
    }

    public Boolean getEquityEligible() {
        return equityEligible;
    }

    public void setEquityEligible(Boolean equityEligible) {
        this.equityEligible = equityEligible;
    }

    public String getEquityDetails() {
        return equityDetails;
    }

    public void setEquityDetails(String equityDetails) {
        this.equityDetails = equityDetails;
    }

    public BigDecimal getSigningBonus() {
        return signingBonus;
    }

    public void setSigningBonus(BigDecimal signingBonus) {
        this.signingBonus = signingBonus;
    }

    public BigDecimal getRelocationAllowance() {
        return relocationAllowance;
    }

    public void setRelocationAllowance(BigDecimal relocationAllowance) {
        this.relocationAllowance = relocationAllowance;
    }

    public String getBenefitsPackage() {
        return benefitsPackage;
    }

    public void setBenefitsPackage(String benefitsPackage) {
        this.benefitsPackage = benefitsPackage;
    }

    public Integer getVacationDaysAnnual() {
        return vacationDaysAnnual;
    }

    public void setVacationDaysAnnual(Integer vacationDaysAnnual) {
        this.vacationDaysAnnual = vacationDaysAnnual;
    }

    public Integer getSickDaysAnnual() {
        return sickDaysAnnual;
    }

    public void setSickDaysAnnual(Integer sickDaysAnnual) {
        this.sickDaysAnnual = sickDaysAnnual;
    }

    public Boolean getHealthInsurance() {
        return healthInsurance;
    }

    public void setHealthInsurance(Boolean healthInsurance) {
        this.healthInsurance = healthInsurance;
    }

    public Boolean getRetirementPlan() {
        return retirementPlan;
    }

    public void setRetirementPlan(Boolean retirementPlan) {
        this.retirementPlan = retirementPlan;
    }

    public BigDecimal getRetirementContributionPercentage() {
        return retirementContributionPercentage;
    }

    public void setRetirementContributionPercentage(BigDecimal retirementContributionPercentage) {
        this.retirementContributionPercentage = retirementContributionPercentage;
    }

    public String getOtherBenefits() {
        return otherBenefits;
    }

    public void setOtherBenefits(String otherBenefits) {
        this.otherBenefits = otherBenefits;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public void setEmploymentType(String employmentType) {
        this.employmentType = employmentType;
    }

    public Integer getContractDurationMonths() {
        return contractDurationMonths;
    }

    public void setContractDurationMonths(Integer contractDurationMonths) {
        this.contractDurationMonths = contractDurationMonths;
    }

    public LocalDate getContractEndDate() {
        return contractEndDate;
    }

    public void setContractEndDate(LocalDate contractEndDate) {
        this.contractEndDate = contractEndDate;
    }

    public Integer getProbationaryPeriodDays() {
        return probationaryPeriodDays;
    }

    public void setProbationaryPeriodDays(Integer probationaryPeriodDays) {
        this.probationaryPeriodDays = probationaryPeriodDays;
    }

    public Integer getNoticePeriodDays() {
        return noticePeriodDays;
    }

    public void setNoticePeriodDays(Integer noticePeriodDays) {
        this.noticePeriodDays = noticePeriodDays;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public Boolean getStartDateFlexible() {
        return startDateFlexible;
    }

    public void setStartDateFlexible(Boolean startDateFlexible) {
        this.startDateFlexible = startDateFlexible;
    }

    public LocalDate getEarliestStartDate() {
        return earliestStartDate;
    }

    public void setEarliestStartDate(LocalDate earliestStartDate) {
        this.earliestStartDate = earliestStartDate;
    }

    public LocalDate getLatestStartDate() {
        return latestStartDate;
    }

    public void setLatestStartDate(LocalDate latestStartDate) {
        this.latestStartDate = latestStartDate;
    }

    public LocalDateTime getOfferExpiryDate() {
        return offerExpiryDate;
    }

    public void setOfferExpiryDate(LocalDateTime offerExpiryDate) {
        this.offerExpiryDate = offerExpiryDate;
    }

    public LocalDateTime getOfferSentAt() {
        return offerSentAt;
    }

    public void setOfferSentAt(LocalDateTime offerSentAt) {
        this.offerSentAt = offerSentAt;
    }

    public LocalDateTime getCandidateViewedAt() {
        return candidateViewedAt;
    }

    public void setCandidateViewedAt(LocalDateTime candidateViewedAt) {
        this.candidateViewedAt = candidateViewedAt;
    }

    public LocalDateTime getCandidateResponseAt() {
        return candidateResponseAt;
    }

    public void setCandidateResponseAt(LocalDateTime candidateResponseAt) {
        this.candidateResponseAt = candidateResponseAt;
    }

    public LocalDateTime getAcceptedAt() {
        return acceptedAt;
    }

    public void setAcceptedAt(LocalDateTime acceptedAt) {
        this.acceptedAt = acceptedAt;
    }

    public LocalDateTime getDeclinedAt() {
        return declinedAt;
    }

    public void setDeclinedAt(LocalDateTime declinedAt) {
        this.declinedAt = declinedAt;
    }

    public LocalDateTime getWithdrawnAt() {
        return withdrawnAt;
    }

    public void setWithdrawnAt(LocalDateTime withdrawnAt) {
        this.withdrawnAt = withdrawnAt;
    }

    public Boolean getRequiresApproval() {
        return requiresApproval;
    }

    public void setRequiresApproval(Boolean requiresApproval) {
        this.requiresApproval = requiresApproval;
    }

    public Integer getApprovalLevelRequired() {
        return approvalLevelRequired;
    }

    public void setApprovalLevelRequired(Integer approvalLevelRequired) {
        this.approvalLevelRequired = approvalLevelRequired;
    }

    public String getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public String getApprovalNotes() {
        return approvalNotes;
    }

    public void setApprovalNotes(String approvalNotes) {
        this.approvalNotes = approvalNotes;
    }

    public String getRejectedBy() {
        return rejectedBy;
    }

    public void setRejectedBy(String rejectedBy) {
        this.rejectedBy = rejectedBy;
    }

    public LocalDateTime getRejectedAt() {
        return rejectedAt;
    }

    public void setRejectedAt(LocalDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Integer getNegotiationRounds() {
        return negotiationRounds;
    }

    public void setNegotiationRounds(Integer negotiationRounds) {
        this.negotiationRounds = negotiationRounds;
    }

    public LocalDateTime getLastNegotiationAt() {
        return lastNegotiationAt;
    }

    public void setLastNegotiationAt(LocalDateTime lastNegotiationAt) {
        this.lastNegotiationAt = lastNegotiationAt;
    }

    public String getNegotiationNotes() {
        return negotiationNotes;
    }

    public void setNegotiationNotes(String negotiationNotes) {
        this.negotiationNotes = negotiationNotes;
    }

    public String getCandidateCounterOffer() {
        return candidateCounterOffer;
    }

    public void setCandidateCounterOffer(String candidateCounterOffer) {
        this.candidateCounterOffer = candidateCounterOffer;
    }

    public String getCompanyResponse() {
        return companyResponse;
    }

    public void setCompanyResponse(String companyResponse) {
        this.companyResponse = companyResponse;
    }

    public String getSpecialConditions() {
        return specialConditions;
    }

    public void setSpecialConditions(String specialConditions) {
        this.specialConditions = specialConditions;
    }

    public Boolean getConfidentialityAgreement() {
        return confidentialityAgreement;
    }

    public void setConfidentialityAgreement(Boolean confidentialityAgreement) {
        this.confidentialityAgreement = confidentialityAgreement;
    }

    public Boolean getNonCompeteAgreement() {
        return nonCompeteAgreement;
    }

    public void setNonCompeteAgreement(Boolean nonCompeteAgreement) {
        this.nonCompeteAgreement = nonCompeteAgreement;
    }

    public Integer getNonCompeteDurationMonths() {
        return nonCompeteDurationMonths;
    }

    public void setNonCompeteDurationMonths(Integer nonCompeteDurationMonths) {
        this.nonCompeteDurationMonths = nonCompeteDurationMonths;
    }

    public Boolean getIntellectualPropertyAgreement() {
        return intellectualPropertyAgreement;
    }

    public void setIntellectualPropertyAgreement(Boolean intellectualPropertyAgreement) {
        this.intellectualPropertyAgreement = intellectualPropertyAgreement;
    }

    public String getOfferLetterTemplateId() {
        return offerLetterTemplateId;
    }

    public void setOfferLetterTemplateId(String offerLetterTemplateId) {
        this.offerLetterTemplateId = offerLetterTemplateId;
    }

    public String getContractTemplateId() {
        return contractTemplateId;
    }

    public void setContractTemplateId(String contractTemplateId) {
        this.contractTemplateId = contractTemplateId;
    }

    public String getOfferDocumentPath() {
        return offerDocumentPath;
    }

    public void setOfferDocumentPath(String offerDocumentPath) {
        this.offerDocumentPath = offerDocumentPath;
    }

    public String getSignedDocumentPath() {
        return signedDocumentPath;
    }

    public void setSignedDocumentPath(String signedDocumentPath) {
        this.signedDocumentPath = signedDocumentPath;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getSupersededByOfferId() {
        return supersededByOfferId;
    }

    public void setSupersededByOfferId(String supersededByOfferId) {
        this.supersededByOfferId = supersededByOfferId;
    }

    public String getSupersedesOfferId() {
        return supersedesOfferId;
    }

    public void setSupersedesOfferId(String supersedesOfferId) {
        this.supersedesOfferId = supersedesOfferId;
    }

    public String getESignatureEnvelopeId() {
        return eSignatureEnvelopeId;
    }

    public void setESignatureEnvelopeId(String eSignatureEnvelopeId) {
        this.eSignatureEnvelopeId = eSignatureEnvelopeId;
    }

    public String getESignatureStatus() {
        return eSignatureStatus;
    }

    public void setESignatureStatus(String eSignatureStatus) {
        this.eSignatureStatus = eSignatureStatus;
    }

    public LocalDateTime getESignatureSentAt() {
        return eSignatureSentAt;
    }

    public void setESignatureSentAt(LocalDateTime eSignatureSentAt) {
        this.eSignatureSentAt = eSignatureSentAt;
    }

    public LocalDateTime getESignatureCompletedAt() {
        return eSignatureCompletedAt;
    }

    public void setESignatureCompletedAt(LocalDateTime eSignatureCompletedAt) {
        this.eSignatureCompletedAt = eSignatureCompletedAt;
    }

    public String getESignatureProvider() {
        return eSignatureProvider;
    }

    public void setESignatureProvider(String eSignatureProvider) {
        this.eSignatureProvider = eSignatureProvider;
    }

    public String getESignatureSignerEmail() {
        return eSignatureSignerEmail;
    }

    public void setESignatureSignerEmail(String eSignatureSignerEmail) {
        this.eSignatureSignerEmail = eSignatureSignerEmail;
    }
}