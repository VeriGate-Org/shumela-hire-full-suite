package com.arthmatic.shumelahire.dto.integration;

import com.arthmatic.shumelahire.entity.integration.SsoProvider;

public class SsoConfigRequest {

    private SsoProvider provider;
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

    public SsoConfigRequest() {}

    public SsoProvider getProvider() { return provider; }
    public void setProvider(SsoProvider provider) { this.provider = provider; }

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
}
