package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the AgencyProfile entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  AGENCY_PROFILE#{id}
 *
 * GSI1 (status):
 *   GSI1PK: AGENCY_STATUS#{tenantId}#{status}
 *   GSI1SK: AGENCY_PROFILE#{agencyName}
 *
 * GSI4 (unique constraint — contact email per tenant):
 *   GSI4PK: AGENCY_EMAIL#{tenantId}#{contactEmail}
 *   GSI4SK: AGENCY_PROFILE#{id}
 */
@DynamoDbBean
public class AgencyProfileItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String agencyName;
    private String registrationNumber;
    private String contactPerson;
    private String contactEmail;
    private String contactPhone;
    private String specializations;
    private String status;
    private String feePercentage;
    private String contractStartDate;
    private String contractEndDate;
    private Integer beeLevel;
    private String createdAt;
    private String updatedAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status query, sorted by agency name ───────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI4: Unique constraint on contact email per tenant ─────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getAgencyName() { return agencyName; }
    public void setAgencyName(String agencyName) { this.agencyName = agencyName; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getSpecializations() { return specializations; }
    public void setSpecializations(String specializations) { this.specializations = specializations; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFeePercentage() { return feePercentage; }
    public void setFeePercentage(String feePercentage) { this.feePercentage = feePercentage; }

    public String getContractStartDate() { return contractStartDate; }
    public void setContractStartDate(String contractStartDate) { this.contractStartDate = contractStartDate; }

    public String getContractEndDate() { return contractEndDate; }
    public void setContractEndDate(String contractEndDate) { this.contractEndDate = contractEndDate; }

    public Integer getBeeLevel() { return beeLevel; }
    public void setBeeLevel(Integer beeLevel) { this.beeLevel = beeLevel; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
