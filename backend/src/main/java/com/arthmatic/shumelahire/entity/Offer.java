package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offers")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Offer extends TenantAwareEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @NotNull(message = "Application is required")
    private Application application;

    @Column(name = "offer_number", unique = true, nullable = false)
    private String offerNumber;

    @Column(name = "version", nullable = false)
    private Integer version = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OfferStatus status = OfferStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "offer_type", nullable = false)
    private OfferType offerType = OfferType.FULL_TIME_PERMANENT;

    @Enumerated(EnumType.STRING)
    @Column(name = "negotiation_status", nullable = false)
    private NegotiationStatus negotiationStatus = NegotiationStatus.NOT_STARTED;

    // Position Details
    @Column(name = "job_title", nullable = false)
    private String jobTitle;

    @Column(name = "department", nullable = false)
    private String department;

    @Column(name = "reporting_manager")
    private String reportingManager;

    @Column(name = "work_location")
    private String workLocation;

    @Column(name = "remote_work_allowed")
    private Boolean remoteWorkAllowed = false;

    // Compensation Details
    @Column(name = "base_salary", precision = 15, scale = 2, nullable = false)
    @DecimalMin(value = "0.0", message = "Base salary must be positive")
    private BigDecimal baseSalary;

    @Column(name = "currency", nullable = false)
    private String currency = "ZAR";

    @Column(name = "salary_frequency")
    private String salaryFrequency = "ANNUALLY"; // ANNUALLY, MONTHLY, HOURLY

    @Column(name = "bonus_eligible")
    private Boolean bonusEligible = false;

    @Column(name = "bonus_target_percentage")
    private BigDecimal bonusTargetPercentage;

    @Column(name = "bonus_maximum_percentage")
    private BigDecimal bonusMaximumPercentage;

    @Column(name = "commission_eligible")
    private Boolean commissionEligible = false;

    @Column(name = "commission_structure", columnDefinition = "TEXT")
    private String commissionStructure;

    @Column(name = "equity_eligible")
    private Boolean equityEligible = false;

    @Column(name = "equity_details", columnDefinition = "TEXT")
    private String equityDetails;

    @Column(name = "signing_bonus", precision = 15, scale = 2)
    private BigDecimal signingBonus;

    @Column(name = "relocation_allowance", precision = 15, scale = 2)
    private BigDecimal relocationAllowance;

    // Benefits
    @Column(name = "benefits_package", columnDefinition = "TEXT")
    private String benefitsPackage;

    @Column(name = "vacation_days_annual")
    private Integer vacationDaysAnnual;

    @Column(name = "sick_days_annual")
    private Integer sickDaysAnnual;

    @Column(name = "health_insurance")
    private Boolean healthInsurance = false;

    @Column(name = "retirement_plan")
    private Boolean retirementPlan = false;

    @Column(name = "retirement_contribution_percentage")
    private BigDecimal retirementContributionPercentage;

    @Column(name = "other_benefits", columnDefinition = "TEXT")
    private String otherBenefits;

    // Contract Terms
    @Column(name = "employment_type")
    private String employmentType; // PERMANENT, CONTRACT, TEMPORARY

    @Column(name = "contract_duration_months")
    private Integer contractDurationMonths;

    @Column(name = "contract_end_date")
    private LocalDate contractEndDate;

    @Column(name = "probationary_period_days")
    private Integer probationaryPeriodDays;

    @Column(name = "notice_period_days")
    private Integer noticePeriodDays = 30;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "start_date_flexible")
    private Boolean startDateFlexible = false;

    @Column(name = "earliest_start_date")
    private LocalDate earliestStartDate;

    @Column(name = "latest_start_date")
    private LocalDate latestStartDate;

    // Offer Lifecycle
    @Column(name = "offer_expiry_date")
    private LocalDateTime offerExpiryDate;

    @Column(name = "offer_sent_at")
    private LocalDateTime offerSentAt;

    @Column(name = "candidate_viewed_at")
    private LocalDateTime candidateViewedAt;

    @Column(name = "candidate_response_at")
    private LocalDateTime candidateResponseAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "declined_at")
    private LocalDateTime declinedAt;

    @Column(name = "withdrawn_at")
    private LocalDateTime withdrawnAt;

    // Approval Workflow
    @Column(name = "requires_approval")
    private Boolean requiresApproval = true;

    @Column(name = "approval_level_required")
    private Integer approvalLevelRequired = 1;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    @Column(name = "rejected_by")
    private Long rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    // Negotiation Details
    @Column(name = "negotiation_rounds")
    private Integer negotiationRounds = 0;

    @Column(name = "last_negotiation_at")
    private LocalDateTime lastNegotiationAt;

    @Column(name = "negotiation_notes", columnDefinition = "TEXT")
    private String negotiationNotes;

    @Column(name = "candidate_counter_offer", columnDefinition = "TEXT")
    private String candidateCounterOffer;

    @Column(name = "company_response", columnDefinition = "TEXT")
    private String companyResponse;

    // Additional Terms
    @Column(name = "special_conditions", columnDefinition = "TEXT")
    private String specialConditions;

    @Column(name = "confidentiality_agreement")
    private Boolean confidentialityAgreement = false;

    @Column(name = "non_compete_agreement")
    private Boolean nonCompeteAgreement = false;

    @Column(name = "non_compete_duration_months")
    private Integer nonCompeteDurationMonths;

    @Column(name = "intellectual_property_agreement")
    private Boolean intellectualPropertyAgreement = false;

    // Document References
    @Column(name = "offer_letter_template_id")
    private Long offerLetterTemplateId;

    @Column(name = "contract_template_id")
    private Long contractTemplateId;

    @Column(name = "offer_document_path")
    private String offerDocumentPath;

    @Column(name = "signed_document_path")
    private String signedDocumentPath;

    // E-Signature
    @Column(name = "e_signature_envelope_id")
    private String eSignatureEnvelopeId;

    @Column(name = "e_signature_status")
    private String eSignatureStatus;

    @Column(name = "e_signature_sent_at")
    private LocalDateTime eSignatureSentAt;

    @Column(name = "e_signature_completed_at")
    private LocalDateTime eSignatureCompletedAt;

    @Column(name = "e_signature_provider")
    private String eSignatureProvider;

    @Column(name = "e_signature_signer_email")
    private String eSignatureSignerEmail;

    // Tracking
    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by")
    private Long updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "superseded_by_offer_id")
    private Long supersededByOfferId;

    @Column(name = "supersedes_offer_id")
    private Long supersedesOfferId;

    // Constructors
    public Offer() {
        this.createdAt = LocalDateTime.now();
        this.offerNumber = generateOfferNumber();
    }

    public Offer(Application application, String jobTitle, BigDecimal baseSalary, Long createdBy) {
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
    @PreUpdate
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
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
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

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
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

    public Long getRejectedBy() {
        return rejectedBy;
    }

    public void setRejectedBy(Long rejectedBy) {
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

    public Long getOfferLetterTemplateId() {
        return offerLetterTemplateId;
    }

    public void setOfferLetterTemplateId(Long offerLetterTemplateId) {
        this.offerLetterTemplateId = offerLetterTemplateId;
    }

    public Long getContractTemplateId() {
        return contractTemplateId;
    }

    public void setContractTemplateId(Long contractTemplateId) {
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

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getSupersededByOfferId() {
        return supersededByOfferId;
    }

    public void setSupersededByOfferId(Long supersededByOfferId) {
        this.supersededByOfferId = supersededByOfferId;
    }

    public Long getSupersedesOfferId() {
        return supersedesOfferId;
    }

    public void setSupersedesOfferId(Long supersedesOfferId) {
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