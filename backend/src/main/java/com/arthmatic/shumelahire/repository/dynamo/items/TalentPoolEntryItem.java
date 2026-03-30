package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the TalentPoolEntry entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  TALENT_POOL_ENTRY#{id}
 *
 * GSI1 (status — available entries per pool):
 *   GSI1PK: TPENTRY_POOL#{tenantId}#{talentPoolId}
 *   GSI1SK: TALENT_POOL_ENTRY#{addedAt}
 *
 * GSI2 (FK lookup — applicant):
 *   GSI2PK: TPENTRY_APPLICANT#{tenantId}#{applicantId}
 *   GSI2SK: TALENT_POOL_ENTRY#{id}
 *
 * GSI4 (unique constraint — pool+applicant):
 *   GSI4PK: TPENTRY_UNIQUE#{tenantId}#{talentPoolId}#{applicantId}
 *   GSI4SK: TALENT_POOL_ENTRY#{id}
 */
@DynamoDbBean
public class TalentPoolEntryItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String talentPoolId;
    private String applicantId;
    private String sourceApplicationId;
    private String sourceType;
    private String notes;
    private Integer rating;
    private Boolean isAvailable;
    private String lastContactedAt;
    private String addedBy;
    private String addedAt;
    private String removedAt;
    private String removalReason;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Pool lookup, sorted by addedAt ────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup — applicant ─────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI4: Unique constraint — pool+applicant ────────────────────────────

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

    public String getTalentPoolId() { return talentPoolId; }
    public void setTalentPoolId(String talentPoolId) { this.talentPoolId = talentPoolId; }

    public String getApplicantId() { return applicantId; }
    public void setApplicantId(String applicantId) { this.applicantId = applicantId; }

    public String getSourceApplicationId() { return sourceApplicationId; }
    public void setSourceApplicationId(String sourceApplicationId) { this.sourceApplicationId = sourceApplicationId; }

    public String getSourceType() { return sourceType; }
    public void setSourceType(String sourceType) { this.sourceType = sourceType; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public String getLastContactedAt() { return lastContactedAt; }
    public void setLastContactedAt(String lastContactedAt) { this.lastContactedAt = lastContactedAt; }

    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }

    public String getAddedAt() { return addedAt; }
    public void setAddedAt(String addedAt) { this.addedAt = addedAt; }

    public String getRemovedAt() { return removedAt; }
    public void setRemovedAt(String removedAt) { this.removedAt = removedAt; }

    public String getRemovalReason() { return removalReason; }
    public void setRemovalReason(String removalReason) { this.removalReason = removalReason; }
}
