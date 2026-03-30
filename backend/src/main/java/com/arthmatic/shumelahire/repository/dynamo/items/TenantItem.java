package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the Tenant entity.
 *
 * Table keys:
 *   PK: TENANT#{tenantId}
 *   SK: TENANT#{tenantId}
 *
 * GSI4 (unique constraint — subdomain lookup):
 *   GSI4PK: TENANT_SUBDOMAIN#{subdomain}
 *   GSI4SK: TENANT#{tenantId}
 *
 * GSI1 (status query):
 *   GSI1PK: TENANT_STATUS#{status}
 *   GSI1SK: TENANT#{tenantId}
 *
 * Note: Tenant is a special case — the PK *is* the tenant ID (not nested under another tenant).
 */
@DynamoDbBean
public class TenantItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi4pk;
    private String gsi4sk;

    // Entity fields
    private String id;
    private String name;
    private String subdomain;
    private String status;
    private String plan;
    private String contactEmail;
    private String contactName;
    private Integer maxUsers;
    private String settings;
    private String createdAt;
    private String updatedAt;

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

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public Integer getMaxUsers() { return maxUsers; }
    public void setMaxUsers(Integer maxUsers) { this.maxUsers = maxUsers; }

    public String getSettings() { return settings; }
    public void setSettings(String settings) { this.settings = settings; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
