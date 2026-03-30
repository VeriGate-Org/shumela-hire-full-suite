package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the AuditLog entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  AUDIT_LOG#{id}
 *
 * GSI8 (user + date timeline):
 *   GSI8PK: AUDIT_USER#{tenantId}#{userId}
 *   GSI8SK: AUDIT_LOG#{timestamp}
 *
 * GSI1 (action type):
 *   GSI1PK: AUDIT_ACTION#{tenantId}#{action}
 *   GSI1SK: AUDIT_LOG#{timestamp}
 */
@DynamoDbBean
public class AuditLogItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi8pk;
    private String gsi8sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String timestamp;
    private String userId;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private String userRole;

    // -- Table keys -----------------------------------------------------------

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // -- GSI1: Action type index ----------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // -- GSI8: User timeline index --------------------------------------------

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI8")
    @DynamoDbAttribute("GSI8PK")
    public String getGsi8pk() { return gsi8pk; }
    public void setGsi8pk(String gsi8pk) { this.gsi8pk = gsi8pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI8")
    @DynamoDbAttribute("GSI8SK")
    public String getGsi8sk() { return gsi8sk; }
    public void setGsi8sk(String gsi8sk) { this.gsi8sk = gsi8sk; }

    // -- Entity fields --------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }
}
