package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Skill entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  SKILL#{id}
 *
 * GSI1 (active status + name sort):
 *   GSI1PK: SKILL_ACTIVE#{isActive}
 *   GSI1SK: SKILL#{name}
 *
 * GSI3 (category index):
 *   GSI3PK: SKILL_CATEGORY#{category}
 *   GSI3SK: SKILL#{name}
 *
 * GSI4 (unique constraint — name):
 *   GSI4PK: SKILL_NAME#{name}
 *   GSI4SK: SKILL#{id}
 */
@DynamoDbBean
public class SkillItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi3pk;
    private String gsi3sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String name;
    private String code;
    private String category;
    private String description;
    private Boolean isActive;
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

    // ── GSI1: Active status query, sorted by name ────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI3: Category index, sorted by name ─────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

    // ── GSI4: Unique constraint on name ──────────────────────────────────────

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

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
