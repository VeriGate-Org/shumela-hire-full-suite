package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the DocumentTemplate entity.
 *
 * Table keys:
 *   PK: TENANT#{tenantId}
 *   SK: DOC_TEMPLATE#{id}
 *
 * GSI1 (type + archive filter, sorted by creation date):
 *   GSI1PK: DOCTEMPL_TYPE#{type}_ARCHIVED#{isArchived}
 *   GSI1SK: DOCTEMPL#{createdAt ISO string}
 *
 * GSI3 (default template lookup — only populated when isDefault is true):
 *   GSI3PK: DOCTEMPL_DEFAULT#{type}
 *   GSI3SK: DOC_TEMPLATE#{id}
 */
@DynamoDbBean
public class DocumentTemplateItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi3pk;
    private String gsi3sk;

    // Entity fields
    private String id;
    private String type;
    private String name;
    private String subject;
    private String content;
    private String placeholders;
    private String isDefault;
    private String isArchived;
    private String createdBy;
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

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getPlaceholders() { return placeholders; }
    public void setPlaceholders(String placeholders) { this.placeholders = placeholders; }

    public String getIsDefault() { return isDefault; }
    public void setIsDefault(String isDefault) { this.isDefault = isDefault; }

    public String getIsArchived() { return isArchived; }
    public void setIsArchived(String isArchived) { this.isArchived = isArchived; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }
}
