package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the CustomFieldValue entity.
 *
 * Table keys:
 *   PK: TENANT#{tenantId}
 *   SK: CF_VALUE#{id}
 *
 * GSI2 (lookup by entity — find all custom field values for a given entity):
 *   GSI2PK: CFV_ENTITY#{entityType}#{entityId}
 *   GSI2SK: CF_VALUE#{customFieldId}
 */
@DynamoDbBean
public class CustomFieldValueItem {

    private String pk;
    private String sk;
    private String gsi2pk;
    private String gsi2sk;

    // Entity fields
    private String id;
    private String customFieldId;
    private String entityId;
    private String entityType;
    private String fieldValue;
    private String createdAt;
    private String updatedAt;
    private String tenantId;

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCustomFieldId() { return customFieldId; }
    public void setCustomFieldId(String customFieldId) { this.customFieldId = customFieldId; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
