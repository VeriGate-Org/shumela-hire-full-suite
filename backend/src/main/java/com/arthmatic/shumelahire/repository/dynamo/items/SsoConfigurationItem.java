package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

@DynamoDbBean
public class SsoConfigurationItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;

    private String id;
    private String tenantId;
    private String provider;
    private String displayName;
    private String clientId;
    private String clientSecret;
    private String tenantIdentifier;
    private String discoveryUrl;
    private String metadataXml;
    private Boolean isEnabled;
    private Boolean autoProvisionUsers;
    private String defaultRole;
    private String groupMappings;
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String getTenantIdentifier() { return tenantIdentifier; }
    public void setTenantIdentifier(String tenantIdentifier) { this.tenantIdentifier = tenantIdentifier; }

    public String getDiscoveryUrl() { return discoveryUrl; }
    public void setDiscoveryUrl(String discoveryUrl) { this.discoveryUrl = discoveryUrl; }

    public String getMetadataXml() { return metadataXml; }
    public void setMetadataXml(String metadataXml) { this.metadataXml = metadataXml; }

    public Boolean getIsEnabled() { return isEnabled; }
    public void setIsEnabled(Boolean isEnabled) { this.isEnabled = isEnabled; }

    public Boolean getAutoProvisionUsers() { return autoProvisionUsers; }
    public void setAutoProvisionUsers(Boolean autoProvisionUsers) { this.autoProvisionUsers = autoProvisionUsers; }

    public String getDefaultRole() { return defaultRole; }
    public void setDefaultRole(String defaultRole) { this.defaultRole = defaultRole; }

    public String getGroupMappings() { return groupMappings; }
    public void setGroupMappings(String groupMappings) { this.groupMappings = groupMappings; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
