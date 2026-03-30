package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the BackgroundCheck entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  BGCHECK#{id}
 *
 * GSI1 (status queries):
 *   GSI1PK: BGCHECK_STATUS#{status}
 *   GSI1SK: BGCHECK#{createdAt}
 *
 * GSI2 (FK lookup -- background checks by application):
 *   GSI2PK: BGCHECK_APP#{applicationId}
 *   GSI2SK: BGCHECK#{createdAt}
 *
 * GSI4 (unique constraint -- referenceId):
 *   GSI4PK: BGCHECK_REF#{referenceId}
 *   GSI4SK: BGCHECK#{id}
 *
 * GSI5 (initiatedBy lookup):
 *   GSI5PK: BGCHECK_INITIATOR#{initiatedBy}
 *   GSI5SK: BGCHECK#{createdAt}
 */
@DynamoDbBean
public class BackgroundCheckItem {

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
    private String applicationId;
    private String referenceId;
    private String candidateIdNumber;
    private String candidateName;
    private String candidateEmail;
    private String checkTypes;
    private String status;
    private String overallResult;
    private String resultsJson;
    private Boolean consentObtained;
    private String consentObtainedAt;
    private String initiatedBy;
    private String provider;
    private String externalScreeningId;
    private String reportUrl;
    private String errorMessage;
    private String notes;
    private String createdAt;
    private String updatedAt;
    private String submittedAt;
    private String completedAt;
    private String cancelledAt;

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

    // -- GSI2: FK lookup -- background checks by application ------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // -- GSI4: Unique constraint -- referenceId -------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // -- GSI5: InitiatedBy lookup ---------------------------------------------

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

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }

    public String getCandidateIdNumber() { return candidateIdNumber; }
    public void setCandidateIdNumber(String candidateIdNumber) { this.candidateIdNumber = candidateIdNumber; }

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public String getCheckTypes() { return checkTypes; }
    public void setCheckTypes(String checkTypes) { this.checkTypes = checkTypes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getOverallResult() { return overallResult; }
    public void setOverallResult(String overallResult) { this.overallResult = overallResult; }

    public String getResultsJson() { return resultsJson; }
    public void setResultsJson(String resultsJson) { this.resultsJson = resultsJson; }

    public Boolean getConsentObtained() { return consentObtained; }
    public void setConsentObtained(Boolean consentObtained) { this.consentObtained = consentObtained; }

    public String getConsentObtainedAt() { return consentObtainedAt; }
    public void setConsentObtainedAt(String consentObtainedAt) { this.consentObtainedAt = consentObtainedAt; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getExternalScreeningId() { return externalScreeningId; }
    public void setExternalScreeningId(String externalScreeningId) { this.externalScreeningId = externalScreeningId; }

    public String getReportUrl() { return reportUrl; }
    public void setReportUrl(String reportUrl) { this.reportUrl = reportUrl; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(String submittedAt) { this.submittedAt = submittedAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }
}
