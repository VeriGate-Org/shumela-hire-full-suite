package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the SalaryRecommendation entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  SALREC#{id}
 *
 * GSI1 (status queries):
 *   GSI1PK: SALREC_STATUS#{status}
 *   GSI1SK: SALREC#{createdAt}
 *
 * GSI2 (FK lookup -- recommendations by application):
 *   GSI2PK: SALREC_APP#{applicationId}
 *   GSI2SK: SALREC#{createdAt}
 *
 * GSI4 (unique constraint -- recommendationNumber):
 *   GSI4PK: SALREC_NUM#{recommendationNumber}
 *   GSI4SK: SALREC#{id}
 *
 * GSI5 (department lookup):
 *   GSI5PK: SALREC_DEPT#{department}
 *   GSI5SK: SALREC#{createdAt}
 */
@DynamoDbBean
public class SalaryRecommendationItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi5pk;
    private String gsi5sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String recommendationNumber;
    private String status;
    private String positionTitle;
    private String department;
    private String jobGrade;
    private String positionLevel;
    private String requestedBy;
    private String candidateName;
    private String candidateCurrentSalary;
    private String candidateExpectedSalary;
    private String marketDataReference;
    private String proposedMinSalary;
    private String proposedMaxSalary;
    private String proposedTargetSalary;
    private String recommendedSalary;
    private String recommendedBy;
    private String recommendedAt;
    private String recommendationJustification;
    private String bonusRecommendation;
    private String equityRecommendation;
    private String benefitsNotes;
    private Boolean requiresApproval;
    private Integer approvalLevelRequired;
    private String approvedBy;
    private String approvedAt;
    private String approvalNotes;
    private String rejectedBy;
    private String rejectionReason;
    private String currency;
    private String applicationId;
    private String offerId;
    private String createdAt;
    private String updatedAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: Status queries, sorted by createdAt ----------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI2: FK lookup -- recommendations by application --------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI4: Unique constraint -- recommendationNumber ----------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // -- GSI5: Department lookup ----------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5PK")
    public String getGsi5pk() { return gsi5pk; }
    public void setGsi5pk(String gsi5pk) { this.gsi5pk = gsi5pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI5")
    @DynamoDbAttribute("GSI5SK")
    public String getGsi5sk() { return gsi5sk; }
    public void setGsi5sk(String gsi5sk) { this.gsi5sk = gsi5sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getRecommendationNumber() { return recommendationNumber; }
    public void setRecommendationNumber(String recommendationNumber) { this.recommendationNumber = recommendationNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

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

    public String getCandidateCurrentSalary() { return candidateCurrentSalary; }
    public void setCandidateCurrentSalary(String candidateCurrentSalary) { this.candidateCurrentSalary = candidateCurrentSalary; }

    public String getCandidateExpectedSalary() { return candidateExpectedSalary; }
    public void setCandidateExpectedSalary(String candidateExpectedSalary) { this.candidateExpectedSalary = candidateExpectedSalary; }

    public String getMarketDataReference() { return marketDataReference; }
    public void setMarketDataReference(String marketDataReference) { this.marketDataReference = marketDataReference; }

    public String getProposedMinSalary() { return proposedMinSalary; }
    public void setProposedMinSalary(String proposedMinSalary) { this.proposedMinSalary = proposedMinSalary; }

    public String getProposedMaxSalary() { return proposedMaxSalary; }
    public void setProposedMaxSalary(String proposedMaxSalary) { this.proposedMaxSalary = proposedMaxSalary; }

    public String getProposedTargetSalary() { return proposedTargetSalary; }
    public void setProposedTargetSalary(String proposedTargetSalary) { this.proposedTargetSalary = proposedTargetSalary; }

    public String getRecommendedSalary() { return recommendedSalary; }
    public void setRecommendedSalary(String recommendedSalary) { this.recommendedSalary = recommendedSalary; }

    public String getRecommendedBy() { return recommendedBy; }
    public void setRecommendedBy(String recommendedBy) { this.recommendedBy = recommendedBy; }

    public String getRecommendedAt() { return recommendedAt; }
    public void setRecommendedAt(String recommendedAt) { this.recommendedAt = recommendedAt; }

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

    public String getApprovedAt() { return approvedAt; }
    public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getOfferId() { return offerId; }
    public void setOfferId(String offerId) { this.offerId = offerId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
