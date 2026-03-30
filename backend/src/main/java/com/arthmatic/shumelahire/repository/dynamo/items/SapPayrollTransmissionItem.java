package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the SapPayrollTransmission entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  SAP_PAYROLL_TRANSMISSION#{id}
 *
 * GSI1 (status queries):
 *   GSI1PK: SAP_TX_STATUS#{status}
 *   GSI1SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *
 * GSI2 (FK lookup — offerId):
 *   GSI2PK: SAP_TX_OFFER#{offerId}
 *   GSI2SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *
 * GSI4 (unique constraint — transmissionId):
 *   GSI4PK: SAP_TX_ID#{tenantId}#{transmissionId}
 *   GSI4SK: SAP_PAYROLL_TRANSMISSION#{id}
 *
 * GSI6 (date range — createdAt):
 *   GSI6PK: SAP_TX_TENANT#{tenantId}
 *   GSI6SK: SAP_PAYROLL_TRANSMISSION#{createdAt}
 *
 * GSI7 (integration sync status):
 *   GSI7PK: SAP_TX_SYNC#{status}
 *   GSI7SK: SAP_PAYROLL_TRANSMISSION#{transmittedAt}
 */
@DynamoDbBean
public class SapPayrollTransmissionItem {

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
    private String gsi7pk;
    private String gsi7sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String offerId;
    private String transmissionId;
    private String sapEmployeeNumber;
    private String status;
    private String payloadJson;
    private String responseJson;
    private String errorMessage;
    private Integer retryCount;
    private Integer maxRetries;
    private String nextRetryAt;
    private String initiatedBy;
    private String sapCompanyCode;
    private String sapPayrollArea;
    private String validationErrors;
    private String createdAt;
    private String updatedAt;
    private String transmittedAt;
    private String confirmedAt;
    private String cancelledAt;
    private String cancelledBy;
    private String cancellationReason;

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

    // ── GSI2: FK lookup by offerId ───────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI4: Unique constraint on transmissionId per tenant ─────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI6: Date range by tenant ───────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── GSI7: Integration sync status ────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI7")
    @DynamoDbAttribute("GSI7PK")
    public String getGsi7pk() { return gsi7pk; }
    public void setGsi7pk(String gsi7pk) { this.gsi7pk = gsi7pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI7")
    @DynamoDbAttribute("GSI7SK")
    public String getGsi7sk() { return gsi7sk; }
    public void setGsi7sk(String gsi7sk) { this.gsi7sk = gsi7sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getOfferId() { return offerId; }
    public void setOfferId(String offerId) { this.offerId = offerId; }

    public String getTransmissionId() { return transmissionId; }
    public void setTransmissionId(String transmissionId) { this.transmissionId = transmissionId; }

    public String getSapEmployeeNumber() { return sapEmployeeNumber; }
    public void setSapEmployeeNumber(String sapEmployeeNumber) { this.sapEmployeeNumber = sapEmployeeNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPayloadJson() { return payloadJson; }
    public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }

    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Integer getRetryCount() { return retryCount; }
    public void setRetryCount(Integer retryCount) { this.retryCount = retryCount; }

    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    public String getNextRetryAt() { return nextRetryAt; }
    public void setNextRetryAt(String nextRetryAt) { this.nextRetryAt = nextRetryAt; }

    public String getInitiatedBy() { return initiatedBy; }
    public void setInitiatedBy(String initiatedBy) { this.initiatedBy = initiatedBy; }

    public String getSapCompanyCode() { return sapCompanyCode; }
    public void setSapCompanyCode(String sapCompanyCode) { this.sapCompanyCode = sapCompanyCode; }

    public String getSapPayrollArea() { return sapPayrollArea; }
    public void setSapPayrollArea(String sapPayrollArea) { this.sapPayrollArea = sapPayrollArea; }

    public String getValidationErrors() { return validationErrors; }
    public void setValidationErrors(String validationErrors) { this.validationErrors = validationErrors; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getTransmittedAt() { return transmittedAt; }
    public void setTransmittedAt(String transmittedAt) { this.transmittedAt = transmittedAt; }

    public String getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(String confirmedAt) { this.confirmedAt = confirmedAt; }

    public String getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(String cancelledAt) { this.cancelledAt = cancelledAt; }

    public String getCancelledBy() { return cancelledBy; }
    public void setCancelledBy(String cancelledBy) { this.cancelledBy = cancelledBy; }

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
}
