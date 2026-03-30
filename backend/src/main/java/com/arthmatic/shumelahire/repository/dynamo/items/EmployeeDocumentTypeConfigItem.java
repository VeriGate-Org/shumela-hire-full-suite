package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the EmployeeDocumentTypeConfig entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  DOCTYPECONFIG#{id}
 *
 * GSI1 (status — active configs):
 *   GSI1PK: DOCTYPECONFIG_ACTIVE#{tenantId}#{isActive}
 *   GSI1SK: DOCTYPECONFIG#{name}
 *
 * GSI4 (unique constraint — code per tenant):
 *   GSI4PK: DOCTYPECONFIG_CODE#{tenantId}#{code}
 *   GSI4SK: DOCTYPECONFIG#{id}
 */
@DynamoDbBean
public class EmployeeDocumentTypeConfigItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String name;
    private String code;
    private String description;
    private Boolean isRequired;
    private Boolean requiresExpiry;
    private Boolean isActive;
    private String createdAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Active configs, sorted by name ─────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI4: Unique constraint on code per tenant ───────────────────────────

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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsRequired() { return isRequired; }
    public void setIsRequired(Boolean isRequired) { this.isRequired = isRequired; }

    public Boolean getRequiresExpiry() { return requiresExpiry; }
    public void setRequiresExpiry(Boolean requiresExpiry) { this.requiresExpiry = requiresExpiry; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
