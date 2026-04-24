package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the EmployeeDocument entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  EMPDOC#{id}
 *
 * GSI1 (status — active documents by type):
 *   GSI1PK: EMPDOC_ACTIVE#{tenantId}#{isActive}
 *   GSI1SK: EMPDOC#{documentType}#{createdAt}
 *
 * GSI2 (FK lookup — documents by employee):
 *   GSI2PK: EMPDOC_EMP#{tenantId}#{employeeId}
 *   GSI2SK: EMPDOC#{createdAt}
 *
 * GSI6 (date range — expiry date for alerting):
 *   GSI6PK: EMPDOC_EXPIRY#{tenantId}
 *   GSI6SK: #{expiryDate}#{id}
 */
@DynamoDbBean
public class EmployeeDocumentItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String employeeId;
    private String documentType;
    private String title;
    private String description;
    private String filename;
    private String fileUrl;
    private String fileSize;
    private String contentType;
    private Integer version;
    private String expiryDate;
    private Boolean isActive;
    private String uploadedBy;
    private String createdAt;
    private String updatedAt;
    private Boolean isVerified;
    private String verifiedBy;
    private String verifiedAt;

    // E-Signature fields
    private String eSignatureEnvelopeId;
    private String eSignatureStatus;
    private String eSignatureSentAt;
    private String eSignatureCompletedAt;
    private String eSignatureSignerEmail;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Active documents by type ───────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: Documents by employee ──────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI6: Expiry date range ──────────────────────────────────────────────

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

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileSize() { return fileSize; }
    public void setFileSize(String fileSize) { this.fileSize = fileSize; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsVerified() { return isVerified; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(String verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getESignatureEnvelopeId() { return eSignatureEnvelopeId; }
    public void setESignatureEnvelopeId(String eSignatureEnvelopeId) { this.eSignatureEnvelopeId = eSignatureEnvelopeId; }

    public String getESignatureStatus() { return eSignatureStatus; }
    public void setESignatureStatus(String eSignatureStatus) { this.eSignatureStatus = eSignatureStatus; }

    public String getESignatureSentAt() { return eSignatureSentAt; }
    public void setESignatureSentAt(String eSignatureSentAt) { this.eSignatureSentAt = eSignatureSentAt; }

    public String getESignatureCompletedAt() { return eSignatureCompletedAt; }
    public void setESignatureCompletedAt(String eSignatureCompletedAt) { this.eSignatureCompletedAt = eSignatureCompletedAt; }

    public String getESignatureSignerEmail() { return eSignatureSignerEmail; }
    public void setESignatureSignerEmail(String eSignatureSignerEmail) { this.eSignatureSignerEmail = eSignatureSignerEmail; }
}
