package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Offer entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  OFFER#{id}
 *
 * GSI1 (status queries, sorted by createdAt):
 *   GSI1PK: OFFER_STATUS#{status}
 *   GSI1SK: OFFER#{createdAt}
 *
 * GSI2 (FK lookup — offers by application):
 *   GSI2PK: OFFER_APP#{applicationId}
 *   GSI2SK: OFFER#{createdAt}
 *
 * GSI4 (unique constraint — offerNumber):
 *   GSI4PK: OFFER_NUMBER#{tenantId}#{offerNumber}
 *   GSI4SK: OFFER#{id}
 *
 * GSI6 (date range — offers by sentAt):
 *   GSI6PK: OFFER_DATE#{tenantId}
 *   GSI6SK: #{offerSentAt}
 */
@DynamoDbBean
public class OfferItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String applicationId;
    private String offerNumber;
    private Integer version;
    private String status;
    private String offerType;
    private String negotiationStatus;
    private String jobTitle;
    private String department;
    private String reportingManager;
    private String workLocation;
    private Boolean remoteWorkAllowed;
    private String baseSalary;
    private String currency;
    private String salaryFrequency;
    private Boolean bonusEligible;
    private String bonusTargetPercentage;
    private String bonusMaximumPercentage;
    private Boolean commissionEligible;
    private String commissionStructure;
    private Boolean equityEligible;
    private String equityDetails;
    private String signingBonus;
    private String relocationAllowance;
    private String benefitsPackage;
    private Integer vacationDaysAnnual;
    private Integer sickDaysAnnual;
    private Boolean healthInsurance;
    private Boolean retirementPlan;
    private String retirementContributionPercentage;
    private String otherBenefits;
    private String employmentType;
    private Integer contractDurationMonths;
    private String contractEndDate;
    private Integer probationaryPeriodDays;
    private Integer noticePeriodDays;
    private String startDate;
    private Boolean startDateFlexible;
    private String earliestStartDate;
    private String latestStartDate;
    private String offerExpiryDate;
    private String offerSentAt;
    private String candidateViewedAt;
    private String candidateResponseAt;
    private String acceptedAt;
    private String declinedAt;
    private String withdrawnAt;
    private Boolean requiresApproval;
    private Integer approvalLevelRequired;
    private String approvedBy;
    private String approvedAt;
    private String approvalNotes;
    private String rejectedBy;
    private String rejectedAt;
    private String rejectionReason;
    private Integer negotiationRounds;
    private String lastNegotiationAt;
    private String negotiationNotes;
    private String candidateCounterOffer;
    private String companyResponse;
    private String specialConditions;
    private Boolean confidentialityAgreement;
    private Boolean nonCompeteAgreement;
    private Integer nonCompeteDurationMonths;
    private Boolean intellectualPropertyAgreement;
    private String offerLetterTemplateId;
    private String contractTemplateId;
    private String offerDocumentPath;
    private String signedDocumentPath;
    private String eSignatureEnvelopeId;
    private String eSignatureStatus;
    private String eSignatureSentAt;
    private String eSignatureCompletedAt;
    private String eSignatureProvider;
    private String eSignatureSignerEmail;
    private String createdBy;
    private String createdAt;
    private String updatedBy;
    private String updatedAt;
    private String supersededByOfferId;
    private String supersedesOfferId;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status queries, sorted by createdAt ────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup — offers by application ──────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI4: Unique constraint — offerNumber per tenant ─────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI6: Date range queries ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getOfferNumber() { return offerNumber; }
    public void setOfferNumber(String offerNumber) { this.offerNumber = offerNumber; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOfferType() { return offerType; }
    public void setOfferType(String offerType) { this.offerType = offerType; }

    public String getNegotiationStatus() { return negotiationStatus; }
    public void setNegotiationStatus(String negotiationStatus) { this.negotiationStatus = negotiationStatus; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getReportingManager() { return reportingManager; }
    public void setReportingManager(String reportingManager) { this.reportingManager = reportingManager; }

    public String getWorkLocation() { return workLocation; }
    public void setWorkLocation(String workLocation) { this.workLocation = workLocation; }

    public Boolean getRemoteWorkAllowed() { return remoteWorkAllowed; }
    public void setRemoteWorkAllowed(Boolean remoteWorkAllowed) { this.remoteWorkAllowed = remoteWorkAllowed; }

    public String getBaseSalary() { return baseSalary; }
    public void setBaseSalary(String baseSalary) { this.baseSalary = baseSalary; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getSalaryFrequency() { return salaryFrequency; }
    public void setSalaryFrequency(String salaryFrequency) { this.salaryFrequency = salaryFrequency; }

    public Boolean getBonusEligible() { return bonusEligible; }
    public void setBonusEligible(Boolean bonusEligible) { this.bonusEligible = bonusEligible; }

    public String getBonusTargetPercentage() { return bonusTargetPercentage; }
    public void setBonusTargetPercentage(String bonusTargetPercentage) { this.bonusTargetPercentage = bonusTargetPercentage; }

    public String getBonusMaximumPercentage() { return bonusMaximumPercentage; }
    public void setBonusMaximumPercentage(String bonusMaximumPercentage) { this.bonusMaximumPercentage = bonusMaximumPercentage; }

    public Boolean getCommissionEligible() { return commissionEligible; }
    public void setCommissionEligible(Boolean commissionEligible) { this.commissionEligible = commissionEligible; }

    public String getCommissionStructure() { return commissionStructure; }
    public void setCommissionStructure(String commissionStructure) { this.commissionStructure = commissionStructure; }

    public Boolean getEquityEligible() { return equityEligible; }
    public void setEquityEligible(Boolean equityEligible) { this.equityEligible = equityEligible; }

    public String getEquityDetails() { return equityDetails; }
    public void setEquityDetails(String equityDetails) { this.equityDetails = equityDetails; }

    public String getSigningBonus() { return signingBonus; }
    public void setSigningBonus(String signingBonus) { this.signingBonus = signingBonus; }

    public String getRelocationAllowance() { return relocationAllowance; }
    public void setRelocationAllowance(String relocationAllowance) { this.relocationAllowance = relocationAllowance; }

    public String getBenefitsPackage() { return benefitsPackage; }
    public void setBenefitsPackage(String benefitsPackage) { this.benefitsPackage = benefitsPackage; }

    public Integer getVacationDaysAnnual() { return vacationDaysAnnual; }
    public void setVacationDaysAnnual(Integer vacationDaysAnnual) { this.vacationDaysAnnual = vacationDaysAnnual; }

    public Integer getSickDaysAnnual() { return sickDaysAnnual; }
    public void setSickDaysAnnual(Integer sickDaysAnnual) { this.sickDaysAnnual = sickDaysAnnual; }

    public Boolean getHealthInsurance() { return healthInsurance; }
    public void setHealthInsurance(Boolean healthInsurance) { this.healthInsurance = healthInsurance; }

    public Boolean getRetirementPlan() { return retirementPlan; }
    public void setRetirementPlan(Boolean retirementPlan) { this.retirementPlan = retirementPlan; }

    public String getRetirementContributionPercentage() { return retirementContributionPercentage; }
    public void setRetirementContributionPercentage(String retirementContributionPercentage) { this.retirementContributionPercentage = retirementContributionPercentage; }

    public String getOtherBenefits() { return otherBenefits; }
    public void setOtherBenefits(String otherBenefits) { this.otherBenefits = otherBenefits; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public Integer getContractDurationMonths() { return contractDurationMonths; }
    public void setContractDurationMonths(Integer contractDurationMonths) { this.contractDurationMonths = contractDurationMonths; }

    public String getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(String contractEndDate) { this.contractEndDate = contractEndDate; }

    public Integer getProbationaryPeriodDays() { return probationaryPeriodDays; }
    public void setProbationaryPeriodDays(Integer probationaryPeriodDays) { this.probationaryPeriodDays = probationaryPeriodDays; }

    public Integer getNoticePeriodDays() { return noticePeriodDays; }
    public void setNoticePeriodDays(Integer noticePeriodDays) { this.noticePeriodDays = noticePeriodDays; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public Boolean getStartDateFlexible() { return startDateFlexible; }
    public void setStartDateFlexible(Boolean startDateFlexible) { this.startDateFlexible = startDateFlexible; }

    public String getEarliestStartDate() { return earliestStartDate; }
    public void setEarliestStartDate(String earliestStartDate) { this.earliestStartDate = earliestStartDate; }

    public String getLatestStartDate() { return latestStartDate; }
    public void setLatestStartDate(String latestStartDate) { this.latestStartDate = latestStartDate; }

    public String getOfferExpiryDate() { return offerExpiryDate; }
    public void setOfferExpiryDate(String offerExpiryDate) { this.offerExpiryDate = offerExpiryDate; }

    public String getOfferSentAt() { return offerSentAt; }
    public void setOfferSentAt(String offerSentAt) { this.offerSentAt = offerSentAt; }

    public String getCandidateViewedAt() { return candidateViewedAt; }
    public void setCandidateViewedAt(String candidateViewedAt) { this.candidateViewedAt = candidateViewedAt; }

    public String getCandidateResponseAt() { return candidateResponseAt; }
    public void setCandidateResponseAt(String candidateResponseAt) { this.candidateResponseAt = candidateResponseAt; }

    public String getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(String acceptedAt) { this.acceptedAt = acceptedAt; }

    public String getDeclinedAt() { return declinedAt; }
    public void setDeclinedAt(String declinedAt) { this.declinedAt = declinedAt; }

    public String getWithdrawnAt() { return withdrawnAt; }
    public void setWithdrawnAt(String withdrawnAt) { this.withdrawnAt = withdrawnAt; }

    public Boolean getRequiresApproval() { return requiresApproval; }
    public void setRequiresApproval(Boolean requiresApproval) { this.requiresApproval = requiresApproval; }

    public Integer getApprovalLevelRequired() { return approvalLevelRequired; }
    public void setApprovalLevelRequired(Integer approvalLevelRequired) { this.approvalLevelRequired = approvalLevelRequired; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public String getApprovedAt() { return approvedAt; }
    public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public String getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(String rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public Integer getNegotiationRounds() { return negotiationRounds; }
    public void setNegotiationRounds(Integer negotiationRounds) { this.negotiationRounds = negotiationRounds; }

    public String getLastNegotiationAt() { return lastNegotiationAt; }
    public void setLastNegotiationAt(String lastNegotiationAt) { this.lastNegotiationAt = lastNegotiationAt; }

    public String getNegotiationNotes() { return negotiationNotes; }
    public void setNegotiationNotes(String negotiationNotes) { this.negotiationNotes = negotiationNotes; }

    public String getCandidateCounterOffer() { return candidateCounterOffer; }
    public void setCandidateCounterOffer(String candidateCounterOffer) { this.candidateCounterOffer = candidateCounterOffer; }

    public String getCompanyResponse() { return companyResponse; }
    public void setCompanyResponse(String companyResponse) { this.companyResponse = companyResponse; }

    public String getSpecialConditions() { return specialConditions; }
    public void setSpecialConditions(String specialConditions) { this.specialConditions = specialConditions; }

    public Boolean getConfidentialityAgreement() { return confidentialityAgreement; }
    public void setConfidentialityAgreement(Boolean confidentialityAgreement) { this.confidentialityAgreement = confidentialityAgreement; }

    public Boolean getNonCompeteAgreement() { return nonCompeteAgreement; }
    public void setNonCompeteAgreement(Boolean nonCompeteAgreement) { this.nonCompeteAgreement = nonCompeteAgreement; }

    public Integer getNonCompeteDurationMonths() { return nonCompeteDurationMonths; }
    public void setNonCompeteDurationMonths(Integer nonCompeteDurationMonths) { this.nonCompeteDurationMonths = nonCompeteDurationMonths; }

    public Boolean getIntellectualPropertyAgreement() { return intellectualPropertyAgreement; }
    public void setIntellectualPropertyAgreement(Boolean intellectualPropertyAgreement) { this.intellectualPropertyAgreement = intellectualPropertyAgreement; }

    public String getOfferLetterTemplateId() { return offerLetterTemplateId; }
    public void setOfferLetterTemplateId(String offerLetterTemplateId) { this.offerLetterTemplateId = offerLetterTemplateId; }

    public String getContractTemplateId() { return contractTemplateId; }
    public void setContractTemplateId(String contractTemplateId) { this.contractTemplateId = contractTemplateId; }

    public String getOfferDocumentPath() { return offerDocumentPath; }
    public void setOfferDocumentPath(String offerDocumentPath) { this.offerDocumentPath = offerDocumentPath; }

    public String getSignedDocumentPath() { return signedDocumentPath; }
    public void setSignedDocumentPath(String signedDocumentPath) { this.signedDocumentPath = signedDocumentPath; }

    public String getESignatureEnvelopeId() { return eSignatureEnvelopeId; }
    public void setESignatureEnvelopeId(String eSignatureEnvelopeId) { this.eSignatureEnvelopeId = eSignatureEnvelopeId; }

    public String getESignatureStatus() { return eSignatureStatus; }
    public void setESignatureStatus(String eSignatureStatus) { this.eSignatureStatus = eSignatureStatus; }

    public String getESignatureSentAt() { return eSignatureSentAt; }
    public void setESignatureSentAt(String eSignatureSentAt) { this.eSignatureSentAt = eSignatureSentAt; }

    public String getESignatureCompletedAt() { return eSignatureCompletedAt; }
    public void setESignatureCompletedAt(String eSignatureCompletedAt) { this.eSignatureCompletedAt = eSignatureCompletedAt; }

    public String getESignatureProvider() { return eSignatureProvider; }
    public void setESignatureProvider(String eSignatureProvider) { this.eSignatureProvider = eSignatureProvider; }

    public String getESignatureSignerEmail() { return eSignatureSignerEmail; }
    public void setESignatureSignerEmail(String eSignatureSignerEmail) { this.eSignatureSignerEmail = eSignatureSignerEmail; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getSupersededByOfferId() { return supersededByOfferId; }
    public void setSupersededByOfferId(String supersededByOfferId) { this.supersededByOfferId = supersededByOfferId; }

    public String getSupersedesOfferId() { return supersedesOfferId; }
    public void setSupersedesOfferId(String supersedesOfferId) { this.supersedesOfferId = supersedesOfferId; }
}
