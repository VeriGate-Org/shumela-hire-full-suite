package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the LinkedInOrgConnection entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  LINKEDIN_ORG#{id}
 *
 * No GSIs needed -- this is a small data set (typically one per tenant)
 * and is always accessed via the tenant partition key.
 */
@DynamoDbBean
public class LinkedInOrgConnectionItem {

    private String pk;
    private String sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String accessToken;
    private String refreshToken;
    private String tokenExpiresAt;
    private String organizationId;
    private String organizationName;
    private String connectedByUserId;
    private String connectedAt;
    private String createdAt;
    private String updatedAt;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getTokenExpiresAt() { return tokenExpiresAt; }
    public void setTokenExpiresAt(String tokenExpiresAt) { this.tokenExpiresAt = tokenExpiresAt; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public String getOrganizationName() { return organizationName; }
    public void setOrganizationName(String organizationName) { this.organizationName = organizationName; }

    public String getConnectedByUserId() { return connectedByUserId; }
    public void setConnectedByUserId(String connectedByUserId) { this.connectedByUserId = connectedByUserId; }

    public String getConnectedAt() { return connectedAt; }
    public void setConnectedAt(String connectedAt) { this.connectedAt = connectedAt; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
